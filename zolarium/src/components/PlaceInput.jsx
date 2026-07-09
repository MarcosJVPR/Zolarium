import { useState, useEffect, useRef } from 'react'

function cleanLabel(r) {
  const a = r.address || {}
  const city = a.city || a.town || a.village || a.municipality || r.name
  const region = a.state || a.province || ''
  const country = a.country || ''
  const parts = [city]
  if (region && region !== city) parts.push(region)
  if (country) parts.push(country)
  return parts.join(', ')
}

function isRegionResult(r) {
  const a = r.address || {}
  const city = a.city || a.town || a.village || a.municipality
  return !city && (r.type === 'administrative' || r.class === 'boundary') && a.state === r.name
}

export default function PlaceInput({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [searching, setSearching] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    if (selected || query.length < 3) {
      setResults([])
      return
    }

    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10&addressdetails=1&accept-language=es`
        )
        const data = await res.json()

        const seen = new Set()
        const unique = []
        for (const r of data) {
          if (isRegionResult(r)) continue
          const label = cleanLabel(r)
          if (!seen.has(label)) {
            seen.add(label)
            unique.push({ ...r, label })
          }
          if (unique.length === 5) break
        }

        setResults(unique)
      } catch {
        setResults([])
      }
      setSearching(false)
    }, 400)

    return () => clearTimeout(timer.current)
  }, [query, selected])

  const pick = r => {
    setSelected(r)
    setQuery(r.label)
    setResults([])
    onSelect({ lat: parseFloat(r.lat), lon: parseFloat(r.lon), name: r.label })
  }

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Valencia, España"
        value={query}
        onChange={e => {
          setQuery(e.target.value)
          setSelected(null)
          onSelect(null)
        }}
        className="w-full bg-white/10 border border-violet-400/30 rounded-xl p-3 text-white placeholder:text-violet-300/40"
      />

      {searching && (
        <p className="text-xs text-violet-300/50 mt-1">Buscando lugares...</p>
      )}

      {results.length > 0 && (
        <ul className="absolute z-20 top-full mt-1 w-full bg-[#2a1548] border border-violet-400/30 rounded-xl overflow-hidden shadow-2xl">
          {results.map(r => (
            <li key={r.place_id}>
              <button
                type="button"
                onClick={() => pick(r)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-violet-500/20 border-b border-violet-400/10 last:border-0"
              >
                📍 {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
