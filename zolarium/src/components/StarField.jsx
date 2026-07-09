import { useMemo } from 'react'

const LAYERS = [
  { count: 45, size: [1, 2], opacity: [0.15, 0.35], duration: [6, 10] },
  { count: 30, size: [2, 3], opacity: [0.35, 0.6], duration: [4, 7] },
  { count: 14, size: [3, 4.5], opacity: [0.6, 0.9], duration: [3, 5], glow: true },
]

function randBetween([min, max]) {
  return min + Math.random() * (max - min)
}

export default function StarField() {
  const stars = useMemo(() => {
    const all = []
    LAYERS.forEach((layer, layerIdx) => {
      for (let i = 0; i < layer.count; i++) {
        all.push({
          id: `${layerIdx}-${i}`,
          top: Math.random() * 100,
          left: Math.random() * 100,
          size: randBetween(layer.size),
          opacity: randBetween(layer.opacity),
          duration: randBetween(layer.duration),
          delay: Math.random() * -10,
          glow: !!layer.glow,
        })
      }
    })
    return all
  }, [])

  return (
    <div className="zolar-starfield" aria-hidden="true">
      {stars.map(s => (
        <div
          key={s.id}
          className="zolar-star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            '--star-opacity': s.opacity,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
            boxShadow: s.glow ? `0 0 ${s.size * 2}px rgba(255,255,255,${s.opacity * 0.8})` : 'none',
          }}
        />
      ))}
      <style>{`
        .zolar-starfield {
          position: fixed;
          inset: 0;
          z-index: -10;
          overflow: hidden;
          pointer-events: none;
          background:
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(157,114,149,0.35), transparent 60%),
            radial-gradient(ellipse 60% 40% at 85% 90%, rgba(228,167,188,0.12), transparent 65%),
            radial-gradient(ellipse 100% 100% at 50% 50%, #3a2942 0%, #2F2133 55%, #1c1420 100%);
        }
        .zolar-star {
          position: absolute;
          border-radius: 50%;
          background: #FBE4E9;
          opacity: var(--star-opacity);
          animation-name: zolarTwinkle;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes zolarTwinkle {
          0%, 100% { opacity: var(--star-opacity); }
          50% { opacity: calc(var(--star-opacity) * 0.25); }
        }
      `}</style>
    </div>
  )
}
