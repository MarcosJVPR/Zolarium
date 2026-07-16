import { useEffect, useMemo, useState } from 'react'
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
  { key: 'musica', label: '🎵 Música' },
  { key: 'teatro-danza', label: '🎭 Teatro' },
  { key: 'cine', label: '🎬 Cine' },
  { key: 'exposiciones', label: '🎨 Expos' },
  { key: 'talleres', label: '🛠️ Talleres' },
  { key: 'deporte', label: '🏃 Deporte' },
  { key: 'fiestas-populares', label: '🎉 Fiestas' },
  { key: 'infantil-familiar', label: '🧸 Familia' },
  { key: 'mercadillos', label: '🧺 Mercadillos' },
]

const SIGN_KEYS = Object.keys(SIGNS)
const SIGN_VECTORS = SIGN_KEYS.map(sign =>
  ARCHETYPE_KEYS.map(k => SIGN_ARCHETYPES[sign][k] || 0)
)

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

function assignSigns(plans) {
  const sims = plans.map(p => SIGN_VECTORS.map(sv => cosine(sv, p.archetype_vector)))
  const means = SIGN_KEYS.map((_, si) => {
    let sum = 0
    for (const row of sims) sum += row[si]
    return sum / (sims.length || 1) || 1e-6
  })
  return plans.map((p, pi) => {
    if (p.sign_override && SIGNS[p.sign_override]) return { ...p, sign: p.sign_override }
    let best = 0
    let bestScore = -Infinity
    for (let si = 0; si < SIGN_KEYS.length; si++) {
      const score = sims[pi][si] / means[si]
      if (score > bestScore) {
        bestScore = score
        best = si
      }
    }
    return { ...p, sign: SIGN_KEYS[best] }
  })
}

function truncate(text, max = 150) {
  if (!text) return null
  if (text.length <= max) return text
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

const iconCache = {}
function signIcon(sign) {
  if (iconCache[sign]) return iconCache[sign]
  const s = SIGNS[sign]
  const textColor = isLightColor(s.color) ? '#2F2133' : '#fff'
  iconCache[sign] = L.divIcon({
    className: '',
    html: `<div style="width:34px;height:34px;border-radius:50%;background:${s.color};border:2px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;font-size:17px;color:${textColor};box-shadow:0 2px 10px rgba(0,0,0,0.45)">${s.symbol}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
  return iconCache[sign]
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

function ClusterLayer({ index, plans, onSelect }) {
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
    return (
      <Marker
        key={p.id}
        position={[lat, lng]}
        icon={signIcon(p.sign)}
        eventHandlers={{ click: () => onSelect(p) }}
      />
    )
  })
}

export default function MapView({ onBack }) {
  const [plans, setPlans] = useState([])
  const [selected, setSelected] = useState(null)
  const [cat, setCat] = useState('todos')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const today = new Date().toISOString().slice(0, 10)
    const [eventsRes, placesRes] = await Promise.all([
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
    ])
    const all = [...(eventsRes.data || []), ...(placesRes.data || [])]
      .map(p => ({ ...p, cat: p.subcats?.[1] || null }))
    setPlans(assignSigns(all))
  }

  const filtered = useMemo(
    () => (cat === 'todos' ? plans : plans.filter(p => p.cat === cat)),
    [plans, cat]
  )

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

  return (
    <div className="fixed inset-0" style={{ height: '100dvh' }}>
      <MapContainer
        center={[40.4168, -3.7038]}
        zoom={12}
        style={{ width: '100%', height: '100%', background: '#2F2133' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        <ClusterLayer index={index} plans={filtered} onSelect={setSelected} />
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
        <div className="flex gap-2 overflow-x-auto px-5 pt-3 pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATS.map(c => (
            <button
              key={c.key}
              onClick={() => {
                setCat(c.key)
                setSelected(null)
              }}
              className={`shrink-0 text-sm rounded-full px-4 py-2 text-white transition-all ${cat === c.key ? 'cta-zolar font-bold' : 'bubble-glass'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="absolute inset-x-0 bottom-0 px-4 pb-6"
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
                    <p className="text-xs mb-0.5 font-semibold" style={{ color: s.soft, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                      {s.symbol} Plan muy {s.name}
                    </p>
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
