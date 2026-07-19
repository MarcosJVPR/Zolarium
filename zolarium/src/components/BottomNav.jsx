const LEFT = [
  { id: 'planes', label: 'Planes', icon: 'sparkle' },
  { id: 'mapa', label: 'Mapa', icon: 'map' },
]

const RIGHT = [
  { id: 'feed', label: 'Feed', icon: 'comet' },
  { id: 'menu', label: 'Menú', icon: 'grid' },
]

function Icon({ name, size = 22 }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const icons = {
    sparkle: <path {...p} d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9zM19 3.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />,
    map: <><path {...p} d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path {...p} d="M9 4v14M15 6v14" /></>,
    comet: <><circle {...p} cx="16" cy="8" r="3.4" /><path {...p} d="M13.3 10.7L4.5 19.5M14.6 13.2L9.2 18.6M11 9.8L5.4 15.4" opacity="0.75" /></>,
    grid: <><rect {...p} x="4" y="4" width="7" height="7" rx="2" /><rect {...p} x="13" y="4" width="7" height="7" rx="2" /><rect {...p} x="4" y="13" width="7" height="7" rx="2" /><rect {...p} x="13" y="13" width="7" height="7" rx="2" /></>,
    sprout: <><path {...p} d="M12 21v-7" /><path {...p} d="M12 14c0-4.2-3-6.4-7.2-6.4C4.8 11.8 7.8 14 12 14z" /><path {...p} d="M12 14c0-4.2 3-6.4 7.2-6.4C19.2 11.8 16.2 14 12 14z" /></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {icons[name]}
    </svg>
  )
}

function Tab({ tab, active, onSelect }) {
  const isActive = active === tab.id
  return (
    <button
      onClick={() => onSelect(tab.id)}
      aria-label={tab.label}
      className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 transition-all ${isActive ? 'cta-zolar' : ''}`}
      style={isActive ? undefined : { color: 'rgba(255,255,255,0.55)' }}
    >
      <Icon name={tab.icon} />
      <span className={`text-[10px] ${isActive ? 'font-bold text-white' : ''}`}>{tab.label}</span>
    </button>
  )
}

export default function BottomNav({ active, onSelect }) {
  return (
    <div className="fixed bottom-0 inset-x-0" style={{ zIndex: 1200 }}>
      <div className="max-w-md mx-auto px-4 pb-4">
        <nav
          className="relative flex justify-between items-center rounded-[26px] px-3 py-2"
          style={{
            background: 'rgba(20,14,27,0.88)',
            border: '1px solid rgba(255,255,255,0.14)',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 -6px 30px rgba(0,0,0,0.35), 0 10px 30px rgba(138,43,226,0.18)',
          }}
        >
          <div className="flex flex-1 justify-around">
            {LEFT.map(t => (
              <Tab key={t.id} tab={t} active={active} onSelect={onSelect} />
            ))}
          </div>

          <div className="w-16 shrink-0" />

          <div className="flex flex-1 justify-around">
            {RIGHT.map(t => (
              <Tab key={t.id} tab={t} active={active} onSelect={onSelect} />
            ))}
          </div>

          <button
            onClick={() => onSelect('garden')}
            aria-label="Jardín zodiacal"
            className="absolute left-1/2 -translate-x-1/2 -top-5 w-16 h-16 rounded-full flex flex-col items-center justify-center text-white"
            style={{
              background: 'linear-gradient(135deg, #00E0D1 0%, #8A2BE2 80%)',
              border: '2.5px solid rgba(255,255,255,0.35)',
              boxShadow: '0 0 24px rgba(0,224,209,0.5), 0 10px 28px rgba(138,43,226,0.5)',
            }}
          >
            <Icon name="sprout" size={26} />
            <span className="text-[9px] font-bold -mt-0.5">Jardín</span>
          </button>
        </nav>
      </div>
    </div>
  )
}
