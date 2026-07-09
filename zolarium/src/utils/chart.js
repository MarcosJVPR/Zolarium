import { Origin, Horoscope } from 'circular-natal-horoscope-js'

const SIGN_MAP = {
  Aries: 'aries', Taurus: 'tauro', Gemini: 'geminis', Cancer: 'cancer',
  Leo: 'leo', Virgo: 'virgo', Libra: 'libra', Scorpio: 'escorpio',
  Sagittarius: 'sagitario', Capricorn: 'capricornio',
  Aquarius: 'acuario', Pisces: 'piscis',
}

export async function geocode(place) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`
  )
  const data = await res.json()
  if (!data.length) return null
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
}

export function computeChart({ date, time, lat, lon }) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = (time || '12:00').split(':').map(Number)

  const origin = new Origin({
    year,
    month: month - 1,
    date: day,
    hour,
    minute,
    latitude: lat,
    longitude: lon,
  })

  const horoscope = new Horoscope({
    origin,
    houseSystem: 'whole-sign',
    zodiac: 'tropical',
    aspectTypes: [],
    language: 'en',
  })

  const body = name =>
    SIGN_MAP[horoscope.CelestialBodies[name].Sign.label] || null

  return {
    sun: body('sun'),
    moon: body('moon'),
    mercury: body('mercury'),
    venus: body('venus'),
    mars: body('mars'),
    jupiter: body('jupiter'),
    saturn: body('saturn'),
    ascendant: SIGN_MAP[horoscope.Ascendant.Sign.label] || null,
    hasTime: Boolean(time),
  }
}
