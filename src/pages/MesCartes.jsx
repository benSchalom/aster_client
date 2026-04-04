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

function Badge({ type }) {
  const map = {
    fidelite:            { bg: `${colors.blue}22`,    color: colors.blueLight,   label: 'Fidélité' },
    abonnement_seances:  { bg: `${colors.success}22`, color: colors.success,     label: 'Séances' },
    abonnement_temporel: { bg: `${colors.orange}22`,  color: colors.orangeLight, label: 'Temporel' },
  }
  const s = map[type] || map.fidelite
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 10, fontWeight: font.weight.semibold,
      padding: `3px ${spacing.sm}px`, borderRadius: radius.full,
      letterSpacing: '0.06em', textTransform: 'uppercase'
    }}>{s.label}</span>
  )
}

function Barre({ valeur, max, couleur }) {
  const pct = max > 0 ? Math.min((valeur / max) * 100, 100) : 0
  return (
    <div style={{ background: colors.surface2, borderRadius: radius.full, height: 6, overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`, height: '100%',
        background: couleur || colors.blue,
        borderRadius: radius.full, transition: 'width 0.5s ease'
      }} />
    </div>
  )
}

function CarteItem({ carte }) {
  const tamponsMax = carte.tampons_max || 10
  return (
    <div style={{
      background: colors.surface, border: `1px solid ${colors.surface2}`,
      borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        {carte.pro_logo && (
          <img src={carte.pro_logo} alt="" style={{ width: 42, height: 42, borderRadius: radius.sm, objectFit: 'cover' }} />
        )}
        <div>
          <p style={{ color: colors.text, fontWeight: font.weight.semibold, fontSize: fontSize.base, margin: `0 0 ${spacing.xs}px` }}>
            {carte.pro_nom || 'Commerçant'}
          </p>
          <Badge type={carte.type} />
        </div>
      </div>

      {carte.type === 'fidelite' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <span style={{ color: colors.textMuted, fontSize: fontSize.base }}>Tampons</span>
            <span style={{ color: colors.text, fontWeight: font.weight.semibold, fontSize: fontSize.base }}>
              {carte.tampons} / {tamponsMax}
            </span>
          </div>
          <Barre valeur={carte.tampons} max={tamponsMax} couleur={colors.blue} />
          <div style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap', marginTop: spacing.md }}>
            {Array.from({ length: tamponsMax }).map((_, i) => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: radius.full,
                background: i < carte.tampons ? `linear-gradient(135deg, ${colors.blue}, ${colors.blueDark})` : colors.surface2,
                border: `1px solid ${i < carte.tampons ? 'transparent' : colors.surface2}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: colors.text
              }}>{i < carte.tampons ? '★' : ''}</div>
            ))}
          </div>
        </>
      )}

      {carte.type === 'abonnement_seances' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
            <span style={{ color: colors.textMuted, fontSize: fontSize.base }}>Séances restantes</span>
            <span style={{ color: colors.success, fontWeight: font.weight.bold, fontSize: fontSize.xl }}>
              {carte.seances_restantes}
            </span>
          </div>
          <Barre valeur={carte.seances_restantes} max={10} couleur={colors.success} />
        </>
      )}

      {carte.type === 'abonnement_temporel' && (
        <>
          <p style={{ color: colors.textMuted, fontSize: fontSize.base, margin: `0 0 ${spacing.xs}px` }}>Expire le</p>
          <p style={{ color: colors.orangeLight, fontWeight: font.weight.semibold, fontSize: fontSize.sm, margin: 0 }}>
            {carte.date_expiration
              ? new Date(carte.date_expiration).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })
              : 'N/A'}
          </p>
        </>
      )}

      {carte.points > 0 && (
        <div style={{
          marginTop: spacing.md, padding: `${spacing.sm}px ${spacing.md}px`,
          background: `${colors.blue}11`, borderRadius: radius.md,
          display: 'flex', justifyContent: 'space-between'
        }}>
          <span style={{ color: colors.textMuted, fontSize: fontSize.base }}>Points accumulés</span>
          <span style={{ color: colors.blueLight, fontWeight: font.weight.semibold, fontSize: fontSize.base }}>
            {carte.points} pts
          </span>
        </div>
      )}

      <a
        href={`${API}${carte.wallet_url}`}
        target="_blank" rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: spacing.sm, marginTop: spacing.lg,
          padding: `${spacing.sm + 4}px ${spacing.md}px`,
          background: colors.surface2, border: `1px solid ${colors.surface2}`,
          borderRadius: radius.md, color: colors.text, fontSize: fontSize.base,
          fontWeight: font.weight.medium, textDecoration: 'none', fontFamily: font.sans,
        }}
      >
        🎫 Ajouter à Google Wallet
      </a>
    </div>
  )
}

export default function MesCartes() {
  const [cartes, setCartes] = useState([])
  const [clientNom, setClientNom] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [installPrompt, setInstallPrompt] = useState(null)
  const [estInstalle, setEstInstalle] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    if (window.matchMedia('(display-mode: standalone)').matches) setEstInstalle(true)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const ajouterEcranAccueil = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') { setEstInstalle(true); setInstallPrompt(null) }
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
        abonnerPush(token)
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

  const abonnerPush = async (token) => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !VAPID_PUBLIC_KEY) return
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return
      const reg = await navigator.serviceWorker.ready
      const existant = await reg.pushManager.getSubscription()
      const sub = existant || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      await axios.post(`${API}/portail/subscribe-push`, { push_token: sub.toJSON() }, {
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch { /* silencieux — les notifs ne sont pas critiques */ }
  }

  const handleLogout = () => {
    localStorage.removeItem('portail_token')
    navigate('/connexion')
  }

  const prenom = clientNom ? clientNom.split(' ')[0] : ''

  return (
    <div style={{ minHeight: '100dvh', background: colors.bg, fontFamily: font.sans, boxSizing: 'border-box' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 70% 40% at 50% 0%, ${colors.blue}18 0%, transparent 70%)`
      }} />

      {/* Header sticky */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: `${colors.bg}ee`, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${colors.surface2}`,
        padding: `${spacing.md}px ${spacing.lg}px`,
      }}>
        <div style={{
          maxWidth: 480, margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <img
              src="/web-app-manifest-192x192.png"
              alt="ASTER"
              style={{ width: 36, height: 36, borderRadius: radius.sm }}
            />
            <div>
              <p style={{
                color: colors.textMuted, fontSize: 10,
                fontWeight: font.weight.medium,
                letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0
              }}>Portefeuille ASTER</p>
              {prenom && (
                <p style={{ color: colors.text, fontSize: fontSize.base, fontWeight: font.weight.semibold, margin: 0 }}>
                  Bonjour, {prenom} 👋
                </p>
              )}
            </div>
          </div>

          <button onClick={handleLogout} style={{
            background: colors.surface, border: `1px solid ${colors.surface2}`,
            borderRadius: radius.md, padding: `${spacing.xs}px ${spacing.md}px`,
            color: colors.textMuted, fontSize: fontSize.base,
            cursor: 'pointer', fontFamily: font.sans
          }}>Déconnexion</button>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: `${spacing.lg}px`, position: 'relative' }}>

        {installPrompt && !estInstalle && (
          <div style={{
            background: `${colors.blue}18`, border: `1px solid ${colors.blue}33`,
            borderRadius: radius.xl, padding: `${spacing.md}px ${spacing.lg}px`,
            marginBottom: spacing.lg,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md
          }}>
            <div>
              <p style={{ color: colors.text, fontWeight: font.weight.semibold, fontSize: fontSize.base, margin: `0 0 2px` }}>
                Accès rapide
              </p>
              <p style={{ color: colors.textMuted, fontSize: 12, margin: 0 }}>
                Ajoutez le portefeuille à votre écran d'accueil
              </p>
            </div>
            <button onClick={ajouterEcranAccueil} style={{
              background: `linear-gradient(135deg, ${colors.blue}, ${colors.blueDark})`,
              border: 'none', borderRadius: radius.md,
              padding: `${spacing.sm}px ${spacing.md}px`,
              color: colors.text, fontSize: fontSize.base,
              fontWeight: font.weight.semibold, fontFamily: font.sans,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
            }}>+ Installer</button>
          </div>
        )}

        <h1 style={{
          fontSize: fontSize.xxl, fontWeight: font.weight.bold,
          color: colors.text, margin: `0 0 ${spacing.xs}px`, letterSpacing: '-0.02em'
        }}>Mes cartes</h1>

        <p style={{ color: colors.textMuted, fontSize: fontSize.base, margin: `0 0 ${spacing.lg}px` }}>
          {loading ? '' : `${cartes.length} carte${cartes.length !== 1 ? 's' : ''} trouvée${cartes.length !== 1 ? 's' : ''}`}
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: `${spacing.xxl}px 0` }}>
            <p style={{ color: colors.textMuted, fontSize: fontSize.base }}>Chargement...</p>
          </div>
        )}

        {error && (
          <div style={{
            background: `${colors.error}18`, border: `1px solid ${colors.error}44`,
            borderRadius: radius.md, padding: spacing.md,
            color: colors.error, fontSize: fontSize.base
          }}>{error}</div>
        )}

        {!loading && !error && cartes.length === 0 && (
          <div style={{ textAlign: 'center', padding: `${spacing.xxl}px ${spacing.lg}px` }}>
            <div style={{ fontSize: 48, marginBottom: spacing.md }}>🎴</div>
            <p style={{ color: colors.textMuted, fontSize: fontSize.base }}>Aucune carte associée à ce numéro</p>
          </div>
        )}

        {cartes.map(carte => <CarteItem key={carte.id} carte={carte} />)}
      </div>
    </div>
  )
}
