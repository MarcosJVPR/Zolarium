import { useState } from 'react'
import Mascot from './Mascot'
import { SIGNS } from '../utils/zodiac'

const MESSAGES = [
  'Hoy es un buen día para intentar algo que veías desde lejos.',
  'Tu energía va a atraer justo lo que necesitas, confía.',
  'Un pequeño paso hoy vale más que un plan perfecto mañana.',
  'Deja que la curiosidad te lleve, no el calendario.',
  'Lo que estás cuidando en silencio también está creciendo.',
  'Hoy toca soltar un poco el control y disfrutar el proceso.',
  'Alguien de tu entorno necesita lo que solo tú puedes dar hoy.',
  'Respira. Las cosas están llegando en el orden correcto.',
]

function Back({ onClick }) {
  return <button onClick={onClick} className="text-zolar-rose/70 mb-4">← Volver</button>
}

export default function ZodiacGarden({ sign, onBack }) {
  const [message, setMessage] = useState(null)
  const s = SIGNS[sign]

  function askMascot() {
    const next = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
    setMessage(next)
  }

  return (
    <div className="max-w-md mx-auto px-6 pt-8 pb-12">
      <Back onClick={onBack} />
      <h2 className="text-2xl font-bold mb-1 text-center font-display">Jardín zodiacal</h2>
      <p className="text-center text-zolar-rose/70 mb-8">El hogar de tu mascota</p>

      <div className="relative flex flex-col items-center justify-end" style={{ minHeight: 320 }}>
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full"
          style={{
            height: 40,
            background: `radial-gradient(ellipse at center, ${s.color}33, transparent 70%)`,
          }}
        />
        <div className="absolute bottom-2 left-4 text-2xl opacity-70">🌿</div>
        <div className="absolute bottom-2 right-4 text-2xl opacity-70">🌸</div>
        <div className="absolute bottom-8 left-10 text-lg opacity-50">✦</div>
        <div className="absolute bottom-10 right-12 text-lg opacity-50">✦</div>

        <button onClick={askMascot} className="relative z-10 mb-2" aria-label="Hablar con tu mascota">
          <Mascot sign={sign} size={220} />
        </button>
      </div>

      {message ? (
        <div
          className="card-zolar rounded-2xl p-4 text-center text-sm mt-2"
          style={{ borderLeft: `4px solid ${s.color}` }}
        >
          {message}
        </div>
      ) : (
        <p className="text-center text-zolar-rose/50 text-sm mt-2">Toca a tu mascota</p>
      )}

      <p className="text-xs text-center text-zolar-rose/40 mt-8">
        Próximamente: paseos, ropa y personalización de tu mascota.
      </p>
    </div>
  )
}
