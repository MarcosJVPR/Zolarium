import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Mascot from './Mascot'
import { SIGNS } from '../utils/zodiac'
import { supabase } from '../utils/supabase'

const FEED_LIMIT = 3

function isNightNow() {
  const h = new Date().getHours()
  return h >= 21 || h < 8
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export default function ZodiacGarden({ sign, onBack }) {
  const s = SIGNS[sign]
  const night = isNightNow()
  const [petState, setPetState] = useState(night ? 'duerme' : 'neutral')
  const [care, setCare] = useState(null)
  const [particles, setParticles] = useState([])
  const [bgSrc, setBgSrc] = useState(`/jardin/fondos/fondo-${night ? 'noche' : 'dia'}.jpg`)
  const [bgFallback, setBgFallback] = useState(false)
  const timerRef = useRef(null)

  const bubbles = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        id: i,
        left: 8 + Math.random() * 84,
        delay: Math.random() * 8,
        dur: 9 + Math.random() * 6,
        img: 1 + (i % 3),
        size: 18 + Math.random() * 22,
      })),
    []
  )

  const fireflies = useMemo(
    () =>
      night
        ? Array.from({ length: 12 }, (_, i) => ({
            id: i,
            left: 5 + Math.random() * 90,
            top: 18 + Math.random() * 55,
            delay: Math.random() * 4,
            dur: 2.5 + Math.random() * 3,
          }))
        : [],
    [night]
  )

  useEffect(() => {
    load()
    return () => clearTimeout(timerRef.current)
  }, [])

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase.from('profiles').select('mascota').eq('id', session.user.id).maybeSingle()
    const m = data?.mascota || {}
    const feeds = m.day === todayKey() ? m.feeds ?? 0 : 0
    setCare({ happiness: m.happiness ?? 50, feeds })
  }

  async function save(next) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase
      .from('profiles')
      .update({ mascota: { ...next, day: todayKey() } })
      .eq('id', session.user.id)
  }

  function burst(emoji) {
    const batch = Array.from({ length: 5 }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      left: 38 + Math.random() * 24,
      emoji,
    }))
    setParticles(p => [...p, ...batch])
    setTimeout(() => {
      setParticles(p => p.filter(x => !batch.some(b => b.id === x.id)))
    }, 1900)
  }

  function setTemp(state, ms, after) {
    clearTimeout(timerRef.current)
    setPetState(state)
    timerRef.current = setTimeout(() => {
      if (after) after()
      else setPetState(night ? 'duerme' : 'neutral')
    }, ms)
  }

  function pet() {
    if (!care) return
    burst(night ? '💤' : '💚')
    if (!night) {
      setTemp('feliz', 1600)
      const next = { happiness: Math.min(100, care.happiness + 2), feeds: care.feeds }
      setCare(next)
      save(next)
    }
  }

  function feed() {
    if (!care || night || care.feeds >= FEED_LIMIT) return
    burst('⭐')
    setTemp('come', 2200, () => setTemp('feliz', 1400))
    const next = { happiness: Math.min(100, care.happiness + 10), feeds: care.feeds + 1 }
    setCare(next)
    save(next)
  }

  const feedsLeft = care ? FEED_LIMIT - care.feeds : 0

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ height: '100dvh' }}>
      <img
        src={bgSrc}
        alt=""
        onError={() => {
          if (!bgFallback) {
            setBgFallback(true)
            setBgSrc('/jardin/fondos/fondo-dia.jpg')
          }
        }}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      {night && bgFallback && <div className="absolute inset-0 bg-[#1c1030]/70" />}

      <img src="/jardin/props/monticulo-pequeno-2.png" alt="" draggable={false}
        className="absolute pointer-events-none zolar-drift-a" style={{ width: '20%', left: '6%', top: '16%' }} />
      <img src="/jardin/props/monticulo-pequeno-4.png" alt="" draggable={false}
        className="absolute pointer-events-none zolar-drift-b" style={{ width: '14%', right: '8%', top: '24%' }} />
      <img src="/jardin/props/monticulo-2.png" alt="" draggable={false}
        className="absolute pointer-events-none zolar-drift-b" style={{ width: '26%', left: '-4%', top: '38%' }} />
      <img src="/jardin/props/monticulo-pequeno-6.png" alt="" draggable={false}
        className="absolute pointer-events-none zolar-drift-a" style={{ width: '12%', right: '3%', top: '46%' }} />

      {bubbles.map(b => (
        <img key={b.id} src={`/jardin/efectos/burbuja-${b.img}.png`} alt="" draggable={false}
          className="absolute pointer-events-none zolar-bubble"
          style={{ width: b.size, left: `${b.left}%`, animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s` }} />
      ))}

      {fireflies.map(f => (
        <div key={f.id} className="absolute rounded-full pointer-events-none zolar-firefly"
          style={{ left: `${f.left}%`, top: `${f.top}%`, animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s` }} />
      ))}

      <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: '14%', width: '78%', maxWidth: 420 }}>
        <img src="/jardin/props/monticulo-1.png" alt="" draggable={false} className="w-full zolar-drift-platform" />
        <img src="/jardin/props/arbusto-2.png" alt="" draggable={false}
          className="absolute pointer-events-none" style={{ width: '26%', left: '2%', top: '-6%' }} />
        <img src="/jardin/props/hongo-3.png" alt="" draggable={false}
          className="absolute pointer-events-none" style={{ width: '14%', right: '6%', top: '-14%' }} />
        <button
          onClick={pet}
          aria-label="Acariciar a tu mascota"
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: '58%', background: 'none', border: 'none', padding: 0 }}
        >
          <Mascot sign={sign} size={190} state={petState} />
        </button>
      </div>

      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute text-2xl pointer-events-none"
            style={{ left: `${p.left}%`, bottom: '42%' }}
            initial={{ opacity: 0, y: 10, scale: 0.6 }}
            animate={{ opacity: 1, y: -70, scale: 1.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      <img src="/jardin/props/hojas-esquina.png" alt="" draggable={false}
        className="absolute inset-x-0 bottom-0 w-full pointer-events-none" style={{ opacity: 0.95 }} />

      <div className="absolute top-0 inset-x-0 px-5 pt-6 flex items-center justify-between">
        <button onClick={onBack} className="text-white/90 text-sm bg-black/30 backdrop-blur rounded-full px-4 py-2">
          ← Volver
        </button>
        {care && (
          <div className="bg-black/30 backdrop-blur rounded-full px-4 py-2 flex items-center gap-2">
            <span className="text-sm">💜</span>
            <div className="w-20 h-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${care.happiness}%`, background: `linear-gradient(90deg, ${s.color}, ${s.soft})` }} />
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 inset-x-0 px-6 pb-8 flex justify-center">
        {night ? (
          <div className="bg-black/40 backdrop-blur rounded-2xl px-5 py-3 text-sm text-white/90">
            🌙 {s.name} está durmiendo. Vuelve por la mañana.
          </div>
        ) : (
          <button
            onClick={feed}
            disabled={!care || feedsLeft <= 0}
            className="rounded-2xl px-6 py-3 font-semibold text-white shadow-lg disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #F4913F, #9D7295)' }}
          >
            {feedsLeft > 0 ? `⭐ Alimentar (${feedsLeft})` : 'Ya comió por hoy 💚'}
          </button>
        )}
      </div>

      <style>{`
        .zolar-drift-a { animation: zolarDriftA 7s ease-in-out infinite; }
        .zolar-drift-b { animation: zolarDriftA 9s ease-in-out infinite reverse; }
        .zolar-drift-platform { animation: zolarDriftA 8s ease-in-out infinite; }
        @keyframes zolarDriftA {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .zolar-bubble {
          bottom: -60px;
          animation-name: zolarRise;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          opacity: 0.7;
        }
        @keyframes zolarRise {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.5; }
          100% { transform: translateY(-110vh); opacity: 0; }
        }
        .zolar-firefly {
          width: 5px;
          height: 5px;
          background: #ffe9a8;
          box-shadow: 0 0 10px 3px rgba(255, 233, 168, 0.65);
          animation-name: zolarFirefly;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes zolarFirefly {
          0%, 100% { opacity: 0.1; transform: translate(0, 0); }
          50% { opacity: 1; transform: translate(8px, -12px); }
        }
      `}</style>
    </div>
  )
}
