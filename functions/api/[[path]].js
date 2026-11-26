// Ti Guigui FIT on Cloudflare Pages: the few API routes the app needs for "nickname + password"
// accounts and syncing the profile, backed by D1 (binding DB, schema in migrations/). Everything
// else of api/server.js (passkeys, e-mail, push, coach, sharing...) is not served here: 404.
// One addition of its own: a light AI coach (/api/ai/*, functions/lib/ai-coach.js), on only once
// the ANTHROPIC_API_KEY secret is set on the Pages project.
// Same request and answer shapes as api/server.js, so the frontend is unchanged.
import { passwordProblem, nameKey, MAX_LENGTH, makeResetCode, hashResetCode, resetCodeMatches, RESET_TTL_MS } from '../../api/password.js'
import { stampPut } from '../../api/sync-stamps.js'
import { API_URL, DEFAULT_MODEL, cleanMessages, requestBody, requestHeaders, readReply, dailyCap, WORKERS_MODEL, workersInput, readWorkersReply, workersErrorCode } from '../lib/ai-coach.js'

const COOKIE = '__Host-tgf_session'
const SESSION_DAYS = 90
const WID_KEEP = 50
// Workers cap PBKDF2 at 100k iterations.
const ITER = 100000
const MAX_FAILS = 10
const LOCK_MS = 15 * 60000
// shortcut: D1 keeps at most 2 MB per row, so a profile document is capped there; move states to R2 if one ever gets near it.
const MAX_DOC = 1900000

const WRONG = { error: 'wrong name or password', code: 'bad-credentials' }
const POLICY = {
  'too-short': 'the password needs at least 10 characters',
  'too-long': `the password can have at most ${MAX_LENGTH} characters`,
  'too-common': 'this password is too easy to guess'
}

const enc = new TextEncoder()
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)))
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0))
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
const randomId = n => hex(crypto.getRandomValues(new Uint8Array(n)))
const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)))

async function pbkdf2(pw, salt, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(String(pw).normalize('NFKC')), 'PBKDF2', false, ['deriveBits'])
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256)
}
export async function hashPassword(pw) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return `pbkdf2$${ITER}$${b64(salt)}$${b64(await pbkdf2(pw, salt, ITER))}`
}
export async function verifyPassword(pw, stored) {
  const [kind, iter, salt, want] = String(stored || '').split('$')
  if (kind !== 'pbkdf2') return false
  const got = new Uint8Array(await pbkdf2(pw, unb64(salt), +iter))
  const exp = unb64(want)
  if (got.length !== exp.length) return false
  let diff = 0
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ exp[i]
  return diff === 0
}

const json = (status, body, headers = {}) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers }
})
const cookieOf = req => (req.headers.get('Cookie') || '').split(/;\s*/).find(c => c.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1) || ''
const clearCookie = `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
const publicUser = u => ({ id: u.id, name: u.name, admin: !!u.admin })
const text = v => (typeof v === 'string' ? v : '')

async function startSession(db, user) {
  const token = randomId(32)
  await db.prepare('INSERT INTO sessions (hash, uid, exp) VALUES (?, ?, ?)')
    .bind(await sha256(token), user.id, Date.now() + SESSION_DAYS * 86400000).run()
  return json(200, { user: publicUser(user) }, { 'Set-Cookie': `${COOKIE}=${token}; Path=/; Max-Age=${SESSION_DAYS * 86400}; HttpOnly; Secure; SameSite=Lax` })
}
async function sessionUser(db, req) {
  const token = cookieOf(req)
  if (!/^[0-9a-f]{64}$/.test(token)) return null
  return db.prepare('SELECT u.id, u.name, u.admin FROM sessions s JOIN users u ON u.id = s.uid WHERE s.hash = ? AND s.exp > ?')
    .bind(await sha256(token), Date.now()).first()
}
async function readBody(req) {
  try { const b = await req.json(); return b && typeof b === 'object' ? b : {} } catch { return {} }
}
async function readState(db, uid) {
  const row = await db.prepare('SELECT doc FROM states WHERE uid = ?').bind(uid).first()
  return row ? JSON.parse(row.doc) : null
}
function forClient(S) {
  if (!S || typeof S !== 'object' || !('_unstamped' in S || '_prior' in S)) return S
  const { _unstamped, _prior, ...rest } = S
  return rest
}
const record = x => !!x && typeof x === 'object' && !Array.isArray(x)
const records = v => (Array.isArray(v) ? v.filter(record) : [])

// true, false or 'locked'. MAX_FAILS wrong passwords in a row lock the account for LOCK_MS.
async function checkPassword(db, user, pw) {
  if (user && user.locked_until > Date.now()) return 'locked'
  // An unknown name costs the same hash as a wrong password, so timing does not tell names apart.
  const ok = await verifyPassword(pw, user?.pw || 'pbkdf2$' + ITER + '$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=')
  if (!user) return false
  if (!ok) {
    const fails = user.fails + 1
    await db.prepare('UPDATE users SET fails = ?, locked_until = ? WHERE id = ?')
      .bind(fails >= MAX_FAILS ? 0 : fails, fails >= MAX_FAILS ? Date.now() + LOCK_MS : 0, user.id).run()
    return false
  }
  if (user.fails) await db.prepare('UPDATE users SET fails = 0, locked_until = 0 WHERE id = ?').bind(user.id).run()
  return true
}
const locked = user => {
  const secs = String(Math.ceil((user.locked_until - Date.now()) / 1000))
  return json(429, { error: 'too many attempts, try again later', code: 'locked', retryAfter: +secs }, { 'Retry-After': secs })
}

const today = () => new Date().toISOString().slice(0, 10)
async function aiUsed(db, uid) {
  const row = await db.prepare('SELECT n FROM ai_usage WHERE uid = ? AND day = ?').bind(uid, today()).first()
  return row?.n || 0
}

// Which model answers: Claude only when asked for (AI_PROVIDER=anthropic and a key), else Workers AI.
const aiProvider = env => (env.AI_PROVIDER === 'anthropic' && env.ANTHROPIC_API_KEY ? 'anthropic' : env.AI ? 'workers' : null)

const routes = {
  // The AI coach: whether it is on, who answers, and how many questions are left today.
  'GET /api/ai/status': async (db, req, env) => {
    const user = await sessionUser(db, req)
    const cap = dailyCap(env.AI_DAILY)
    const provider = aiProvider(env)
    return json(200, { available: !!provider, provider, signedIn: !!user, cap, left: user ? Math.max(0, cap - await aiUsed(db, user.id)) : 0 })
  },

  // One question: the conversation so far and a summary of the person's data, sent to the model.
  // Nothing is kept on the server but the day's count.
  'POST /api/ai/chat': async (db, req, env) => {
    const user = await sessionUser(db, req)
    if (!user) return json(401, { error: 'not signed in', code: 'signed-out' })
    const provider = aiProvider(env)
    if (!provider) return json(503, { error: 'the coach is not set up', code: 'no-key' })
    const cap = dailyCap(env.AI_DAILY)
    const used = await aiUsed(db, user.id)
    if (used >= cap) return json(429, { error: 'daily limit reached', code: 'limit', left: 0 })
    const body = await readBody(req)
    const messages = cleanMessages(body.messages)
    if (!messages) return json(400, { error: 'a question is needed', code: 'empty' })
    let reply
    if (provider === 'workers') {
      let data
      try { data = await env.AI.run(WORKERS_MODEL, workersInput({ messages, context: body.context })) } catch (err) {
        console.log('ai workers', String(err?.message || err).slice(0, 200))
        return json(502, { error: 'the coach is unavailable', code: workersErrorCode(err) })
      }
      reply = readWorkersReply(data)
    } else {
      let res
      try {
        res = await fetch(API_URL, {
          method: 'POST', headers: requestHeaders(env.ANTHROPIC_API_KEY),
          body: JSON.stringify(requestBody({ messages, context: body.context, model: env.AI_MODEL || DEFAULT_MODEL }))
        })
      } catch { return json(502, { error: 'the coach could not be reached', code: 'unreachable' }) }
      let data = null
      try { data = await res.json() } catch { /* not JSON */ }
      if (!res.ok) {
        // Anthropic's own reason (never the key), readable with `wrangler pages deployment tail`.
        console.log('ai upstream', res.status, data?.error?.type || '', String(data?.error?.message || '').slice(0, 200))
        const code = res.status === 429 || res.status === 529 ? 'busy' : res.status === 401 || res.status === 403 ? 'no-key' : 'unreachable'
        return json(502, { error: 'the coach is unavailable', code })
      }
      reply = readReply(data)
    }
    if (reply.error) return json(502, { error: 'no answer', code: reply.error })
    await db.prepare('INSERT INTO ai_usage (uid, day, n) VALUES (?, ?, 1) ON CONFLICT (uid, day) DO UPDATE SET n = n + 1')
      .bind(user.id, today()).run()
    return json(200, { text: reply.text, truncated: reply.truncated, left: Math.max(0, cap - used - 1) })
  },

  'GET /api/config': async (db, req) => json(200, {
    invite_only: false, allow_guest: true, signed_in: !!(await sessionUser(db, req)), password_login: true
  }),

  'GET /api/me': async (db, req) => {
    const user = await sessionUser(db, req)
    return user ? json(200, { user: publicUser(user) }) : json(401, { error: 'not signed in' })
  },

  // A nickname and a password, nothing else: no e-mail, no personal data.
  'POST /api/register/password': async (db, req) => {
    const body = await readBody(req)
    const name = text(body.name).trim().slice(0, 40)
    if (!name) return json(400, { error: 'name required', code: 'missing' })
    const problem = passwordProblem(body.password, name)
    if (problem) return json(400, { error: POLICY[problem], code: problem })
    const key = nameKey(name)
    const taken = json(409, { error: 'another profile already signs in with this name', code: 'name-taken' })
    if (await db.prepare('SELECT 1 FROM users WHERE name_key = ?').bind(key).first()) return taken
    const user = { id: randomId(12), name }
    const ins = await db.prepare('INSERT INTO users (id, name, name_key, pw, created) VALUES (?, ?, ?, ?, ?) ON CONFLICT (name_key) DO NOTHING')
      .bind(user.id, name, key, await hashPassword(body.password), new Date().toISOString()).run()
    if (!ins.meta.changes) return taken
    return startSession(db, user)
  },

  'POST /api/login/password': async (db, req) => {
    const body = await readBody(req)
    const key = nameKey(text(body.name ?? body.identifier).slice(0, 300))
    const pw = text(body.password)
    if (!key || !pw) return json(400, { error: 'name and password required', code: 'missing' })
    const user = await db.prepare('SELECT id, name, admin, pw, fails, locked_until FROM users WHERE name_key = ?').bind(key).first()
    const check = await checkPassword(db, user, pw)
    if (check === 'locked') return locked(user)
    if (!check) return json(401, WRONG)
    return startSession(db, user)
  },

  // What the delete sheet asks first: no passkeys here, the password is the proof.
  'GET /api/account/passkeys': async (db, req) => {
    const user = await sessionUser(db, req)
    return user ? json(200, { passkeys: [], password: true, lastWayIn: true }) : json(401, { error: 'not signed in' })
  },

  // Settings → Account → Password: the row needs whether one is set and the sign-in name.
  'GET /api/account/password': async (db, req) => {
    const user = await sessionUser(db, req)
    if (!user) return json(401, { error: 'not signed in' })
    return json(200, { set: true, setAt: null, passkeys: 0, name: user.name, nameTaken: false, email: null })
  },

  // Change it: the current password first. Every other session ends; this one gets a new cookie.
  'POST /api/account/password': async (db, req) => {
    const s = await sessionUser(db, req)
    if (!s) return json(401, { error: 'not signed in' })
    const body = await readBody(req)
    const problem = passwordProblem(body.next, s.name)
    if (problem) return json(400, { error: POLICY[problem], code: problem })
    const current = text(body.current)
    if (!current) return json(403, { error: 'enter your current password', code: 'current-required' })
    const user = await db.prepare('SELECT id, name, admin, pw, fails, locked_until FROM users WHERE id = ?').bind(s.id).first()
    const check = await checkPassword(db, user, current)
    if (check === 'locked') return locked(user)
    if (!check) return json(403, { error: 'your current password is not right', code: 'current-wrong' })
    await db.batch([
      db.prepare('UPDATE users SET pw = ? WHERE id = ?').bind(await hashPassword(body.next), user.id),
      db.prepare('DELETE FROM sessions WHERE uid = ?').bind(user.id)
    ])
    return startSession(db, user)
  },

  // Forgot the password: the code an admin handed out (24 h, once), the name, and a new password.
  'POST /api/login/password-reset': async (db, req) => {
    const body = await readBody(req)
    const key = nameKey(text(body.name).slice(0, 300))
    if (!key || !text(body.code)) return json(400, { error: 'name and reset code required', code: 'missing' })
    const user = await db.prepare('SELECT id, name, admin, fails, locked_until, reset_hash, reset_until FROM users WHERE name_key = ?').bind(key).first()
    if (user && user.locked_until > Date.now()) return locked(user)
    if (!user || !resetCodeMatches(body.code, { h: user.reset_hash, exp: user.reset_until })) {
      if (user) {
        const fails = user.fails + 1
        await db.prepare('UPDATE users SET fails = ?, locked_until = ? WHERE id = ?')
          .bind(fails >= MAX_FAILS ? 0 : fails, fails >= MAX_FAILS ? Date.now() + LOCK_MS : 0, user.id).run()
      }
      return json(401, { error: 'that reset code is wrong, used or expired', code: 'reset-invalid' })
    }
    const problem = passwordProblem(body.next, user.name)
    if (problem) return json(400, { error: POLICY[problem], code: problem })
    await db.batch([
      db.prepare('UPDATE users SET pw = ?, reset_hash = NULL, reset_until = 0, fails = 0, locked_until = 0 WHERE id = ?').bind(await hashPassword(body.next), user.id),
      db.prepare('DELETE FROM sessions WHERE uid = ?').bind(user.id)
    ])
    return startSession(db, user)
  },

  // Admin space (Réglages → Compte → Administration): the accounts, and a reset code for one of them.
  'GET /api/admin/users': async (db, req) => {
    const me = await sessionUser(db, req)
    if (!me) return json(401, { error: 'not signed in' })
    if (!me.admin) return json(403, { error: 'forbidden' })
    const { results } = await db.prepare(`SELECT u.id, u.name, u.admin, u.created, u.reset_until, u.locked_until, s.rev,
      (SELECT MAX(exp) FROM sessions WHERE uid = u.id) AS last_exp FROM users u LEFT JOIN states s ON s.uid = u.id ORDER BY u.name_key`).all()
    const now = Date.now()
    return json(200, { users: results.map(u => ({ id: u.id, name: u.name, admin: !!u.admin, created: u.created, rev: u.rev || 0,
      // a session lives SESSION_DAYS from its sign-in: its end tells when they last signed in
      lastSignIn: u.last_exp ? u.last_exp - SESSION_DAYS * 86400000 : null,
      resetUntil: u.reset_until > now ? u.reset_until : null, locked: u.locked_until > now })) })
  },

  'POST /api/admin/user/password-reset': async (db, req) => {
    const me = await sessionUser(db, req)
    if (!me) return json(401, { error: 'not signed in' })
    if (!me.admin) return json(403, { error: 'forbidden' })
    const body = await readBody(req)
    const user = await db.prepare('SELECT id, name FROM users WHERE id = ?').bind(text(body.id)).first()
    if (!user) return json(404, { error: 'no such user' })
    const code = makeResetCode(), expires = Date.now() + RESET_TTL_MS
    await db.prepare('UPDATE users SET reset_hash = ?, reset_until = ?, fails = 0, locked_until = 0 WHERE id = ?').bind(hashResetCode(code), expires, user.id).run()
    return json(200, { code, expires, name: user.name })
  },

  'POST /api/logout/all': async (db, req) => {
    const user = await sessionUser(db, req)
    if (!user) return json(401, { error: 'not signed in' })
    await db.prepare('DELETE FROM sessions WHERE uid = ?').bind(user.id).run()
    return json(200, { ok: true }, { 'Set-Cookie': clearCookie })
  },

  // Settings → Account → Delete my account: the typed name plus the current password.
  'POST /api/account/delete': async (db, req) => {
    const s = await sessionUser(db, req)
    if (!s) return json(401, { error: 'not signed in' })
    const body = await readBody(req)
    if (typeof body.name !== 'string' || body.name.trim() !== s.name) return json(400, { error: 'type the account name to confirm', code: 'confirm-name' })
    const user = await db.prepare('SELECT id, name, pw, fails, locked_until FROM users WHERE id = ?').bind(s.id).first()
    const current = text(body.current)
    if (!current) return json(403, { error: 'enter your current password', code: 'current-required' })
    const check = await checkPassword(db, user, current)
    if (check === 'locked') return locked(user)
    if (!check) return json(403, { error: 'your current password is not right', code: 'current-wrong' })
    await db.batch([
      db.prepare('DELETE FROM states WHERE uid = ?').bind(user.id),
      db.prepare('DELETE FROM sessions WHERE uid = ?').bind(user.id),
      db.prepare('DELETE FROM users WHERE id = ?').bind(user.id)
    ])
    return json(200, { ok: true }, { 'Set-Cookie': clearCookie })
  },

  'POST /api/logout': async (db, req) => {
    const token = cookieOf(req)
    if (token) await db.prepare('DELETE FROM sessions WHERE hash = ? OR exp < ?').bind(await sha256(token), Date.now()).run()
    return json(200, { ok: true }, { 'Set-Cookie': clearCookie })
  },

  'GET /api/data': async (db, req) => {
    const user = await sessionUser(db, req)
    if (!user) return json(401, { error: 'not signed in' })
    const state = await readState(db, user.id)
    return json(200, { state: forClient(state), rev: state?._rev || 0 })
  },

  'GET /api/data/rev': async (db, req) => {
    const user = await sessionUser(db, req)
    if (!user) return json(401, { error: 'not signed in' })
    const row = await db.prepare('SELECT rev, wid FROM states WHERE uid = ?').bind(user.id).first()
    return json(200, { rev: row?.rev || 0, ...(row?.wid ? { wid: row.wid } : {}) })
  },

  // The same checks and bookkeeping as PUT /api/data and commitState() in api/server.js.
  'PUT /api/data': async (db, req) => {
    const user = await sessionUser(db, req)
    if (!user) return json(401, { error: 'not signed in' })
    const body = await readBody(req)
    const state = body.state
    if (!state || typeof state !== 'object') return json(400, { error: 'state required' })
    if (!Array.isArray(state) && !Object.keys(state).some(k => k !== '_rev' && k !== '_ts')) return json(400, { error: 'state required' })
    const list = v => v == null || Array.isArray(v)
    if (Array.isArray(state) || !list(state.workouts) || !list(state.routines)) return json(400, { error: 'invalid state' })
    for (const k of ['workouts', 'routines']) if (Array.isArray(state[k])) state[k] = records(state[k])

    const cur = await readState(db, user.id)
    const curRev = cur?._rev || 0
    if ((body.baseRev != null && body.baseRev !== curRev) ||
        (body.baseRev != null && typeof body.baseWid === 'string' && cur?._wid && body.baseWid !== cur._wid)) {
      return json(409, { error: 'conflict', rev: curRev, state: forClient(cur) })
    }
    delete state.active
    const storedReset = Number(cur?.resetAt) || 0
    if (storedReset > (Number(state.resetAt) || 0)) {
      state.resetAt = cur.resetAt
      if (cur.resetIds && typeof cur.resetIds === 'object') state.resetIds = cur.resetIds
      else delete state.resetIds
    }
    const report = {}
    try { stampPut(cur, state, { overRead: body.baseRev != null && body.baseRev === curRev, stamped: body.stamped === true, report }) }
    catch (e) { if (e instanceof RangeError) return json(400, { error: 'invalid state' }); throw e }
    state._rev = curRev + (report.changed ? 2 : 1)
    state._wids = [...(Array.isArray(cur?._wids) ? cur._wids : []), ...(cur?._wid ? [cur._wid] : [])]
      .filter(x => typeof x === 'string').slice(-WID_KEEP)
    state._wid = randomId(8)
    let doc
    try { doc = JSON.stringify(state) } catch (e) { if (e instanceof RangeError) return json(400, { error: 'invalid state' }); throw e }
    if (doc.length > MAX_DOC) return json(413, { error: 'profile too large for this server', code: 'too-large' })
    // Compare-and-write: another device may have written between the read above and here.
    const done = cur
      ? await db.prepare('UPDATE states SET doc = ?, rev = ?, wid = ? WHERE uid = ? AND rev = ?').bind(doc, state._rev, state._wid, user.id, curRev).run()
      : await db.prepare('INSERT INTO states (uid, doc, rev, wid) VALUES (?, ?, ?, ?) ON CONFLICT (uid) DO NOTHING').bind(user.id, doc, state._rev, state._wid).run()
    if (!done.meta.changes) {
      const now = await readState(db, user.id)
      return json(409, { error: 'conflict', rev: now?._rev || 0, state: forClient(now) })
    }
    return json(200, { ok: true, ts: state._ts || null, rev: curRev + 1, wid: state._wid })
  }
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url)
  const route = routes[`${request.method} ${url.pathname.replace(/\/+$/, '')}`]
  if (!route) return json(404, { error: 'not available on this server' })
  // CSRF: a write must come from the app's own page.
  if (request.method !== 'GET' && request.headers.get('Origin') !== url.origin) return json(403, { error: 'origin not allowed' })
  return route(env.DB, request, env)
}
