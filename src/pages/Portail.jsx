import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { colors, font, fontSize, spacing, radius } from '../utils/theme'

const API = import.meta.env.VITE_API_URL

const formaterAffichage = (val) => {
  const chiffres = val.replace(/\D/g, '').slice(0, 10)
  if (chiffres.length <= 3) return chiffres
  if (chiffres.length <= 6) return `(${chiffres.slice(0,3)}) ${chiffres.slice(3)}`
  return `(${chiffres.slice(0,3)}) ${chiffres.slice(3,6)}-${chiffres.slice(6)}`
}

export default function Portail() {
  const [telephone, setTelephone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    setTelephone(formaterAffichage(e.target.value))
    setError('')
  }

  const handleSubmit = async () => {
    const chiffres = telephone.replace(/\D/g, '')
    if (chiffres.length !== 10) {
      setError('Entrez un numéro à 10 chiffres')
      return
    }
    setLoading(true)
    try {
      await axios.post(`${API}/portail/send-otp`, { telephone: chiffres })
      navigate('/connexion/verify', { state: { telephone: chiffres } })
    } catch (e) {
      setError(e.response?.data?.error || "Erreur lors de l'envoi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: colors.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: font.sans,
      padding: spacing.lg,
      boxSizing: 'border-box',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 70% 40% at 50% 0%, ${colors.blue}22 0%, transparent 70%)`
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: spacing.xxl }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.sm }}>
            <img
              src="/web-app-manifest-192x192.png"
              alt="ASTER"
              style={{ width: 72, height: 72, borderRadius: radius.lg }}
            />
            <span style={{
              color: colors.text, fontWeight: font.weight.bold,
              fontSize: fontSize.sm, letterSpacing: '0.06em'
            }}>Portefeuille ASTER</span>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.surface2}`,
          borderRadius: radius.xxl,
          padding: `${spacing.xl}px ${spacing.lg}px`,
        }}>
          <h1 style={{
            fontSize: fontSize.xxl,
            fontWeight: font.weight.bold,
            color: colors.text,
            margin: `0 0 ${spacing.sm}px`,
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}>Mes cartes fidélité</h1>

          <p style={{
            color: colors.textMuted,
            fontSize: fontSize.base,
            margin: `0 0 ${spacing.xl}px`,
            lineHeight: 1.6
          }}>
            Entrez votre numéro pour accéder à toutes vos cartes ASTER.
          </p>

          <div style={{ marginBottom: spacing.md }}>
            <label style={{
              display: 'block',
              color: colors.textMuted,
              fontSize: 11,
              fontWeight: font.weight.medium,
              marginBottom: spacing.sm,
              letterSpacing: '0.06em',
              textTransform: 'uppercase'
            }}>Numéro de téléphone</label>

            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: spacing.md,
                top: '50%', transform: 'translateY(-50%)',
                color: colors.textMuted, fontSize: fontSize.base,
                userSelect: 'none'
              }}>🇨🇦 +1</span>
              <input
                type="tel"
                value={telephone}
                onChange={handleChange}
                placeholder="(819) 123-4567"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: colors.surface2,
                  border: `1px solid ${error ? colors.error + '88' : colors.surface2}`,
                  borderRadius: radius.md,
                  padding: `14px ${spacing.md}px 14px 72px`,
                  color: colors.text,
                  fontSize: fontSize.sm,
                  fontFamily: font.sans,
                  outline: 'none',
                  letterSpacing: '0.04em',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
            {error && (
              <p style={{ color: colors.error, fontSize: fontSize.base, marginTop: spacing.xs }}>
                {error}
              </p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              background: loading
                ? `${colors.blue}88`
                : `linear-gradient(135deg, ${colors.blue}, ${colors.blueDark})`,
              border: 'none', borderRadius: radius.md,
              padding: `15px ${spacing.md}px`,
              color: colors.text,
              fontSize: fontSize.base,
              fontWeight: font.weight.semibold,
              fontFamily: font.sans,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: spacing.xs,
              transition: 'opacity 0.2s'
            }}
          >
            {loading ? 'Envoi en cours...' : 'Recevoir mon code →'}
          </button>
        </div>

        <p style={{
          textAlign: 'center',
          color: colors.textMuted,
          fontSize: 12,
          marginTop: spacing.lg,
          opacity: 0.5
        }}>
          Un code SMS sera envoyé à votre numéro
        </p>
      </div>
    </div>
  )
}
