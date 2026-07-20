import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Supercluster from 'supercluster'
import { motion, AnimatePresence } from 'framer-motion'
import Mascot from './Mascot'
import { SIGNS, isLightColor } from '../utils/zodiac'
import { supabase } from '../utils/supabase'
import { ARCHETYPE_KEYS, SIGN_ARCHETYPES } from '../engine/config.js'

const CATS = [
  { key: 'todos', label: '✨ Todos' },
  { key: 'ocio-urbano', label: '🎯 Ocio' },
  { key: 'karaoke', label: '🎤 Karaoke' },
  { key: 'musica', label: '🎵 Música' },
  { key: 'teatro-danza', label: '🎭 Teatro' },
  { key: 'cine', label: '🎬 Cine' },
  { key: 'exposiciones', label: '🎨 Expos' },
  { key: 'talleres', label: '🛠️ Talleres' },
  { key: 'deporte', label: '🏃 Deporte' },
  { key: 'fiestas-populares', label: '🎉 Fiestas' },
  { key: 'infantil-familiar', label: '🧸 Familia' },
  { key: 'mercadillos', label: '🧺 Mercadillos' },
  { key: 'esoterico', label: '🔮 Místico' },
  { key: 'acupuntura', label: '🪡 Acupuntura' },
]

const SKILL_EMOJI = { tarot: '🔮', astrologia: '🔭', acupuntura: '🪡', manos: '🖐️' }
const SKILL_LABEL = { tarot: 'Tarot', astrologia: 'Astrología', acupuntura: 'Acupuntura', manos: 'Lectura de manos' }

const CAR_KEY = 'zolar_car'
const CAR_MAX_MS = 12 * 60 * 60 * 1000

function loadCar() {
  try {
    const raw = localStorage.getItem(CAR_KEY)
    if (!raw) return null
    const pin = JSON.parse(raw)
    if (!pin?.lat || !pin?.lon || !pin?.ts) throw new Error()
    if (Date.now() - pin.ts > CAR_MAX_MS) throw new Error()
    return pin
  } catch {
    localStorage.removeItem(CAR_KEY)
    return null
  }
}

function carAge(pin) {
  const mins = Math.floor((Date.now() - pin.ts) / 60000)
  if (mins < 1) return 'ahora mismo'
  if (mins < 60) return `hace ${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `hace ${h}h ${m}min` : `hace ${h}h`
}

const SIGN_KEYS = Object.keys(SIGNS)
const SIGN_VECTORS = SIGN_KEYS.map(sign =>
  ARCHETYPE_KEYS.map(k => SIGN_ARCHETYPES[sign][k] || 0)
)
const MAX_SIGNS = 3
const MIN_PER_SIGN = 20

const SIGN_ELEMENT = {
  aries: 'fuego', leo: 'fuego', sagitario: 'fuego',
  tauro: 'tierra', virgo: 'tierra', capricornio: 'tierra',
  geminis: 'aire', libra: 'aire', acuario: 'aire',
  cancer: 'agua', escorpio: 'agua', piscis: 'agua',
}
const ELEMENT_SIGNS = {
  fuego: ['aries', 'leo', 'sagitario'],
  tierra: ['tauro', 'virgo', 'capricornio'],
  aire: ['geminis', 'libra', 'acuario'],
  agua: ['cancer', 'escorpio', 'piscis'],
}

function cosine(a, b) {
  let d = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    d += a[i] * (b[i] || 0)
    na += a[i] * a[i]
    nb += (b[i] || 0) * (b[i] || 0)
  }
  if (!na || !nb) return 0
  return d / Math.sqrt(na * nb)
}

function hashStr(str) {
  let h = 0
  const s = String(str)
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function assignSigns(plans) {
  const sims = plans.map(p => SIGN_VECTORS.map(sv => cosine(sv, p.archetype_vector)))
  const means = SIGN_KEYS.map((_, si) => {
    let sum = 0
    for (const row of sims) sum += row[si]
    return sum / (sims.length || 1) || 1e-6
  })

  const enriched = plans.map((p, pi) => {
    if (p.sign_override && SIGNS[p.sign_override]) {
      return { ...p, sign: p.sign_override, signs: [p.sign_override], _rank: null }
    }
    const scored = SIGN_KEYS.map((key, si) => ({ key, score: sims[pi][si] / means[si] }))
      .sort((a, b) => b.score - a.score)
    const signs = scored.slice(0, MAX_SIGNS).map(x => x.key)
    const primary = signs[hashStr(p.id) % signs.length]
    return { ...p, sign: primary, signs, _rank: scored }
  })

  const counts = {}
  for (const k of SIGN_KEYS) counts[k] = 0
  for (const p of enriched) for (const s of p.signs) counts[s] += 1

  for (const sign of SIGN_KEYS) {
    if (counts[sign] >= MIN_PER_SIGN) continue
    const element = SIGN_ELEMENT[sign]
    const siblings = ELEMENT_SIGNS[element].filter(s => s !== sign)

    const candidates = enriched
      .filter(p => p._rank && !p.signs.includes(sign))
      .map(p => {
        const own = p._rank.find(r => r.key === sign)?.score ?? 0
        const kinship = p.signs.some(s => siblings.includes(s)) ? 1 : 0
        return { p, own, kinship }
      })
      .sort((a, b) => (b.kinship - a.kinship) || (b.own - a.own))

    for (const c of candidates) {
      if (counts[sign] >= MIN_PER_SIGN) break
      c.p.signs = [...c.p.signs, sign]
      counts[sign] += 1
    }
  }

  return enriched.map(({ _rank, ...p }) => p)
}

function truncate(text, max = 150) {
  if (!text) return null
  if (text.length <= max) return text
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

const iconCache = {}
function signIcon(sign, match) {
  const cacheKey = `${sign}-${match ? 1 : 0}`
  if (iconCache[cacheKey]) return iconCache[cacheKey]
  const s = SIGNS[sign]
  const textColor = isLightColor(s.color) ? '#2F2133' : '#fff'
  const size = match ? 36 : 22
  const fontSize = match ? 18 : 11
  const opacity = match ? 1 : 0.45
  const glow = match ? `box-shadow:0 0 14px ${s.color}cc, 0 2px 10px rgba(0,0,0,0.45);` : 'box-shadow:0 2px 8px rgba(0,0,0,0.4);'
  iconCache[cacheKey] = L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${s.color};border:2px solid rgba(255,255,255,${match ? 0.9 : 0.4});display:flex;align-items:center;justify-content:center;font-size:${fontSize}px;color:${textColor};opacity:${opacity};${glow}">${s.symbol}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
  return iconCache[cacheKey]
}

const practIconCache = {}
function practitionerIcon(skill) {
  if (practIconCache[skill]) return practIconCache[skill]
  const emoji = SKILL_EMOJI[skill] || '✨'
  practIconCache[skill] = L.divIcon({
    className: '',
    html: `<div style="width:38px;height:38px;border-radius:50%;background:rgba(28,20,32,0.95);border:2.5px solid #FFC94A;display:flex;align-items:center;justify-content:center;font-size:19px;box-shadow:0 0 16px rgba(255,201,74,0.7), 0 2px 10px rgba(0,0,0,0.5)">${emoji}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  })
  return practIconCache[skill]
}

let carIconCache = null
function carIcon() {
  if (carIconCache) return carIconCache
  carIconCache = L.divIcon({
    className: '',
    html: `<div style="width:40px;height:40px;border-radius:50%;background:rgba(28,20,32,0.95);border:2.5px solid #00E0D1;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 18px rgba(0,224,209,0.7), 0 2px 10px rgba(0,0,0,0.5)">🚗</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
  return carIconCache
}

function clusterIcon(count) {
  const size = count >= 100 ? 52 : count >= 25 ? 44 : 38
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:linear-gradient(135deg,#FF8A00,#FF2DA1);border:2px solid rgba(255,255,255,0.85);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;box-shadow:0 2px 14px rgba(255,45,161,0.55)">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function ClusterLayer({ index, plans, userSign, signFilter, onSelect }) {
  const map = useMap()
  const [, setTick] = useState(0)
  useMapEvents({
    moveend: () => setTick(t => t + 1),
    zoomend: () => setTick(t => t + 1),
  })
  const b = map.getBounds()
  const clusters = index.getClusters(
    [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
    Math.round(map.getZoom())
  )
  return clusters.map(c => {
    const [lng, lat] = c.geometry.coordinates
    if (c.properties.cluster) {
      return (
        <Marker
          key={`c-${c.id}`}
          position={[lat, lng]}
          icon={clusterIcon(c.properties.point_count)}
          eventHandlers={{
            click: () =>
              map.setView([lat, lng], Math.min(index.getClusterExpansionZoom(c.id), 18), { animate: true }),
          }}
        />
      )
    }
    const p = plans[c.properties.idx]
    const highlight = signFilter || userSign
    const match = highlight ? (p.signs || [p.sign]).includes(highlight) : true
    return (
      <Marker
        key={p.id}
        position={[lat, lng]}
        icon={signIcon(match && highlight ? highlight : p.sign, match)}
        zIndexOffset={match ? 500 : 0}
        eventHandlers={{ click: () => onSelect(p) }}
      />
    )
  })
}

export default function MapView({ onBack, sign = null, initialCat = 'todos' }) {
  const [plans, setPlans] = useState([])
  const [practitioners, setPractitioners] = useState([])
  const [selected, setSelected] = useState(null)
  const [selectedPract, setSelectedPract] = useState(null)
  const [cat, setCat] = useState(initialCat)
  const [signFilter, setSignFilter] = useState(null)
  const [catOpen, setCatOpen] = useState(initialCat !== 'todos')
  const [carPin, setCarPin] = useState(null)
  const [carSheet, setCarSheet] = useState(false)
  const [carBusy, setCarBusy] = useState(false)
  const mapRef = useRef(null)

  useEffect(() => {
    load()
    setCarPin(loadCar())
  }, [])

  async function load() {
    const today = new Date().toISOString().slice(0, 10)
    const [eventsRes, placesRes, practRes] = await Promise.all([
      supabase.from('plans').select('*')
        .not('archetype_vector', 'is', null)
        .not('lat', 'is', null)
        .gte('event_date', today)
        .limit(400),
      supabase.from('plans').select('*')
        .not('archetype_vector', 'is', null)
        .not('lat', 'is', null)
        .is('event_date', null)
        .limit(400),
      supabase.from('practitioners').select('*')
        .eq('active', true)
        .not('lat', 'is', null),
    ])
    const all = [...(eventsRes.data || []), ...(placesRes.data || [])]
      .map(p => ({ ...p, cat: p.subcats?.[1] || null }))
    setPlans(assignSigns(all))
    setPractitioners(practRes.data || [])
  }

  function savePin(lat, lon) {
    const pin = { lat, lon, ts: Date.now() }
    localStorage.setItem(CAR_KEY, JSON.stringify(pin))
    setCarPin(pin)
    setCarBusy(false)
    mapRef.current?.setView([lat, lon], Math.max(mapRef.current.getZoom(), 16), { animate: true })
  }

  function parkHere() {
    if (carBusy) return
    setCarBusy(true)
    if (!navigator.geolocation) {
      const c = mapRef.current?.getCenter()
      savePin(c?.lat ?? 40.4168, c?.lng ?? -3.7038)
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => savePin(pos.coords.latitude, pos.coords.longitude),
      () => {
        const c = mapRef.current?.getCenter()
        savePin(c?.lat ?? 40.4168, c?.lng ?? -3.7038)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  function removeCar() {
    localStorage.removeItem(CAR_KEY)
    setCarPin(null)
    setCarSheet(false)
  }

  function openCar() {
    const pin = loadCar()
    if (!pin) {
      setCarPin(null)
      return
    }
    setCarPin(pin)
    closeSheets()
    setCarSheet(true)
    mapRef.current?.setView([pin.lat, pin.lon], Math.max(mapRef.current.getZoom(), 16), { animate: true })
  }

  const filtered = useMemo(() => {
    let list = plans
    if (cat === 'karaoke') list = list.filter(p => p.emoji === '🎤')
    else if (cat !== 'todos') list = list.filter(p => p.cat === cat)
    if (signFilter) list = list.filter(p => (p.signs || [p.sign]).includes(signFilter))
    return list
  }, [plans, cat, signFilter])

  const visiblePractitioners = useMemo(() => {
    if (cat === 'todos') return practitioners
    if (cat === 'acupuntura') return practitioners.filter(p => p.skill === 'acupuntura')
    if (cat === 'esoterico') return practitioners.filter(p => p.skill !== 'acupuntura')
    return []
  }, [practitioners, cat])

  const index = useMemo(() => {
    const sc = new Supercluster({ radius: 60, maxZoom: 17 })
    sc.load(
      filtered.map((p, idx) => ({
        type: 'Feature',
        properties: { idx },
        geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
      }))
    )
    return sc
  }, [filtered])

  const s = selected ? SIGNS[selected.sign] : null

  function closeSheets() {
    setSelected(null)
    setSelectedPract(null)
    setCarSheet(false)
  }

  return (
    <div className="fixed inset-0" style={{ height: '100dvh' }}>
      <MapContainer
        ref={mapRef}
        center={[40.4168, -3.7038]}
        zoom={12}
        style={{ width: '100%', height: '100%', background: '#17101d' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        <ClusterLayer
          index={index}
          plans={filtered}
          userSign={sign}
          signFilter={signFilter}
          onSelect={p => {
            setSelectedPract(null)
            setCarSheet(false)
            setSelected(p)
          }}
        />
        {visiblePractitioners.map(p => (
          <Marker
            key={`pr-${p.id}`}
            position={[p.lat, p.lon]}
            icon={practitionerIcon(p.skill)}
            zIndexOffset={800}
            eventHandlers={{
              click: () => {
                setSelected(null)
                setCarSheet(false)
                setSelectedPract(p)
              },
            }}
          />
        ))}
        {carPin && (
          <Marker
            position={[carPin.lat, carPin.lon]}
            icon={carIcon()}
            zIndexOffset={900}
            eventHandlers={{
              click: () => {
                closeSheets()
                setCarSheet(true)
              },
            }}
          />
        )}
      </MapContainer>

      <div className="absolute top-0 inset-x-0 pt-6" style={{ zIndex: 1000 }}>
        <div className="px-5 flex items-center justify-between">
          <button onClick={onBack} className="text-white/90 text-sm bubble-glass rounded-full px-4 py-2">
            ← Volver
          </button>
          <div className="bubble-glass rounded-full px-4 py-2 text-sm text-white/90">
            {filtered.length} planes
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto px-5 pt-3 pb-1 items-center" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => {
              setSignFilter(null)
              closeSheets()
            }}
            className={`shrink-0 text-sm rounded-full px-3 py-2 text-white ${!signFilter ? 'cta-zolar font-bold' : 'bubble-glass'}`}
          >
            ✨
          </button>
          {SIGN_KEYS.map(k => {
            const sk = SIGNS[k]
            const active = signFilter === k
            return (
              <button
                key={k}
                onClick={() => {
                  setSignFilter(active ? null : k)
                  closeSheets()
                }}
                title={sk.name}
                className="shrink-0 w-9 h-9 rounded-full text-base font-bold flex items-center justify-center"
                style={
                  active
                    ? { background: sk.color, color: isLightColor(sk.color) ? '#2F2133' : '#fff', boxShadow: `0 0 14px ${sk.color}bb` }
                    : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.22)', color: sk.soft }
                }
              >
                {sk.symbol}
              </button>
            )
          })}
          <button
            onClick={() => setCatOpen(o => !o)}
            aria-label="Filtros por actividad"
            className="shrink-0 w-9 h-9 rounded-full bubble-glass text-white/90 text-sm"
          >
            {catOpen ? '▴' : '▾'}
          </button>
        </div>

        {catOpen && (
          <div className="flex gap-2 overflow-x-auto px-5 pt-2 pb-1" style={{ scrollbarWidth: 'none' }}>
            {CATS.map(c => (
              <button
                key={c.key}
                onClick={() => {
                  setCat(c.key)
                  closeSheets()
                }}
                className={`shrink-0 text-sm rounded-full px-4 py-2 text-white transition-all ${cat === c.key ? 'cta-zolar font-bold' : 'bubble-glass'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => (carPin ? openCar() : parkHere())}
        aria-label={carPin ? 'Ver mi coche' : 'Marcar dónde aparqué'}
        className="absolute bottom-24 right-5 w-14 h-14 rounded-full text-2xl flex items-center justify-center"
        style={{
          zIndex: 900,
          background: 'rgba(28,20,32,0.92)',
          border: carPin ? '2.5px solid #00E0D1' : '1.5px solid rgba(255,255,255,0.25)',
          boxShadow: carPin ? '0 0 18px rgba(0,224,209,0.6), 0 6px 20px rgba(0,0,0,0.45)' : '0 6px 20px rgba(0,0,0,0.45)',
          opacity: carBusy ? 0.6 : 1,
        }}
      >
        {carBusy ? '📡' : '🚗'}
      </button>

      <AnimatePresence>
        {carSheet && carPin && (
          <motion.div
            className="absolute inset-x-0 bottom-0 px-4 pb-24"
            style={{ zIndex: 1000 }}
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            exit={{ y: '110%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div
              className="rounded-[28px] shadow-2xl backdrop-blur-xl relative overflow-hidden p-4"
              style={{
                background: 'rgba(28,20,32,0.94)',
                border: '1px solid rgba(0,224,209,0.4)',
                boxShadow: '0 -4px 40px rgba(0,224,209,0.3), 0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              <button
                onClick={() => setCarSheet(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bubble-glass text-white/80 text-sm z-10"
                aria-label="Cerrar"
              >
                ✕
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 shrink-0 rounded-full bubble-glass flex items-center justify-center text-2xl">
                  🚗
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold leading-tight">Tu coche</h3>
                  <p className="text-xs text-white/70 mt-0.5">
                    Aparcado {carAge(carPin)} · el pin se borra a las 12h
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end mt-3 gap-2">
                <button
                  onClick={removeCar}
                  className="bubble-glass rounded-full px-4 py-2 text-xs text-white/80"
                >
                  Quitar pin
                </button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${carPin.lat},${carPin.lon}&travelmode=walking`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cta-zolar rounded-full px-4 py-2 text-xs font-semibold"
                >
                  🚶 Llévame a él
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPract && (
          <motion.div
            className="absolute inset-x-0 bottom-0 px-4 pb-24"
            style={{ zIndex: 1000 }}
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            exit={{ y: '110%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div
              className="rounded-[28px] shadow-2xl backdrop-blur-xl relative overflow-hidden p-4"
              style={{
                background: 'rgba(28,20,32,0.94)',
                border: '1px solid rgba(255,201,74,0.4)',
                boxShadow: '0 -4px 40px rgba(255,201,74,0.3), 0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              <button
                onClick={() => setSelectedPract(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bubble-glass text-white/80 text-sm z-10"
                aria-label="Cerrar"
              >
                ✕
              </button>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 shrink-0 rounded-full bubble-glass overflow-hidden flex items-center justify-center text-xl">
                  {selectedPract.photo_url ? (
                    <img src={selectedPract.photo_url} alt="" className="w-full h-full object-cover"
                      onError={e => { e.currentTarget.style.display = 'none' }} />
                  ) : (
                    SKILL_EMOJI[selectedPract.skill] || '✨'
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold leading-tight">{selectedPract.name}</h3>
                    {selectedPract.featured && (
                      <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ background: 'rgba(255,201,74,0.25)', color: '#FFC94A' }}>
                        ⭐ Destacado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/70 mt-0.5">
                    {SKILL_EMOJI[selectedPract.skill]} {SKILL_LABEL[selectedPract.skill] || selectedPract.skill}
                    <span className="ml-2" style={{ color: '#FFC94A' }}>★ {Number(selectedPract.rating || 5).toFixed(1)}</span>
                  </p>
                </div>
              </div>
              {selectedPract.description && (
                <p className="text-xs text-white/80 mt-2 line-clamp-2">{selectedPract.description}</p>
              )}
              <div className="flex items-center justify-between mt-3 gap-2">
                <span className="text-[11px] text-white/60 truncate">
                  📍 {selectedPract.neighborhood || selectedPract.address || 'Madrid'}
                </span>
                <div className="flex gap-2 shrink-0">
                  {selectedPract.phone && (
                    <a href={`tel:${selectedPract.phone}`} className="bubble-glass rounded-full px-3 py-1.5 text-xs text-white/90">
                      📞
                    </a>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedPract.lat},${selectedPract.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cta-zolar rounded-full px-3 py-1.5 text-xs font-semibold"
                  >
                    Cómo llegar
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="absolute inset-x-0 bottom-0 px-4 pb-24"
            style={{ zIndex: 1000 }}
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            exit={{ y: '110%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div
              className="rounded-[28px] shadow-2xl backdrop-blur-xl relative overflow-hidden"
              style={{
                background: 'rgba(28,20,32,0.92)',
                border: '1px solid rgba(255,255,255,0.14)',
                boxShadow: `0 -4px 40px ${s.color}55, 0 20px 40px rgba(0,0,0,0.5)`,
              }}
            >
              {selected.image_url && (
                <div className="relative h-32 w-full">
                  <img
                    src={selected.image_url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={e => { e.currentTarget.parentElement.style.display = 'none' }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(28,20,32,0.95) 0%, rgba(28,20,32,0.25) 55%, transparent 100%)' }}
                  />
                  {/4sq|fsq|foursquare/i.test(selected.image_url) && (
                    <span className="absolute top-2 left-2 text-[9px] text-white/75 bg-black/45 rounded-full px-2 py-0.5">
                      📷 Foursquare
                    </span>
                  )}
                </div>
              )}

              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bubble-glass text-white/80 text-sm z-10"
                aria-label="Cerrar"
              >
                ✕
              </button>

              <div className="p-4" style={{ marginTop: selected.image_url ? '-2.75rem' : 0, position: 'relative' }}>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 bubble-glass rounded-full p-1.5">
                    <Mascot sign={selected.sign} size={58} />
                  </div>
                  <div className="min-w-0 pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <p className="text-xs font-semibold" style={{ color: s.soft, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                        {s.symbol} Plan muy {s.name}
                      </p>
                      {(selected.signs || []).filter(k => k !== selected.sign).map(k => {
                        const sk = SIGNS[k]
                        return (
                          <span
                            key={k}
                            title={sk.name}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
                            style={{
                              background: sk.color,
                              color: isLightColor(sk.color) ? '#2F2133' : '#fff',
                              boxShadow: `0 0 8px ${sk.color}88`,
                            }}
                          >
                            {sk.symbol}
                          </span>
                        )
                      })}
                    </div>
                    <h3 className="font-bold font-display leading-tight pr-6 text-sm" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                      {selected.title}
                    </h3>
                    {selected.event_date && (
                      <p className="text-xs text-zolar-rose/70 mt-0.5">
                        📅 {selected.event_date.slice(8, 10)}/{selected.event_date.slice(5, 7)}
                      </p>
                    )}
                  </div>
                </div>
                {selected.description && (
                  <p className="text-xs text-zolar-rose/80 mt-2 line-clamp-2">{truncate(selected.description)}</p>
                )}
                <div className="flex items-center justify-between mt-3 gap-3">
                  <span className="text-xs text-zolar-rose/60 truncate">
                    📍 {selected.neighborhood || selected.address || 'Madrid'}
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-semibold rounded-full px-4 py-2 cta-zolar"
                  >
                    Cómo llegar
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
