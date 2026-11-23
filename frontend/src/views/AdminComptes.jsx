import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { api } from '../lib/api.js'
import { pathBefore } from '../lib/nav.js'
import { confirmSheet } from '../sheets.jsx'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import '../admin.css'

// Ti Guigui FIT on Cloudflare Pages (functions/): the admin space is only the list of accounts and a
// one-time reset code for whoever forgot their password. French only, like the app's own operator
// page is English only: it is not part of the translated surface.

const jour = ts => (ts ? new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'jamais')
const heure = ts => new Date(ts).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

// Le seul moment où le code est visible : la feuille est verrouillée pour ne pas le perdre d'un tap à côté.
function CodeSheet({ name, code, expires, close }) {
  const toast = useUI(s => s.toast)
  const copy = () => { navigator.clipboard?.writeText(code).catch(() => {}); toast('Code copié') }
  return <>
    <h3>Code pour {name}</h3>
    <div className="adm-lead">Donne ce code à <b>{name}</b>. Sur le premier écran, choisir « Se connecter avec un mot de passe », puis
      « Tu as un code de réinitialisation de ton administrateur ? », taper le nom <b>{name}</b>, ce code et un nouveau mot de passe.
      Il ne marche qu'une fois, jusqu'au {heure(expires)}, et ne sera plus affiché ensuite.</div>
    <button className="adm-code" style={{ fontSize: 'var(--fs-title2)', width: '100%', padding: '14px 0' }} onClick={copy} aria-label="Copier le code">{code}</button>
    <div style={{ height: 12 }} />
    <Button variant="primary" onClick={close}>Terminé</Button>
  </>
}

export default function AdminComptes() {
  const nav = useNavigate()
  const user = useStore(s => s.user)
  const { toast, openSheet } = useUI.getState()
  const [users, setUsers] = useState(null)
  const [err, setErr] = useState(null)
  const load = () => api('/api/admin/users').then(d => { setUsers(d.users); setErr(null) }).catch(e => setErr(e.message || 'Échec du chargement'))
  useEffect(() => { load() }, [])

  const reset = u => confirmSheet({
    title: 'Réinitialiser le mot de passe de ' + u.name + ' ?',
    message: 'Tu obtiens un code à usage unique, valable 24 heures, à donner à cette personne. Avec ce code, elle choisit un nouveau mot de passe et est déconnectée de ses autres appareils. Tant que le code n’a pas servi, son mot de passe actuel marche toujours.',
    confirmText: 'Créer le code',
    onConfirm: () => api('/api/admin/user/password-reset', { method: 'POST', body: JSON.stringify({ id: u.id }) })
      .then(r => { load(); openSheet(done => <CodeSheet name={r.name} code={r.code} expires={r.expires} close={done} />, { locked: true }) })
      .catch(e => toast(e.message)),
  })

  const hasBack = (window.history.state?.idx || 0) > 0
  return <div className="narrow">
    <div className="hdr">
      <button className="iconbtn" data-back={(hasBack ? pathBefore() : null) || '/settings/account'}
        onClick={() => hasBack ? nav(-1) : nav('/settings/account', { replace: true })} aria-label="Retour"><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginInlineStart: 12 }}><h1 style={{ margin: 0 }}>Administration</h1>
        <div className="sub">{users ? users.length + ' compte' + (users.length > 1 ? 's' : '') : err ? 'Chargement impossible' : 'Chargement…'}</div></div>
      <button className="iconbtn" onClick={load} aria-label="Actualiser"><Icon name="reset" /></button>
    </div>
    <div className="adm-intro">Les comptes de l’appli. Si quelqu’un a oublié son mot de passe, crée-lui un code de réinitialisation.
      Tu ne vois que le pseudo et les dates : les séances restent privées.</div>
    {err && <div className="card" role="alert" style={{ borderColor: 'var(--red)' }}>
      <div className="row between"><h2 style={{ margin: 0 }}>Impossible de charger les comptes</h2>
        <Button size="sm" icon="reset" onClick={load}>Réessayer</Button></div>
      <div className="adm-lead" style={{ marginBottom: 0 }}>{err}</div>
    </div>}
    <div className="card">
      <h2 style={{ margin: 0 }}>Comptes</h2>
      <div className="list">
        {(users || []).map(u => <div key={u.id} className="item">
          <div className="grow">
            <div className="tt">{u.name}{u.admin && <span className="adm-pill acc" style={{ marginInlineStart: 6 }}>admin</span>}
              {u.locked && <span className="adm-pill bad" style={{ marginInlineStart: 6 }}>bloqué 15 min</span>}</div>
            <div className="ss">Créé le {jour(Date.parse(u.created))} · dernière connexion : {jour(u.lastSignIn)}</div>
            {u.resetUntil && <div className="ss">Code de réinitialisation valable jusqu’au {heure(u.resetUntil)}</div>}
          </div>
          {u.id !== user?.id && <Button size="sm" icon="key" onClick={() => reset(u)}>Réinitialiser</Button>}
        </div>)}
      </div>
    </div>
  </div>
}
