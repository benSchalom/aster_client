import { useState, useEffect } from 'react'
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

  const [carteSerial, setCarteSerial] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const carte = params.get('carte')
    if (carte) setCarteSerial(carte)
    const tel = params.get('tel')
    if (tel) setTelephone(formaterAffichage(tel))
  }, [])

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
      navigate('/connexion/verify', { state: { telephone: chiffres, carteSerial } })
    } catch (e) {
      setError(e.response?.data?.error || "Erreur lors de l'envoi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page" style={{ background: colors.bg, fontFamily: font.sans }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ textAlign: 'center', marginBottom: spacing.xl }}>
          <img
            src="/web-app-manifest-192x192.png"
            alt="ASTER Wallet"
            style={{ width: 64, height: 64, borderRadius: radius.lg, marginBottom: spacing.md }}
          />
          <h1 style={{
            color: colors.text,
            fontSize: fontSize.xl,
            fontWeight: font.weight.bold,
            margin: `0 0 ${spacing.xs}px`,
            letterSpacing: '-0.02em',
          }}>ASTER Wallet</h1>
          <p style={{ color: colors.textMuted, fontSize: fontSize.base, margin: 0 }}>
            Accédez à toutes vos cartes fidélité
          </p>
        </div>

        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.xl,
          padding: spacing.lg,
        }}>
          <label style={{
            display: 'block',
            color: colors.textMuted,
            fontSize: fontSize.sm,
            fontWeight: font.weight.medium,
            marginBottom: spacing.sm,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>Numéro de téléphone</label>

          <div style={{ position: 'relative', marginBottom: spacing.md }}>
            <span style={{
              position: 'absolute', left: spacing.md,
              top: '50%', transform: 'translateY(-50%)',
              color: colors.textMuted, fontSize: fontSize.base,
              userSelect: 'none',
            }}>+1</span>
            <input
              type="tel"
              value={telephone}
              onChange={handleChange}
              placeholder="(819) 123-4567"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: colors.bg,
                border: `1px solid ${error ? colors.error + '66' : colors.border}`,
                borderRadius: radius.md,
                padding: `13px ${spacing.md}px 13px 44px`,
                color: colors.text,
                fontSize: fontSize.md,
                fontFamily: font.sans,
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
            />
          </div>

          {error && (
            <p style={{ color: colors.error, fontSize: fontSize.sm, margin: `0 0 ${spacing.md}px` }}>
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? colors.blueDark : colors.blue,
              border: 'none',
              borderRadius: radius.md,
              padding: '14px',
              color: colors.text,
              fontSize: fontSize.md,
              fontWeight: font.weight.semibold,
              fontFamily: font.sans,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Envoi en cours...' : 'Continuer'}
          </button>
        </div>

        <p style={{
          textAlign: 'center',
          color: colors.textMuted,
          fontSize: fontSize.sm,
          marginTop: spacing.lg,
        }}>
          Un code de vérification sera envoyé par SMS
        </p>
      </div>
    </div>
  )
}
