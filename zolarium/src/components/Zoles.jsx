import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Mascot from './Mascot'
import { SIGNS } from '../utils/zodiac'
import { supabase } from '../utils/supabase'
import { recordSwipe } from '../utils/api'

const CORAL = '#FF7F50'

const MOODS = [
  { state: 'feliz', label: '✨ Radiante' },
  { state: 'neutral', label: '😌 En calma' },
  { state: 'come', label: '🍜 De antojos' },
  { state: 'duerme', label: '😴 Sin batería' },
]

const POKE_EMOJIS = ['💜', '✨', '🍀', '🔥']

const KIND_EMOJI = { prop: '🌿', effect: '✨', skin: '🎭', fondo: '🖼️', platform: '🏝️' }

const ERROR_MESSAGES = {
  CODE_NOT_FOUND: 'Ese código no existe. Revísalo.',
  SELF_ADD: 'Ese es tu propio código 😅',
  FRIEND_LIMIT: 'Ya tienes 5 Zoles, el máximo del plan gratuito.',
}

const GIFT_ERRORS = {
  NO_STARDUST: 'No tienes suficiente polvo estelar ⭐',
  ALREADY_OWNED: 'Ya tiene ese artículo en su jardín',
  NOT_FRIENDS: 'Solo puedes regalar a tus Zoles',
  ITEM_NOT_FOUND: 'Ese artículo ya no está disponible',
}

function inviteUrl(code) {
  return `${window.location.origin}/invite/${code}`
}

export default function Zoles({ user, onBack }) {
  const [me, setMe] = useState(null)
  const [friends, setFriends] = useState(null)
  const [moodText, setMoodText] = useState('')
  const [nameDraft, setNameDraft] = useState('')
  const [code, setCode] = useState('')
  const [addError, setAddError] = useState(null)
  const [addBusy, setAddBusy] = useState(false)
  const [pokeTarget, setPokeTarget] = useState(null)
  const [toast, setToast] = useState(null)
  const [showQr, setShowQr] = useState(false)
  const [invites, setInvites] = useState([])
  const [catalog, setCatalog] = useState([])
  const [stardust, setStardust] = useState(0)
  const [giftFor, setGiftFor] = useState(null)
  const [giftBusy, setGiftBusy] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const uid = session.user.id
    const [profileRes, friendsRes, pokesRes, invitesRes, giftsRes, catalogRes] = await Promise.all([
      supabase.from('profiles').select('friend_code, display_name, mood, stardust').eq('id', uid).maybeSingle(),
      supabase.rpc('get_zoles'),
      supabase.from('pokes').select('*').eq('to_user', uid).eq('seen', false),
      supabase.from('invites').select('id, from_user, seen, created_at, plan:plans(id, title, emoji, neighborhood, event_date)').eq('to_user', uid).eq('seen', false).order('created_at', { ascending: false }).limit(12),
      supabase.from('gifts').select('id, from_user, item_id').eq('to_user', uid).eq('seen', false),
      supabase.from('garden_catalog').select('id, name, price, kind').eq('active', true).order('sort'),
    ])
    setMe({ id: uid, ...(profileRes.data || {}) })
    setMoodText(profileRes.data?.mood?.text || '')
    setNameDraft(profileRes.data?.display_name || '')
    setStardust(profileRes.data?.stardust || 0)
    setFriends(friendsRes.data || [])
    setInvites((invitesRes.data || []).filter(i => i.plan))
    setCatalog(catalogRes.data || [])

    const byName = id => (friendsRes.data || []).find(f => f.id === id)?.display_name || 'Un Zol'
    const parts = []
    const unseenPokes = pokesRes.data || []
    if (unseenPokes.length) {
      parts.push(unseenPokes.map(p => `${p.emoji} de ${byName(p.from_user)}`).join(' · '))
      await supabase.from('pokes').update({ seen: true }).eq('to_user', uid).eq('seen', false)
    }
    const unseenGifts = giftsRes.data || []
    if (unseenGifts.length) {
      const itemName = id => (catalogRes.data || []).find(c => c.id === id)?.name || 'un regalo'
      parts.push(unseenGifts.map(g => `🎁 ${byName(g.from_user)} te ha regalado ${itemName(g.item_id)}`).join(' · '))
      await supabase.from('gifts').update({ seen: true }).eq('to_user', uid).eq('seen', false)
    }
    if (parts.length) showToast(parts.join(' · '))
  }

  async function refreshFriends() {
    const { data } = await supabase.rpc('get_zoles')
    setFriends(data || [])
  }

  function showToast(text) {
    setToast(text)
    setTimeout(() => setToast(null), 5000)
  }

  async function saveMood(state) {
    if (!me) return
    const mood = { state, text: moodText.slice(0, 40), updated_at: new Date().toISOString() }
    setMe(m => ({ ...m, mood }))
    await supabase.from('profiles').update({ mood }).eq('id', me.id)
  }

  async function saveName() {
    if (!me || !nameDraft.trim()) return
    const display_name = nameDraft.trim().slice(0, 24)
    setMe(m => ({ ...m, display_name }))
    await supabase.from('profiles').update({ display_name }).eq('id', me.id)
    showToast('Nombre guardado ✨')
  }

  async function toggleRole(f) {
    const next = f.role === 'pareja' ? 'amigo' : 'pareja'
    const { error } = await supabase.rpc('set_friend_role', { p_friend: f.id, p_role: next })
    if (error) {
      showToast('No se pudo cambiar el rol')
      return
    }
    showToast(next === 'pareja' ? `💕 ${f.display_name || 'Tu Zol'} ahora es tu pareja` : 'Rol cambiado a amigo')
    refreshFriends()
  }

  async function addFriend(e) {
    e.preventDefault()
    if (!code.trim()) return
    setAddBusy(true)
    setAddError(null)
    const { data, error } = await supabase.rpc('add_friend_by_code', { p_code: code.trim() })
    setAddBusy(false)
    if (error) {
      const key = Object.keys(ERROR_MESSAGES).find(k => error.message.includes(k))
      setAddError(key ? ERROR_MESSAGES[key] : 'No se pudo añadir. Inténtalo de nuevo.')
      return
    }
    setCode('')
    showToast(`${data?.display_name || 'Tu nuevo Zol'} añadido 💜`)
    refreshFriends()
  }

  async function sendPoke(friendId, emoji) {
    if (!me) return
    setPokeTarget(null)
    const { error } = await supabase.from('pokes').insert({ from_user: me.id, to_user: friendId, emoji })
    if (!error) showToast(`${emoji} enviado`)
  }

  async function sendGift(item) {
    if (!giftFor || giftBusy) return
    setGiftBusy(true)
    const { data, error } = await supabase.rpc('send_gift', { p_to: giftFor.id, p_item: item.id })
    setGiftBusy(false)
    if (error) {
      const key = Object.keys(GIFT_ERRORS).find(k => error.message.includes(k))
      showToast(key ? GIFT_ERRORS[key] : 'No se pudo enviar el regalo')
      return
    }
    setStardust(s => Math.max(0, s - (data?.price || item.price)))
    const name = giftFor.display_name || SIGNS[giftFor.sun]?.name || 'tu Zol'
    setGiftFor(null)
    showToast(`🎁 ${data?.item || item.name} enviado a ${name} (−${data?.price ?? item.price}⭐)`)
  }

  async function acceptInvite(inv) {
    recordSwipe(inv.plan.id, 1)
    setInvites(list => list.filter(i => i.id !== inv.id))
    await supabase.from('invites').update({ seen: true }).eq('id', inv.id)
    showToast(`💜 "${inv.plan.title}" guardado en tus planes`)
  }

  async function dismissInvite(inv) {
    setInvites(list => list.filter(i => i.id !== inv.id))
    await supabase.from('invites').update({ seen: true }).eq('id', inv.id)
  }

  async function share() {
    if (!me?.friend_code) return
    const url = inviteUrl(me.friend_code)
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Únete a mi Zolarium', text: `Conéctate conmigo en Zolarium ✨ Mi código: ${me.friend_code}`, url })
      } catch { }
    } else {
      await navigator.clipboard.writeText(url)
      showToast('Enlace copiado 📋')
    }
  }

  const myMoodState = me?.mood?.state || 'neutral'
  const giftName = id => (friends || []).find(f => f.id === id)?.display_name || 'Un Zol'

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-12">
      <button onClick={onBack} className="inline-flex items-center mb-4 text-sm text-white/90 bubble-glass rounded-full px-4 py-2">
        ← Volver
      </button>

      <h2 className="text-2xl font-bold text-center font-display mb-1">Zoles</h2>
      <p className="text-center text-zolar-rose/70 text-sm mb-6">Tus amigos del cosmos</p>

      {friends === null ? (
        <p className="text-center text-zolar-rose/60">Consultando el cosmos...</p>
      ) : friends.length === 0 ? (
        <div className="card-bento p-5 text-center mb-6" style={{ backgroundImage: 'linear-gradient(135deg, rgba(138,43,226,0.3), rgba(255,45,161,0.25))' }}>
          <p className="text-sm text-white/85">Aún no tienes Zoles. Comparte tu código y conecta hasta 5 amigos gratis.</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
          {friends.map(f => {
            const fs = SIGNS[f.sun] || SIGNS.aries
            const pareja = f.role === 'pareja'
            return (
              <div key={f.id} className="shrink-0 w-24 flex flex-col items-center text-center relative">
                <button
                  onClick={() => setPokeTarget(pokeTarget === f.id ? null : f.id)}
                  className="bubble-glass bubble-mascot rounded-full p-2"
                  style={pareja ? { boxShadow: `0 0 0 3px ${CORAL}, 0 10px 30px rgba(255,127,80,0.4)` } : undefined}
                >
                  <Mascot sign={f.sun || 'aries'} size={64} state={f.mood?.state || 'neutral'} />
                </button>
                <p className="text-xs font-semibold mt-2 truncate w-full">
                  {pareja ? '💕 ' : ''}{f.display_name || fs.name}
                </p>
                <p className="text-[10px] text-zolar-rose/70 truncate w-full">
                  {f.mood?.text || MOODS.find(m => m.state === (f.mood?.state || 'neutral'))?.label}
                </p>
                <button
                  onClick={() => toggleRole(f)}
                  className="text-[10px] mt-1 rounded-full px-2 py-0.5 bubble-glass"
                  style={pareja ? { color: CORAL, fontWeight: 700 } : { color: 'rgba(255,255,255,0.7)' }}
                >
                  {pareja ? '💔 Quitar pareja' : '💕 Hacer pareja'}
                </button>
                <button
                  onClick={() => setGiftFor(f)}
                  className="text-[10px] mt-1 rounded-full px-2 py-0.5 bubble-glass text-white/80"
                >
                  🎁 Regalar
                </button>
                <AnimatePresence>
                  {pokeTarget === f.id && (
                    <motion.div
                      className="absolute -bottom-10 bubble-glass rounded-full px-2 py-1 flex gap-1 z-10"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {POKE_EMOJIS.map(em => (
                        <button key={em} onClick={() => sendPoke(f.id, em)} className="text-lg">
                          {em}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}

      {invites.length > 0 && (
        <div className="card-zolar rounded-3xl p-5 mb-4">
          <h3 className="font-bold mb-3">✉️ Invitaciones</h3>
          <div className="flex flex-col gap-3">
            {invites.map(inv => (
              <div key={inv.id} className="bubble-glass rounded-2xl p-3">
                <div className="flex items-start gap-2">
                  <span className="text-xl shrink-0">{inv.plan.emoji || '✨'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight">{inv.plan.title}</p>
                    <p className="text-[11px] text-zolar-rose/70 mt-0.5">
                      {giftName(inv.from_user)} te invita
                      {inv.plan.event_date && ` · 📅 ${inv.plan.event_date.slice(8, 10)}/${inv.plan.event_date.slice(5, 7)}`}
                      {inv.plan.neighborhood && ` · 📍 ${inv.plan.neighborhood}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => acceptInvite(inv)}
                    className="flex-1 cta-zolar rounded-full py-1.5 text-xs font-semibold"
                  >
                    💾 Guardar plan
                  </button>
                  <button
                    onClick={() => dismissInvite(inv)}
                    className="bubble-glass rounded-full px-4 py-1.5 text-xs text-white/70"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card-zolar rounded-3xl p-5 mb-4">
        <h3 className="font-bold mb-3">Tu estado</h3>
        <div className="flex justify-center mb-3">
          <Mascot sign={user.chart.sun} size={84} state={myMoodState} />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {MOODS.map(m => (
            <button
              key={m.state}
              onClick={() => saveMood(m.state)}
              className={`rounded-full px-3 py-2 text-sm ${myMoodState === m.state ? 'cta-zolar font-bold' : 'bubble-glass text-white/85'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          maxLength={40}
          placeholder="Cuenta algo corto (opcional)"
          value={moodText}
          onChange={e => setMoodText(e.target.value)}
          onBlur={() => me?.mood?.state && saveMood(me.mood.state)}
          className="w-full bubble-glass rounded-full px-4 py-2 text-sm bg-transparent outline-none placeholder:text-white/40"
        />
      </div>

      <div className="card-zolar rounded-3xl p-5 mb-4">
        <h3 className="font-bold mb-3">Tu código Zol</h3>
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="font-display font-black text-2xl tracking-widest" style={{ color: '#FF8A00' }}>
            {me?.friend_code || '······'}
          </span>
          <div className="flex gap-2">
            <button onClick={share} className="cta-zolar rounded-full px-4 py-2 text-sm font-semibold">
              Compartir
            </button>
            <button onClick={() => setShowQr(q => !q)} className="bubble-glass rounded-full px-4 py-2 text-sm text-white/85">
              QR
            </button>
          </div>
        </div>
        {showQr && me?.friend_code && (
          <div className="flex justify-center py-2">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&bgcolor=1c1420&color=FBE4E9&data=${encodeURIComponent(inviteUrl(me.friend_code))}`}
              alt="QR de invitación"
              width={180}
              height={180}
              className="rounded-2xl"
            />
          </div>
        )}
        <div className="mt-3">
          <p className="text-xs text-zolar-rose/70 mb-2">Tu nombre para tus Zoles</p>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={24}
              placeholder="Tu nombre"
              value={nameDraft}
              onChange={e => setNameDraft(e.target.value)}
              className="flex-1 bubble-glass rounded-full px-4 py-2 text-sm bg-transparent outline-none placeholder:text-white/40"
            />
            <button onClick={saveName} className="bubble-glass rounded-full px-4 py-2 text-sm text-white/85">
              Guardar
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={addFriend} className="card-zolar rounded-3xl p-5">
        <h3 className="font-bold mb-3">Añadir un Zol</h3>
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={6}
            placeholder="Código (6 letras)"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            className="flex-1 bubble-glass rounded-full px-4 py-2 text-sm bg-transparent outline-none placeholder:text-white/40 uppercase tracking-widest"
          />
          <button type="submit" disabled={addBusy || code.length < 6} className="cta-zolar rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-50">
            {addBusy ? '...' : 'Añadir'}
          </button>
        </div>
        {addError && <p className="text-sm text-red-400 mt-2">{addError}</p>}
        <p className="text-[11px] text-zolar-rose/50 mt-3">Hasta 5 Zoles en el plan gratuito.</p>
      </form>

      <AnimatePresence>
        {giftFor && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setGiftFor(null)} />
            <motion.div
              className="relative w-full max-w-md rounded-t-[28px] p-5 pb-8"
              style={{ background: 'rgba(28,20,32,0.97)', border: '1px solid rgba(255,255,255,0.14)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">
                  🎁 Regalo para {giftFor.display_name || SIGNS[giftFor.sun]?.name || 'tu Zol'}
                </h3>
                <span className="bubble-glass rounded-full px-3 py-1 text-xs text-white/90">
                  Tienes {stardust}⭐
                </span>
              </div>
              <p className="text-[11px] text-zolar-rose/60 mb-3">
                El regalo aparecerá directamente en su jardín zodiacal.
              </p>
              <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
                {catalog.map(item => {
                  const affordable = stardust >= item.price
                  return (
                    <button
                      key={item.id}
                      onClick={() => affordable && sendGift(item)}
                      disabled={!affordable || giftBusy}
                      className={`bubble-glass rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-left ${affordable ? '' : 'opacity-40'}`}
                    >
                      <span className="text-sm text-white/90">
                        {KIND_EMOJI[item.kind] || '✨'} {item.name}
                      </span>
                      <span className="text-sm font-bold shrink-0" style={{ color: '#FF8A00' }}>
                        {item.price}⭐
                      </span>
                    </button>
                  )
                })}
                {catalog.length === 0 && (
                  <p className="text-center text-sm text-zolar-rose/60 py-4">La tienda cósmica está vacía.</p>
                )}
              </div>
              <button
                onClick={() => setGiftFor(null)}
                className="w-full mt-4 bubble-glass rounded-full py-2.5 text-sm text-white/80"
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bubble-glass rounded-full px-5 py-3 text-sm text-white z-50 max-w-[90vw] text-center"
            style={{ background: 'rgba(28,20,32,0.9)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
