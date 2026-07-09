import logo from '../assets/logo.png'

export default function ZolariumZ({ sign, size = 48, withWordmark = false }) {
  return (
    <div className="flex items-center" style={{ gap: size * 0.08 }}>
      <img
        src={logo}
        alt="Zolarium"
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
        draggable={false}
      />
      {withWordmark && (
        <span
          className="font-display font-black"
          style={{ fontSize: size * 0.62, color: '#F4913F', lineHeight: 1 }}
        >
          olarium
        </span>
      )}
    </div>
  )
}
