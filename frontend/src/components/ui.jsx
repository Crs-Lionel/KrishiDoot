import { useEffect, useState } from 'react'

export const cx = (...parts) => parts.filter(Boolean).join(' ')

const FIELD_BASE =
  'w-full rounded-2xl border border-white/10 bg-[rgba(23,20,15,0.74)] px-4 py-3 text-sm text-[var(--mist-100)] placeholder:text-[var(--mist-500)] outline-none transition duration-200 focus:border-[var(--leaf-400)] focus:ring-2 focus:ring-[rgba(124,175,77,0.18)]'

export const INPUT_CLS = FIELD_BASE
export const SELECT_CLS = `${FIELD_BASE} appearance-none`
export const PANEL_CLS =
  'rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(31,26,20,0.94),rgba(20,17,13,0.94))] shadow-[0_22px_70px_rgba(0,0,0,0.28)]'
export const PANEL_SOFT_CLS =
  'rounded-[24px] border border-white/8 bg-[rgba(29,24,19,0.82)] shadow-[0_12px_36px_rgba(0,0,0,0.18)]'
export const KD_CARD = PANEL_CLS
export const KICKER_CLS = 'text-[11px] uppercase tracking-[0.28em] text-[var(--millet-300)]'
export const SECTION_TITLE_CLS = 'font-display text-[clamp(1.6rem,2vw,2.5rem)] leading-[1.05] text-[var(--mist-100)]'

function StrokeIcon({ className = 'w-4 h-4', children, strokeWidth = 1.7 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className}>
      {children}
    </svg>
  )
}

export function SurfaceCard({ as: Tag = 'div', className = '', children }) {
  return <Tag className={cx(PANEL_CLS, className)}>{children}</Tag>
}

export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const toggle = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  return [theme, toggle]
}

export function ThemeToggle({ theme = 'dark', toggle, className = '' }) {
  return (
    <button
      type="button"
      onClick={toggle}
      className={cx('inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--mist-200)] transition hover:bg-white/10', className)}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? 'D' : 'L'}
    </button>
  )
}

export function SectionLabel({ children, className = '' }) {
  return <p className={cx(KICKER_CLS, 'font-medium', className)}>{children}</p>
}

export function FieldLabel({ children, meta, className = '' }) {
  return (
    <label className={cx('mb-1.5 block text-[11px] uppercase tracking-[0.22em] text-[var(--mist-500)]', className)}>
      {children}
      {meta && <span className="ml-2 normal-case tracking-normal text-[var(--mist-500)]/70">{meta}</span>}
    </label>
  )
}

export function StatusBadge({ children, tone = 'default', className = '' }) {
  const tones = {
    default: 'border-white/10 bg-white/5 text-[var(--mist-300)]',
    leaf: 'border-[rgba(124,175,77,0.28)] bg-[rgba(124,175,77,0.12)] text-[var(--leaf-300)]',
    millet: 'border-[rgba(209,174,108,0.28)] bg-[rgba(209,174,108,0.12)] text-[var(--millet-300)]',
    rain: 'border-[rgba(111,165,186,0.3)] bg-[rgba(111,165,186,0.12)] text-[var(--rain-300)]',
    danger: 'border-[rgba(194,93,70,0.28)] bg-[rgba(194,93,70,0.12)] text-[var(--danger-300)]',
  }
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]', tones[tone], className)}>
      {children}
    </span>
  )
}

export function PageIntro({ eyebrow, title, desc, className = '', aside = null }) {
  return (
    <div className={cx('grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end', className)}>
      <div className="space-y-2">
        {eyebrow && <SectionLabel>{eyebrow}</SectionLabel>}
        <h1 className={cx(SECTION_TITLE_CLS, 'max-w-3xl')}>{title}</h1>
        {desc && <p className="max-w-2xl text-sm leading-6 text-[var(--mist-400)]">{desc}</p>}
      </div>
      {aside && <div className="md:justify-self-end">{aside}</div>}
    </div>
  )
}

export function AlertIcon({ className = 'w-4 h-4 flex-shrink-0' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </StrokeIcon>
  )
}

export function InfoIcon({ className = 'w-4 h-4 flex-shrink-0' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </StrokeIcon>
  )
}

export function LeafIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.808 4.622c-4.413.212-8.398 1.785-11.105 4.492C5.244 11.571 4 14.995 4 18.58v1.17h1.17c3.585 0 7.009-1.244 9.466-3.703 2.707-2.705 4.28-6.69 4.492-11.105l.044-.92-.364-.364zM8.14 14.712c1.32-1.319 3.455-2.604 6.404-3.858-1.254 2.949-2.539 5.084-3.858 6.404-1.44 1.438-3.41 2.326-5.585 2.53.203-2.175 1.091-4.144 2.53-5.576z" />
    </svg>
  )
}

export function GrainIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0-10c-1.5-.6-2.6-1.7-3.2-3.2M12 12c1.5-.6 2.6-1.7 3.2-3.2M12 14.5c-1.5.6-2.6 1.7-3.2 3.2M12 14.5c1.5.6 2.6 1.7 3.2 3.2" />
    </StrokeIcon>
  )
}

export function SeedIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5c3.038 2.166 4.557 4.59 4.557 7.272 0 2.683-1.519 5.092-4.557 7.228-3.038-2.136-4.557-4.545-4.557-7.228S8.962 6.666 12 4.5z" />
    </StrokeIcon>
  )
}

export function ProduceIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25c3.935 0 6.75 2.815 6.75 6.75S15.935 21.75 12 21.75 5.25 18.935 5.25 15 8.065 8.25 12 8.25z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25c0-1.79.728-3.234 2.185-4.332-2.272-.123-4.068.712-5.387 2.505" />
    </StrokeIcon>
  )
}

export function CropIcon({ crop, className = 'w-4 h-4' }) {
  if (['wheat', 'rice', 'maize', 'sugarcane'].includes(crop)) return <GrainIcon className={className} />
  if (['tomato', 'onion', 'potato'].includes(crop)) return <ProduceIcon className={className} />
  return <SeedIcon className={className} />
}

export function CameraIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </StrokeIcon>
  )
}

export function ScaleIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.97z" />
    </StrokeIcon>
  )
}

export function ChartIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </StrokeIcon>
  )
}

export function SproutIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20v-8.5m0 0c-3.314 0-6-2.686-6-6 3.314 0 6 2.686 6 6zm0 0c0-3.314 2.686-6 6-6 0 3.314-2.686 6-6 6z" />
    </StrokeIcon>
  )
}

export function RainIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 17.25l-.75 2.25m5.25-2.25l-.75 2.25m5.25-2.25l-.75 2.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15c-2.071 0-3.75-1.567-3.75-3.5 0-1.84 1.523-3.355 3.458-3.491C8.756 5.8 10.894 4.25 13.5 4.25c3.244 0 5.875 2.395 5.875 5.348 0 .125-.005.249-.014.372 1.344.28 2.389 1.409 2.389 2.78 0 1.576-1.383 2.85-3.089 2.85H8.25z" />
    </StrokeIcon>
  )
}

export function HeatIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <circle cx="12" cy="12" r="3.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5v2.25M12 18.25v2.25M4.93 4.93l1.59 1.59M17.48 17.48l1.59 1.59M3.5 12h2.25M18.25 12h2.25M4.93 19.07l1.59-1.59M17.48 6.52l1.59-1.59" />
    </StrokeIcon>
  )
}

export function FrostIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5v17M7.5 6.5 12 9l4.5-2.5M7.5 17.5 12 15l4.5 2.5M5 10.5 9.5 13 5 15.5M19 10.5 14.5 13l4.5 2.5" />
    </StrokeIcon>
  )
}

export function CloudIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 17.25c-2.071 0-3.75-1.567-3.75-3.5 0-1.84 1.523-3.355 3.458-3.491C8.756 8.05 10.894 6.5 13.5 6.5c3.244 0 5.875 2.395 5.875 5.348 0 .125-.005.249-.014.372 1.344.28 2.389 1.409 2.389 2.78 0 1.576-1.383 2.85-3.089 2.85H8.25z" />
    </StrokeIcon>
  )
}

export function WeatherIcon({ weather, className = 'w-4 h-4' }) {
  if (!weather) return <CloudIcon className={className} />
  if (weather.frost_risk) return <FrostIcon className={className} />
  if (weather.heat_stress) return <HeatIcon className={className} />
  if ((weather.rain_mm_week || weather.precip_mm || 0) > 0) return <RainIcon className={className} />
  if ((weather.humidity_pct || 0) > 80) return <CloudIcon className={className} />
  return <HeatIcon className={className} />
}

export function ShieldIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75c2.296 1.792 4.568 2.689 6.816 2.689v4.58c0 4.104-2.272 7.263-6.816 9.481-4.544-2.218-6.816-5.377-6.816-9.481V6.439C7.432 6.439 9.704 5.542 12 3.75z" />
    </StrokeIcon>
  )
}

export function ScissorsIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <circle cx="6.5" cy="8" r="2" />
      <circle cx="6.5" cy="16" r="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.2 9.2 18 4.5M8.2 14.8 18 19.5" />
    </StrokeIcon>
  )
}

export function EyeIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.75 12s3.5-5.25 9.25-5.25S21.25 12 21.25 12 17.75 17.25 12 17.25 2.75 12 2.75 12z" />
      <circle cx="12" cy="12" r="2.25" />
    </StrokeIcon>
  )
}

export function TaskIcon({ category, className = 'w-4 h-4' }) {
  if (category === 'sowing') return <SproutIcon className={className} />
  if (category === 'irrigation') return <RainIcon className={className} />
  if (category === 'fertilizer' || category === 'pesticide') return <ShieldIcon className={className} />
  if (category === 'weeding') return <ScissorsIcon className={className} />
  if (category === 'observation') return <EyeIcon className={className} />
  return <GrainIcon className={className} />
}

export function ChemicalIcon({ type, className = 'w-4 h-4' }) {
  if (type === 'fertilizer') return <SproutIcon className={className} />
  if (type === 'fungicide' || type === 'pesticide' || type === 'insecticide') return <ShieldIcon className={className} />
  if (type === 'herbicide') return <ScissorsIcon className={className} />
  return <SeedIcon className={className} />
}

export function MapPinIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.076 3.208-4.535 3.208-7.327a6.5 6.5 0 10-13 0c0 2.792 1.264 5.251 3.208 7.327a19.583 19.583 0 002.856 2.779 13.057 13.057 0 00.281.241zM12 9a2 2 0 110 4 2 2 0 010-4z" clipRule="evenodd" />
    </svg>
  )
}

export function ArrowRightIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 12h13.5m-4.5-4.5L18.75 12l-4.5 4.5" />
    </StrokeIcon>
  )
}

export function ChevronRightIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75 14.25 12 9 17.25" />
    </StrokeIcon>
  )
}

export function ChevronDownIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 9.75 12 15l5.25-5.25" />
    </StrokeIcon>
  )
}

export function DownloadIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5 7.5 12M12 16.5V3" />
    </StrokeIcon>
  )
}

export function DocumentIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75h6.879c.398 0 .779.158 1.061.44l3.87 3.87c.281.281.44.663.44 1.06v9.63a2.25 2.25 0 01-2.25 2.25h-9A2.25 2.25 0 016.25 18.75v-12A3 3 0 019.25 3.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 3.75V8.25h4.5M9 12.75h6M9 16.5h6" />
    </StrokeIcon>
  )
}

export function RefreshIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.024 8.977a5.25 5.25 0 10.58 6.092M16.024 8.977V4.75m0 4.227H11.75" />
    </StrokeIcon>
  )
}

export function TrophyIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5h7.5v2.25A3.75 3.75 0 0112 10.5 3.75 3.75 0 018.25 6.75V4.5zm0 0H5.625A1.875 1.875 0 003.75 6.375v.375A3.75 3.75 0 007.5 10.5m8.25-6H18.375A1.875 1.875 0 0120.25 6.375v.375A3.75 3.75 0 0116.5 10.5M12 10.5v5.25m-3.75 3.75h7.5" />
    </StrokeIcon>
  )
}

export function SubsidyIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75 12 4.5l8.25 5.25M5.25 9v9.75m13.5-9v9.75M3.75 19.5h16.5M9 13.5h6M12 10.5v6" />
    </StrokeIcon>
  )
}

export function TimelineIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h15M3 6h.008M3 12h.008M3 18h.008M6 12h15M6 18h15" />
    </StrokeIcon>
  )
}

export function SendIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </StrokeIcon>
  )
}

export function MicIcon({ className = 'w-4 h-4', active = false }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  )
}

export function SpeakerIcon({ className = 'w-4 h-4', muted = false }) {
  if (muted) {
    return (
      <StrokeIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 011.28.531V19.94a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.395C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
      </StrokeIcon>
    )
  }
  return (
    <StrokeIcon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.395C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
    </StrokeIcon>
  )
}

export function SpinnerIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={cx(className, 'animate-spin')} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function SuccessBanner({ message, onClose }) {
  if (!message) return null
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[rgba(124,175,77,0.26)] bg-[rgba(124,175,77,0.12)] px-4 py-3 text-sm text-[var(--leaf-300)]">
      <CheckIcon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 leading-6">{message}</span>
      {onClose && (
        <button type="button" onClick={onClose} className="text-[var(--mist-400)] hover:text-[var(--mist-100)]" aria-label="Dismiss">
          x
        </button>
      )}
    </div>
  )
}

export function PulsingDot({ color = '#7caf4d', size = 6 }) {
  return (
    <span
      className="inline-block rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: `0 0 0 ${Math.max(4, size)}px ${color}22`,
        animation: 'pulse 1.6s ease-in-out infinite',
      }}
    />
  )
}

export function CropBadge({ crop, className = '' }) {
  if (!crop) return null
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full border border-[rgba(124,175,77,0.25)] bg-[rgba(124,175,77,0.12)] px-2.5 py-1 text-xs font-semibold capitalize text-[var(--leaf-300)]', className)}>
      <CropIcon crop={crop} className="h-3.5 w-3.5" />
      {crop}
    </span>
  )
}

export function ProgressRing({ pct = 0, size = 48, stroke = 4, color = '#7caf4d', label }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.max(0, Math.min(100, pct)) / 100) * circumference

  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {label && <span className="absolute text-[10px] font-semibold text-[var(--mist-200)]">{label}</span>}
    </span>
  )
}

export function PriceDisplay({ amount, unit = '/kg', className = '', size = 'md' }) {
  const numeric = Number(amount)
  const formatted = Number.isFinite(numeric)
    ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: numeric >= 100 ? 0 : 2 }).format(numeric)
    : amount || '0'
  const sizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  }

  return (
    <span className={cx('tabular-nums font-display font-semibold', sizes[size] || sizes.md, className)}>
      Rs {formatted}{unit && <span className="ml-1 text-sm font-medium opacity-70">{unit}</span>}
    </span>
  )
}

export function triggerConfetti(container) {
  if (!container || typeof document === 'undefined') return
  const colors = ['#7caf4d', '#dcc08a', '#a6d2de', '#f3eee2']

  for (let i = 0; i < 18; i += 1) {
    const piece = document.createElement('span')
    piece.style.position = 'absolute'
    piece.style.left = `${45 + Math.random() * 10}%`
    piece.style.top = '12px'
    piece.style.width = '6px'
    piece.style.height = '10px'
    piece.style.borderRadius = '2px'
    piece.style.background = colors[i % colors.length]
    piece.style.pointerEvents = 'none'
    piece.style.transform = `translate(-50%, 0) rotate(${Math.random() * 120}deg)`
    piece.style.transition = 'transform 900ms ease-out, opacity 900ms ease-out'
    container.appendChild(piece)

    requestAnimationFrame(() => {
      piece.style.transform = `translate(${(Math.random() - 0.5) * 220}px, ${80 + Math.random() * 80}px) rotate(${180 + Math.random() * 280}deg)`
      piece.style.opacity = '0'
    })

    setTimeout(() => piece.remove(), 950)
  }
}

export function CheckIcon({ className = 'w-4 h-4' }) {
  return (
    <StrokeIcon className={className} strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75 9.75 18l9.75-12.75" />
    </StrokeIcon>
  )
}

export function ErrorAlert({ error, className = '' }) {
  if (!error) return null
  return (
    <div className={cx('flex items-start gap-2.5 rounded-2xl border border-[rgba(194,93,70,0.26)] bg-[rgba(194,93,70,0.12)] px-4 py-3 text-sm text-[var(--danger-300)]', className)}>
      <AlertIcon />
      <span className="leading-6">{error}</span>
    </div>
  )
}
