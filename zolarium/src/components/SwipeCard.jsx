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
        className="h-full card-zolar rounded-3xl p-6 flex flex-col justify-between shadow-2xl"
        style={{ borderTop: '5px solid ' + s.color }}
      >
        <div className="overflow-hidden">
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-6 left-6 z-10 border-2 border-green-400 text-green-400 font-bold px-3 py-1 rounded-lg rotate-[-15deg]"
          >
            GUARDAR
          </motion.div>
          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute top-6 right-6 z-10 border-2 border-red-400 text-red-400 font-bold px-3 py-1 rounded-lg rotate-[15deg]"
          >
            PASO
          </motion.div>

          <div className="text-6xl text-center mt-6 mb-4">{plan.emoji}</div>
          <h2 className="text-xl font-bold text-center font-display leading-tight">
            {plan.title}
          </h2>
          {plan.description && (
            <p className="text-zolar-rose/80 text-center mt-3 text-sm line-clamp-4">
              {plan.description}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {total >= MIN_VOTES ? (
            <div className="card-zolar rounded-xl p-3 text-center text-sm text-zolar-rose/80">
              ✨ {pct}% de {s.name} aman este plan
            </div>
          ) : (
            <div className="card-zolar rounded-xl p-3 text-center text-sm text-zolar-rose/80">
              🌱 {total}/{MIN_VOTES} {s.name} han opinado. Sé de los primeros.
            </div>
          )}
          <div className="flex justify-between items-center text-sm gap-2">
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
