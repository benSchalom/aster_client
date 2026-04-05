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
    <div className="auth-page" style={{ background: colors.bg, fontFamily: font.sans }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <button onClick={() => navigate('/connexion')} style={{
          background: 'none', border: 'none',
          color: colors.textMuted, fontSize: fontSize.base,
          cursor: 'pointer', padding: 0,
          marginBottom: spacing.xl,
          fontFamily: font.sans,
          display: 'flex', alignItems: 'center', gap: spacing.xs,
        }}>
          ← Retour
        </button>

        <div style={{ marginBottom: spacing.xl }}>
          <h1 style={{
            color: colors.text,
            fontSize: fontSize.xl,
            fontWeight: font.weight.bold,
            margin: `0 0 ${spacing.xs}px`,
            letterSpacing: '-0.02em',
          }}>Vérification</h1>
          <p style={{ color: colors.textMuted, fontSize: fontSize.base, margin: 0 }}>
            Code envoyé au +1 {telFormate}
          </p>
        </div>

        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.xl,
          padding: spacing.lg,
        }}>
          <div className="otp-grid" style={{ marginBottom: error ? spacing.md : spacing.lg }}>
            {code.map((d, i) => (
              <input
                key={i}
                ref={el => refs.current[i] = el}
                type="tel" maxLength={1} value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                style={{
                  background: colors.bg,
                  border: `1px solid ${
                    error ? colors.error + '66'
                    : d ? colors.blue + '88'
                    : colors.border
                  }`,
                  borderRadius: radius.md,
                  color: colors.text,
                  fontSize: fontSize.xl,
                  fontWeight: font.weight.semibold,
                  fontFamily: font.sans,
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
              />
            ))}
          </div>

          {error && (
            <p style={{
              color: colors.error, fontSize: fontSize.sm,
              textAlign: 'center', margin: `0 0 ${spacing.md}px`,
            }}>{error}</p>
          )}

          {loading && (
            <p style={{
              color: colors.textMuted, fontSize: fontSize.sm,
              textAlign: 'center', margin: `0 0 ${spacing.md}px`,
            }}>Vérification en cours...</p>
          )}

          <div style={{ textAlign: 'center' }}>
            <button onClick={handleResend} disabled={resendCooldown > 0} style={{
              background: 'none', border: 'none',
              color: resendCooldown > 0 ? colors.textMuted : colors.blue,
              fontSize: fontSize.base,
              cursor: resendCooldown > 0 ? 'default' : 'pointer',
              fontFamily: font.sans,
              opacity: resendCooldown > 0 ? 0.5 : 1,
            }}>
              {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : 'Renvoyer le code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
