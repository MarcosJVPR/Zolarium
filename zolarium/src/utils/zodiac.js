export const SIGNS = {
  aries: { name: 'Aries', symbol: '♈', element: 'fuego', modality: 'cardinal', color: '#FF3B30', soft: '#FF6B4A' },
  tauro: { name: 'Tauro', symbol: '♉', element: 'tierra', modality: 'fijo', color: '#1B4332', soft: '#2D6A4F' },
  geminis: { name: 'Géminis', symbol: '♊', element: 'aire', modality: 'mutable', color: '#FFF3B0', soft: '#FFE566' },
  cancer: { name: 'Cáncer', symbol: '♋', element: 'agua', modality: 'cardinal', color: '#1E90FF', soft: '#5FB0FF' },
  leo: { name: 'Leo', symbol: '♌', element: 'fuego', modality: 'fijo', color: '#A4161A', soft: '#C9262B' },
  virgo: { name: 'Virgo', symbol: '♍', element: 'tierra', modality: 'mutable', color: '#B7E4C7', soft: '#D8F3DC' },
  libra: { name: 'Libra', symbol: '♎', element: 'aire', modality: 'cardinal', color: '#FFD60A', soft: '#FFE566' },
  escorpio: { name: 'Escorpio', symbol: '♏', element: 'agua', modality: 'fijo', color: '#0B3D91', soft: '#1B5CC4' },
  sagitario: { name: 'Sagitario', symbol: '♐', element: 'fuego', modality: 'mutable', color: '#FFA3A3', soft: '#FFC4C4' },
  capricornio: { name: 'Capricornio', symbol: '♑', element: 'tierra', modality: 'cardinal', color: '#00B368', soft: '#2FD68F' },
  acuario: { name: 'Acuario', symbol: '♒', element: 'aire', modality: 'fijo', color: '#B8860B', soft: '#D9A521' },
  piscis: { name: 'Piscis', symbol: '♓', element: 'agua', modality: 'mutable', color: '#A5D8FF', soft: '#C9E8FF' },
}

export const ELEMENT_OPPOSITE = {
  fuego: 'agua',
  agua: 'fuego',
  tierra: 'aire',
  aire: 'tierra',
}

export function isLightColor(hex) {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 150
}

const CUTOFFS = [
  [1, 19, 'capricornio'], [2, 18, 'acuario'], [3, 20, 'piscis'],
  [4, 19, 'aries'], [5, 20, 'tauro'], [6, 20, 'geminis'],
  [7, 22, 'cancer'], [8, 22, 'leo'], [9, 22, 'virgo'],
  [10, 22, 'libra'], [11, 21, 'escorpio'], [12, 21, 'sagitario'],
  [12, 31, 'capricornio'],
]

export function sunSignFromDate(dateStr) {
  const d = new Date(dateStr)
  const month = d.getMonth() + 1
  const day = d.getDate()
  for (const [m, lastDay, sign] of CUTOFFS) {
    if (month < m || (month === m && day <= lastDay)) return sign
  }
  return 'capricornio'
}
