import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { colors, font, fontSize, spacing, radius } from '../utils/theme'

const API = import.meta.env.VITE_API_URL
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

const TYPE_LABEL = {
  fidelite: 'Fidélité',
  abonnement_seances: 'Séances',
  abonnement_temporel: 'Abonnement',
}

const TYPE_COLOR = {
  fidelite: colors.blue,
  abonnement_seances: colors.success,
  abonnement_temporel: colors.orange,
}

function CarteItem({ carte }) {
  const tamponsMax = carte.tampons_max || 10
  const couleur = TYPE_COLOR[carte.type] || colors.blue
  const [walletUrl, setWalletUrl] = useState(null)

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
      {/* Bande de couleur type */}
      <div style={{ height: 3, background: couleur }} />

      <div style={{ padding: spacing.lg }}>
        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
          {carte.pro_logo ? (
            <img src={carte.pro_logo} alt="" style={{
              width: 40, height: 40, borderRadius: radius.sm, objectFit: 'cover', flexShrink: 0,
            }} />
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: radius.sm, flexShrink: 0,
              background: couleur + '22',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: couleur, fontSize: fontSize.md, fontWeight: font.weight.bold,
            }}>
              {(carte.pro_nom || 'C')[0].toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              color: colors.text, fontWeight: font.weight.semibold,
              fontSize: fontSize.md, margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {carte.pro_nom || 'Commerce'}
            </p>
            <p style={{ color: colors.textMuted, fontSize: fontSize.sm, margin: 0 }}>
              {TYPE_LABEL[carte.type] || 'Carte'}
            </p>
          </div>
        </div>

        {/* Contenu selon le type */}
        {carte.type === 'fidelite' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.sm }}>
              <span style={{ color: colors.textMuted, fontSize: fontSize.base }}>Tampons</span>
              <span style={{ color: colors.text, fontWeight: font.weight.semibold, fontSize: fontSize.base }}>
                {carte.tampons} / {tamponsMax}
              </span>
            </div>
            <div style={{ background: colors.bg, borderRadius: radius.sm, height: 4, overflow: 'hidden', marginBottom: spacing.md }}>
              <div style={{
                width: `${Math.min((carte.tampons / tamponsMax) * 100, 100)}%`,
                height: '100%', background: couleur,
                borderRadius: radius.sm, transition: 'width 0.4s ease',
              }} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Array.from({ length: tamponsMax }).map((_, i) => (
                <div key={i} style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: i < carte.tampons ? couleur : colors.bg,
                  border: `1.5px solid ${i < carte.tampons ? couleur : colors.border}`,
                }} />
              ))}
            </div>
          </>
        )}

        {carte.type === 'abonnement_seances' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.sm }}>
              <span style={{ color: colors.textMuted, fontSize: fontSize.base }}>Séances restantes</span>
              <span style={{ color: couleur, fontWeight: font.weight.bold, fontSize: fontSize.xl }}>
                {carte.seances_restantes}
              </span>
            </div>
            <div style={{ background: colors.bg, borderRadius: radius.sm, height: 4, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min((carte.seances_restantes / 10) * 100, 100)}%`,
                height: '100%', background: couleur, borderRadius: radius.sm,
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

        {/* Google Wallet */}
        <a
          href={walletUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => !walletUrl && e.preventDefault()}
          style={{
            display: 'block',
            marginTop: spacing.lg,
            padding: `${spacing.sm + 2}px ${spacing.md}px`,
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
  const [notifStatut, setNotifStatut] = useState('idle')
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const ajouterEcranAccueil = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstallPrompt(null)
  }

  useEffect(() => {
    const token = localStorage.getItem('portail_token')
    if (!token) { navigate('/connexion'); return }

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
  }, [])

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
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: colors.bg,
        borderBottom: `1px solid ${colors.border}`,
        padding: `${spacing.md}px ${spacing.lg}px`,
      }}>
        <div style={{
          maxWidth: 480, margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
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
            padding: `${spacing.xs}px ${spacing.md}px`,
            color: colors.textMuted,
            fontSize: fontSize.base,
            cursor: 'pointer',
            fontFamily: font.sans,
          }}>Déconnexion</button>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: `${spacing.lg}px ${spacing.md}px` }}>

        {/* Bannière installer */}
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

        {/* Titre */}
        <div style={{ marginBottom: spacing.lg }}>
          {prenom && (
            <p style={{ color: colors.textMuted, fontSize: fontSize.base, margin: `0 0 ${spacing.xs}px` }}>
              Bonjour, {prenom}
            </p>
          )}
          <h1 style={{
            color: colors.text, fontSize: fontSize.xxl,
            fontWeight: font.weight.bold, margin: 0, letterSpacing: '-0.02em',
          }}>Mes cartes</h1>
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
            <p style={{ color: colors.textMuted, fontSize: fontSize.base, margin: 0 }}>
              Aucune carte associée à ce numéro
            </p>
          </div>
        )}

        {cartes.map(carte => <CarteItem key={carte.id} carte={carte} />)}
      </div>
    </div>
  )
}
