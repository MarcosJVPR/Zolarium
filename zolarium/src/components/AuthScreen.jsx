import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import ZolariumZ from './ZolariumZ'

export default function AuthScreen() {
  const { signUp, signIn, authError, clearError } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState(null)
  const [forgotMsg, setForgotMsg] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setInfo(null)
    clearError()
    if (mode === 'register') {
      const ok = await signUp(email, password)
      if (ok) setInfo('Cuenta creada. Si tu proyecto pide confirmación por email, revisa tu bandeja antes de entrar.')
    } else {
      await signIn(email, password)
    }
    setBusy(false)
  }

  async function handleForgot() {
    clearError()
    setInfo(null)
    if (!email.trim()) {
      setForgotMsg('Escribe tu email arriba y vuelve a pulsar.')
      return
    }
    setForgotMsg('Enviando...')
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    })
    setForgotMsg(error ? 'No se pudo enviar. Inténtalo en un minuto.' : '📮 Revisa tu correo para forjar una nueva llave.')
  }

  async function handleGoogle() {
    clearError()
    setInfo(null)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  return (
    <div className="max-w-md mx-auto px-6 pt-16 pb-12 flex flex-col items-center">
      <div className="mb-8">
        <ZolariumZ size={64} withWordmark />
      </div>

      <h2 className="text-2xl font-bold font-display mb-1">
        {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
      </h2>
      <p className="text-zolar-rose/70 text-sm mb-8">
        {mode === 'login' ? 'Vuelve a tus planes' : 'Planes a la carta astral'}
      </p>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="card-zolar rounded-xl px-4 py-3 bg-transparent outline-none"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="card-zolar rounded-xl px-4 py-3 bg-transparent outline-none"
        />

        {authError && <p className="text-sm text-red-400 text-center">{authError}</p>}
        {info && <p className="text-sm text-zolar-rose/80 text-center">{info}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full py-3 font-bold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(90deg, #F4913F, #9D7295)' }}
        >
          {busy ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>

      <div className="w-full flex items-center gap-3 my-5">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
        <span className="text-xs text-zolar-rose/50">o</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        className="w-full rounded-full py-3 font-semibold flex items-center justify-center gap-3 bubble-glass text-white/90"
      >
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        Continuar con Google
      </button>

      <button
        onClick={() => {
          setMode(mode === 'login' ? 'register' : 'login')
          clearError()
          setInfo(null)
          setForgotMsg(null)
        }}
        className="text-sm text-zolar-rose/70 underline mt-6"
      >
        {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Entra'}
      </button>

      {mode === 'login' && (
        <button
          type="button"
          onClick={handleForgot}
          className="text-sm text-zolar-rose/50 underline mt-3"
        >
          ¿Olvidaste tu contraseña?
        </button>
      )}
      {forgotMsg && <p className="text-xs text-center text-zolar-rose/70 mt-2">{forgotMsg}</p>}
    </div>
  )
}
