import { motion } from 'framer-motion'
import { SIGNS } from '../utils/zodiac'
import ZolariumZ from './ZolariumZ'
import Mascot from './Mascot'

const OPTIONS = [
  { id: 'planes', emoji: '🎉', title: 'Planes divertidos', desc: 'Según tu energía astral', span: 'col-span-2 row-span-2', gradient: 'linear-gradient(135deg, #FF8A00, #FF2DA1)', glow: 'rgba(255,45,161,0.35)' },
  { id: 'diferentes', emoji: '🌗', title: 'Planes diferentes', desc: 'Explora tu sombra', span: 'row-span-2', gradient: 'linear-gradient(135deg, #8A2BE2, #3B1D6E)', glow: 'rgba(138,43,226,0.35)' },
  { id: 'cita', emoji: '💕', title: 'Plan en cita', desc: 'Ideal para dos', span: 'row-span-1', gradient: 'linear-gradient(135deg, #FF2DA1, #8A2BE2)', glow: 'rgba(255,45,161,0.3)', tilt: -1.2 },
  { id: 'solitario', emoji: '🌙', title: 'Plan a solas', desc: 'Solo para ti', span: 'row-span-1', gradient: 'linear-gradient(135deg, #4C1D95, #1E1B4B)', glow: 'rgba(76,29,149,0.4)', tilt: 1.2 },
  { id: 'mapa', emoji: '🗺️', title: 'Mapa astral de Madrid', desc: 'Todos los planes por signo', span: 'col-span-2 row-span-2', gradient: 'linear-gradient(135deg, #F4913F, #8A2BE2)', glow: 'rgba(138,43,226,0.32)' },
  { id: 'garden', emoji: '🌱', title: 'Jardín zodiacal', desc: 'Visita a tu mascota', span: 'row-span-2', gradient: 'linear-gradient(135deg, #00E0D1, #8A2BE2)', glow: 'rgba(0,224,209,0.3)' },
  { id: 'astro', emoji: '🔮', title: 'Astro', desc: 'Tarot y astrólogos', span: 'row-span-1', gradient: 'linear-gradient(135deg, #8A2BE2, #00C2FF)', glow: 'rgba(0,194,255,0.3)', tilt: 1.2 },
  { id: 'guardados', emoji: '💜', title: 'Mis guardados', desc: 'Tus favoritos', span: 'row-span-1', gradient: 'linear-gradient(135deg, #9D7295, #FF2DA1)', glow: 'rgba(255,45,161,0.28)', tilt: -1.2 },
]

export default function Menu({ user, onSelect }) {
  const signKey = user.chart.sun
  const sign = SIGNS[signKey]

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-12 relative">
      <button
        onClick={() => onSelect('perfil')}
        aria-label="Mi perfil"
        className="absolute top-8 right-5 w-11 h-11 rounded-full bubble-glass flex items-center justify-center text-lg z-10"
      >
        {sign.symbol}
      </button>

      <div className="flex justify-center mb-5">
        <ZolariumZ sign={signKey} size={54} withWordmark />
      </div>

      <div className="text-center mb-7 flex flex-col items-center gap-3">
        <div className="bubble-glass bubble-mascot p-4">
          <Mascot sign={signKey} size={112} />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Hola, {sign.name}</h1>
          <p className="text-zolar-rose/70 text-sm mt-1">¿Qué te apetece hoy?</p>
        </div>
      </div>

      <div className="grid grid-cols-2 auto-rows-[88px] gap-3">
        {OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={`card-bento p-4 flex flex-col justify-end ${opt.span}`}
            style={{
              background: opt.gradient,
              boxShadow: `0 8px 26px ${opt.glow}`,
              rotate: opt.tilt || 0,
            }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileTap={{ scale: 0.96 }}
          >
            <span
              className="text-3xl mb-auto"
              style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))' }}
            >
              {opt.emoji}
            </span>
            <h3 className="font-bold leading-tight" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
              {opt.title}
            </h3>
            <p className="text-xs text-white/80 mt-0.5">{opt.desc}</p>
          </motion.button>
        ))}

        <motion.button
          onClick={() => onSelect('carta')}
          className="card-bento bubble-glass col-span-2 row-span-1 p-4 flex items-center gap-4"
          style={{ boxShadow: '0 8px 26px rgba(138,43,226,0.25)' }}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: OPTIONS.length * 0.06 }}
          whileTap={{ scale: 0.96 }}
        >
          <span className="text-3xl" style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))' }}>🌌</span>
          <div>
            <h3 className="font-bold leading-tight">Mi carta astral</h3>
            <p className="text-xs text-white/70 mt-0.5">Tu perfil cósmico</p>
          </div>
        </motion.button>
      </div>
    </div>
  )
}
