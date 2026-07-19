import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../utils/supabase'

const SKILLS = [
  { key: 'todos', label: '✨ Todos' },
  { key: 'tarot', label: '🃏 Tarot' },
  { key: 'astrologia', label: '🔭 Astrología' },
  { key: 'acupuntura', label: '🪡 Acupuntura' },
  { key: 'manos', label: '🖐️ Manos' },
]

const SKILL_EMOJI = { tarot: '🃏', astrologia: '🔭', acupuntura: '🪡', manos: '🖐️' }
const SKILL_LABEL = { tarot: 'Tarot', astrologia: 'Astrología', acupuntura: 'Acupuntura', manos: 'Lectura de manos' }
const CONTACT_EMAIL = 'zolariumapp@gmail.com'

function Stars({ rating }) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0))
  const full = Math.round(r)
  return (
    <span className="text-xs" style={{ color: '#FFC94A' }}>
      {'★'.repeat(full)}
      <span className="text-white/25">{'★'.repeat(5 - full)}</span>
      <span className="text-white/60 ml-1">{r.toFixed(1)}</span>
    </span>
  )
}

function mapsUrl(p) {
  if (p.lat && p.lon) return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`
  const q = encodeURIComponent(`${p.address || p.name} ${p.neighborhood || ''} Madrid`)
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

function waUrl(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  const full = digits.length === 9 ? `34${digits}` : digits
  return `https://wa.me/${full}`
}

export default function Astro({ onBack }) {
  const [list, setList] = useState(null)
  const [skill, setSkill] = useState('todos')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ nombre: '', telefono: '', ciudad: 'Madrid', habilidad: 'tarot', mensaje: '' })

  useEffect(() => {
    supabase
      .from('practitioners')
      .select('*')
      .eq('active', true)
      .order('featured', { ascending: false })
      .order('rating', { ascending: false })
      .then(({ data }) => setList(data || []))
  }, [])

  const filtered = useMemo(
    () => (skill === 'todos' ? list : (list || []).filter(p => p.skill === skill)),
    [list, skill]
  )

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function sendForm() {
    const subject = encodeURIComponent('Quiero aparecer en Zolarium ✨')
    const body = encodeURIComponent(
      `Nombre: ${form.nombre}\n` +
      `Teléfono: ${form.telefono}\n` +
      `Ciudad: ${form.ciudad}\n` +
      `Habilidad: ${SKILL_LABEL[form.habilidad] || form.habilidad}\n\n` +
      `Cuéntanos de ti:\n${form.mensaje}`
    )
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
    setFormOpen(false)
  }

  const formValid = form.nombre.trim() && form.telefono.trim() && form.ciudad.trim()

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-12">
      <button onClick={onBack} className="inline-flex items-center mb-4 text-sm text-white/90 bubble-glass rounded-full px-4 py-2">
        ← Volver
      </button>
      <h2 className="text-2xl font-bold mb-1 text-center font-display">Astro</h2>
      <p className="text-center text-zolar-rose/70 text-sm mb-5">Guías místicos de Madrid, elegidos con cariño</p>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
        {SKILLS.map(sk => (
          <button
            key={sk.key}
            onClick={() => setSkill(sk.key)}
            className={`shrink-0 text-sm rounded-full px-4 py-2 text-white ${skill === sk.key ? 'cta-zolar font-bold' : 'bubble-glass'}`}
          >
            {sk.label}
          </button>
        ))}
      </div>

      {list === null ? (
        <p className="text-center text-zolar-rose/60 mt-8">Consultando el cosmos...</p>
      ) : filtered.length === 0 ? (
        <div className="card-bento p-6 text-center" style={{ backgroundImage: 'linear-gradient(135deg, rgba(138,43,226,0.32), rgba(0,194,255,0.22))' }}>
          <div className="text-4xl mb-2">🔮</div>
          <p className="text-sm text-white/85">
            Aún estamos reuniendo a los místicos de esta categoría. Vuelve pronto.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(p => (
            <div
              key={p.id}
              className="card-bento p-4"
              style={{
                backgroundImage: p.featured
                  ? 'linear-gradient(135deg, rgba(255,138,0,0.28), rgba(255,45,161,0.28))'
                  : 'linear-gradient(135deg, rgba(138,43,226,0.28), rgba(59,29,110,0.35))',
                boxShadow: p.featured ? '0 8px 26px rgba(255,138,0,0.22)' : '0 8px 26px rgba(138,43,226,0.16)',
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 shrink-0 rounded-full bubble-glass overflow-hidden flex items-center justify-center text-2xl">
                  {p.photo_url ? (
                    <img
                      src={p.photo_url}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={e => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    SKILL_EMOJI[p.skill] || '✨'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold leading-tight">{p.name}</h3>
                    {p.featured && (
                      <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ background: 'rgba(255,201,74,0.25)', color: '#FFC94A' }}>
                        ⭐ Destacado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[11px] bubble-glass rounded-full px-2 py-0.5 text-white/85">
                      {SKILL_EMOJI[p.skill]} {SKILL_LABEL[p.skill] || p.skill}
                    </span>
                    <Stars rating={p.rating} />
                  </div>
                </div>
              </div>

              {p.description && (
                <p className="text-xs text-white/80 mt-3 line-clamp-3">{p.description}</p>
              )}

              <div className="flex items-center justify-between mt-3 gap-2">
                <span className="text-[11px] text-white/60 truncate">
                  📍 {p.neighborhood || p.address || 'Madrid'}
                </span>
                <div className="flex gap-2 shrink-0">
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="bubble-glass rounded-full px-3 py-1.5 text-xs text-white/90">
                      📞
                    </a>
                  )}
                  {p.phone && (
                    <a href={waUrl(p.phone)} target="_blank" rel="noopener noreferrer" className="bubble-glass rounded-full px-3 py-1.5 text-xs text-white/90">
                      WhatsApp
                    </a>
                  )}
                  <a href={mapsUrl(p)} target="_blank" rel="noopener noreferrer" className="cta-zolar rounded-full px-3 py-1.5 text-xs font-semibold">
                    Cómo llegar
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center mt-6">
        <p className="text-[11px] text-zolar-rose/50 mb-2">
          ¿Eres tarotista, astrólogo o terapeuta en Madrid?
        </p>
        <button onClick={() => setFormOpen(true)} className="cta-zolar rounded-full px-5 py-2 text-sm font-semibold">
          Contáctanos
        </button>
      </div>

      <AnimatePresence>
        {formOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/55"
              style={{ zIndex: 60 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFormOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 rounded-t-[28px] px-5 pt-5 pb-8 max-h-[85dvh] overflow-y-auto"
              style={{ zIndex: 70, background: 'rgba(28,20,32,0.98)', border: '1px solid rgba(255,255,255,0.14)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold font-display text-lg">Aparece en Zolarium</h3>
                <button onClick={() => setFormOpen(false)} className="text-white/60 text-lg" aria-label="Cerrar">
                  ✕
                </button>
              </div>
              <p className="text-xs text-zolar-rose/70 mb-4">
                Rellena esto y se abrirá tu correo con el mensaje listo para enviarnos.
              </p>

              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  maxLength={60}
                  placeholder="Tu nombre"
                  value={form.nombre}
                  onChange={e => setField('nombre', e.target.value)}
                  className="w-full bubble-glass rounded-full px-4 py-2.5 text-sm bg-transparent outline-none placeholder:text-white/40"
                />
                <input
                  type="tel"
                  maxLength={20}
                  placeholder="Teléfono"
                  value={form.telefono}
                  onChange={e => setField('telefono', e.target.value)}
                  className="w-full bubble-glass rounded-full px-4 py-2.5 text-sm bg-transparent outline-none placeholder:text-white/40"
                />
                <input
                  type="text"
                  maxLength={40}
                  placeholder="Ciudad"
                  value={form.ciudad}
                  onChange={e => setField('ciudad', e.target.value)}
                  className="w-full bubble-glass rounded-full px-4 py-2.5 text-sm bg-transparent outline-none placeholder:text-white/40"
                />
                <div className="flex gap-2 flex-wrap">
                  {SKILLS.filter(sk => sk.key !== 'todos').map(sk => (
                    <button
                      key={sk.key}
                      onClick={() => setField('habilidad', sk.key)}
                      className={`text-sm rounded-full px-4 py-2 ${form.habilidad === sk.key ? 'cta-zolar font-bold' : 'bubble-glass text-white/85'}`}
                    >
                      {sk.label}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={4}
                  maxLength={500}
                  placeholder="Cuéntanos de ti"
                  value={form.mensaje}
                  onChange={e => setField('mensaje', e.target.value)}
                  className="w-full bubble-glass rounded-2xl px-4 py-3 text-sm bg-transparent outline-none placeholder:text-white/40 resize-none"
                />
                <button
                  onClick={sendForm}
                  disabled={!formValid}
                  className="w-full cta-zolar rounded-full py-3 font-bold disabled:opacity-40"
                >
                  ✨ Enviar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
