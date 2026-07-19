import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { SIGNS } from '../utils/zodiac'
import { supabase } from '../utils/supabase'
import { computeChart } from '../utils/chart'

const MERCURY_RETRO = [
  { start: '2026-02-26', end: '2026-03-20', sign: 'piscis' },
  { start: '2026-06-29', end: '2026-07-23', sign: 'cancer' },
  { start: '2026-10-24', end: '2026-11-13', sign: 'escorpio' },
]

const ECLIPSES = [
  {
    date: '2026-08-12',
    title: 'Eclipse total de Sol',
    emoji: '🌑',
    where: 'El primero visible desde la Península en más de un siglo. Totalidad en la mitad norte; desde Madrid se verá parcial, al atardecer.',
    tip: 'Gafas homologadas ISO 12312-2 y horizonte despejado hacia el oeste.',
  },
  {
    date: '2026-08-28',
    title: 'Eclipse parcial de Luna',
    emoji: '🌒',
    where: 'La Luna se oscurece parcialmente. Consulta la hora de visibilidad en tu zona.',
    tip: 'A simple vista, sin protección.',
  },
  {
    date: '2027-02-06',
    title: 'Eclipse anular de Sol',
    emoji: '💍',
    where: 'Anularidad sobre el Atlántico; desde España, parcial.',
    tip: '',
  },
  {
    date: '2027-08-02',
    title: 'Eclipse total de Sol',
    emoji: '🌑',
    where: 'Totalidad en el sur: Málaga, Almería, Ceuta y Melilla. Uno de los más largos del siglo.',
    tip: 'Reserva alojamiento con muchísima antelación.',
  },
  {
    date: '2028-01-26',
    title: 'Eclipse anular de Sol',
    emoji: '💍',
    where: 'Cierra el trío ibérico de eclipses 2026-2028.',
    tip: '',
  },
]

const PLANET_LABELS = [
  ['sun', '☀️ Sol'],
  ['moon', '🌙 Luna'],
  ['mercury', '💬 Mercurio'],
  ['venus', '💘 Venus'],
  ['mars', '🔥 Marte'],
]

const MSG_LABELS = {
  aspiracional: '🌠 Aspiracional',
  fortuna: '🍀 Fortuna',
  recomendacion: '💫 Recomendación',
}

const CONSEJOS = {
  aries: [
    'Tu impulso hoy es tu brújula: elige el plan más activo y no lo pienses dos veces.',
    'Canaliza el fuego: algo de deporte o competición te dejará como nuevo.',
    'Frena tres segundos antes de responder. Solo tres. Luego arrasa.',
  ],
  tauro: [
    'Mímate sin culpa: un mercadillo, algo rico y de vuelta a casa despacio.',
    'Hoy la constancia gana a la prisa. Termina eso que dejaste a medias.',
    'Tu jardín (el real y el zodiacal) agradecería una visita.',
  ],
  geminis: [
    'Tu mente pide chispa: una charla, un club de lectura o un café con alguien nuevo.',
    'Escribe esa idea antes de que se te escape volando.',
    'Dos planes en un día no es caos, es tu hábitat natural.',
  ],
  cancer: [
    'Plan casero o con los tuyos: hoy tu energía está en el nido.',
    'Escucha esa corazonada, suele acertar más que tu calendario.',
    'Un mensaje a alguien que echas de menos vale más que diez stories.',
  ],
  leo: [
    'Brilla sin pedir permiso: teatro, escenario o karaoke con tu nombre en luces.',
    'Comparte tu último logro. No es ego, es inspirar.',
    'Regala protagonismo a alguien hoy: te volverá multiplicado.',
  ],
  virgo: [
    'Ordena una sola cosa y suéltalo: el resto puede esperar al cosmos.',
    'Un taller o curso corto es justo tu tipo de placer.',
    'Perfecto es enemigo de publicado. Dale a enviar.',
  ],
  libra: [
    'Plan a dos: hoy tu Venus interior pide compañía bonita.',
    'Una expo o algo estético te recalibra el alma.',
    'Decide sin consultar a nadie. Solo una vez. Verás qué gusto.',
  ],
  escorpio: [
    'Lo místico te llama: tarot, astrología o esa conversación intensa pendiente.',
    'Suelta un secreto pequeño. Aligera.',
    'Tu intuición hoy está en modo rayos X: úsala con cariño.',
  ],
  sagitario: [
    'Piérdete por un barrio que no conozcas: la aventura no necesita avión.',
    'Di que sí al plan improvisado. Es tu elemento.',
    'Aprende algo inútil y maravilloso hoy.',
  ],
  capricornio: [
    'Trabaja tu meta 25 minutos y luego prémiate con un plan de verdad.',
    'Delegar también es liderar. Suelta una tarea.',
    'Un monumento o museo: la historia es tu tipo de ambición.',
  ],
  acuario: [
    'Haz el plan raro que nadie más entendería. Ese.',
    'Tu idea loca de hoy es tu proyecto de mañana. Apúntala.',
    'Rodéate de tu gente extraña favorita.',
  ],
  piscis: [
    'Cine, música o agua: deja que algo te atraviese hoy.',
    'Tus sueños de anoche traían mensaje. ¿Lo apuntaste?',
    'Crear algo pequeño (un dibujo, una frase) te ordena por dentro.',
  ],
}

function todayKey() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function daysTo(dateStr) {
  const target = new Date(`${dateStr}T00:00:00`)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((target - now) / 86400000)
}

function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${Number(d)} ${months[Number(m) - 1]} ${y}`
}

export default function AstroFeed({ user, onBack, onGarden, onAstro }) {
  const [messages, setMessages] = useState(null)
  const [questions, setQuestions] = useState(null)
  const [poll, setPoll] = useState(null)
  const [pollBusy, setPollBusy] = useState(false)

  const today = todayKey()
  const dayIndex = Math.floor(Date.now() / 86400000)
  const sign = SIGNS[user.chart.sun]

  const transits = useMemo(() => {
    try {
      const now = new Date()
      const pad = n => String(n).padStart(2, '0')
      return computeChart({
        date: today,
        time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
        lat: 40.4168,
        lon: -3.7038,
      })
    } catch {
      return null
    }
  }, [])

  const retro = MERCURY_RETRO.find(r => today >= r.start && today <= r.end)
  const nextRetro = MERCURY_RETRO.find(r => r.start > today)
  const upcomingEclipses = ECLIPSES.filter(e => e.date >= today).slice(0, 3)
  const mainEclipse = upcomingEclipses[0]

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const [profileRes, questionsRes] = await Promise.all([
        supabase.from('profiles').select('daily_messages').eq('id', session.user.id).maybeSingle(),
        supabase.from('feed_questions').select('id, question, options').eq('active', true).order('id'),
      ])
      setMessages(profileRes.data?.daily_messages || null)
      setQuestions(questionsRes.data || [])
    }
    load()
  }, [])

  const question = useMemo(() => {
    if (!questions || questions.length === 0) return null
    return questions[dayIndex % questions.length]
  }, [questions])

  useEffect(() => {
    if (!question) return
    supabase
      .rpc('vote_feed_question', { p_question: question.id, p_choice: null })
      .then(({ data }) => setPoll(data || null))
  }, [question])

  async function vote(i) {
    if (!question || pollBusy) return
    setPollBusy(true)
    const { data, error } = await supabase.rpc('vote_feed_question', {
      p_question: question.id,
      p_choice: i,
    })
    setPollBusy(false)
    if (!error && data) setPoll(data)
  }

  const unlocked = messages?.date === today
  const consejo = CONSEJOS[user.chart.sun]?.[dayIndex % 3]
  const retroSign = retro ? SIGNS[retro.sign] : null

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-12">
      <button onClick={onBack} className="inline-flex items-center mb-4 text-sm text-white/90 bubble-glass rounded-full px-4 py-2">
        ← Volver
      </button>

      <h2 className="text-2xl font-bold text-center font-display mb-1">Feed astral</h2>
      <p className="text-center text-zolar-rose/70 text-sm mb-6">El cosmos, hoy</p>

      <div className="flex flex-col gap-4">
        {retro ? (
          <motion.div
            className="card-bento p-5"
            style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,45,161,0.4), rgba(138,43,226,0.45))' }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Alerta cósmica</p>
            <h3 className="font-bold font-display text-lg leading-tight">
              ☿ Mercurio retrógrado en {retroSign?.name}
            </h3>
            <p className="text-sm text-white/85 mt-2">
              Hasta el {fmtDate(retro.end)} ({daysTo(retro.end)} días). Revisa antes de enviar, guarda copias y no firmes nada con prisa. Y si vuelve un ex... ya sabes a quién culpar.
            </p>
          </motion.div>
        ) : nextRetro ? (
          <motion.div className="card-bento p-4" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm text-white/85">
              ☿ Mercurio va directo ✅ El próximo retrógrado empieza el {fmtDate(nextRetro.start)} en {SIGNS[nextRetro.sign]?.name}. Respira tranquilo.
            </p>
          </motion.div>
        ) : (
          <motion.div className="card-bento p-4" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm text-white/85">☿ Mercurio va directo ✅ Sin retrógrados a la vista.</p>
          </motion.div>
        )}

        {mainEclipse && (
          <motion.div
            className="card-bento p-5"
            style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,138,0,0.38), rgba(138,43,226,0.42))' }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Cuenta atrás</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{mainEclipse.emoji}</span>
              <div>
                <h3 className="font-bold font-display leading-tight">{mainEclipse.title}</h3>
                <p className="text-xs text-white/70">{fmtDate(mainEclipse.date)}</p>
              </div>
              <div className="ml-auto text-center shrink-0">
                <p className="font-display font-black text-3xl leading-none" style={{ color: '#FF8A00' }}>
                  {daysTo(mainEclipse.date)}
                </p>
                <p className="text-[10px] text-white/70">días</p>
              </div>
            </div>
            <p className="text-sm text-white/85 mt-2">{mainEclipse.where}</p>
            {mainEclipse.tip && (
              <p className="text-xs text-white/70 mt-1.5">💡 {mainEclipse.tip}</p>
            )}
            {upcomingEclipses.length > 1 && (
              <div className="mt-3 pt-3 flex flex-col gap-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.14)' }}>
                {upcomingEclipses.slice(1).map(e => (
                  <p key={e.date} className="text-xs text-white/75">
                    {e.emoji} {e.title} · {fmtDate(e.date)}
                  </p>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {transits && (
          <motion.div className="card-zolar rounded-3xl p-5" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <h3 className="font-bold mb-3">🔭 El cielo ahora</h3>
            <div className="flex flex-wrap gap-2">
              {PLANET_LABELS.map(([key, label]) => {
                const sk = SIGNS[transits[key]]
                if (!sk) return null
                return (
                  <span
                    key={key}
                    className="bubble-glass rounded-full px-3 py-1.5 text-xs text-white/90"
                    style={{ boxShadow: `inset 0 0 12px ${sk.color}33` }}
                  >
                    {label} en <span className="font-bold" style={{ color: sk.soft }}>{sk.symbol} {sk.name}</span>
                  </span>
                )
              })}
            </div>
          </motion.div>
        )}

        <motion.div className="card-zolar rounded-3xl p-5" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <h3 className="font-bold mb-1">✨ Tu horóscopo de hoy</h3>
          <p className="text-xs text-zolar-rose/60 mb-3">
            {sign.symbol} {sign.name} · personalizado con tu carta y los tránsitos
          </p>
          {unlocked ? (
            <div className="flex flex-col gap-3">
              {['aspiracional', 'fortuna', 'recomendacion'].map(k =>
                messages[k] ? (
                  <div key={k} className="bubble-glass rounded-2xl p-3">
                    <p className="text-[11px] font-bold text-white/70 mb-1">{MSG_LABELS[k]}</p>
                    <p className="text-sm text-white/90 leading-relaxed">{messages[k]}</p>
                  </div>
                ) : null
              )}
            </div>
          ) : (
            <div className="bubble-glass rounded-2xl p-4 text-center">
              <p className="text-sm text-white/85 mb-3">
                Tu mascota guarda tus 3 mensajes de hoy. Aliméntala en el jardín para desbloquearlos.
              </p>
              <button onClick={onGarden} className="cta-zolar rounded-full px-5 py-2 text-sm font-semibold">
                🪴 Ir al jardín
              </button>
            </div>
          )}
        </motion.div>

        {consejo && (
          <motion.div
            className="card-bento p-5"
            style={{ backgroundImage: `linear-gradient(135deg, ${sign.color}44, rgba(138,43,226,0.35))` }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">
              Consejo para {sign.name}
            </p>
            <p className="text-sm text-white/90 font-display leading-relaxed">"{consejo}"</p>
          </motion.div>
        )}

        <motion.div
          className="card-bento p-5"
          style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,201,74,0.22), rgba(138,43,226,0.4))' }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.27 }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔮</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold font-display leading-tight">¿Quieres una lectura de verdad?</h3>
              <p className="text-xs text-white/75 mt-0.5">Tarotistas y astrólogos de Madrid, elegidos a mano.</p>
            </div>
          </div>
          <button
            onClick={onAstro}
            className="w-full mt-3 rounded-full py-2.5 text-sm font-semibold"
            style={{ background: 'rgba(255,201,74,0.25)', border: '1px solid rgba(255,201,74,0.5)', color: '#FFC94A' }}
          >
            ✨ Ver la constelación de místicos
          </button>
        </motion.div>

        {question && (
          <motion.div className="card-zolar rounded-3xl p-5" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <p className="text-xs font-bold uppercase tracking-widest text-zolar-rose/60 mb-1">Pregunta cósmica del día</p>
            <h3 className="font-bold font-display mb-3">{question.question}</h3>
            {poll?.mine != null ? (
              <div className="flex flex-col gap-2">
                {question.options.map((opt, i) => {
                  const count = poll.counts?.[i] || 0
                  const pct = poll.total ? Math.round((count / poll.total) * 100) : 0
                  const mine = poll.mine === i
                  return (
                    <div key={i} className="relative bubble-glass rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0"
                        style={{
                          width: `${pct}%`,
                          background: mine
                            ? 'linear-gradient(135deg, rgba(255,138,0,0.55), rgba(255,45,161,0.55))'
                            : 'rgba(138,43,226,0.35)',
                          transition: 'width 0.6s ease',
                        }}
                      />
                      <div className="relative flex justify-between items-center px-4 py-2 text-sm">
                        <span className={mine ? 'font-bold text-white' : 'text-white/85'}>
                          {mine ? '✓ ' : ''}{opt}
                        </span>
                        <span className="text-xs text-white/80 shrink-0 ml-2">{pct}%</span>
                      </div>
                    </div>
                  )
                })}
                <p className="text-[11px] text-zolar-rose/50 text-center mt-1">
                  {poll.total} {poll.total === 1 ? 'voto' : 'votos'} · mañana hay pregunta nueva
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {question.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => vote(i)}
                    disabled={pollBusy}
                    className="bubble-glass rounded-full px-4 py-2.5 text-sm text-white/90 text-left disabled:opacity-50"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
