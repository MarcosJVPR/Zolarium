import { motion, useMotionValue, useTransform } from 'framer-motion'
import { SIGNS } from '../utils/zodiac'

const MIN_VOTES = 100

function mapsUrl(plan) {
  if (plan.lat && plan.lon) {
    return `https://www.google.com/maps/search/?api=1&query=${plan.lat},${plan.lon}`
  }
  const q = encodeURIComponent(`${plan.title} ${plan.neighborhood || ''} Madrid`)
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

function calendarUrl(plan) {
  const d = plan.event_date.replaceAll('-', '')
  const next = new Date(plan.event_date)
  next.setDate(next.getDate() + 1)
  const d2 = next.toISOString().slice(0, 10).replaceAll('-', '')
  const text = encodeURIComponent(plan.title)
  const details = encodeURIComponent(
    (plan.description || '') + ' — Guardado desde Zolarium'
  )
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${d}/${d2}&details=${details}`
}

export default function SwipeCard({ plan, sign, onSwipe }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-15, 15])
  const likeOpacity = useTransform(x, [40, 120], [0, 1])
  const nopeOpacity = useTransform(x, [-120, -40], [1, 0])

  const s = SIGNS[sign]
  const total = plan.votes_total || 0
  const pct = plan.votes_pct || 0

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      initial={{ scale: 0.95, opacity: 0, y: 12 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      variants={{
        exit: dir => ({
          x: dir === 'like' ? 600 : -600,
          opacity: 0,
          rotate: dir === 'like' ? 25 : -25,
          transition: { duration: 0.3, ease: 'easeIn' },
        }),
      }}
      exit="exit"
      onDragEnd={(_, info) => {
        if (info.offset.x > 100) onSwipe('like')
        else if (info.offset.x < -100) onSwipe('dislike')
      }}
    >
      <div
        className="h-full rounded-[28px] p-4 flex flex-col justify-between shadow-2xl overflow-hidden"
        style={{
          background: 'rgba(28,20,32,0.88)',
          border: '1px solid rgba(255,255,255,0.14)',
          backdropFilter: 'blur(12px)',
          boxShadow: `0 12px 44px ${s.color}40, 0 24px 60px rgba(0,0,0,0.45)`,
        }}
      >
        <motion.div
          style={{ opacity: likeOpacity, color: '#00E0D1', borderColor: '#00E0D1', textShadow: '0 0 12px rgba(0,224,209,0.6)' }}
          className="absolute top-6 left-6 z-10 border-2 font-bold px-3 py-1 rounded-xl rotate-[-15deg] bg-black/30 backdrop-blur"
        >
          GUARDAR
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity, color: '#FF2DA1', borderColor: '#FF2DA1', textShadow: '0 0 12px rgba(255,45,161,0.6)' }}
          className="absolute top-6 right-6 z-10 border-2 font-bold px-3 py-1 rounded-xl rotate-[15deg] bg-black/30 backdrop-blur"
        >
          PASO
        </motion.div>

        <div className="overflow-hidden flex flex-col min-h-0">
          <div className="relative h-44 rounded-[20px] overflow-hidden shrink-0">
            {plan.image_url ? (
              <>
                <img
                  src={plan.image_url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  draggable={false}
                  onError={e => { e.currentTarget.style.display = 'none' }}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(28,20,32,0.85) 0%, transparent 55%)' }}
                />
                <div className="absolute bottom-3 left-3 bubble-glass rounded-full w-11 h-11 flex items-center justify-center text-2xl">
                  {plan.emoji}
                </div>
              </>
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, #8A2BE2 0%, ${s.color} 55%, #FF2DA1 130%)` }}
              >
                <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 20% 15%, rgba(255,255,255,0.30), transparent 45%)' }} />
                <div className="bubble-glass rounded-full w-24 h-24 flex items-center justify-center text-5xl">
                  {plan.emoji}
                </div>
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold text-center font-display leading-tight mt-4 px-2">
            {plan.title}
          </h2>
          {plan.description && (
            <p className="text-zolar-rose/80 text-center mt-2 text-sm line-clamp-4 px-2">
              {plan.description}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {total >= MIN_VOTES ? (
            <div className="bubble-glass rounded-full px-4 py-2.5 text-center text-sm text-white/90">
              ✨ {pct}% de {s.name} aman este plan
            </div>
          ) : (
            <div className="bubble-glass rounded-full px-4 py-2.5 text-center text-sm text-white/90">
              🌱 {total}/{MIN_VOTES} {s.name} han opinado. Sé de los primeros.
            </div>
          )}
          <div className="flex justify-between items-center text-sm gap-2 px-1">
            <a
              href={mapsUrl(plan)}
              target="_blank"
              rel="noopener noreferrer"
              onPointerDownCapture={e => e.stopPropagation()}
              className="text-zolar-rose/80 underline decoration-dotted underline-offset-4 truncate"
            >
              📍 {plan.neighborhood || plan.address || 'Madrid'}
            </a>
            {plan.event_date && (
              <a
                href={calendarUrl(plan)}
                target="_blank"
                rel="noopener noreferrer"
                onPointerDownCapture={e => e.stopPropagation()}
                className="text-zolar-rose/80 underline decoration-dotted underline-offset-4 shrink-0"
              >
                📅 {plan.event_date.slice(8, 10)}/{plan.event_date.slice(5, 7)}
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
