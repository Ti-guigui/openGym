import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { t, exerciseNameFor } from '../lib/i18n.js'
import { exOr } from '../lib/exercises.js'
import { coachContext, loadChat, saveChat } from '../lib/coach-ia.js'
import Icon from '../components/Icon.jsx'
import ChatInput from '../components/ChatInput.jsx'
import { Button } from '../components/ui.jsx'

// Ti Guigui FIT's AI coach: a chat with Claude through the Pages server (functions/api/[[path]].js,
// /api/ai/*), each question sent with a summary of the person's data (lib/coach-ia.js). The
// conversation stays on this device; the server keeps only the day's count. Accounts only.

const ERRORS = {
  'signed-out': 'Sign in to an account to talk to the coach.',
  'no-key': 'The coach is not set up on this server yet.',
  limit: 'That’s all the questions for today. Back tomorrow.',
  busy: 'The coach is busy. Try again in a minute.',
  refused: 'The coach could not answer that one. Try putting it another way.',
}
const SUGGEST = [
  'What should I eat tonight?',
  'Is my calorie deficit right for me?',
  'Plan my training week.',
  'How are my measurements going?',
]

export default function CoachIA() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const user = useStore(s => s.user)
  const [status, setStatus] = useState(null)
  const [chat, setChat] = useState(loadChat)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const end = useRef(null)

  useEffect(() => {
    let live = true
    fetch('/api/ai/status', { credentials: 'same-origin' }).then(r => (r.ok ? r.json() : null)).catch(() => null)
      .then(s => { if (live) setStatus(s || { available: false, signedIn: !!user, left: 0 }) })
    return () => { live = false }
  }, [user])
  useEffect(() => { end.current?.scrollIntoView?.({ block: 'end' }) }, [chat.length, busy])

  const send = async (q, base = chat) => {
    const question = String(q ?? text).trim()
    if (!question || busy) return
    const next = [...base, { role: 'user', content: question }]
    setChat(next); saveChat(next); setText(''); setError(null); setBusy(true)
    try {
      const r = await fetch('/api/ai/chat', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, context: coachContext(S, { nameOf: id => exerciseNameFor(exOr(id)) }) }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) { setError(data.code || 'unreachable'); return }
      const done = [...next, { role: 'assistant', content: data.text }]
      setChat(done); saveChat(done)
      setStatus(s => ({ ...(s || {}), left: data.left }))
    } catch { setError('unreachable') } finally { setBusy(false) }
  }
  const clear = () => { setChat([]); saveChat([]); setError(null) }

  const off = status && (!status.available || !status.signedIn)
  return <div className="narrow cia">
    <div className="hdr">
      <button className="iconbtn" data-back="/home" onClick={() => nav('/home')} aria-label={t('Home')}><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginInlineStart: 12 }}><h1>{t('AI coach')}</h1>
        <div className="sub">{status?.signedIn && status?.available ? t('{0} questions left today', status.left) : t('Training and nutrition, from your data')}</div></div>
      {chat.length > 0 && <button className="iconbtn" onClick={clear} aria-label={t('New conversation')}><Icon name="trash" /></button>}
    </div>

    {off && <div className="card cia-off"><Icon name="info" />
      <span>{t(!status.signedIn ? ERRORS['signed-out'] : ERRORS['no-key'])}</span></div>}

    {!chat.length && <div className="card cia-hello">
      <Icon name="sparkles" />
      <div>{t('Ask anything about training, food or your progress. The coach sees your profile, goal, calories, weight, measurements and last workouts.')}</div>
      <div className="chips cia-chips">{SUGGEST.map(s => <button key={s} type="button" className="chip nocap" disabled={off || busy} onClick={() => send(t(s))}>{t(s)}</button>)}</div>
    </div>}

    <div className="cia-list" aria-live="polite">
      {chat.map((m, i) => <div key={i} className={'cia-msg ' + m.role}>{m.content}</div>)}
      {busy && <div className="cia-msg assistant cia-typing" aria-label={t('The coach is writing')}><span /><span /><span /></div>}
      {error && <div className="cia-err small"><Icon name="warning" /> {t(ERRORS[error] || 'Couldn’t reach the coach. Check your connection and try again.')}
        {!ERRORS[error] || error === 'busy' ? <Button size="sm" variant="ghost" onClick={() => { const last = chat.at(-1); if (last?.role === 'user') send(last.content, chat.slice(0, -1)) }}>{t('Retry')}</Button> : null}</div>}
      <div ref={end} />
    </div>

    <div className="cia-compose">
      <ChatInput value={text} onChange={setText} onSend={() => send()} placeholder={t('Ask the coach…')}
        disabled={off || busy} maxLength={2000} expanded={expanded} setExpanded={setExpanded} />
      <Button variant="primary" icon="arrowUp" className="cia-send" aria-label={t('Send')} disabled={off || busy || !text.trim()} onClick={() => send()} />
    </div>
    <div className="small dim cia-foot">{t('Answers come from an AI (Claude): they can be wrong and are not medical advice. Your question and a summary of your data are sent to Anthropic to answer.')}</div>
  </div>
}
