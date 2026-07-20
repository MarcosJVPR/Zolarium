import { useState } from 'react'

const TABS = [
  { id: 'privacidad', label: 'Privacidad' },
  { id: 'terminos', label: 'Términos' },
  { id: 'aviso', label: 'Aviso legal' },
]

const UPDATED = '20 de julio de 2026'

function H({ children }) {
  return <h3 className="font-bold mt-5 mb-1.5">{children}</h3>
}

function P({ children }) {
  return <p className="text-sm text-zolar-rose/85 leading-relaxed mb-2">{children}</p>
}

export default function Legal({ onBack }) {
  const [tab, setTab] = useState('privacidad')

  return (
    <div className="max-w-md mx-auto px-6 pt-8 pb-16">
      <button onClick={onBack} className="inline-flex items-center mb-4 text-sm text-white/90 bubble-glass rounded-full px-4 py-2">
        ← Volver
      </button>

      <h2 className="text-2xl font-bold text-center font-display mb-4">Legal</h2>

      <div className="flex gap-2 justify-center mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm ${tab === t.id ? 'cta-zolar font-bold' : 'bubble-glass text-white/80'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card-zolar rounded-3xl p-5">
        <p className="text-xs text-zolar-rose/50 mb-3">Última actualización: {UPDATED}</p>

        {tab === 'privacidad' && (
          <div>
            <H>1. Responsable del tratamiento</H>
            <P>[NOMBRE Y APELLIDOS], con NIF [NIF], correo de contacto [EMAIL DE CONTACTO], es el responsable del tratamiento de los datos personales recogidos a través de Zolarium (zolarium.vercel.app).</P>

            <H>2. Qué datos tratamos</H>
            <P>Cuenta: dirección de correo electrónico. Perfil astral: fecha, hora y lugar de nacimiento, que tú introduces voluntariamente. Uso de la app: tus reacciones a planes (me gusta / paso), planes guardados, estado de tu mascota virtual y saldo de polvo estelar. Social: nombre visible, estado de ánimo, amistades, invitaciones, toques y regalos entre usuarios conectados. Ubicación: solo si la autorizas, se usa puntualmente para ordenar planes por cercanía o marcar dónde aparcaste; el pin del coche se guarda únicamente en tu dispositivo y nunca en nuestros servidores.</P>

            <H>3. Para qué y con qué base legal</H>
            <P>Prestarte el servicio y personalizar tus recomendaciones (ejecución del contrato, art. 6.1.b RGPD); generar lecturas y mensajes personalizados con IA a partir de tu carta astral (consentimiento, art. 6.1.a, que otorgas al introducir tus datos de nacimiento); estadísticas agregadas y anónimas por signo (interés legítimo, art. 6.1.f).</P>

            <H>4. Con quién compartimos datos</H>
            <P>Usamos encargados de tratamiento para operar: Supabase (base de datos y autenticación), Vercel (alojamiento), Google (Gemini, generación de lecturas: recibe tu carta astral sin tu email), Foursquare (fotografías de lugares), CARTO y OpenStreetMap (mapas). No vendemos tus datos ni los cedemos a terceros con fines publicitarios. Algunos proveedores pueden estar fuera del EEE; en tal caso operan bajo Cláusulas Contractuales Tipo u otros mecanismos del Capítulo V del RGPD.</P>

            <H>5. Conservación</H>
            <P>Conservamos tus datos mientras mantengas tu cuenta. Si la eliminas, borramos tu perfil y datos asociados en un plazo máximo de 30 días, salvo obligación legal de conservación.</P>

            <H>6. Tus derechos</H>
            <P>Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a [EMAIL DE CONTACTO]. También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</P>

            <H>7. Edad mínima</H>
            <P>Zolarium está dirigida a mayores de 16 años. Si detectamos cuentas de menores de esa edad, serán eliminadas.</P>
          </div>
        )}

        {tab === 'terminos' && (
          <div>
            <H>1. El servicio</H>
            <P>Zolarium es una aplicación de descubrimiento de planes y ocio en Madrid con temática astrológica. Los contenidos astrológicos (horóscopos, lecturas, compatibilidades y consejos) tienen una finalidad exclusivamente lúdica y de entretenimiento, y no constituyen consejo médico, psicológico, financiero ni de ningún otro tipo.</P>

            <H>2. Tu cuenta</H>
            <P>Eres responsable de la veracidad de los datos que introduces y del uso de tu cuenta. Nos reservamos el derecho a suspender cuentas que abusen del servicio, manipulen la economía virtual o dañen a otros usuarios.</P>

            <H>3. Polvo estelar y compras</H>
            <P>El polvo estelar (⭐) es una moneda virtual sin valor monetario real, no transferible fuera de la app y no reembolsable en dinero. Puede obtenerse gratuitamente con el uso diario o, cuando esté disponible, adquirirse mediante pago. Los artículos del jardín son bienes digitales de uso dentro de Zolarium. El derecho de desistimiento en contenidos digitales de ejecución inmediata se pierde al ejecutarse la compra, conforme al art. 103 m) del RDL 1/2007, lo que aceptas antes de comprar.</P>

            <H>4. Suscripciones</H>
            <P>Las funciones ampliadas (como superar el límite de 5 Zoles) pueden requerir una suscripción mensual. Podrás cancelarla en cualquier momento con efecto al final del periodo ya pagado.</P>

            <H>5. Contenido y conducta</H>
            <P>Los nombres visibles y estados no pueden contener contenido ilegal, ofensivo o que suplante a terceros. Los datos de planes proceden de fuentes públicas y pueden contener errores; confirma horarios y precios con el organizador antes de asistir.</P>

            <H>6. Profesionales del mapa Astro</H>
            <P>Los tarotistas, astrólogos y otros profesionales mostrados son terceros independientes. Zolarium no participa en los servicios que contrates con ellos ni responde de estos.</P>

            <H>7. Limitación de responsabilidad</H>
            <P>Zolarium se ofrece "tal cual". No garantizamos disponibilidad ininterrumpida ni la exactitud de los datos de terceros, y no respondemos de daños derivados de decisiones tomadas con base en contenidos de entretenimiento astrológico.</P>

            <H>8. Ley aplicable</H>
            <P>Estos términos se rigen por la legislación española. Para cualquier controversia serán competentes los juzgados que correspondan conforme a la normativa de consumidores.</P>
          </div>
        )}

        {tab === 'aviso' && (
          <div>
            <H>Titular</H>
            <P>[NOMBRE Y APELLIDOS], NIF [NIF], con domicilio a efectos de notificaciones en [CIUDAD], España. Contacto: [EMAIL DE CONTACTO]. (Información exigida por el art. 10 de la Ley 34/2002, LSSI-CE.)</P>

            <H>Propiedad intelectual</H>
            <P>El diseño, la marca Zolarium, las mascotas zodiacales y el software son propiedad de su titular. No está permitida su reproducción sin autorización.</P>

            <H>Fuentes de datos y atribuciones</H>
            <P>Agenda de actividades: datos.madrid.es, Ayuntamiento de Madrid (licencia CC BY 4.0). Lugares: © colaboradores de OpenStreetMap (licencia ODbL). Mapas: © CARTO, © OpenStreetMap. Fotografías de lugares: © Foursquare (Powered by Foursquare). Datos turísticos: Dataestur. Lecturas generadas con Google Gemini.</P>

            <H>Enlaces externos</H>
            <P>Los enlaces a sitios de terceros (Google Maps, páginas de eventos, profesionales) se ofrecen para tu comodidad; no controlamos su contenido.</P>
          </div>
        )}
      </div>
    </div>
  )
}
