import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import ZolariumZ from './ZolariumZ'

export default function AuthScreen() {
  const { signUp, signIn, authError, clearError } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState(null)

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

      <button
        onClick={() => {
          setMode(mode === 'login' ? 'register' : 'login')
          clearError()
          setInfo(null)
        }}
        className="text-sm text-zolar-rose/70 underline mt-6"
      >
        {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Entra'}
      </button>
    </div>
  )
}
