import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import SwipeCard from './SwipeCard'
import { fetchDeck, recordSwipe } from '../utils/api'

export default function PlanDeck({ sign, mode, onBack }) {
  const [deck, setDeck] = useState(null)
  const [exitDir, setExitDir] = useState('like')

  useEffect(() => {
    fetchDeck(sign, mode).then(setDeck).catch(() => setDeck([]))
  }, [sign, mode])

  const handleSwipe = action => {
    const current = deck[0]
    if (!current) return
    setExitDir(action)
    recordSwipe(current.id, action === 'like' ? 1 : 0)
    setDeck(d => d.slice(1))
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 h-[100dvh] flex flex-col">
      <button onClick={onBack} className="self-start text-zolar-rose/70 mb-4">
        ← Volver
      </button>

      <div className="relative flex-1 mb-6">
        {deck === null && (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="text-5xl animate-pulse">✨</div>
            <p className="text-zolar-rose/70">Consultando el cosmos...</p>
          </div>
        )}

        <AnimatePresence custom={exitDir}>
          {deck && deck.length > 0 && (
            <SwipeCard
              key={deck[0].id}
              plan={deck[0]}
              sign={sign}
              onSwipe={handleSwipe}
            />
          )}
        </AnimatePresence>

        {deck && deck.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3">
            <div className="text-5xl">🌙</div>
            <p className="text-zolar-rose/70">
              El cosmos no tiene más planes por ahora.
              <br />Vuelve pronto.
            </p>
          </div>
        )}
      </div>

      {deck && deck.length > 0 && (
        <div className="flex justify-center gap-8 pb-8">
          <button
            onClick={() => handleSwipe('dislike')}
            className="w-16 h-16 rounded-full bg-white/10 border border-red-400/50 text-2xl"
          >
            ✕
          </button>
          <button
            onClick={() => handleSwipe('like')}
            className="w-16 h-16 rounded-full text-2xl"
            style={{ background: 'linear-gradient(135deg, #F4913F, #9D7295)' }}
          >
            ❤
          </button>
        </div>
      )}
    </div>
  )
}
