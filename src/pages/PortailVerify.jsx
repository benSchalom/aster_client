import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { colors, font, fontSize, spacing, radius } from '../utils/theme'

const API = import.meta.env.VITE_API_URL

export default function PortailVerify() {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(30)
  const refs = useRef([])
  const navigate = useNavigate()
  const { state } = useLocation()
  const telephone = state?.telephone

  useEffect(() => {
    if (!telephone) navigate('/connexion')
    refs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...code]
    next[i] = val
    setCode(next)
    setError('')
    if (val && i < 5) refs.current[i + 1]?.focus()
    if (next.every(d => d !== '')) verifier(next.join(''))
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const verifier = async (codeStr) => {
    setLoading(true)
    try {
      const res = await axios.post(`${API}/portail/verify-otp`, { telephone, code: codeStr })
      localStorage.setItem('portail_token', res.data.token)
      navigate('/cartes')
    } catch {
      setError('Code invalide ou expiré')
      setCode(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    try {
      await axios.post(`${API}/portail/send-otp`, { telephone })
      setResendCooldown(30)
      setError('')
    } catch {
      setError('Erreur lors du renvoi')
    }
  }

  const telFormate = telephone
    ? `(${telephone.slice(0,3)}) ${telephone.slice(3,6)}-${telephone.slice(6)}`
    : ''

  return (
    <div style={{
      minHeight: '100dvh',
      background: colors.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: font.sans,
      padding: spacing.lg,
      boxSizing: 'border-box'
    }}>
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
            }}>ASTER Wallet</span>
          </div>
        </div>

        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.surface2}`,
          borderRadius: radius.xxl,
          padding: `${spacing.xl}px ${spacing.lg}px`
        }}>
          <button onClick={() => navigate('/connexion')} style={{
            background: 'none', border: 'none',
            color: colors.textMuted, fontSize: fontSize.base,
            cursor: 'pointer', padding: 0,
            marginBottom: spacing.lg,
            display: 'flex', alignItems: 'center', gap: spacing.xs,
            fontFamily: font.sans
          }}>← Retour</button>

          <h1 style={{
            fontSize: fontSize.xxl,
            fontWeight: font.weight.bold,
            color: colors.text,
            margin: `0 0 ${spacing.sm}px`,
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}>Vérification</h1>

          <p style={{
            color: colors.textMuted,
            fontSize: fontSize.base,
            margin: `0 0 ${spacing.xl}px`,
            lineHeight: 1.6
          }}>
            Code envoyé au{' '}
            <span style={{ color: colors.text, fontWeight: font.weight.medium }}>
              +1 {telFormate}
            </span>
          </p>

          {/* OTP inputs */}
          <div style={{
            display: 'flex', gap: spacing.sm,
            marginBottom: spacing.lg,
            justifyContent: 'center'
          }}>
            {code.map((d, i) => (
              <input
                key={i}
                ref={el => refs.current[i] = el}
                type="tel" maxLength={1} value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                style={{
                  width: 46, height: 54,
                  textAlign: 'center',
                  background: d ? `${colors.blue}22` : colors.surface2,
                  border: `1px solid ${
                    error ? colors.error + '88'
                    : d ? colors.blue + '88'
                    : colors.surface2
                  }`,
                  borderRadius: radius.md,
                  color: colors.text,
                  fontSize: fontSize.xl,
                  fontWeight: font.weight.semibold,
                  fontFamily: font.sans,
                  outline: 'none',
                  transition: 'all 0.15s'
                }}
              />
            ))}
          </div>

          {error && (
            <p style={{
              color: colors.error, fontSize: fontSize.base,
              textAlign: 'center', marginBottom: spacing.md
            }}>{error}</p>
          )}

          {loading && (
            <p style={{
              color: colors.textMuted, fontSize: fontSize.base,
              textAlign: 'center', marginBottom: spacing.md
            }}>Vérification...</p>
          )}

          <div style={{ textAlign: 'center' }}>
            <button onClick={handleResend} disabled={resendCooldown > 0} style={{
              background: 'none', border: 'none',
              color: resendCooldown > 0 ? colors.textMuted : colors.blue,
              fontSize: fontSize.base,
              cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
              fontFamily: font.sans,
              opacity: resendCooldown > 0 ? 0.5 : 1
            }}>
              {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : 'Renvoyer le code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
