import { useState } from 'react'
import { SIGNS } from '../utils/zodiac'

export default function Mascot({ sign, size = 120 }) {
  const [failed, setFailed] = useState(false)
  const s = SIGNS[sign]

  if (!s) return null

  if (failed) {
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

  return (
    <div style={{ width: size, height: size }} className="zolar-mascot-float">
      <img
        src={`/mascotas/${sign}.png`}
        alt={s.name}
        onError={() => setFailed(true)}
        className="zolar-mascot-img"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        draggable={false}
      />
      <style>{`
        .zolar-mascot-float {
          animation: zolarFloat 5s ease-in-out infinite;
        }
        .zolar-mascot-img {
          display: block;
          -webkit-mask-image: linear-gradient(to bottom, black 78%, transparent 96%);
          mask-image: linear-gradient(to bottom, black 78%, transparent 96%);
        }
        @keyframes zolarFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4%); }
        }
      `}
      </style>
    </div>
  )
}
