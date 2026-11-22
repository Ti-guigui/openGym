import { useEffect, useRef } from 'react'

// The Atelier's 3D exercise player (public/mannequin/, scripts/sync-mannequin.mjs). It builds its
// own controls inside the <figure>, so React only hands it an empty host and never touches the
// inside. three.js and the bodies (~2.4 MB) load on the first 3D exercise only; the service worker
// keeps them for offline use like any other file it has fetched.
const base = () => new URL('mannequin/', document.baseURI).href
let player = null
function loadPlayer() {
  if (!player) {
    const css = document.createElement('link')
    css.rel = 'stylesheet'; css.href = base() + 'mannequin.css'
    document.head.append(css)
    player = import(/* @vite-ignore */ base() + 'lecteur.js')
    player.catch(() => { player = null })
  }
  return player
}

export default function Mannequin3D({ anim, label }) {
  const host = useRef(null)
  useEffect(() => {
    const fig = document.createElement('figure')
    fig.className = 'mq'
    fig.dataset.ex = anim
    const poster = document.createElement('img')    // what shows until (or without) WebGL
    poster.className = 'mq-poster'; poster.alt = label || ''; poster.decoding = 'async'
    poster.src = base() + 'affiches/' + anim + '.webp'
    fig.append(poster)
    host.current.append(fig)
    let alive = true
    loadPlayer().then(m => { if (alive) m.brancher(fig) }, () => {})
    return () => { alive = false; fig.remove() }
  }, [anim, label])
  return <div ref={host} className="mq-host" />
}
