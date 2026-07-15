import { motion } from 'framer-motion'
import { SIGNS } from '../utils/zodiac'
import ZolariumZ from './ZolariumZ'
import Mascot from './Mascot'

const OPTIONS = [
  { id: 'planes', emoji: '🎉', title: 'Planes divertidos', desc: 'Según tu energía astral' },
  { id: 'diferentes', emoji: '🌗', title: 'Planes diferentes', desc: 'Explora tu signo opuesto' },
  { id: 'cita', emoji: '💕', title: 'Plan en cita', desc: 'Ideal para dos' },
  { id: 'solitario', emoji: '🌙', title: 'Plan a solas', desc: 'Solo para ti' },
  { id: 'astro', emoji: '🔮', title: 'Astro', desc: 'Tarot, astrólogos y guías' },
  { id: 'guardados', emoji: '💜', title: 'Mis guardados', desc: 'Tus planes favoritos' },
  { id: 'carta', emoji: '🌌', title: 'Mi carta astral', desc: 'Tu perfil cósmico' },
  { id: 'garden', emoji: '🌱', title: 'Jardín zodiacal', desc: 'Visita a tu mascota' },
  { id: 'mapa', emoji: '🗺️', title: 'Mapa astral de Madrid', desc: 'Todos los planes por signo' },
]

export default function Menu({ user, onSelect }) {
  const signKey = user.chart.sun
  const sign = SIGNS[signKey]

  return (
    <div className="max-w-md mx-auto px-6 pt-8 pb-12 relative">
      <button
        onClick={() => onSelect('perfil')}
        aria-label="Mi perfil"
        className="absolute top-8 right-6 w-11 h-11 rounded-full card-zolar flex items-center justify-center text-lg"
        style={{ borderColor: sign.color }}
      >
        {sign.symbol}
      </button>

      <div className="flex justify-center mb-6">
        <ZolariumZ sign={signKey} size={54} withWordmark />
      </div>

      <div className="text-center mb-8 flex flex-col items-center gap-3">
        <Mascot sign={signKey} size={120} />
        <div>
          <h1 className="text-2xl font-bold font-display">Hola, {sign.name}</h1>
          <p className="text-zolar-rose/70 text-sm mt-1">
            ¿Qué te apetece hoy?
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className="card-zolar rounded-2xl p-5 flex items-center gap-4 text-left"
            style={{ borderLeft: `4px solid ${sign.color}` }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="text-3xl">{opt.emoji}</span>
            <div>
              <h3 className="font-bold">{opt.title}</h3>
              <p className="text-sm text-zolar-rose/70">{opt.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
