

export const ARCHETYPE_KEYS = [
  'innocent', 'explorer', 'sage', 'hero', 'outlaw', 'magician',
  'lover', 'jester', 'caregiver', 'creator', 'ruler', 'everyman',
]

export const SIGN_ARCHETYPES = {
  aries:       { hero: 0.5, explorer: 0.3, outlaw: 0.2 },
  tauro:       { lover: 0.4, caregiver: 0.3, everyman: 0.3 },
  geminis:     { jester: 0.4, explorer: 0.3, sage: 0.3 },
  cancer:      { caregiver: 0.5, innocent: 0.3, lover: 0.2 },
  leo:         { hero: 0.35, creator: 0.35, ruler: 0.3 },
  virgo:       { sage: 0.4, caregiver: 0.3, everyman: 0.3 },
  libra:       { lover: 0.4, ruler: 0.3, everyman: 0.3 },
  escorpio:    { magician: 0.45, outlaw: 0.35, lover: 0.2 },
  sagitario:   { explorer: 0.45, sage: 0.3, jester: 0.25 },
  capricornio: { ruler: 0.45, hero: 0.3, sage: 0.25 },
  acuario:     { outlaw: 0.35, magician: 0.3, sage: 0.35 },
  piscis:      { innocent: 0.3, magician: 0.35, creator: 0.35 },
}

export const W_POINT = {
  sun: 0.30,
  moon: 0.25,
  ascendant: 0.20,
  venus: 0.10,
  mars: 0.08,
  mercury: 0.07,
}

export const W_POINT_SOLAR_FALLBACK = {
  sun: 0.45,
  moon: 0.30, 
  venus: 0.10,
  mars: 0.08,
  mercury: 0.07,
  ascendant: 0,
}

export const W_POINT_CITA = { venus: 0.6, sun: 0.4 }
export const W_POINT_SOLITARIO = { moon: 0.6, sun: 0.4 }


export const CATEGORY_ARCHETYPES = {
  'exposiciones':      { sage: 0.35, creator: 0.35, magician: 0.30 },
  'musica':            { lover: 0.30, jester: 0.30, creator: 0.40 },
  'teatro-danza':      { creator: 0.40, lover: 0.30, magician: 0.30 },
  'deporte':           { hero: 0.50, explorer: 0.30, everyman: 0.20 },
  'talleres':          { creator: 0.40, sage: 0.30, caregiver: 0.30 },
  'conferencias':      { sage: 0.60, ruler: 0.20, magician: 0.20 },
  'fiestas-populares': { everyman: 0.40, jester: 0.35, innocent: 0.25 },
  'cine':              { magician: 0.30, sage: 0.25, lover: 0.25, jester: 0.20 },
  'infantil-familiar': { innocent: 0.40, caregiver: 0.40, jester: 0.20 },
  'naturaleza-paseos': { explorer: 0.40, innocent: 0.30, caregiver: 0.30 },
  'monumentos':        { sage: 0.40, creator: 0.30, ruler: 0.30 },
  'mercadillos':       { everyman: 0.40, lover: 0.30, explorer: 0.30 },
  'templos':           { magician: 0.40, innocent: 0.30, sage: 0.30 },
}

export const CATEGORY_FALLBACK = { everyman: 0.5, explorer: 0.5 }

export const KEYWORD_DELTAS = [
  { pattern: /nocturn|underground/i, archetype: 'outlaw', delta: 0.10 },
  { pattern: /gratuit|barrio|vecinal/i, archetype: 'everyman', delta: 0.10 },
  { pattern: /meditaci|tarot|esoteric|astrolog/i, archetype: 'magician', delta: 0.15 },
  { pattern: /gastronom|cata|degustaci/i, archetype: 'lover', delta: 0.10 },
  { pattern: /solidari|benefic/i, archetype: 'caregiver', delta: 0.15 },
  { pattern: /competici|torneo|reto/i, archetype: 'hero', delta: 0.10 },
  { pattern: /familiar|ni[ñn]os/i, archetype: 'caregiver', delta: 0.10 },
  { pattern: /humor|comedia|improvisaci/i, archetype: 'jester', delta: 0.12 },
  { pattern: /vintage|artesan|tradicion/i, archetype: 'sage', delta: 0.08 },
]

export const AGE_BRACKETS = [
  { min: 18, max: 22, mult: { explorer: 1.30, jester: 1.20, hero: 1.15, ruler: 0.85 } },
  { min: 23, max: 27, mult: { hero: 1.20, lover: 1.20, explorer: 1.15, sage: 0.90 } },
  { min: 28, max: 31, mult: { ruler: 1.30, sage: 1.20, hero: 1.10, jester: 0.85, innocent: 0.85 } },
  { min: 32, max: 38, mult: { ruler: 1.15, caregiver: 1.15, creator: 1.10 } },
  { min: 39, max: 44, mult: { outlaw: 1.30, magician: 1.25, explorer: 1.15, ruler: 0.90, everyman: 0.90 } },
  { min: 45, max: 49, mult: { sage: 1.20, creator: 1.15, magician: 1.10 } },
  { min: 50, max: 56, mult: { caregiver: 1.25, sage: 1.20, innocent: 1.10 } },
  { min: 57, max: 63, mult: { sage: 1.30, ruler: 1.10, magician: 1.10, hero: 0.85 } },
  { min: 64, max: Infinity, mult: { sage: 1.30, innocent: 1.20, caregiver: 1.15, hero: 0.80 } },
]

export const NATAL_BONUS = {
  saturnSameAsSun: { archetype: 'ruler', mult: 1.05 },
  jupiterSameAsSun: { archetype: 'explorer', mult: 1.05 },
}

export const SCORE_WEIGHTS = { w1: 0.40, w2: 0.30, w3: 0.15, w4: 0.15 }
export const COLD_START_N = 30

export const CONTEXT = { proximityMidpointKm: 5 }

export const LEARNING = { eta: 0.08, thetaClip: 2.0, weeklyDecay: 0.98 }

export const BETA_PRIOR = { alpha: 5, beta: 5 }

export const SOCIAL_PROOF = { minVotesForPercent: 100, minSignVotesToShow: 30 }

export const DECK = { size: 20, explorationCount: 3, thompsonNoiseStd: 0.15, weakestCount: 4 }


export const PRACTICAL_FEATURE_SLOTS = {
  price_tier: ['0', '1', '2'],
  indoor: ['true', 'false'],
  time_slot: ['mañana', 'tarde', 'noche'],
  social_energy: ['solitario', 'pareja', 'grupo'],
  intensity: ['calmado', 'medio', 'activo'],
}


export const PRACTICAL_KEYWORD_RULES = {
  price_tier: [
    { pattern: /gratuit|entrada libre|acceso libre|sin coste/i, value: 0 },
  ],
  indoor: [
    { pattern: /aire libre|parque|jard[ií]n|paseo|exterior/i, value: false },
    { pattern: /museo|sala|teatro|auditorio|biblioteca|centro cultural/i, value: true },
  ],
  social_energy: [
    { pattern: /pareja|rom[aá]ntic/i, value: 'pareja' },
    { pattern: /individual|solo|a solas/i, value: 'solitario' },
    { pattern: /familiar|grupo|taller|comunit/i, value: 'grupo' },
  ],
  intensity: [
    { pattern: /deporte|adrenalina|baile|senderismo|activ/i, value: 'activo' },
    { pattern: /charla|conferencia|exposici[oó]n|lectura|meditaci/i, value: 'calmado' },
  ],
}
