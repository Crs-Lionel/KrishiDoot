// ── Shared UI primitives for KrishiDoot.AI ────────────────────────────────────
import { useState, useEffect, useRef } from 'react'

// ── Style constants ──────────────────────────────────────────────────────────
export const INPUT_CLS = [
  'w-full kd-input rounded-xl px-3.5 py-2.5 text-sm font-sans',
  'placeholder:text-[var(--text-muted)]',
  'focus:outline-none',
  'transition',
].join(' ')

export const SELECT_CLS = [
  'w-full kd-select rounded-xl px-3.5 py-2.5 text-sm font-sans',
  'focus:outline-none focus:ring-2 focus:ring-crop-500 focus:border-transparent',
  'transition appearance-none',
].join(' ')

export const KD_CARD = [
  'kd-card p-4 rounded-2xl',
].join(' ')

// ── Theme Hook ───────────────────────────────────────────────────────────────
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'
    return localStorage.getItem('kd_theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('kd_theme', theme)
  }, [theme])

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  return { theme, toggle }
}

// ── Theme Toggle Button ──────────────────────────────────────────────────────
export function ThemeToggle({ theme, toggle }) {
  const isDark = theme === 'dark'
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className="relative w-[52px] h-[28px] rounded-full flex items-center transition-all duration-300 flex-shrink-0"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #1a2b1c, #223023)'
          : 'linear-gradient(135deg, #bbf7d0, #86efac)',
        border: isDark ? '1.5px solid rgba(42,58,43,0.8)' : '1.5px solid rgba(22,163,74,0.35)',
        boxShadow: isDark
          ? '0 0 12px rgba(34,197,94,0.15)'
          : '0 0 12px rgba(22,163,74,0.25)',
      }}
    >
      {/* Track icons */}
      <span className="absolute left-1.5 text-[10px] select-none pointer-events-none">
        {isDark ? '🌙' : ''}
      </span>
      <span className="absolute right-1.5 text-[10px] select-none pointer-events-none">
        {!isDark ? '☀️' : ''}
      </span>
      {/* Thumb */}
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all duration-300 shadow-md relative z-10"
        style={{
          transform: isDark ? 'translateX(0px)' : 'translateX(24px)',
          background: isDark
            ? 'linear-gradient(135deg, #22c55e, #15803d)'
            : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          boxShadow: isDark
            ? '0 2px 8px rgba(22,163,74,0.5)'
            : '0 2px 8px rgba(245,158,11,0.5)',
        }}
      >
        {isDark ? '🌙' : '☀️'}
      </div>
    </button>
  )
}

// ── Leaf Icon ────────────────────────────────────────────────────────────────
export function LeafIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17 8C8 10 5.9 16.17 3.82 19.82L5.71 21l1-1.73c.97.53 1.94.83 2.79.83 4 0 7-4 7-9 0-.9-.17-1.77-.5-2.56 2.3 1.93 3.7 4.8 3.7 7.96 0 2.42-.83 4.65-2.2 6.41L19 24c1.81-2.22 2.9-5.07 2.9-8.18C21.9 10.55 19.95 6.76 17 4V8z"/>
    </svg>
  )
}

// ── Alert Icon ───────────────────────────────────────────────────────────────
export function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 flex-shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  )
}

// ── Info Icon ────────────────────────────────────────────────────────────────
export function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 flex-shrink-0 text-green-400 mt-0.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  )
}

// ── Spinner ──────────────────────────────────────────────────────────────────
export function SpinnerIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}

// ── Error Alert ──────────────────────────────────────────────────────────────
export function ErrorAlert({ error }) {
  if (!error) return null
  return (
    <div
      className="flex items-start gap-2.5 rounded-xl p-3.5 text-sm"
      style={{
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.25)',
        color: '#f87171',
        animation: 'shake 0.4s ease',
      }}
    >
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-4px)}40%,80%{transform:translateX(4px)}}`}</style>
      <AlertIcon />
      <span>{error}</span>
    </div>
  )
}

// ── Success Banner ────────────────────────────────────────────────────────────
export function SuccessBanner({ message, onClose }) {
  if (!message) return null
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl p-3.5 text-sm relative overflow-hidden"
      style={{
        background: 'rgba(34,197,94,0.1)',
        border: '1px solid rgba(34,197,94,0.3)',
        color: '#4ade80',
        animation: 'celebrate 0.5s ease-out',
      }}
    >
      <span className="text-base">✅</span>
      <span className="flex-1 font-semibold">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-green-500 hover:text-green-300 ml-auto">✕</button>
      )}
    </div>
  )
}

// ── Pulsing Dot ──────────────────────────────────────────────────────────────
export function PulsingDot({ color = '#22c55e', size = 6 }) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <span
        className="absolute inline-flex rounded-full animate-ping"
        style={{ width: size, height: size, background: color, opacity: 0.5 }}
      />
      <span
        className="relative inline-flex rounded-full"
        style={{ width: size, height: size, background: color }}
      />
    </span>
  )
}

// ── Crop Badge ───────────────────────────────────────────────────────────────
const CROP_EMOJI_MAP = {
  tomato: '🍅', wheat: '🌾', onion: '🧅', potato: '🥔', rice: '🍚',
  maize: '🌽', soybean: '🫘', cotton: '🌿', sugarcane: '🍬', bajra: '🌾',
  jowar: '🌾', mustard: '🌼', groundnut: '🥜', gram: '🫛',
}
export function CropBadge({ crop, className = '' }) {
  const emoji = CROP_EMOJI_MAP[crop?.toLowerCase()] || '🌱'
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}
      style={{
        background: 'rgba(34,197,94,0.1)',
        border: '1px solid rgba(34,197,94,0.25)',
        color: '#4ade80',
      }}
    >
      <span>{emoji}</span>
      <span className="capitalize">{crop}</span>
    </span>
  )
}

// ── Progress Ring ─────────────────────────────────────────────────────────────
export function ProgressRing({ pct = 0, size = 48, stroke = 4, color = '#22c55e', label }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(34,197,94,0.1)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s var(--ease-out-expo)' }}
        />
      </svg>
      {label && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">{label}</span>
        </div>
      )}
    </div>
  )
}

// ── Price Display ─────────────────────────────────────────────────────────────
export function PriceDisplay({ amount, unit = '/kg', className = '', size = 'md' }) {
  const sizeMap = {
    sm: 'text-lg font-bold',
    md: 'text-2xl font-black',
    lg: 'text-4xl font-black',
    xl: 'text-5xl font-black',
  }
  return (
    <span className={`font-display inline-flex items-baseline gap-0.5 ${className}`}>
      <span className="text-xs font-semibold opacity-70 -translate-y-0.5">₹</span>
      <span className={sizeMap[size]}>{amount?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
      {unit && <span className="text-xs font-medium opacity-60 ml-0.5">{unit}</span>}
    </span>
  )
}

// ── Section Label ─────────────────────────────────────────────────────────────
export function SectionLabel({ children, className = '' }) {
  return (
    <p className={`text-[10px] font-bold uppercase tracking-[0.18em] font-display ${className}`}
      style={{ color: '#22c55e' }}>
      {children}
    </p>
  )
}

// ── Confetti Burst (imperative) ───────────────────────────────────────────────
export function triggerConfetti(container) {
  if (!container) return
  const colors = ['#22c55e', '#f59e0b', '#4ade80', '#fbbf24', '#86efac', '#fde68a']
  for (let i = 0; i < 20; i++) {
    const dot = document.createElement('div')
    dot.className = 'confetti-particle'
    dot.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 40}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-delay: ${Math.random() * 0.3}s;
      animation-duration: ${0.8 + Math.random() * 0.6}s;
    `
    container.appendChild(dot)
    setTimeout(() => dot.remove(), 1500)
  }
}
