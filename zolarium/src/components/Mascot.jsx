import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SIGNS } from '../utils/zodiac'

const SUFFIX = { neutral: '', feliz: '-feliz', come: '-come', duerme: '-duerme' }

export default function Mascot({ sign, size = 120, state = 'neutral', skin = null, float = true }) {
  const s = SIGNS[sign]

  const sources = useMemo(() => {
    const suf = SUFFIX[state] ?? ''
    const list = []
    if (skin) {
      if (suf) list.push(`/mascotas/skins/${sign}-${skin}${suf}.png`)
      list.push(`/mascotas/skins/${sign}-${skin}.png`)
    }
    if (suf) list.push(`/mascotas/${sign}${suf}.png`)
    list.push(`/mascotas/${sign}.png`)
    return list
  }, [sign, skin, state])

  const [srcIdx, setSrcIdx] = useState(0)
  const [allFailed, setAllFailed] = useState(false)

  useEffect(() => {
    setSrcIdx(0)
    setAllFailed(false)
  }, [sources])

  if (!s) return null

  if (allFailed) {
    return (
      <div
        className="rounded-full flex items-center justify-center font-display font-bold"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.42,
          color: s.soft,
          background: 'rgba(255,255,255,0.06)',
          border: `2px solid ${s.color}`,
        }}
      >
        {s.symbol}
      </div>
    )
  }

  const src = sources[srcIdx]

  return (
    <div
      style={{ width: size, height: size, position: 'relative' }}
      className={float ? 'zolar-mascot-float' : ''}
    >
      <AnimatePresence mode="popLayout">
        <motion.img
          key={src}
          src={src}
          alt={s.name}
          onError={() => {
            if (srcIdx + 1 < sources.length) setSrcIdx(i => i + 1)
            else setAllFailed(true)
          }}
          className="zolar-mascot-img"
          style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', inset: 0 }}
          draggable={false}
          initial={{ opacity: 0, scale: 0.82, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 16 } }}
          exit={{ opacity: 0, scale: 1.08, transition: { duration: 0.14 } }}
        />
      </AnimatePresence>
      <style>{`
        .zolar-mascot-float {
          animation: zolarFloat 5s ease-in-out infinite;
        }
        .zolar-mascot-img {
          display: block;
          -webkit-mask-image: linear-gradient(to bottom, black 78%, transparent 96%);
          mask-image: linear-gradient(to bottom, black 78%, transparent 96%);
          filter: drop-shadow(0 10px 18px rgba(0,0,0,0.35));
        }
        @keyframes zolarFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4%); }
        }
      `}</style>
    </div>
  )
}
