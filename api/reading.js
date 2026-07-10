const SIGN_NAMES = {
  aries: 'Aries', tauro: 'Tauro', geminis: 'Géminis', cancer: 'Cáncer',
  leo: 'Leo', virgo: 'Virgo', libra: 'Libra', escorpio: 'Escorpio',
  sagitario: 'Sagitario', capricornio: 'Capricornio', acuario: 'Acuario', piscis: 'Piscis',
}

function buildPrompt(chart) {
  const points = [
    chart.sun && `Sol en ${SIGN_NAMES[chart.sun]}`,
    chart.moon && `Luna en ${SIGN_NAMES[chart.moon]}`,
    chart.ascendant && `Ascendente en ${SIGN_NAMES[chart.ascendant]}`,
    chart.venus && `Venus en ${SIGN_NAMES[chart.venus]}`,
    chart.mars && `Marte en ${SIGN_NAMES[chart.mars]}`,
    chart.mercury && `Mercurio en ${SIGN_NAMES[chart.mercury]}`,
    chart.jupiter && `Júpiter en ${SIGN_NAMES[chart.jupiter]}`,
    chart.saturn && `Saturno en ${SIGN_NAMES[chart.saturn]}`,
  ].filter(Boolean).join(', ')

  return `Eres un astrólogo con formación junguiana. Con esta carta natal: ${points}. Escribe una lectura personal en español, cercana pero seria, de unos 4 párrafos cortos: (1) identidad central a partir del Sol y el Ascendente, (2) vida emocional a partir de la Luna, (3) una tensión o sombra que integrar, (4) un cierre inspirador. Sin títulos de sección ni markdown, solo prosa fluida.`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Falta token' })

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: ANON_KEY },
  })
  if (!userRes.ok) return res.status(401).json({ error: 'Token inválido' })
  const user = await userRes.json()

  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=chart,ai_reading`,
    { headers: { Authorization: `Bearer ${token}`, apikey: ANON_KEY } }
  )
  const profiles = await profileRes.json()
  const profile = profiles?.[0]

  if (!profile?.chart) return res.status(400).json({ error: 'Perfil sin carta astral' })

  if (profile.ai_reading) {
    return res.status(200).json({ reading: profile.ai_reading, cached: true })
  }

  const prompt = buildPrompt(profile.chart)

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  )

  if (!geminiRes.ok) {
    const errText = await geminiRes.text()
    return res.status(502).json({ error: 'Error de Gemini: ' + errText })
  }

  const geminiData = await geminiRes.json()
  const reading = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
  if (!reading) return res.status(502).json({ error: 'Respuesta vacía de Gemini' })

  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: ANON_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ ai_reading: reading, ai_reading_at: new Date().toISOString() }),
  })

  return res.status(200).json({ reading, cached: false })
}
