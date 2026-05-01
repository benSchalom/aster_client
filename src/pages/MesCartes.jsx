import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Html5Qrcode } from 'html5-qrcode'
import { QRCodeSVG } from 'qrcode.react'
import { colors, font, fontSize, spacing, radius } from '../utils/theme'

const API = import.meta.env.VITE_API_URL
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

const TYPE_CONFIG = {
  fidelite:            { label: 'Fidélité',    color: '#2A7DE1', gradient: 'linear-gradient(135deg, #2A7DE1, #1A3A6B)' },
  abonnement_seances:  { label: 'Séances',     color: '#14C87A', gradient: 'linear-gradient(135deg, #14C87A, #0A7A4A)' },
  abonnement_temporel: { label: 'Abonnement',  color: '#FF6B35', gradient: 'linear-gradient(135deg, #FF6B35, #C03A0A)' },
}

function Badge({ type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.fidelite
  return (
    <span style={{
      background: cfg.color + '22',
      color: cfg.color,
      fontSize: fontSize.xs,
      fontWeight: font.weight.semibold,
      padding: `3px ${spacing.sm}px`,
      borderRadius: radius.xl,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    }}>{cfg.label}</span>
  )
}

function CarteItem({ carte }) {
  const tamponsMax = carte.tampons_max || 10
  const cfg = TYPE_CONFIG[carte.type] || TYPE_CONFIG.fidelite
  const [walletUrl, setWalletUrl] = useState(null)
  const [qrVisible, setQrVisible] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('portail_token')
    axios.get(`${API}${carte.wallet_url}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setWalletUrl(res.data.save_url))
      .catch(() => {})
  }, [carte.wallet_url])

  return (
    <div style={{
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.xl,
      overflow: 'hidden',
      marginBottom: spacing.md,
    }}>
      <div style={{ height: 4, background: cfg.gradient }} />

      <div style={{ padding: spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
          {carte.pro_logo ? (
            <img src={carte.pro_logo} alt="" style={{
              width: 44, height: 44, borderRadius: radius.md, objectFit: 'cover', flexShrink: 0,
            }} />
          ) : (
            <div style={{
              width: 44, height: 44, borderRadius: radius.md, flexShrink: 0,
              background: cfg.color + '22',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: cfg.color, fontSize: fontSize.lg, fontWeight: font.weight.bold,
            }}>
              {(carte.pro_nom || 'C')[0].toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              color: colors.text, fontWeight: font.weight.semibold,
              fontSize: fontSize.md, margin: `0 0 4px`,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {carte.pro_nom || 'Commerce'}
            </p>
            <Badge type={carte.type} />
          </div>
        </div>

        {carte.type === 'fidelite' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.sm }}>
              <span style={{ color: colors.textMuted, fontSize: fontSize.base }}>Tampons</span>
              <span style={{ color: colors.text, fontWeight: font.weight.semibold, fontSize: fontSize.base }}>
                {carte.tampons} / {tamponsMax}
              </span>
            </div>
            <div style={{ background: colors.bg, borderRadius: radius.sm, height: 5, overflow: 'hidden', marginBottom: spacing.md }}>
              <div style={{
                width: `${Math.min((carte.tampons / tamponsMax) * 100, 100)}%`,
                height: '100%',
                background: cfg.gradient,
                borderRadius: radius.sm,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <div className="tampons-grid">
              {Array.from({ length: tamponsMax }).map((_, i) => (
                <div key={i} style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: i < carte.tampons ? cfg.gradient : 'transparent',
                  border: `2px solid ${i < carte.tampons ? cfg.color : colors.border}`,
                }} />
              ))}
            </div>
          </>
        )}

        {carte.type === 'abonnement_seances' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.sm }}>
              <span style={{ color: colors.textMuted, fontSize: fontSize.base }}>Séances restantes</span>
              <span style={{ color: cfg.color, fontWeight: font.weight.bold, fontSize: fontSize.xxl }}>
                {carte.seances_restantes}
              </span>
            </div>
            <div style={{ background: colors.bg, borderRadius: radius.sm, height: 5, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min((carte.seances_restantes / 10) * 100, 100)}%`,
                height: '100%', background: cfg.gradient, borderRadius: radius.sm,
              }} />
            </div>
          </>
        )}

        {carte.type === 'abonnement_temporel' && (
          <div>
            <p style={{ color: colors.textMuted, fontSize: fontSize.base, margin: `0 0 ${spacing.xs}px` }}>
              Expire le
            </p>
            <p style={{ color: colors.text, fontWeight: font.weight.semibold, fontSize: fontSize.md, margin: 0 }}>
              {carte.date_expiration
                ? new Date(carte.date_expiration).toLocaleDateString('fr-CA', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })
                : 'N/A'}
            </p>
          </div>
        )}

        {carte.annonce && (
          <div style={{
            marginTop: spacing.md,
            padding: spacing.md,
            background: cfg.color + '11',
            border: `1px solid ${cfg.color}33`,
            borderRadius: radius.md,
            display: 'flex',
            gap: spacing.sm,
            alignItems: 'flex-start',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <div>
              <p style={{ color: cfg.color, fontSize: fontSize.xs, fontWeight: font.weight.semibold, margin: `0 0 2px`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {carte.annonce.titre}
              </p>
              <p style={{ color: colors.text, fontSize: fontSize.base, margin: 0, lineHeight: 1.4 }}>
                {carte.annonce.message}
              </p>
            </div>
          </div>
        )}

        <div style={{ marginTop: spacing.lg }}>
          <button
            onClick={() => setQrVisible(v => !v)}
            style={{
              width: '100%',
              padding: `${spacing.sm + 2}px`,
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              color: colors.textMuted,
              fontSize: fontSize.base,
              fontWeight: font.weight.medium,
              fontFamily: font.sans,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            {qrVisible ? 'Masquer le code QR' : 'Afficher le code QR'}
          </button>

          {qrVisible && (
            <div style={{
              marginTop: spacing.sm,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: spacing.sm,
              background: '#FFFFFF',
              borderRadius: radius.md,
              padding: spacing.md,
            }}>
              <QRCodeSVG value={carte.serial} size={160} />
              <p style={{ color: '#555', fontSize: fontSize.xs, margin: 0, letterSpacing: '0.04em' }}>
                {carte.serial}
              </p>
            </div>
          )}
        </div>

        <a
          href={walletUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => !walletUrl && e.preventDefault()}
          style={{
            display: 'block',
            marginTop: spacing.sm,
            padding: `${spacing.sm + 2}px`,
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            color: walletUrl ? colors.text : colors.textMuted,
            fontSize: fontSize.base,
            fontWeight: font.weight.medium,
            textDecoration: 'none',
            fontFamily: font.sans,
            textAlign: 'center',
          }}
        >
          Ajouter à Google Wallet
        </a>
      </div>
    </div>
  )
}

export default function MesCartes() {
  const [cartes, setCartes] = useState([])
  const [clientNom, setClientNom] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showIOSBanner, setShowIOSBanner] = useState(false)
  const [notifStatut, setNotifStatut] = useState('idle')
  const [reloadTrigger, setReloadTrigger] = useState(0)

  // Scanner
  const [scannerOuvert, setScannerOuvert] = useState(false)
  const [scanEtat, setScanEtat] = useState('idle') // 'idle' | 'erreur' | 'succes'
  const [scanMessage, setScanMessage] = useState('')
  const [scanNomReqis, setScanNomRequis] = useState(false)
  const [scanSlug, setScanSlug] = useState('')
  const [nomSaisi, setNomSaisi] = useState('')
  const scannerRef = useRef(null)

  const navigate = useNavigate()

  // Détection install Android
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Détection install iOS
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isStandalone = window.navigator.standalone === true
    if (isIOS && !isStandalone) setShowIOSBanner(true)
  }, [])

  const ajouterEcranAccueil = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstallPrompt(null)
  }

  // Chargement des cartes
  useEffect(() => {
    const token = localStorage.getItem('portail_token')
    if (!token) { navigate('/connexion'); return }

    setLoading(true)
    axios.get(`${API}/portail/mes-cartes`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setCartes(res.data.cartes)
        if (res.data.cartes.length > 0) setClientNom(res.data.cartes[0].client_nom || '')
        if (Notification.permission === 'granted') abonnerPush()
      })
      .catch(e => {
        if (e.response?.status === 401) {
          localStorage.removeItem('portail_token')
          navigate('/connexion')
        } else {
          setError('Erreur lors du chargement')
        }
      })
      .finally(() => setLoading(false))
  }, [reloadTrigger])

  // Démarrage/arrêt du scanner
  useEffect(() => {
    if (!scannerOuvert) return

    let instance = null
    let done = false

    const demarrer = async () => {
      try {
        instance = new Html5Qrcode('qr-scanner-zone')
        scannerRef.current = instance
        await instance.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (texte) => {
            if (done) return
            done = true
            try { await instance.stop() } catch {}
            traiterScan(texte)
          },
          () => {}
        )
      } catch {
        setScanEtat('erreur')
        setScanMessage('Accès à la caméra refusé — vérifiez les permissions de votre navigateur')
      }
    }

    demarrer()

    return () => {
      done = true
      if (instance) instance.stop().catch(() => {})
    }
  }, [scannerOuvert])

  const traiterScan = async (texte) => {
    try {
      let slug = ''
      try {
        const url = new URL(texte)
        const match = url.pathname.match(/\/rejoindre\/([^/?#]+)/)
        slug = match?.[1] || ''
      } catch {
        slug = texte.trim()
      }

      if (!slug) {
        setScanEtat('erreur')
        setScanMessage('Ce QR code ne correspond pas à un établissement ASTER')
        return
      }

      await appelRejoindre(slug)
    } catch {
      setScanEtat('erreur')
      setScanMessage('Erreur de lecture du QR code')
    }
  }

  const appelRejoindre = async (slug, nom) => {
    const token = localStorage.getItem('portail_token')
    try {
      const body = nom ? { full_name: nom } : {}
      const res = await axios.post(`${API}/portail/rejoindre/${slug}`, body, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setScanEtat('succes')
      setScanMessage(`Carte ajoutée — ${res.data.pro_nom}`)
      setTimeout(() => {
        setReloadTrigger(t => t + 1)
        fermerScanner()
      }, 1800)
    } catch (err) {
      if (err.response?.data?.need_name) {
        setScanNomRequis(true)
        setScanSlug(slug)
        setScanEtat('besoin_nom')
      } else {
        setScanEtat('erreur')
        setScanMessage(err.response?.data?.error || "Erreur lors de l'ajout de la carte")
      }
    }
  }

  const ouvrirScanner = () => {
    setScanEtat('idle')
    setScanMessage('')
    setScanNomRequis(false)
    setScanSlug('')
    setNomSaisi('')
    setScannerOuvert(true)
  }

  const fermerScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {})
      scannerRef.current = null
    }
    setScannerOuvert(false)
    setScanEtat('idle')
    setScanMessage('')
    setScanNomRequis(false)
  }

  const abonnerPush = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    if (!VAPID_PUBLIC_KEY) return
    const token = localStorage.getItem('portail_token')
    setNotifStatut('demande')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setNotifStatut('refuse'); return }
      const reg = await navigator.serviceWorker.ready
      const existant = await reg.pushManager.getSubscription()
      const sub = existant || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      await axios.post(`${API}/portail/subscribe-push`, { push_token: sub.toJSON() }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifStatut('ok')
    } catch {
      setNotifStatut('idle')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('portail_token')
    navigate('/connexion')
  }

  const prenom = clientNom ? clientNom.split(' ')[0] : ''

  return (
    <div style={{ minHeight: '100dvh', background: colors.bg, fontFamily: font.sans }}>

      {/* Header */}
      <div className="wallet-header">
        <div className="wallet-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <img src="/web-app-manifest-192x192.png" alt="ASTER Wallet"
              style={{ width: 32, height: 32, borderRadius: radius.sm }} />
            <span style={{
              color: colors.text, fontSize: fontSize.md,
              fontWeight: font.weight.semibold,
            }}>ASTER Wallet</span>
          </div>

          <button onClick={handleLogout} style={{
            background: 'none',
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            padding: `${spacing.sm}px ${spacing.lg}px`,
            color: colors.textMuted,
            fontSize: fontSize.md,
            cursor: 'pointer',
            fontFamily: font.sans,
          }}>Déconnexion</button>
        </div>
      </div>

      {/* Contenu */}
      <div className="cartes-content">

        {/* Bannière iOS */}
        {showIOSBanner && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: spacing.md,
            background: 'rgba(42,125,225,0.08)',
            border: '1px solid rgba(42,125,225,0.2)',
            borderRadius: radius.lg,
            padding: `${spacing.md}px ${spacing.lg}px`,
            marginBottom: spacing.md,
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: colors.text, fontWeight: font.weight.semibold, fontSize: fontSize.base, margin: `0 0 2px` }}>
                Installer ASTER Wallet
              </p>
              <p style={{ color: colors.textMuted, fontSize: fontSize.sm, margin: 0 }}>
                Appuyez sur le bouton Partager puis "Sur l'écran d'accueil"
              </p>
            </div>
            <button
              onClick={() => setShowIOSBanner(false)}
              style={{
                background: 'none', border: 'none',
                color: colors.textMuted, fontSize: fontSize.xl,
                cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0,
              }}
            >
              x
            </button>
          </div>
        )}

        {/* Bannière Android */}
        {installPrompt && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: spacing.md,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            padding: `${spacing.md}px ${spacing.lg}px`,
            marginBottom: spacing.md,
          }}>
            <div>
              <p style={{ color: colors.text, fontWeight: font.weight.semibold, fontSize: fontSize.base, margin: `0 0 2px` }}>
                Installer l'application
              </p>
              <p style={{ color: colors.textMuted, fontSize: fontSize.sm, margin: 0 }}>
                Ajoutez ASTER Wallet à votre écran d'accueil
              </p>
            </div>
            <button onClick={ajouterEcranAccueil} style={{
              background: colors.blue,
              border: 'none', borderRadius: radius.md,
              padding: `${spacing.sm}px ${spacing.md}px`,
              color: colors.text, fontSize: fontSize.base,
              fontWeight: font.weight.semibold, fontFamily: font.sans,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}>Installer</button>
          </div>
        )}

        {/* Bannière notifications */}
        {notifStatut === 'idle' && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: spacing.md,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            padding: `${spacing.md}px ${spacing.lg}px`,
            marginBottom: spacing.md,
          }}>
            <div>
              <p style={{ color: colors.text, fontWeight: font.weight.semibold, fontSize: fontSize.base, margin: `0 0 2px` }}>
                Activer les notifications
              </p>
              <p style={{ color: colors.textMuted, fontSize: fontSize.sm, margin: 0 }}>
                Recevez les offres de vos commerces
              </p>
            </div>
            <button onClick={abonnerPush} style={{
              background: colors.blue,
              border: 'none', borderRadius: radius.md,
              padding: `${spacing.sm}px ${spacing.md}px`,
              color: colors.text, fontSize: fontSize.base,
              fontWeight: font.weight.semibold, fontFamily: font.sans,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}>Activer</button>
          </div>
        )}

        {/* Titre + bouton ajouter */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: spacing.lg }}>
          <div>
            {prenom && (
              <p style={{ color: colors.text, fontSize: fontSize.lg, fontWeight: font.weight.semibold, margin: `0 0 ${spacing.xs}px` }}>
                Bonjour, {prenom}
              </p>
            )}
            <h1 style={{
              color: colors.text, fontSize: fontSize.xxl,
              fontWeight: font.weight.bold, margin: 0, letterSpacing: '-0.02em',
            }}>Mes cartes</h1>
          </div>

          <button
            onClick={ouvrirScanner}
            style={{
              display: 'flex', alignItems: 'center', gap: spacing.sm,
              background: colors.blue,
              border: 'none', borderRadius: radius.md,
              padding: `${spacing.sm}px ${spacing.md}px`,
              color: colors.text, fontSize: fontSize.base,
              fontWeight: font.weight.semibold, fontFamily: font.sans,
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
              <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
              <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
              <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
              <rect x="7" y="7" width="3" height="3"/>
              <rect x="14" y="7" width="3" height="3"/>
              <rect x="7" y="14" width="3" height="3"/>
              <rect x="14" y="14" width="3" height="3"/>
            </svg>
            Ajouter
          </button>
        </div>

        {/* États */}
        {loading && (
          <p style={{ color: colors.textMuted, fontSize: fontSize.base, textAlign: 'center', padding: `${spacing.xxl}px 0` }}>
            Chargement...
          </p>
        )}

        {error && (
          <div style={{
            background: colors.surface, border: `1px solid ${colors.error}44`,
            borderRadius: radius.md, padding: spacing.md,
            color: colors.error, fontSize: fontSize.base,
          }}>{error}</div>
        )}

        {!loading && !error && cartes.length === 0 && (
          <div style={{ textAlign: 'center', padding: `${spacing.xxl}px ${spacing.lg}px` }}>
            <p style={{ color: colors.textMuted, fontSize: fontSize.base, margin: `0 0 ${spacing.md}px` }}>
              Aucune carte pour l'instant
            </p>
            <button
              onClick={ouvrirScanner}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: spacing.sm,
                background: colors.blue, border: 'none', borderRadius: radius.md,
                padding: `${spacing.sm}px ${spacing.lg}px`,
                color: colors.text, fontSize: fontSize.base,
                fontWeight: font.weight.semibold, fontFamily: font.sans,
                cursor: 'pointer',
              }}
            >
              Scanner un QR code
            </button>
          </div>
        )}

        {cartes.map(carte => <CarteItem key={carte.id} carte={carte} />)}
      </div>

      {/* Modal scanner */}
      {scannerOuvert && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: spacing.lg,
          }}
        >
          <div style={{
            width: '100%', maxWidth: 360,
            background: colors.surface,
            borderRadius: radius.xl,
            overflow: 'hidden',
          }}>
            {/* En-tête modal */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: `${spacing.md}px ${spacing.lg}px`,
              borderBottom: `1px solid ${colors.border}`,
            }}>
              <span style={{ color: colors.text, fontWeight: font.weight.semibold, fontSize: fontSize.md }}>
                Ajouter une carte
              </span>
              <button
                onClick={fermerScanner}
                style={{
                  background: 'none', border: 'none',
                  color: colors.textMuted, fontSize: fontSize.xl,
                  cursor: 'pointer', padding: 0, lineHeight: 1,
                  fontFamily: font.sans,
                }}
              >
                x
              </button>
            </div>

            {/* Zone scanner */}
            {scanEtat === 'idle' && (
              <>
                <div
                  id="qr-scanner-zone"
                  style={{ width: '100%', background: colors.bg }}
                />
                <p style={{
                  color: colors.textMuted, fontSize: fontSize.sm,
                  textAlign: 'center', padding: `${spacing.sm}px ${spacing.lg}px ${spacing.md}px`,
                  margin: 0,
                }}>
                  Pointez la caméra vers le QR code du commerçant
                </p>
              </>
            )}

            {/* Demande de nom (premier scan, pas de compte existant) */}
            {scanEtat === 'besoin_nom' && (
              <div style={{ padding: spacing.lg, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                <p style={{ color: colors.textMuted, fontSize: fontSize.base, margin: 0, textAlign: 'center' }}>
                  Entrez votre nom pour créer votre carte
                </p>
                <input
                  type="text"
                  value={nomSaisi}
                  onChange={e => setNomSaisi(e.target.value)}
                  placeholder="Marie Tremblay"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.md,
                    padding: '12px 14px',
                    color: colors.text,
                    fontSize: fontSize.md,
                    fontFamily: font.sans,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => nomSaisi.trim() && appelRejoindre(scanSlug, nomSaisi.trim())}
                  disabled={!nomSaisi.trim()}
                  style={{
                    background: nomSaisi.trim() ? colors.blue : colors.surface,
                    border: 'none', borderRadius: radius.md,
                    padding: '13px',
                    color: colors.text, fontSize: fontSize.md,
                    fontWeight: font.weight.semibold, fontFamily: font.sans,
                    cursor: nomSaisi.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Créer ma carte
                </button>
              </div>
            )}

            {/* Succès */}
            {scanEtat === 'succes' && (
              <div style={{ padding: `${spacing.xl}px ${spacing.lg}px`, textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'rgba(20,200,120,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: `0 auto ${spacing.md}px`,
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14C87A" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <p style={{ color: colors.text, fontWeight: font.weight.semibold, fontSize: fontSize.md, margin: `0 0 ${spacing.xs}px` }}>
                  {scanMessage}
                </p>
                <p style={{ color: colors.textMuted, fontSize: fontSize.sm, margin: 0 }}>
                  Ajout à votre wallet...
                </p>
              </div>
            )}

            {/* Erreur */}
            {scanEtat === 'erreur' && (
              <div style={{ padding: `${spacing.xl}px ${spacing.lg}px`, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                <p style={{ color: colors.error, fontSize: fontSize.base, margin: 0 }}>
                  {scanMessage}
                </p>
                <button
                  onClick={fermerScanner}
                  style={{
                    background: colors.surface, border: `1px solid ${colors.border}`,
                    borderRadius: radius.md, padding: '12px',
                    color: colors.text, fontSize: fontSize.base,
                    fontFamily: font.sans, cursor: 'pointer',
                  }}
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
