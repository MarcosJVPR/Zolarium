import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Mascot from './Mascot'
import { SIGNS } from '../utils/zodiac'
import { supabase } from '../utils/supabase'
import { computeChart } from '../utils/chart'

const FEED_LIMIT = 3
const FEED_REWARD = 2
const PET_REWARD_LIMIT = 1
const ZOOM_MIN = 0.55
const ZOOM_MAX = 1.35
const ZOOM_STEP = 0.2
const COVER = 2
const MSG_KEYS = ['aspiracional', 'fortuna', 'recomendacion']

const FALLBACK_POOL = {
  aspiracional: [
    'Los astros hoy están de tu lado. Camina con calma, que el cosmos acompaña.',
    'Tu energía atrae lo que nombras. Nombra cosas bonitas hoy.',
    'Hoy el universo premia a quien empieza, no a quien espera.',
    'Confía en tu ritmo: las estrellas nunca llegan tarde a su cielo.',
    'Lo que hoy siembras en silencio, mañana brilla sin permiso.',
    'Tu intuición está afinada hoy. Escúchala antes que al ruido.',
    'El cosmos abre puertas discretas. Fíjate en los detalles pequeños.',
    'Hoy eres más fuerte que tu duda favorita.',
  ],
  fortuna: [
    'Quien riega su jardín con paciencia, florece dos veces.',
    'La suerte de hoy se esconde en una conversación pendiente.',
    'Un pequeño desvío en tu rutina trae un regalo inesperado.',
    'Lo que compartas hoy vuelve multiplicado por tres.',
    'La fortuna favorece a quien saluda primero.',
    'Hoy un "sí" espontáneo vale más que diez planes perfectos.',
    'Guarda esa moneda: hoy la abundancia empieza por lo simbólico.',
    'El azar te guiña un ojo cerca del agua o de la música.',
  ],
  recomendacion: [
    'Regálate hoy diez minutos de silencio mirando el cielo antes de dormir.',
    'Escribe tres cosas que agradeces y déjalas bajo la almohada.',
    'Camina por una calle por la que nunca pasas.',
    'Manda un mensaje a esa persona que te hace reír.',
    'Bebe agua como si fuera un ritual, despacio y con intención.',
    'Estira el cuerpo cinco minutos al despertar: tu signo lo agradece.',
    'Cocina algo con las manos hoy, sin pantalla cerca.',
    'Sal a ver el atardecer aunque sea desde la ventana.',
  ],
}

const CAPACITY = { small: 2, medium: 4, large: 6 }
const MASCOT_COST = 2
const MASCOT_SIZE = { small: 78, medium: 115, large: 190 }
const MASCOT_ANCHOR = { small: '50%', medium: '52%', large: '58%' }
const OBJ_WIDTH = { small: '42%', medium: '30%', large: '18%' }
const SLOT_ANCHORS = {
  small: [
    { left: '48%', bottom: '68%' },
    { left: '72%', bottom: '62%' },
  ],
  medium: [
    { left: '34%', bottom: '62%' },
    { left: '56%', bottom: '68%' },
    { left: '74%', bottom: '56%' },
    { left: '46%', bottom: '46%' },
  ],
  large: [
    { left: '24%', bottom: '64%' },
    { left: '40%', bottom: '72%' },
    { left: '62%', bottom: '72%' },
    { left: '80%', bottom: '64%' },
    { left: '32%', bottom: '52%' },
    { left: '70%', bottom: '52%' },
  ],
}

const BASE_PLATFORMS = [
  { id: 'central', src: '/jardin/props/monticulo-1.png', size: 'large', drift: 'central', style: { bottom: '20%', width: '42%', maxWidth: 420, left: '50%' } },
  { id: 'roca-a', src: '/jardin/props/monticulo-pequeno-2.png', size: 'small', drift: 'a', style: { width: 'min(11%, 110px)', left: '18%', top: '28%' } },
  { id: 'roca-b', src: '/jardin/props/monticulo-pequeno-4.png', size: 'small', drift: 'b', style: { width: 'min(8%, 80px)', right: '20%', top: '32%' } },
  { id: 'roca-c', src: '/jardin/props/monticulo-2.png', size: 'medium', drift: 'b', style: { width: 'min(13%, 150px)', left: '12%', top: '44%' } },
  { id: 'roca-d', src: '/jardin/props/monticulo-pequeno-6.png', size: 'small', drift: 'a', style: { width: 'min(7%, 70px)', right: '16%', top: '50%' } },
]

const DRIFT_CLASS = {
  central: 'zolar-drift-central',
  a: 'zolar-drift-a',
  b: 'zolar-drift-b',
}

function isNightNow() {
  const h = new Date().getHours()
  return h >= 21 || h < 8
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function clampNum(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

function hashStr(str) {
  let h = 0
  const s = String(str)
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function fallbackFor(key) {
  const pool = FALLBACK_POOL[key] || []
  if (!pool.length) return ''
  return pool[hashStr(todayKey() + key) % pool.length]
}

function panLimits(zoom) {
  const mx = Math.max(0, (window.innerWidth * (COVER * zoom - 1)) / 2 - 12)
  const my = Math.max(0, (window.innerHeight * (COVER * zoom - 1)) / 2 - 12)
  return { mx, my }
}

function currentTransits() {
  try {
    const now = new Date()
    const pad = n => String(n).padStart(2, '0')
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`
    const chart = computeChart({ date, time, lat: 40.4168, lon: -3.7038 })
    return {
      sun: chart.sun,
      moon: chart.moon,
      mercury: chart.mercury,
      venus: chart.venus,
      mars: chart.mars,
    }
  } catch {
    return null
  }
}

const LEAF_SETS = {
  verde: ['hoja-verde-1'],
  cerezo: ['hoja-cerezo-1', 'hoja-cerezo-2'],
  otono: ['hoja-otono-1', 'hoja-otono-2', 'hoja-otono-3'],
  magica: ['hoja-magica-1'],
}

const LEAF_CONFIG = {
  verde: { count: 16, min: 11, max: 18, opacity: 0.55, sway: 'wide' },
  cerezo: { count: 12, min: 16, max: 26, opacity: 0.9, sway: 'normal' },
  otono: { count: 11, min: 18, max: 28, opacity: 0.9, sway: 'normal' },
  magica: { count: 16, min: 12, max: 20, opacity: 0.85, sway: 'wide' },
}

function FallingLeaves({ variant = 'verde' }) {
  const leaves = useMemo(() => {
    const set = LEAF_SETS[variant] || LEAF_SETS.verde
    const cfg = LEAF_CONFIG[variant] || LEAF_CONFIG.verde
    return Array.from({ length: cfg.count }, (_, i) => ({
      id: i,
      img: set[i % set.length],
      left: 2 + Math.random() * 94,
      delay: Math.random() * 14,
      dur: 11 + Math.random() * 9,
      size: cfg.min + Math.random() * (cfg.max - cfg.min),
      opacity: cfg.opacity,
      anim: cfg.sway === 'wide'
        ? (i % 2 ? 'zolarLeafArcA' : 'zolarLeafArcB')
        : (i % 2 ? 'zolarLeafFall' : 'zolarLeafFallB'),
    }))
  }, [variant])
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 30, touchAction: 'none' }}>
      {leaves.map(l => (
        <img
          key={l.id}
          src={`/jardin/efectos/${l.img}.png`}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            top: '-8%',
            left: `${l.left}%`,
            width: l.size,
            '--leaf-op': l.opacity,
            opacity: 0,
            pointerEvents: 'none',
            willChange: 'transform',
            animation: `${l.anim} ${l.dur}s ease-in-out ${l.delay}s infinite`,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
          }}
        />
      ))}
    </div>
  )
}

export default function ZodiacGarden({ sign, onBack }) {
  const s = SIGNS[sign]
  const night = isNightNow()
  const [petState, setPetState] = useState(night ? 'duerme' : 'neutral')
  const [care, setCare] = useState(null)
  const [stardust, setStardust] = useState(0)
  const [owned, setOwned] = useState([])
  const [equippedSkin, setEquippedSkin] = useState(null)
  const [equippedBg, setEquippedBg] = useState(null)
  const [equippedEffect, setEquippedEffect] = useState(null)
  const [catalog, setCatalog] = useState([])
  const [layout, setLayout] = useState({ mascot: 'central', items: {}, platforms: {} })
  const [decorMode, setDecorMode] = useState(false)
  const [selected, setSelected] = useState(null)
  const [shopOpen, setShopOpen] = useState(false)
  const [zoom, setZoom] = useState(ZOOM_MIN)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState([])
  const [toast, setToast] = useState(null)
  const [bgFallback, setBgFallback] = useState(false)
  const [messages, setMessages] = useState(null)
  const [activeMsg, setActiveMsg] = useState(null)
  const timerRef = useRef(null)
  const msgTimerRef = useRef(null)
  const toastRef = useRef(null)
  const fetchingRef = useRef(false)
  const camRef = useRef(null)
  const panRef = useRef(null)
  const platDragRef = useRef(null)

  const hasBubblesUpgrade = owned.includes('burbujas-extra')
  const hasDayFireflies = owned.includes('luciernagas-dia')

  const platforms = useMemo(() => {
    const bought = catalog
      .filter(c => c.kind === 'platform' && c.src && owned.includes(c.id))
      .map(c => ({
        id: c.id,
        src: c.src,
        size: 'small',
        drift: c.drift === 'b' ? 'b' : 'a',
        style: c.style || { width: 'min(9%, 95px)', right: '24%', top: '24%' },
      }))
    return [...BASE_PLATFORMS, ...bought]
  }, [catalog, owned])

  const ownedProps = useMemo(
    () => catalog.filter(c => c.kind === 'prop' && c.src && owned.includes(c.id)),
    [catalog, owned]
  )

  const priceOf = useMemo(() => {
    const map = {}
    for (const c of catalog) map[c.id] = c.price || 0
    return map
  }, [catalog])

  const resolvedLayout = useMemo(() => {
    const platIds = platforms.map(p => p.id)
    const mascot = platIds.includes(layout.mascot) ? layout.mascot : 'central'
    const items = {}
    const taken = {}
    for (const p of platforms) taken[p.id] = new Set()

    for (const item of ownedProps) {
      const saved = layout.items?.[item.id]
      if (saved && platIds.includes(saved.platform)) {
        const plat = platforms.find(p => p.id === saved.platform)
        const cap = CAPACITY[plat.size] - (mascot === plat.id ? MASCOT_COST : 0)
        if (saved.slot < cap && !taken[plat.id].has(saved.slot)) {
          items[item.id] = saved
          taken[plat.id].add(saved.slot)
          continue
        }
      }
      for (const p of platforms) {
        const cap = CAPACITY[p.size] - (mascot === p.id ? MASCOT_COST : 0)
        let placedSlot = null
        for (let i = 0; i < cap; i++) {
          if (!taken[p.id].has(i)) {
            placedSlot = i
            break
          }
        }
        if (placedSlot !== null) {
          items[item.id] = { platform: p.id, slot: placedSlot }
          taken[p.id].add(placedSlot)
          break
        }
      }
    }
    return { mascot, items, platforms: layout.platforms || {} }
  }, [layout, platforms, ownedProps])

  const customBg = useMemo(() => {
    if (!equippedBg) return null
    const item = catalog.find(c => c.id === equippedBg && c.kind === 'fondo')
    return item?.src || null
  }, [equippedBg, catalog])

  const bgSrc = bgFallback
    ? '/jardin/fondos/fondo-dia.jpg'
    : customBg || (night ? '/jardin/fondos/fondo-noche.png' : '/jardin/fondos/fondo-dia.jpg')

  const bubbles = useMemo(
    () =>
      Array.from({ length: hasBubblesUpgrade ? 12 : 5 }, (_, i) => ({
        id: i,
        left: 8 + Math.random() * 84,
        delay: Math.random() * 8,
        dur: 9 + Math.random() * 6,
        spriteDelay: Math.random() * 0.9,
        size: 18 + Math.random() * 22,
      })),
    [hasBubblesUpgrade]
  )

  const fireflies = useMemo(
    () =>
      night || hasDayFireflies
        ? Array.from({ length: 12 }, (_, i) => ({
            id: i,
            left: 15 + Math.random() * 70,
            top: 25 + Math.random() * 45,
            delay: Math.random() * 4,
            dur: 2.5 + Math.random() * 3,
          }))
        : [],
    [night, hasDayFireflies]
  )

  useEffect(() => {
    load()
    return () => {
      clearTimeout(timerRef.current)
      clearTimeout(msgTimerRef.current)
      clearTimeout(toastRef.current)
    }
  }, [])

  useEffect(() => {
    const { mx, my } = panLimits(zoom)
    setPan(p => ({ x: clampNum(p.x, -mx, mx), y: clampNum(p.y, -my, my) }))
  }, [zoom])

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const [profileRes, catalogRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('mascota, daily_messages, stardust, garden_items, mascot_skin, garden_bg, garden_layout, garden_effect')
        .eq('id', session.user.id)
        .maybeSingle(),
      supabase.from('garden_catalog').select('*').eq('active', true).order('sort'),
    ])
    const data = profileRes.data
    const m = data?.mascota || {}
    const sameDay = m.day === todayKey()
    setCare({
      happiness: m.happiness ?? 50,
      feeds: sameDay ? m.feeds ?? 0 : 0,
      pets: sameDay ? m.pets ?? 0 : 0,
    })
    setStardust(data?.stardust ?? 0)
    setOwned(Array.isArray(data?.garden_items) ? data.garden_items : [])
    setEquippedSkin(data?.mascot_skin || null)
    setEquippedBg(data?.garden_bg || null)
    setEquippedEffect(data?.garden_effect || null)
    if (data?.garden_layout && typeof data.garden_layout === 'object') {
      setLayout({
        mascot: data.garden_layout.mascot || 'central',
        items: data.garden_layout.items || {},
        platforms: data.garden_layout.platforms || {},
      })
    }
    if (data?.daily_messages?.date === todayKey()) setMessages(data.daily_messages)
    setCatalog(catalogRes.data || [])
  }

  async function persistField(field, value) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('profiles').update({ [field]: value }).eq('id', session.user.id)
  }

  function showToast(text) {
    setToast(text)
    clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 3000)
  }

  async function ensureMessages() {
    if (messages?.date === todayKey()) return messages
    if (fetchingRef.current) return null
    fetchingRef.current = true
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null
      const res = await fetch('/api/daily', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transits: currentTransits() }),
      })
      if (!res.ok) return null
      const data = await res.json()
      if (data?.messages) {
        setMessages(data.messages)
        return data.messages
      }
      return null
    } catch {
      return null
    } finally {
      fetchingRef.current = false
    }
  }

  async function revealMessage(idx) {
    const key = MSG_KEYS[Math.min(idx, MSG_KEYS.length - 1)]
    const m = await ensureMessages()
    const text = m?.[key] || fallbackFor(key)
    setActiveMsg(text)
    clearTimeout(msgTimerRef.current)
    msgTimerRef.current = setTimeout(() => setActiveMsg(null), 16000)
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

  function reward(text) {
    const item = { id: `r-${Date.now()}`, left: 46 + Math.random() * 8, emoji: text }
    setParticles(p => [...p, item])
    setTimeout(() => {
      setParticles(p => p.filter(x => x.id !== item.id))
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
    if (decorMode) {
      setSelected(sel => (sel?.type === 'mascot' ? null : { type: 'mascot' }))
      return
    }
    if (!care) return
    burst(night ? '💤' : '💚')
    if (!night) {
      setTemp('feliz', 1600)
      setCare(c => ({
        happiness: Math.min(100, c.happiness + 2),
        feeds: c.feeds,
        pets: c.pets + 1,
      }))
      supabase.rpc('garden_care', { p_action: 'pet' }).then(({ data }) => {
        if (data?.stardust != null) setStardust(data.stardust)
        if (data?.reward > 0) reward(`+${data.reward} ⭐`)
      })
    }
  }

  function feed() {
    if (!care || night || care.feeds >= FEED_LIMIT) return
    burst('⭐')
    setTemp('come', 2200, () => setTemp('feliz', 1400))
    const msgIdx = care.feeds
    setCare(c => ({
      happiness: Math.min(100, c.happiness + 10),
      feeds: c.feeds + 1,
      pets: c.pets,
    }))
    supabase.rpc('garden_care', { p_action: 'feed' }).then(({ data }) => {
      if (data?.stardust != null) setStardust(data.stardust)
      if (data?.reward > 0) reward(`+${data.reward} ⭐`)
    })
    revealMessage(msgIdx)
  }

  function usedSlots(pid, exceptItemId = null) {
    const set = new Set()
    for (const [id, pos] of Object.entries(resolvedLayout.items)) {
      if (id !== exceptItemId && pos.platform === pid) set.add(pos.slot)
    }
    return set
  }

  function saveLayout(next) {
    setLayout(next)
    persistField('garden_layout', next)
  }

  function movePlace(pid) {
    if (!selected) return
    const plat = platforms.find(p => p.id === pid)
    if (!plat) return

    if (selected.type === 'mascot') {
      if (resolvedLayout.mascot === pid) {
        setSelected(null)
        return
      }
      const objCount = usedSlots(pid).size
      if (objCount + MASCOT_COST > CAPACITY[plat.size]) {
        showToast('Esta roca está llena para tu mascota')
        return
      }
      const next = { mascot: pid, items: { ...resolvedLayout.items }, platforms: resolvedLayout.platforms }
      const cap = CAPACITY[plat.size] - MASCOT_COST
      for (const [id, pos] of Object.entries(next.items)) {
        if (pos.platform === pid && pos.slot >= cap) delete next.items[id]
      }
      saveLayout(next)
      setSelected(null)
      burst('✨')
      return
    }

    const itemId = selected.id
    const cap = CAPACITY[plat.size] - (resolvedLayout.mascot === pid ? MASCOT_COST : 0)
    const taken = usedSlots(pid, itemId)
    let slot = null
    for (let i = 0; i < cap; i++) {
      if (!taken.has(i)) {
        slot = i
        break
      }
    }
    if (slot === null) {
      showToast('Esta roca está llena')
      return
    }
    saveLayout({
      mascot: resolvedLayout.mascot,
      items: { ...resolvedLayout.items, [itemId]: { platform: pid, slot } },
      platforms: resolvedLayout.platforms,
    })
    setSelected(null)
    burst('✨')
  }

  function onCamPointerDown(e) {
    if (platDragRef.current) return
    panRef.current = { sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y }
  }

  function onCamPointerMove(e) {
    if (platDragRef.current) return
    if (panRef.current) {
      const { mx, my } = panLimits(zoom)
      setPan({
        x: clampNum(panRef.current.ox + (e.clientX - panRef.current.sx), -mx, mx),
        y: clampNum(panRef.current.oy + (e.clientY - panRef.current.sy), -my, my),
      })
    }
  }

  function onCamPointerUp() {
    panRef.current = null
  }

  function onPlatPointerDown(e, p) {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const el = e.currentTarget.parentElement
    platDragRef.current = {
      id: p.id,
      sx: e.clientX,
      sy: e.clientY,
      origLeft: el.offsetLeft,
      origTop: el.offsetTop,
      moved: false,
    }
  }

  function onPlatPointerMove(e, p) {
    const d = platDragRef.current
    if (!d || d.id !== p.id) return
    const cam = camRef.current
    if (!cam) return
    e.stopPropagation()
    const dx = (e.clientX - d.sx) / zoom
    const dy = (e.clientY - d.sy) / zoom
    if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 6) d.moved = true
    if (!d.moved) return
    const leftPct = clampNum(((d.origLeft + dx) / cam.clientWidth) * 100, 2, 92)
    const topPct = clampNum(((d.origTop + dy) / cam.clientHeight) * 100, 2, 88)
    setLayout(l => ({
      ...l,
      platforms: { ...(l.platforms || {}), [p.id]: { x: leftPct, y: topPct } },
    }))
  }

  function onPlatPointerUp(e, p) {
    const d = platDragRef.current
    if (!d || d.id !== p.id) return
    e.stopPropagation()
    platDragRef.current = null
    if (!d.moved) {
      movePlace(p.id)
    } else {
      persistField('garden_layout', {
        mascot: resolvedLayout.mascot,
        items: resolvedLayout.items,
        platforms: layout.platforms || {},
      })
    }
  }

  function keyOf(item) {
    return item.id.replace(/^skin-/, '')
  }

  async function buy(item) {
    if (!care || owned.includes(item.id) || stardust < item.price) return
    const { data, error } = await supabase.rpc('garden_buy', { p_item: item.id })
    if (error || !data) {
      showToast('El cosmos rechazó la compra ✋')
      return
    }
    setOwned(Array.isArray(data.items) ? data.items : [...owned, item.id])
    setStardust(data.stardust ?? Math.max(0, stardust - item.price))
    burst('✨')
    if (item.kind === 'skin' || item.kind === 'fondo') equip(item)
  }

  function equip(item) {
    if (item.kind === 'skin') {
      const key = keyOf(item)
      const next = equippedSkin === key ? null : key
      setEquippedSkin(next)
      persistField('mascot_skin', next)
    } else if (item.kind === 'fondo') {
      const next = equippedBg === item.id ? null : item.id
      setEquippedBg(next)
      setBgFallback(false)
      persistField('garden_bg', next)
    } else if (item.kind === 'effect') {
      const next = equippedEffect === item.id ? null : item.id
      setEquippedEffect(next)
      persistField('garden_effect', next)
    }
  }

  const feedsLeft = care ? FEED_LIMIT - care.feeds : 0

  function renderPlatform(p) {
    const mascotHere = resolvedLayout.mascot === p.id
    const objectsHere = ownedProps.filter(it => resolvedLayout.items[it.id]?.platform === p.id)
    const anchors = SLOT_ANCHORS[p.size]
    const custom = resolvedLayout.platforms?.[p.id]
    const style = custom
      ? { width: p.style.width, maxWidth: p.style.maxWidth, left: `${custom.x}%`, top: `${custom.y}%` }
      : { ...p.style }

    return (
      <div
        key={p.id}
        className={`absolute ${DRIFT_CLASS[p.drift]}`}
        style={style}
      >
        <img src={p.src} alt="" draggable={false} className="w-full" />

        {decorMode && (
          <div
            onPointerDown={e => onPlatPointerDown(e, p)}
            onPointerMove={e => onPlatPointerMove(e, p)}
            onPointerUp={e => onPlatPointerUp(e, p)}
            role="button"
            aria-label={`Mover o colocar en ${p.id}`}
            className="absolute rounded-[30%]"
            style={{
              inset: '-8%',
              border: '2px dashed rgba(255,255,255,0.55)',
              background: selected ? 'rgba(255,255,255,0.06)' : 'transparent',
              cursor: 'grab',
              touchAction: 'none',
            }}
          />
        )}

        {objectsHere.map(it => {
          const pos = resolvedLayout.items[it.id]
          const anchor = anchors[Math.min(pos.slot, anchors.length - 1)]
          const isSel = selected?.type === 'item' && selected.id === it.id
          return (
            <img
              key={it.id}
              src={it.src}
              alt=""
              draggable={false}
              onClick={e => {
                if (!decorMode) return
                e.stopPropagation()
                setSelected(sel => (sel?.type === 'item' && sel.id === it.id ? null : { type: 'item', id: it.id }))
              }}
              className="absolute"
              style={{
                width: OBJ_WIDTH[p.size],
                left: anchor.left,
                bottom: anchor.bottom,
                transform: 'translateX(-50%)',
                pointerEvents: decorMode ? 'auto' : 'none',
                filter: isSel ? 'drop-shadow(0 0 10px rgba(255,255,255,0.9))' : 'none',
                zIndex: 3 + (priceOf[it.id] || 0),
              }}
            />
          )
        })}

        {mascotHere && (
          <button
            onClick={e => {
              e.stopPropagation()
              pet()
            }}
            onPointerDown={e => e.stopPropagation()}
            aria-label="Tu mascota"
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: MASCOT_ANCHOR[p.size],
              background: 'none',
              border: 'none',
              padding: 0,
              zIndex: 500,
              filter: selected?.type === 'mascot' ? 'drop-shadow(0 0 12px rgba(255,255,255,0.95))' : 'none',
            }}
          >
            <Mascot sign={sign} size={MASCOT_SIZE[p.size]} state={petState} skin={equippedSkin} float={false} />
          </button>
        )}
      </div>
    )
  }

  const EFFECT_TO_VARIANT = {
    'efecto-hojas-cerezo': 'cerezo',
    'efecto-hojas-otono': 'otono',
    'efecto-hojas-magicas': 'magica',
  }
  const leafVariant = EFFECT_TO_VARIANT[equippedEffect] || 'verde'

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ height: '100dvh', background: '#17101d' }}>
      {!night && <FallingLeaves variant={leafVariant} />}
      <div
        ref={camRef}
        className="absolute"
        onPointerDown={onCamPointerDown}
        onPointerMove={onCamPointerMove}
        onPointerUp={onCamPointerUp}
        style={{
          inset: '-50%',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '50% 50%',
          touchAction: 'none',
        }}
      >
        <img
          src={bgSrc}
          alt=""
          onError={() => {
            if (!bgFallback) setBgFallback(true)
          }}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        {night && (bgFallback || customBg) && <div className="absolute inset-0 bg-[#1c1030]/60" />}

        {platforms.map(renderPlatform)}

        {fireflies.map(f => (
          <div key={f.id} className="absolute rounded-full pointer-events-none zolar-firefly"
            style={{ left: `${f.left}%`, top: `${f.top}%`, animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s` }} />
        ))}
      </div>

      {bubbles.map(b => (
        <div
          key={b.id}
          className="absolute pointer-events-none zolar-bubble"
          style={{
            width: b.size,
            height: b.size,
            left: `${b.left}%`,
            animationDelay: `${b.delay}s, ${b.spriteDelay}s`,
            animationDuration: `${b.dur}s, 0.9s`,
          }}
        />
      ))}

      <img src="/jardin/props/hojas-esquina.png" alt="" draggable={false}
        className="absolute inset-x-0 bottom-0 w-full pointer-events-none"
        style={{ opacity: 0.95, transform: 'translateY(22%)' }} />

      <AnimatePresence>
        {activeMsg && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 px-4"
            style={{ bottom: '52%', width: '88%', maxWidth: 360, zIndex: 20 }}
            initial={{ opacity: 0, y: 14, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          >
            <div className="bubble-glass rounded-3xl px-4 py-3 relative" style={{ background: 'rgba(28,20,32,0.78)' }}>
              <button
                onClick={() => setActiveMsg(null)}
                aria-label="Cerrar mensaje"
                className="absolute top-2 right-3 text-white/60 text-sm"
              >
                ✕
              </button>
              <p className="text-sm leading-relaxed text-white/95 pr-5">{activeMsg}</p>
            </div>
            <div
              className="mx-auto"
              style={{
                width: 0,
                height: 0,
                borderLeft: '9px solid transparent',
                borderRight: '9px solid transparent',
                borderTop: '10px solid rgba(28,20,32,0.78)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute text-2xl pointer-events-none"
            style={{ left: `${p.left}%`, bottom: '42%', zIndex: 15 }}
            initial={{ opacity: 0, y: 10, scale: 0.6 }}
            animate={{ opacity: 1, y: -70, scale: 1.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="absolute top-0 inset-x-0 px-5 pt-6 flex items-center justify-between" style={{ zIndex: 600 }}>
        <button onClick={onBack} className="text-white/90 text-sm bubble-glass rounded-full px-4 py-2">
          ← Volver
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDecorMode(d => !d)
              setSelected(null)
            }}
            className={`rounded-full px-3 py-2 text-sm ${decorMode ? 'cta-zolar font-bold' : 'bubble-glass text-white/95'}`}
            aria-label="Modo decorar"
          >
            🪴
          </button>
          <div className="bubble-glass rounded-full px-2 py-1.5 flex items-center gap-1">
            <button
              onClick={() => setZoom(z => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))}
              className="w-7 h-7 rounded-full text-white/90 text-lg leading-none"
              aria-label="Alejar"
            >
              −
            </button>
            <button
              onClick={() => setZoom(z => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))}
              className="w-7 h-7 rounded-full text-white/90 text-lg leading-none"
              aria-label="Acercar"
            >
              +
            </button>
          </div>
          {care && (
            <div className="bubble-glass rounded-full px-3 py-2 flex items-center gap-2">
              <span className="text-sm">💜</span>
              <div className="w-14 h-2 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${care.happiness}%`, background: `linear-gradient(90deg, ${s.color}, ${s.soft})` }} />
              </div>
            </div>
          )}
          <button onClick={() => setShopOpen(true)} className="bubble-glass rounded-full px-3 py-2 text-sm text-white/95">
            ⭐ {stardust}
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 px-6 pb-8 flex justify-center" style={{ zIndex: 600 }}>
        {decorMode ? (
          <div className="bg-black/40 backdrop-blur rounded-2xl px-5 py-3 text-sm text-white/90 text-center">
            {selected
              ? '✨ Toca una roca para colocarlo'
              : '🪴 Toca objetos para moverlos · Arrastra las rocas para reordenarlas'}
          </div>
        ) : night ? (
          <div className="bg-black/40 backdrop-blur rounded-2xl px-5 py-3 text-sm text-white/90">
            🌙 {s.name} está durmiendo. Vuelve por la mañana.
          </div>
        ) : (
          <button
            onClick={feed}
            disabled={!care || feedsLeft <= 0}
            className="rounded-2xl px-6 py-3 font-semibold shadow-lg disabled:opacity-50 cta-zolar"
          >
            {feedsLeft > 0 ? `⭐ Alimentar (${feedsLeft})` : 'Ya comió por hoy 💚'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bubble-glass rounded-full px-5 py-3 text-sm text-white"
            style={{ zIndex: 700, background: 'rgba(28,20,32,0.9)' }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {shopOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50"
              style={{ zIndex: 640 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShopOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 rounded-t-[28px] px-5 pt-5 pb-8 max-h-[70dvh] overflow-y-auto"
              style={{ zIndex: 650, background: 'rgba(28,20,32,0.97)', border: '1px solid rgba(255,255,255,0.14)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold font-display text-lg">Tienda del jardín</h3>
                <div className="flex items-center gap-3">
                  <span className="bubble-glass rounded-full px-3 py-1.5 text-sm">⭐ {stardust}</span>
                  <button onClick={() => setShopOpen(false)} className="text-white/60 text-lg" aria-label="Cerrar tienda">
                    ✕
                  </button>
                </div>
              </div>
              <p className="text-xs text-zolar-rose/70 mb-4">
                Gana polvo estelar cuidando a {s.name}: la primera comida del día +{FEED_REWARD}⭐ y un mimo +1⭐. Con 🪴 colocas tus compras donde quieras.
              </p>
              <div className="flex flex-col gap-3">
                {catalog.map(item => {
                  const isOwned = owned.includes(item.id)
                  const affordable = stardust >= item.price
                  const equipable = item.kind === 'skin' || item.kind === 'fondo' || item.kind === 'effect'
                  const isEquipped =
                    (item.kind === 'skin' && equippedSkin === keyOf(item)) ||
                    (item.kind === 'fondo' && equippedBg === item.id) ||
                    (item.kind === 'effect' && equippedEffect === item.id)
                  const previewSrc = item.kind === 'skin'
                    ? `/mascotas/skins/${sign}-${keyOf(item)}.png`
                    : item.src
                  const kindLabel =
                    item.kind === 'skin' ? ' · Skin'
                    : item.kind === 'fondo' ? ' · Mapa'
                    : item.kind === 'platform' ? ' · Plataforma'
                    : item.kind === 'effect' ? ' · Efecto'
                    : ''
                  return (
                    <div key={item.id} className="card-zolar rounded-2xl p-3 flex items-center gap-3">
                      <div className="w-14 h-14 shrink-0 flex items-center justify-center bubble-glass rounded-2xl overflow-hidden">
                        {previewSrc ? (
                          <img
                            src={previewSrc}
                            alt=""
                            className={item.kind === 'fondo' ? 'w-full h-full object-cover' : 'max-w-full max-h-full object-contain'}
                            draggable={false}
                            onError={e => { e.currentTarget.style.display = 'none' }}
                          />
                        ) : (
                          <span className="text-2xl">{item.id === 'burbujas-extra' ? '🫧' : '🌟'}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-xs text-zolar-rose/70">⭐ {item.price}{kindLabel}</p>
                      </div>
                      {isOwned && equipable ? (
                        <button
                          onClick={() => equip(item)}
                          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${isEquipped ? 'cta-zolar' : 'bubble-glass text-white/85'}`}
                        >
                          {isEquipped ? '✓ En uso' : 'Usar'}
                        </button>
                      ) : (
                        <button
                          onClick={() => buy(item)}
                          disabled={isOwned || !affordable}
                          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${isOwned ? 'bubble-glass text-white/60' : 'cta-zolar disabled:opacity-40'}`}
                        >
                          {isOwned ? '✓ Tuyo' : 'Comprar'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .zolar-drift-a { animation: zolarDriftA 7s ease-in-out infinite; }
        .zolar-drift-b { animation: zolarDriftA 9s ease-in-out infinite reverse; }
        .zolar-drift-central {
          transform: translateX(-50%);
          animation: zolarDriftCentral 8s ease-in-out infinite;
        }
        @keyframes zolarDriftA {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes zolarDriftCentral {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, -10px); }
        }
        .zolar-bubble {
          bottom: -60px;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          animation-name: zolarRise, zolarBubbleSprite;
          animation-timing-function: linear, steps(1);
          animation-iteration-count: infinite, infinite;
          opacity: 0.7;
        }
        @keyframes zolarRise {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.5; }
          100% { transform: translateY(-110vh); opacity: 0; }
        }
        @keyframes zolarBubbleSprite {
          0% { background-image: url('/jardin/efectos/burbuja-1.png'); }
          33% { background-image: url('/jardin/efectos/burbuja-2.png'); }
          66% { background-image: url('/jardin/efectos/burbuja-3.png'); }
          100% { background-image: url('/jardin/efectos/burbuja-1.png'); }
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
