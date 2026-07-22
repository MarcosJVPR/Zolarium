import { motion } from 'framer-motion'
import { SIGNS } from '../utils/zodiac'
import ZolariumZ from './ZolariumZ'
import Mascot from './Mascot'

const OPTIONS = [
  { id: 'carta', icon: 'stars', title: 'Mi carta astral', desc: 'Tu perfil cósmico y tu lectura', span: 'col-span-2 row-span-1', gradient: 'linear-gradient(135deg, rgba(138,43,226,0.45), rgba(0,194,255,0.32))', glow: 'rgba(138,43,226,0.22)' },
  { id: 'astro', icon: 'ball', title: 'Astro', desc: 'Tarot y astrólogos', span: 'row-span-1', gradient: 'linear-gradient(135deg, rgba(138,43,226,0.42), rgba(0,194,255,0.38))', glow: 'rgba(0,194,255,0.18)' },
  { id: 'zoles', icon: 'friends', title: 'Zoles', desc: 'Tus amigos del cosmos', span: 'row-span-1', gradient: 'linear-gradient(135deg, rgba(76,29,149,0.5), rgba(255,45,161,0.35))', glow: 'rgba(138,43,226,0.25)' },
  { id: 'cita', icon: 'heart', title: 'Pareja', desc: 'Planes para dos', span: 'row-span-1', gradient: 'linear-gradient(135deg, rgba(255,45,161,0.42), rgba(138,43,226,0.42))', glow: 'rgba(255,45,161,0.2)' },
  { id: 'guardados', icon: 'bookmark', title: 'Mis guardados', desc: 'Tus favoritos', span: 'row-span-1', gradient: 'linear-gradient(135deg, rgba(157,114,149,0.45), rgba(255,45,161,0.4))', glow: 'rgba(255,45,161,0.18)' },
  { id: 'diferentes', icon: 'eclipse', title: 'Planes opuestos', desc: 'Explora tu sombra', span: 'col-span-2 row-span-1', gradient: 'linear-gradient(135deg, rgba(138,43,226,0.45), rgba(59,29,110,0.55))', glow: 'rgba(138,43,226,0.22)' },
  { id: 'perfil', icon: 'gear', title: 'Ajustes', desc: 'Tu cuenta, tus datos y lo legal', span: 'col-span-2 row-span-1', gradient: 'linear-gradient(135deg, rgba(157,114,149,0.35), rgba(47,33,51,0.6))', glow: 'rgba(157,114,149,0.18)' },
]

function Icon({ name, size = 26 }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const icons = {
    eclipse: <><circle {...p} cx="12" cy="12" r="8" /><path {...p} d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" fillOpacity="0.35" /></>,
    heart: <path {...p} d="M12 20s-7.2-4.6-9.2-9.1A5.1 5.1 0 0 1 12 7.6a5.1 5.1 0 0 1 9.2 3.3C19.2 15.4 12 20 12 20z" />,
    friends: <><circle {...p} cx="9" cy="8.5" r="3" /><path {...p} d="M3.5 19c.6-3.2 2.9-5 5.5-5s4.9 1.8 5.5 5" /><circle {...p} cx="16.8" cy="9.8" r="2.3" /><path {...p} d="M15.6 14.2c2.3.2 4.2 1.7 4.9 4.3" /></>,
    ball: <><circle {...p} cx="12" cy="10" r="6.2" /><path {...p} d="M7.5 20h9M10 16.2L9 20M14 16.2L15 20" /><path {...p} d="M9.6 8.2a3.2 3.2 0 0 1 2.4-1.8" opacity="0.7" /></>,
    bookmark: <path {...p} d="M7 3.5h10V21l-5-4-5 4z" />,
    gear: <><circle {...p} cx="12" cy="12" r="3.2" /><path {...p} d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.2 5.2l1.9 1.9M16.9 16.9l1.9 1.9M18.8 5.2l-1.9 1.9M7.1 16.9l-1.9 1.9" /></>,
    stars: <><circle cx="5" cy="17" r="1.4" fill="currentColor" /><circle cx="12" cy="6.5" r="1.4" fill="currentColor" /><circle cx="19" cy="14" r="1.4" fill="currentColor" /><path {...p} d="M6.1 15.9l4.8-8M13.2 7.6l4.7 5.4" opacity="0.6" /></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ opacity: 0.92 }}>
      {icons[name]}
    </svg>
  )
}

export default function Menu({ user, onSelect }) {
  const signKey = user.chart.sun
  const sign = SIGNS[signKey]

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-12 relative">
      <button
        onClick={() => onSelect('perfil')}
        aria-label="Ajustes"
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

      <div className="grid grid-cols-2 auto-rows-[96px] gap-3">
        {OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={`card-bento p-4 flex flex-col justify-end ${opt.span}`}
            style={{
              backgroundImage: opt.gradient,
              boxShadow: `0 8px 26px ${opt.glow}`,
            }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileTap={{ scale: 0.96 }}
          >
            <span className="mb-auto text-white/90">
              <Icon name={opt.icon} />
            </span>
            <h3 className="font-bold leading-tight">{opt.title}</h3>
            <p className="text-xs text-white/75 mt-0.5">{opt.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
