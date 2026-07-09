const KEY = 'zolarium'

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function getUser() {
  return read().user || null
}

export function saveUser(user) {
  const data = read()
  data.user = user
  write(data)
}

export function getInteractions() {
  const data = read()
  return data.interactions || { liked: [], dislikes: {}, blocked: [] }
}

export function likePlan(id) {
  const data = read()
  const it = data.interactions || { liked: [], dislikes: {}, blocked: [] }
  if (!it.liked.includes(id)) it.liked.push(id)
  data.interactions = it
  write(data)
}

export function dislikePlan(id) {
  const data = read()
  const it = data.interactions || { liked: [], dislikes: {}, blocked: [] }
  it.dislikes[id] = (it.dislikes[id] || 0) + 1
  if (it.dislikes[id] >= 3 && !it.blocked.includes(id)) it.blocked.push(id)
  data.interactions = it
  write(data)
}

export function unlikePlan(id) {
  const data = read()
  const it = data.interactions || { liked: [], dislikes: {}, blocked: [] }
  it.liked = it.liked.filter(x => x !== id)
  data.interactions = it
  write(data)
}

export function resetAll() {
  localStorage.removeItem(KEY)
}
