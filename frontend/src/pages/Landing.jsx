import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import * as THREE from 'three'
import 'swiper/css'
import 'swiper/css/pagination'
import { LeafIcon, KD_CARD, ThemeToggle, useTheme } from '../components/ui.jsx'

gsap.registerPlugin(ScrollTrigger)

const STATS = [
  { value: 19,  suffix: '',   label: 'States covered'           },
  { value: 94,  suffix: '%',  label: 'Negotiation success rate' },
  { value: 50,  suffix: '+',  label: 'Crops supported'          },
  { value: 2,   suffix: 'x',  label: 'Average price uplift'     },
]

const PAIN_POINTS = [
  { title: 'No price transparency',  desc: 'Buyers quote arbitrary prices. Farmers have no real-time reference point.' },
  { title: 'Information asymmetry',  desc: 'Buyers access APMC data in real time. Most farmers never see these numbers.' },
  { title: 'Perishability pressure', desc: 'Spoilage risk forces farmers to accept whatever is offered, however low.' },
  { title: 'No negotiation support', desc: 'Farmers negotiate alone against experienced traders every single day.' },
]

const STEPS = [
  {
    number: '01',
    title:  'Grade your crop',
    desc:   'Take a single photo. Gemini 1.5 Pro applies Agmark grading standards and estimates your price band in under 10 seconds.',
    badge:  'Gemini Vision',
    to:     '/grade',
    cta:    'Try grading',
  },
  {
    number: '02',
    title:  'Know your floor price',
    desc:   "We fetch today's official APMC modal price and compute your BATNA — factoring in your actual transport cost.",
    badge:  'data.gov.in',
    to:     '/market',
    cta:    'Check prices',
  },
  {
    number: '03',
    title:  'Let the AI negotiate',
    desc:   'Our LangGraph agent opens negotiation, adapts strategy based on crop perishability (Conceder vs Boulware), and closes at the best possible price.',
    badge:  'LangGraph',
    to:     '/negotiate',
    cta:    'Start negotiation',
  },
]

const FEATURES = [
  {
    title: 'Agmark AI Grading',
    desc:  'Gemini Vision analyses your crop photo against official Agmark standards. Grade A, B, or C with confidence score.',
    tag:   'Computer Vision',
    paths: [
      'M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z',
      'M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z',
    ],
  },
  {
    title: 'Live APMC Prices',
    desc:  'Real-time official modal prices across 19 states and 50+ crops from data.gov.in. Updated every day at market open.',
    tag:   'Live Data',
    paths: [
      'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
    ],
  },
  {
    title: 'Strategy-Aware Agent',
    desc:  'Conceder for perishables, Boulware for non-perishables. Proven game-theory negotiation tactics adapted per crop.',
    tag:   'AI Agent',
    paths: [
      'M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.97z',
    ],
  },
  {
    title: 'BATNA Price Floor',
    desc:  'Your reservation price factors in your actual transport cost. The AI enforces your floor on every single negotiation round — it is never exposed to the buyer.',
    tag:   'Guardrails',
    paths: [
      'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    ],
  },
  {
    title: 'Telegram Interface',
    desc:  'Negotiate from any phone via Telegram — no smartphone required. Works on 2G data, anywhere in India.',
    tag:   'Accessible',
    paths: [
      'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3',
    ],
  },
  {
    title: 'Installable PWA',
    desc:  'Install directly from Chrome on Android. No app store, no waiting, no storage bloat. Works offline for price lookups.',
    tag:   'PWA',
    paths: [
      'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3',
    ],
  },
]

const TECH = [
  { name: 'Gemini 1.5 Pro',  role: 'Vision analysis & dialogue' },
  { name: 'LangGraph',       role: 'Agent orchestration graph' },
  { name: 'data.gov.in',     role: 'Official APMC price feed' },
  { name: 'FastAPI',         role: 'Async Python API server' },
  { name: 'Supabase',        role: 'PostgreSQL database' },
  { name: 'PWA + Telegram',  role: 'Zero-friction delivery' },
]

// Unsplash photo IDs for testimonial strip
const FARMER_PHOTOS = [
  { id: 'photo-1594548474069-44c35052e541', name: 'Raju M.',   state: 'Karnataka',   crop: 'Tomato', gain: '₹3,200' },
  { id: 'photo-1559827291-72f26f0f3812',   name: 'Sunita D.', state: 'Maharashtra', crop: 'Onion',  gain: '₹4,800' },
  { id: 'photo-1507003211169-0a1dd7228f2d', name: 'Vikram S.', state: 'Punjab',      crop: 'Wheat',  gain: '₹6,100' },
]

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-red-500">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function ArrowDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 animate-bounce">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

// ── Three.js Dark-Theme Particle Background ──────────────────────────────────
function DarkParticles() {
  const mountRef = useRef(null)

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mountRef.current.appendChild(renderer.domElement)

    const particlesGeometry = new THREE.BufferGeometry()
    const particlesCount = 800
    const posArray = new Float32Array(particlesCount * 3)
    const colorsArray = new Float32Array(particlesCount * 3)
    
    const colorOptions = [
      new THREE.Color('#4ade80'),
      new THREE.Color('#fbbf24'),
      new THREE.Color('#fcd34d'),
      new THREE.Color('#ffffff'),
    ]

    for (let i = 0; i < particlesCount * 3; i += 3) {
      posArray[i]     = (Math.random() - 0.5) * 15
      posArray[i + 1] = (Math.random() - 0.5) * 15
      posArray[i + 2] = (Math.random() - 0.5) * 10
      const c = colorOptions[Math.floor(Math.random() * colorOptions.length)]
      colorsArray[i] = c.r; colorsArray[i + 1] = c.g; colorsArray[i + 2] = c.b
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    particlesGeometry.setAttribute('color',    new THREE.BufferAttribute(colorsArray, 3))

    // Soft circular sprite
    const cv = document.createElement('canvas'); cv.width = 16; cv.height = 16
    const cx = cv.getContext('2d')
    const gr = cx.createRadialGradient(8, 8, 0, 8, 8, 8)
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)')
    cx.fillStyle = gr; cx.fillRect(0, 0, 16, 16)
    const texture = new THREE.CanvasTexture(cv)

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05, vertexColors: true, map: texture,
      transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })

    const mesh = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(mesh)
    camera.position.z = 3

    let mouseX = 0, mouseY = 0
    const halfW = window.innerWidth / 2, halfH = window.innerHeight / 2
    const onMove = (e) => { mouseX = (e.clientX - halfW) * 0.0005; mouseY = (e.clientY - halfH) * 0.0005 }
    document.addEventListener('mousemove', onMove)

    const clock = new THREE.Clock()
    let animId
    const animate = () => {
      animId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      mesh.rotation.y += 0.001; mesh.rotation.x += 0.0005
      mesh.position.y = Math.sin(t * 0.5) * 0.1
      camera.position.x += (mouseX - camera.position.x) * 0.05
      camera.position.y += (-mouseY - camera.position.y) * 0.05
      camera.lookAt(scene.position)
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('mousemove', onMove)
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement)
      }
      particlesGeometry.dispose(); particlesMaterial.dispose(); texture.dispose(); renderer.dispose()
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none z-0 overflow-hidden" style={{ mixBlendMode: 'screen' }} />
}

// ── Light-Theme Organic Background ───────────────────────────────────────────
// Animated gradient blobs + floating leaf / petal SVG elements (pure CSS)
const LIGHT_BG_STYLES = `
  @keyframes blobA { 0%,100%{ transform:translate(0,0) scale(1) rotate(0deg); } 33%{ transform:translate(30px,-50px) scale(1.1) rotate(120deg); } 66%{ transform:translate(-20px,20px) scale(0.9) rotate(240deg); } }
  @keyframes blobB { 0%,100%{ transform:translate(0,0) scale(1) rotate(0deg); } 33%{ transform:translate(-40px,30px) scale(1.15) rotate(-120deg); } 66%{ transform:translate(25px,-40px) scale(0.85) rotate(-240deg); } }
  @keyframes blobC { 0%,100%{ transform:translate(0,0) scale(1); } 50%{ transform:translate(20px,30px) scale(1.08); } }
  @keyframes leafFloat { 0%{ transform:translateY(0) rotate(0deg); opacity:0; } 10%{ opacity:1; } 90%{ opacity:1; } 100%{ transform:translateY(-100vh) rotate(360deg); opacity:0; } }
  @keyframes petalSway { 0%,100%{ transform:translateX(0); } 50%{ transform:translateX(20px); } }
`

// Pre-generate leaf positions
const LEAVES = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 17 + 7) % 100}%`,
  delay: `${(i * 1.3) % 8}s`,
  duration: `${10 + (i % 5) * 3}s`,
  size: 12 + (i % 4) * 5,
  color: ['#22c55e', '#16a34a', '#15803d', '#86efac', '#4ade80', '#f59e0b', '#fbbf24'][i % 7],
  rotation: (i * 37) % 360,
  swayDur: `${3 + (i % 3) * 2}s`,
  swayDelay: `${(i * 0.7) % 4}s`,
}))

function LightOrganicBg() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <style>{LIGHT_BG_STYLES}</style>

      {/* Gradient blobs */}
      <div className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-40"
           style={{ top: '5%', right: '10%', background: 'radial-gradient(circle, #bbf7d0 0%, #dcfce7 40%, transparent 70%)', animation: 'blobA 20s ease-in-out infinite' }} />
      <div className="absolute w-[450px] h-[450px] rounded-full blur-[90px] opacity-35"
           style={{ bottom: '10%', left: '5%', background: 'radial-gradient(circle, #fef3c7 0%, #fef9c3 40%, transparent 70%)', animation: 'blobB 25s ease-in-out infinite' }} />
      <div className="absolute w-[350px] h-[350px] rounded-full blur-[80px] opacity-30"
           style={{ top: '40%', left: '40%', background: 'radial-gradient(circle, #d9f99d 0%, #ecfccb 40%, transparent 70%)', animation: 'blobC 18s ease-in-out infinite' }} />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
           style={{ backgroundImage: 'radial-gradient(circle, #16a34a 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Floating leaf / petal SVGs */}
      {LEAVES.map((leaf, i) => (
        <div key={i} className="absolute bottom-[-40px]"
             style={{
               left: leaf.left,
               animation: `leafFloat ${leaf.duration} linear ${leaf.delay} infinite, petalSway ${leaf.swayDur} ease-in-out ${leaf.swayDelay} infinite`,
             }}>
          <svg width={leaf.size} height={leaf.size} viewBox="0 0 24 24" fill={leaf.color} style={{ opacity: 0.35, transform: `rotate(${leaf.rotation}deg)` }}>
            {i % 3 === 0 ? (
              /* Leaf shape */
              <path d="M17 8C8 10 5.9 16.17 3.82 19.82L5.71 21l1-1.73c.97.53 1.94.83 2.79.83 4 0 7-4 7-9 0-.9-.17-1.77-.5-2.56 2.3 1.93 3.7 4.8 3.7 7.96 0 2.42-.83 4.65-2.2 6.41L19 24c1.81-2.22 2.9-5.07 2.9-8.18C21.9 10.55 19.95 6.76 17 4V8z" />
            ) : i % 3 === 1 ? (
              /* Circle petal */
              <circle cx="12" cy="12" r="8" />
            ) : (
              /* Small diamond */
              <path d="M12 2L20 12L12 22L4 12Z" />
            )}
          </svg>
        </div>
      ))}
    </div>
  )
}

// ── Theme-Aware Background Switcher ──────────────────────────────────────────
function HeroBackground({ theme }) {
  return theme === 'dark' ? <DarkParticles /> : <LightOrganicBg />
}

export default function Landing() {
  const lenisRef = useRef(null)
  const { theme, toggle } = useTheme()

  const scrollTo = (id) => {
    lenisRef.current?.scrollTo(document.querySelector(id), { offset: -72, duration: 1.4 })
  }

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
    lenisRef.current = lenis
    const rafFn = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(rafFn)
    gsap.ticker.lagSmoothing(0)
    lenis.on('scroll', ScrollTrigger.update)

    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    heroTl
      .fromTo('.ld-nav',    { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0)
      .fromTo('.ld-badge',  { y: 12,  opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.35)
      .fromTo('.ld-word',   { y: 52,  opacity: 0, rotationX: -90, transformOrigin: '0% 50% -50' }, { y: 0, opacity: 1, rotationX: 0, duration: 0.8, stagger: 0.08, ease: 'back.out(1.7)' }, 0.55)
      .fromTo('.ld-sub',    { y: 20,  opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.95)
      .fromTo('.ld-cta',    { y: 18,  opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 }, 1.15)
      .fromTo('.ld-card-a', { y: 60,  opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 1, ease: 'elastic.out(1, 0.7)' }, 0.8)
      .fromTo('.ld-card-b', { y: 40,  opacity: 0, x: 30, rotation: 5 }, { y: 0, opacity: 1, x: 0, rotation: 0, duration: 0.8, ease: 'back.out(1.5)' }, 1.0)
      .fromTo('.ld-card-c', { y: 40,  opacity: 0, x: -30, rotation: -5 }, { y: 0, opacity: 1, x: 0, rotation: 0, duration: 0.8, ease: 'back.out(1.5)' }, 1.1)

    document.querySelectorAll('[data-count]').forEach((el) => {
      const target = parseFloat(el.dataset.count)
      const obj = { val: 0 }
      gsap.to(obj, {
        val: target, duration: 2.5, ease: 'power3.out',
        onUpdate() { el.textContent = target % 1 === 0 ? Math.round(obj.val) : obj.val.toFixed(1) },
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      })
    })

    gsap.utils.toArray('.ld-reveal').forEach((el) => {
      gsap.fromTo(el,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 86%', once: true } }
      )
    })

    gsap.utils.toArray('.ld-stagger').forEach((parent) => {
      gsap.fromTo(parent.querySelectorAll(':scope > *'),
        { y: 40, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: parent, start: 'top 82%', once: true } }
      )
    })

    document.querySelectorAll('.ld-step').forEach((el, i) => {
      gsap.fromTo(el,
        { x: i % 2 === 0 ? -60 : 60, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true } }
      )
      
      // Add a subtle line drawing effect if there's a connector
      if (i > 0) {
        gsap.fromTo(`.ld-step-connector-${i}`, 
          { scaleY: 0, transformOrigin: 'top' },
          { scaleY: 1, duration: 0.8, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }
        )
      }
    })

    ScrollTrigger.create({
      start: 'top -60',
      onEnter:     () => gsap.to('.ld-nav', { backgroundColor: 'var(--bg-nav)', backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow-nav)', duration: 0.4 }),
      onLeaveBack: () => gsap.to('.ld-nav', { backgroundColor: 'transparent', backdropFilter: 'blur(0px)', boxShadow: 'none', duration: 0.4 }),
    })

    gsap.fromTo('.ld-cta-section',
      { scale: 0.95, opacity: 0, y: 30 },
      { scale: 1, opacity: 1, y: 0, duration: 1, ease: 'elastic.out(1, 0.8)',
        scrollTrigger: { trigger: '.ld-cta-section', start: 'top 85%', once: true } }
    )

    return () => {
      heroTl.kill()
      lenis.destroy()
      gsap.ticker.remove(rafFn)
      gsap.ticker.lagSmoothing(60, 1000)
      ScrollTrigger.getAll().forEach((st) => st.kill())
    }
  }, [])

  return (
    <div className="font-sans antialiased overflow-x-hidden transition-colors duration-300">
      
      {/* NAV */}
      <nav className="ld-nav fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b border-transparent">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                 style={{ background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)', boxShadow: '0 2px 12px rgba(34,197,94,0.4)' }}>
              <LeafIcon />
            </div>
            <span className="font-display font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              KrishiDoot<span className="text-green-500">.AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            <button onClick={() => scrollTo('#how-it-works')} className="hover:text-green-500 transition-colors">How it works</button>
            <button onClick={() => scrollTo('#features')}    className="hover:text-green-500 transition-colors">Features</button>
            <button onClick={() => scrollTo('#technology')}  className="hover:text-green-500 transition-colors">Technology</button>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} toggle={toggle} />
            <div className="relative group">
              <button className="kd-btn-primary text-white text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-2">
                Open App
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-200">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-50"
                   style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
                {[
                  { to: '/grade',     icon: '📸', label: 'Grade Crop',    hindi: 'श्रेणी',  color: '#22c55e' },
                  { to: '/negotiate', icon: '🤝', label: 'Negotiate',     hindi: 'सौदा',    color: '#f59e0b' },
                  { to: '/market',    icon: '📊', label: 'Mandi Prices',  hindi: 'भाव',     color: '#3b82f6' },
                  { to: '/grow',      icon: '🌱', label: 'Crop Journey',  hindi: 'उगाओ',    color: '#10b981' },
                ].map(item => (
                  <Link key={item.to} to={item.to}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors hover:bg-green-500/10"
                        style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span className="text-lg">{item.icon}</span>
                    <div className="flex-1">
                      <span>{item.label}</span>
                      <span className="text-[9px] font-hindi ml-2 opacity-50">{item.hindi}</span>
                    </div>
                    <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-screen flex items-center pt-16 relative overflow-hidden">
        {/* Background grain and theme-aware effects */}
        <div className="absolute inset-0 grain-overlay z-0 mix-blend-overlay"></div>
        <HeroBackground theme={theme} />
        
        {/* Glow accents */}
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] opacity-30 pointer-events-none z-0"
             style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.6) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full blur-[80px] opacity-20 pointer-events-none z-0"
             style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.5) 0%, transparent 70%)' }} />

        <div className="max-w-6xl mx-auto px-5 py-24 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div className="max-w-lg">
              <div className="ld-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8 font-display"
                   style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}>
                <span className="w-2 h-2 rounded-full animate-ping" style={{ background: '#22c55e', opacity: 0.8 }} />
                <span className="text-xs font-bold tracking-wide">AI-powered negotiation for Indian farmers</span>
              </div>

              <h1 className="text-5xl sm:text-6xl font-black leading-[1.1] tracking-tight mb-2 font-display" style={{ color: 'var(--text-primary)' }}>
                {['Stop', 'leaving', 'money'].map((w, i) => (
                  <span key={i} className="ld-word inline-block" style={{ marginRight: '0.22em' }}>{w}</span>
                ))}
                <br />
                {['at', 'the'].map((w, i) => (
                  <span key={i} className="ld-word inline-block" style={{ marginRight: '0.22em' }}>{w}</span>
                ))}
                <span className="ld-word inline-block text-green-500 relative">
                  mandi.
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <path d="M0,10 Q50,20 100,10" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />
                  </svg>
                </span>
              </h1>

              <p className="ld-sub text-lg leading-relaxed mt-8 mb-10" style={{ color: 'var(--text-secondary)' }}>
                KrishiDoot uses real APMC data and a LangGraph AI agent to negotiate on your behalf —
                so experienced traders can never lowball you again.
              </p>

              <div className="flex flex-wrap gap-3 mb-6">
                <Link to="/grade" className="ld-cta kd-btn-primary text-white font-bold px-7 py-3.5 rounded-xl text-sm flex items-center gap-2 group">
                  📸 Grade Crop
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                <Link to="/negotiate" className="ld-cta font-bold px-7 py-3.5 rounded-xl text-sm flex items-center gap-2 group transition-all duration-200"
                      style={{ border: '2px solid var(--border-card)', color: 'var(--text-primary)', background: 'var(--bg-card)' }}>
                  🤝 Negotiate
                </Link>
                <Link to="/market" className="ld-cta font-bold px-7 py-3.5 rounded-xl text-sm flex items-center gap-2 group transition-all duration-200"
                      style={{ border: '2px solid var(--border-card)', color: 'var(--text-primary)', background: 'var(--bg-card)' }}>
                  📊 Prices
                </Link>
                <Link to="/grow" className="ld-cta font-bold px-7 py-3.5 rounded-xl text-sm flex items-center gap-2 group transition-all duration-200"
                      style={{ border: '2px solid var(--border-card)', color: 'var(--text-primary)', background: 'var(--bg-card)' }}>
                  🌱 Grow
                </Link>
              </div>

              <p className="ld-cta text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                <span className="text-green-500">✓</span> No signup required
                <span className="mx-2 opacity-50">·</span>
                <span className="text-green-500">✓</span> Free to use
              </p>
            </div>

            {/* Premium Hero product cards */}
            <div className="relative flex justify-center lg:justify-end min-h-[400px]">
              
              {/* Main Price Card */}
              <div className="ld-card-a relative z-20 kd-glass rounded-3xl p-6 w-80 mt-8 glow-green animate-float">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🍅</span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider font-display" style={{ color: 'var(--text-muted)' }}>Tomato · Karnataka</p>
                      <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-faint)' }}>APMC Modal Price</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                        style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                    LIVE
                  </span>
                </div>
                
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-bold opacity-60" style={{ color: 'var(--text-primary)' }}>₹</span>
                  <p className="text-5xl font-black tracking-tight font-display" style={{ color: 'var(--text-primary)' }}>
                    28.50
                  </p>
                  <span className="text-sm font-medium ml-1" style={{ color: 'var(--text-muted)' }}>/kg</span>
                </div>
                
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1"
                        style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <span className="text-[10px]">⚖️</span> Floor: ₹26.50/kg
                  </span>
                </div>
                
                <div className="mt-6 pt-5 flex items-center gap-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative"
                       style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <div className="w-4 h-4 rounded-full bg-green-500 glow-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>AI negotiating</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Round 2 of 5 · Boulware</p>
                  </div>
                </div>
              </div>

              {/* Savings Card */}
              <div className="ld-card-b absolute -bottom-6 -right-4 lg:-right-8 z-30 rounded-2xl p-5 w-48 animate-float"
                   style={{ 
                     background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                     boxShadow: '0 20px 40px -10px rgba(22,163,74,0.5)',
                     border: '1px solid rgba(74,222,128,0.4)',
                     animationDelay: '1s'
                   }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">💰</span>
                  <p className="text-xs font-bold text-green-100 uppercase tracking-wide">AI Saved You</p>
                </div>
                <p className="text-3xl font-black text-white tracking-tight font-display">₹4,200</p>
                <p className="text-xs font-medium text-green-200 mt-2">200 kg wheat · this week</p>
              </div>

              {/* Grade Card */}
              <div className="ld-card-c absolute -top-8 -left-6 lg:-left-12 z-30 kd-glass rounded-2xl p-4 animate-float"
                   style={{ animationDelay: '2s' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2 font-display" style={{ color: 'var(--text-muted)' }}>Agmark Grade</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                       style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <span className="text-2xl font-black text-green-500 font-display">A</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Premium</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                      <p className="text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>94% confidence</p>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>

          <div className="flex justify-center mt-24">
            <button onClick={() => scrollTo('#stats')} className="flex flex-col items-center gap-3 transition-colors group" style={{ color: 'var(--text-muted)' }}>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] group-hover:text-green-500 transition-colors">Scroll</span>
              <div className="w-8 h-8 rounded-full border flex items-center justify-center group-hover:border-green-500 group-hover:text-green-500 transition-colors"
                   style={{ borderColor: 'var(--border-subtle)' }}>
                <ArrowDown />
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" className="py-20 border-y" style={{ background: 'var(--bg-card-2)', borderColor: 'var(--border-subtle)' }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {STATS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <p className="text-5xl font-black tracking-tight font-display" style={{ color: 'var(--text-primary)' }}>
                    <span data-count={s.value}>{s.value}</span>{s.suffix}
                  </p>
                </div>
                <p className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                {/* Decorative underline */}
                <div className="w-12 h-1 bg-green-500/50 mx-auto mt-4 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="py-32" style={{ background: 'var(--bg-base)' }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="ld-reveal">
              <p className="text-xs font-black text-red-500 uppercase tracking-[0.2em] mb-4 font-display">The Problem</p>
              <h2 className="text-4xl sm:text-5xl font-black leading-[1.1] mb-6 font-display" style={{ color: 'var(--text-primary)' }}>
                Farmers lose <span className="text-red-500">30–40%</span><br />of income at the mandi.
              </h2>
              <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                The system is fundamentally stacked against farmers. Traders have real-time data,
                negotiation experience, and market leverage. Farmers walk in with none of that.
              </p>
              <Link to="/negotiate" className="inline-flex items-center gap-2 mt-8 font-bold text-green-600 hover:text-green-500 text-lg group transition-colors">
                See how we fix this <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>

            <div className="ld-stagger grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PAIN_POINTS.map((p, i) => (
                <div key={i} className="kd-card p-6 group hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors"
                       style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <CrossIcon />
                  </div>
                  <p className="font-bold text-base mb-2 font-display" style={{ color: 'var(--text-primary)' }}>{p.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-32 relative overflow-hidden" style={{ background: 'var(--bg-card-2)' }}>
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none"
             style={{ background: 'radial-gradient(circle at top right, #22c55e, transparent 70%)' }}></div>
        
        <div className="max-w-4xl mx-auto px-5 relative z-10">
          <div className="ld-reveal text-center mb-20">
            <p className="text-xs font-black text-green-500 uppercase tracking-[0.2em] mb-4 font-display">How It Works</p>
            <h2 className="text-4xl sm:text-5xl font-black leading-[1.1] font-display" style={{ color: 'var(--text-primary)' }}>
              Three steps to a fair price.
            </h2>
            <p className="text-lg mt-6" style={{ color: 'var(--text-secondary)' }}>From photo to final price in under five minutes.</p>
          </div>
          
          <div className="space-y-12 relative">
            {/* Vertical connector line */}
            <div className="absolute left-8 sm:left-14 top-10 bottom-10 w-1 rounded-full hidden sm:block"
                 style={{ background: 'var(--border-subtle)' }}></div>
            
            {STEPS.map((step, i) => (
              <div key={i} className="ld-step relative flex flex-col sm:flex-row gap-6 sm:gap-10 items-start group">
                
                {/* Active connecting line (animated via GSAP) */}
                {i > 0 && (
                  <div className={`ld-step-connector-${i} absolute left-8 sm:left-14 top-[-48px] h-12 w-1 bg-green-500 hidden sm:block origin-top`} />
                )}

                <div className="relative z-10 flex-shrink-0 w-16 sm:w-28 flex justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-display text-2xl font-black shadow-lg transition-transform duration-300 group-hover:scale-110"
                       style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)', color: 'white' }}>
                    {step.number}
                  </div>
                </div>
                
                <div className="flex-1 kd-card p-6 sm:p-8 relative overflow-hidden">
                  {/* Subtle card glow on hover */}
                  <div className="absolute inset-0 bg-green-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                  
                  <div className="flex flex-wrap items-center gap-3 mb-3 relative z-10">
                    <h3 className="text-xl sm:text-2xl font-black font-display" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                    <span className="text-xs px-2.5 py-1 rounded-md font-mono font-bold"
                          style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                      {step.badge}
                    </span>
                  </div>
                  <p className="text-base leading-relaxed mb-6 relative z-10" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
                  
                  <Link to={step.to} className="inline-flex items-center gap-2 font-bold text-sm transition-colors relative z-10"
                        style={{ color: 'var(--text-primary)' }}>
                    <span className="group-hover:text-green-500 transition-colors">{step.cta}</span>
                    <span className="w-8 h-8 rounded-full flex items-center justify-center transition-colors group-hover:bg-green-500 group-hover:text-white group-hover:border-transparent"
                          style={{ border: '1px solid var(--border-subtle)' }}>
                      <ChevronRight />
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FARMER PHOTO STRIP */}
      <section className="py-24 border-y" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="ld-reveal text-center mb-16">
            <p className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] mb-4 font-display">Real farmers, real results</p>
            <h2 className="text-3xl sm:text-4xl font-black font-display" style={{ color: 'var(--text-primary)' }}>Extra income from every harvest.</h2>
          </div>
          <div className="ld-stagger grid grid-cols-1 sm:grid-cols-3 gap-8">
            {FARMER_PHOTOS.map((f, i) => (
              <div key={i} className="kd-card overflow-hidden group p-0 border-0">
                <div className="h-56 overflow-hidden relative">
                  <img
                    src={`https://images.unsplash.com/${f.id}?w=600&q=80&auto=format&fit=crop`}
                    alt={`Farmer ${f.name}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Rich gradient overlay */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,15,11,0.9) 0%, transparent 100%)' }} />
                  
                  {/* Gain badge */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <div>
                      <p className="font-bold text-white text-lg">{f.name}</p>
                      <p className="text-xs font-medium text-gray-300 mt-0.5">{f.crop} farmer · {f.state}</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg font-black text-sm"
                         style={{ background: 'rgba(245,158,11,0.9)', color: '#fff', boxShadow: '0 4px 12px rgba(245,158,11,0.4)' }}>
                      +{f.gain}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SWIPER */}
      <section id="features" className="py-32 overflow-hidden relative" style={{ background: 'var(--bg-card-2)' }}>
        <div className="max-w-6xl mx-auto px-5 mb-16">
          <div className="ld-reveal">
            <p className="text-xs font-black text-green-500 uppercase tracking-[0.2em] mb-4 font-display">Features</p>
            <h2 className="text-4xl sm:text-5xl font-black leading-[1.1] font-display" style={{ color: 'var(--text-primary)' }}>
              Everything a farmer needs<br className="hidden sm:block" /> to win at the mandi.
            </h2>
          </div>
        </div>
        
        <div className="pl-5 md:pl-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))]">
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={20}
            slidesPerView={1.1}
            breakpoints={{
              540:  { slidesPerView: 1.8 },
              768:  { slidesPerView: 2.4 },
              1024: { slidesPerView: 3.2 },
            }}
            autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
            pagination={{ clickable: true }}
            loop
            style={{ paddingBottom: '60px' }}
          >
            {FEATURES.map((f, i) => (
              <SwiperSlide key={i} style={{ height: 'auto' }}>
                <div className="kd-card h-full flex flex-col p-8 group">
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                         style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
                        {f.paths.map((d, di) => (
                          <path key={di} strokeLinecap="round" strokeLinejoin="round" d={d} />
                        ))}
                      </svg>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md tracking-wide"
                          style={{ background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="font-black text-xl mb-3 font-display" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5" style={{ background: 'var(--bg-base)' }}>
        <div className="ld-cta-section max-w-5xl mx-auto rounded-[2rem] px-8 py-20 sm:px-16 text-center overflow-hidden relative"
             style={{ 
               background: 'linear-gradient(135deg, #166534 0%, #14532d 100%)',
               boxShadow: '0 20px 40px rgba(22,163,74,0.3)',
               border: '1px solid rgba(74,222,128,0.3)'
             }}>
          
          {/* Decorative shapes */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-green-400 rounded-full mix-blend-overlay blur-3xl opacity-30 pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-400 rounded-full mix-blend-overlay blur-3xl opacity-20 pointer-events-none" />
          
          <div className="relative z-10">
            <p className="text-green-300 text-sm font-black uppercase tracking-[0.2em] mb-6 font-display">Get started today</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white leading-[1.1] mb-6 font-display">
              Your next mandi deal<br />should be a fair one.
            </h2>
            <p className="text-green-100/90 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
              KrishiDoot.AI is free, requires no sign-up, and works on any phone. Start with a single crop photo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/grade" className="bg-white text-green-800 font-black px-10 py-4 rounded-xl hover:bg-green-50 active:scale-95 transition-all duration-200 text-base shadow-xl flex items-center justify-center gap-2">
                <span className="text-xl">📸</span> Grade my crop
              </Link>
              <Link to="/market" className="kd-glass text-white font-bold px-10 py-4 rounded-xl hover:bg-white/10 active:scale-95 transition-all duration-200 text-base flex items-center justify-center gap-2">
                <span className="text-xl">📊</span> Check mandi prices
              </Link>
            </div>
            <p className="text-green-300/70 text-sm mt-8 font-medium">Works on any phone · No app store · 100% free</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 border-t mt-10" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col md:flex-row justify-between gap-12 mb-12">
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                     style={{ background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' }}>
                  <LeafIcon className="w-4 h-4" />
                </div>
                <span className="font-display font-black text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  KrishiDoot<span className="text-green-500">.AI</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                AI-powered negotiation for Indian farmers. Get the price you deserve at every mandi.
              </p>
              {/* Decorative crops */}
              <div className="flex gap-3 text-xl opacity-80">
                <span>🌾</span><span>🍅</span><span>🧅</span><span>🥔</span>
              </div>
            </div>
            
            <div className="flex gap-16 md:gap-24">
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-5 font-display" style={{ color: 'var(--text-muted)' }}>App</p>
                <div className="space-y-4">
                  {[
                    { to: '/grade',     label: 'Grade Crop'   },
                    { to: '/market',    label: 'Mandi Prices' },
                    { to: '/negotiate', label: 'Negotiate'    },
                    { to: '/grow',      label: 'Crop Journey' },
                  ].map(({ to, label }) => (
                    <Link key={to} to={to} className="block text-sm font-medium hover:text-green-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-5 font-display" style={{ color: 'var(--text-muted)' }}>Technology</p>
                <div className="space-y-4">
                  {['Gemini Vision', 'LangGraph', 'APMC API', 'React & Three.js'].map((t) => (
                    <p key={t} className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t flex flex-col sm:flex-row justify-between gap-4" style={{ borderColor: 'var(--border-subtle)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>© 2026 KrishiDoot.AI. Built for Indian farmers.</p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>DPDP Act 2023 compliant · data.gov.in APMC data</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
