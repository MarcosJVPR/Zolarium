import { useState } from 'react'
import { motion } from 'framer-motion'
import { sunSignFromDate, SIGNS } from '../utils/zodiac'
import { computeChart } from '../utils/chart'
import { saveUser } from '../utils/storage'
import PlaceInput from './PlaceInput'
import ZolariumZ from './ZolariumZ'

export default function Onboarding({ onComplete }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [coords, setCoords] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const preview = date ? sunSignFromDate(date) : null

  const submit = () => {
    if (!date) return
    setLoading(true)
    setError('')

    let chart = { sun: sunSignFromDate(date), hasTime: false }

    try {
      if (coords) {
        chart = computeChart({ date, time, lat: coords.lat, lon: coords.lon })
      }
    } catch {
      setError('El cálculo completo falló, usamos solo tu signo solar.')
    }

    const user = { birth: { date, time, place: coords?.name || '' }, chart }
    saveUser(user)
    setLoading(false)
    onComplete(user)
  }

  return (
    <motion.div
      className="max-w-md mx-auto px-6 pt-14 flex flex-col gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-center flex flex-col items-center">
        <ZolariumZ sign={preview} size={84} withWordmark />
        <p className="text-zolar-rose/80 mt-3 italic">Planes a la carta astral</p>
      </div>

      <label className="flex flex-col gap-1 text-sm text-zolar-rose/90">
        Fecha de nacimiento
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="card-zolar rounded-xl p-3 text-white"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-zolar-rose/90">
        Hora de nacimiento (necesaria para tu ascendente)
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          className="card-zolar rounded-xl p-3 text-white"
        />
      </label>

      <div className="flex flex-col gap-1 text-sm text-zolar-rose/90">
        Lugar de nacimiento (escribe y elige de la lista)
        <PlaceInput onSelect={setCoords} />
      </div>

      {preview && (
        <div className="text-center text-zolar-rose/90">
          Tu signo solar:{' '}
          <span className="font-bold" style={{ color: SIGNS[preview].soft }}>
            {SIGNS[preview].symbol} {SIGNS[preview].name}
          </span>
        </div>
      )}

      {error && <p className="text-center text-sm text-zolar-orange">{error}</p>}

      <button
        onClick={submit}
        disabled={!date || loading}
        className="rounded-full py-3 font-bold text-white disabled:opacity-40"
        style={{ background: 'linear-gradient(90deg, #F4913F, #9D7295)' }}
      >
        {loading ? 'Consultando el cosmos...' : 'Ver mi destino'}
      </button>
    </motion.div>
  )
}
