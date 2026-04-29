import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import {
  ArrowRightIcon,
  CameraIcon,
  ChartIcon,
  LeafIcon,
  MicIcon,
  RainIcon,
  ScaleIcon,
  ShieldIcon,
  SproutIcon,
  StatusBadge,
  SubsidyIcon,
  SurfaceCard,
  TimelineIcon,
} from '../components/ui.jsx'

gsap.registerPlugin(ScrollTrigger)

const HERO_SIGNALS = [
  { value: '4', label: 'desks in one farmer workflow' },
  { value: '1', label: 'decision chain from field to sale' },
  { value: 'Now', label: 'start from the crop lot in hand' },
]

const VALUE_LEAKS = [
  {
    index: '01',
    title: 'Nearest mandi is not always the strongest outcome.',
    body: 'Price boards matter, but transport, arrivals, and route choice decide what actually lands in the farmer’s hand.',
    kicker: 'Route risk',
  },
  {
    index: '02',
    title: 'Ungraded produce gets negotiated like a guess.',
    body: 'When the lot has no visible evidence behind it, the buyer starts from doubt and the seller starts from weakness.',
    kicker: 'Quality risk',
  },
  {
    index: '03',
    title: 'Weather advice, crop tasks, and subsidy timing stay fragmented.',
    body: 'District advisories exist, but they do not usually flow into one simple seasonal operating rhythm for the farmer.',
    kicker: 'Timing risk',
  },
]

const RHYTHM = [
  {
    eyebrow: 'Inspect',
    title: 'Start from the lot in front of you.',
    body: 'Capture the crop batch, detect the crop, and convert visible quality into a grade the farmer can stand behind.',
    to: '/grade',
    cta: 'Open grading desk',
    Icon: CameraIcon,
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1400&q=80&auto=format&fit=crop',
  },
  {
    eyebrow: 'Compare',
    title: 'See the mandi as net value, not noise.',
    body: 'Rank destinations by what remains after freight, not by the loudest headline price in the market.',
    to: '/market',
    cta: 'Open mandi atlas',
    Icon: ChartIcon,
    image: 'https://images.unsplash.com/photo-1517022812141-23620dba5c23?w=1400&q=80&auto=format&fit=crop',
  },
  {
    eyebrow: 'Negotiate',
    title: 'Carry grade-backed leverage into the deal.',
    body: 'Protect the reservation floor, speak in Hinglish when needed, and track each counter like a real live mandi desk.',
    to: '/negotiate',
    cta: 'Open negotiation desk',
    Icon: ScaleIcon,
    image: 'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?w=1400&q=80&auto=format&fit=crop',
  },
  {
    eyebrow: 'Plan',
    title: 'Keep the season readable after the sale too.',
    body: 'Turn weather, crop tasks, photo checks, and subsidy watch into one calmer weekly planning surface.',
    to: '/grow',
    cta: 'Open grow workspace',
    Icon: SproutIcon,
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&q=80&auto=format&fit=crop',
  },
]

const CAPABILITIES = [
  {
    title: 'Hinglish voice support',
    body: 'Speak instead of typing when the farmer is moving fast or the field is not a desk.',
    Icon: MicIcon,
    tone: 'leaf',
  },
  {
    title: 'Weather-aware crop rhythm',
    body: 'Shape weekly work with advisory context instead of treating weather as a disconnected widget.',
    Icon: RainIcon,
    tone: 'rain',
  },
  {
    title: 'Scheme and subsidy watch',
    body: 'Surface support signals closer to the crop workflow instead of hiding them in a separate search journey.',
    Icon: SubsidyIcon,
    tone: 'millet',
  },
  {
    title: 'Farmer-first guardrails',
    body: 'Reservation floors, clearer transcripts, and one coherent path from evidence to selling decision.',
    Icon: ShieldIcon,
    tone: 'default',
  },
]

const SOURCE_LINES = [
  'Mandi comparison shaped around price discovery and route economics.',
  'Season planning informed by weather advisories and crop-task timing.',
  'Photo-led grading so negotiation starts from visible evidence.',
  'A Bharat-first interface with voice, Hinglish, and no sign-up wall at the front.',
]

export default function Landing() {
  const lenisRef = useRef(null)

  const scrollTo = (id) => {
    lenisRef.current?.scrollTo(document.querySelector(id), { offset: -72, duration: 1.1 })
  }

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })
    lenisRef.current = lenis
    const rafFn = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(rafFn)
    gsap.ticker.lagSmoothing(0)
    lenis.on('scroll', ScrollTrigger.update)

    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    heroTl
      .from('.ld-nav', { y: -30, autoAlpha: 0, duration: 0.6 })
      .from('.ld-hero-copy > *', { y: 30, autoAlpha: 0, duration: 0.6, stagger: 0.08 }, '-=0.22')
      .from('.ld-hero-visual', { y: 34, autoAlpha: 0, scale: 0.985, duration: 0.72 }, '-=0.42')

    gsap.fromTo('.ld-hero-image', { scale: 1.12 }, {
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: '.ld-hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    })

    gsap.fromTo('.ld-value-meter', { scaleX: 0.18 }, {
      scaleX: 1,
      transformOrigin: 'left center',
      ease: 'none',
      scrollTrigger: {
        trigger: '.ld-value-section',
        start: 'top 72%',
        end: 'bottom 38%',
        scrub: true,
      },
    })

    gsap.utils.toArray('.ld-reveal').forEach((el) => {
      gsap.from(el, {
        y: 34,
        autoAlpha: 0,
        duration: 0.72,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 84%', once: true },
      })
    })

    gsap.utils.toArray('.ld-rhythm-strip').forEach((el, index) => {
      gsap.from(el, {
        x: index % 2 === 0 ? -34 : 34,
        autoAlpha: 0,
        duration: 0.76,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 82%', once: true },
      })
    })

    return () => {
      heroTl.kill()
      lenis.destroy()
      gsap.ticker.remove(rafFn)
      gsap.ticker.lagSmoothing(60, 1000)
      ScrollTrigger.getAll().forEach((st) => st.kill())
    }
  }, [])

  return (
    <div className="overflow-x-hidden bg-transparent text-[var(--mist-100)]">
      <nav className="ld-nav fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[rgba(14,12,9,0.72)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--leaf-400),var(--leaf-600))] text-white shadow-[0_14px_34px_rgba(79,111,44,0.28)]">
              <LeafIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight">KrishiDoot<span className="text-[var(--leaf-300)]">.AI</span></p>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--mist-500)]">Field to mandi system</p>
            </div>
          </Link>
          <div className="hidden items-center gap-6 text-sm text-[var(--mist-400)] md:flex">
            <button onClick={() => scrollTo('#leaks')} className="transition hover:text-[var(--mist-100)]">Why value leaks</button>
            <button onClick={() => scrollTo('#system')} className="transition hover:text-[var(--mist-100)]">How it works</button>
            <button onClick={() => scrollTo('#trust')} className="transition hover:text-[var(--mist-100)]">Why trust it</button>
          </div>
          <Link to="/grade" className="rounded-full border border-[rgba(124,175,77,0.24)] bg-[rgba(124,175,77,0.12)] px-4 py-2 text-sm font-medium text-[var(--leaf-300)] transition hover:bg-[rgba(124,175,77,0.18)]">
            Open app
          </Link>
        </div>
      </nav>

      <section className="ld-hero relative min-h-screen overflow-hidden pt-16">
        <div
          className="ld-hero-image absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&q=80&auto=format&fit=crop)' }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(96deg,rgba(12,11,8,0.94)_0%,rgba(12,11,8,0.68)_47%,rgba(12,11,8,0.88)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,169,108,0.24),transparent_26%)]" />

        <div className="relative z-10 grid min-h-[calc(100vh-64px)] items-end px-4 pb-10 pt-10 md:px-6">
          <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-end">
            <div className="ld-hero-copy max-w-xl space-y-6 pb-4 lg:pb-10">
              <StatusBadge tone="leaf">AI for the mandi, and the season before it</StatusBadge>
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--millet-300)]">Built for farmers who sell into uncertainty</p>
                <h1 className="font-display text-[clamp(3.25rem,7vw,6.3rem)] leading-[0.92] text-[var(--mist-100)]">
                  Stop losing money in the gap between crop quality, market price, and timing.
                </h1>
                <p className="max-w-lg text-base leading-7 text-[var(--mist-300)] md:text-lg">
                  KrishiDoot turns crop grading, mandi comparison, negotiation support, and weather-aware planning into one coherent operating system for the farmer.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to="/grade" className="flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--leaf-400),var(--leaf-600))] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(79,111,44,0.28)]">
                  Start with crop grading
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <button onClick={() => scrollTo('#system')} className="rounded-full border border-white/10 bg-[rgba(255,255,255,0.05)] px-6 py-3 text-sm font-medium text-[var(--mist-200)] transition hover:bg-[rgba(255,255,255,0.09)]">
                  See the workflow
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {HERO_SIGNALS.map((item) => (
                  <div key={item.label} className="border-t border-white/12 pt-4">
                    <p className="font-display text-3xl text-[var(--mist-100)]">{item.value}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--mist-400)]">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="ld-hero-visual lg:pl-10">
              <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[rgba(14,12,9,0.38)] shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
                <img
                  src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1600&q=80&auto=format&fit=crop"
                  alt="Fresh produce on a grading table"
                  className="h-[540px] w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,8,0.16)_0%,rgba(10,10,8,0.68)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                  <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[28px] border border-white/12 bg-[rgba(14,12,9,0.74)] p-5 backdrop-blur-md">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--millet-300)]">Live farmer desk</p>
                      <p className="mt-2 max-w-sm font-display text-3xl leading-tight text-[var(--mist-100)]">
                        One surface where crop proof, market route, and ask price can finally talk to each other.
                      </p>
                    </div>

                    <div className="rounded-[28px] border border-[rgba(124,175,77,0.18)] bg-[rgba(12,11,8,0.82)] p-5 backdrop-blur-md">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--mist-500)]">Signal chain</p>
                        <StatusBadge tone="leaf">Ready</StatusBadge>
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-start justify-between gap-3 border-b border-white/8 pb-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-[var(--mist-500)]">Grade confidence</p>
                            <p className="mt-1 font-display text-3xl text-[var(--leaf-300)]">A</p>
                          </div>
                          <p className="max-w-[10rem] text-right text-xs leading-5 text-[var(--mist-400)]">Photo-backed evidence before the first buyer offer.</p>
                        </div>
                        <div className="flex items-start justify-between gap-3 border-b border-white/8 pb-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-[var(--mist-500)]">Best route</p>
                            <p className="mt-1 font-display text-3xl text-[var(--mist-100)]">Rs.28.50/kg</p>
                          </div>
                          <p className="max-w-[10rem] text-right text-xs leading-5 text-[var(--mist-400)]">Net value after freight, not the nearest default.</p>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-[var(--mist-500)]">Season rhythm</p>
                            <p className="mt-1 font-display text-3xl text-[var(--millet-300)]">Weekly</p>
                          </div>
                          <p className="max-w-[10rem] text-right text-xs leading-5 text-[var(--mist-400)]">Weather, crop tasks, and subsidy watch in one line of sight.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="leaks" className="ld-value-section border-y border-white/8 bg-[rgba(255,255,255,0.02)] py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 md:px-6 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="space-y-5 lg:sticky lg:top-24 lg:self-start lg:pr-8">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--millet-300)]">Why value leaks</p>
            <h2 className="font-display text-[clamp(2.35rem,4vw,4.2rem)] leading-[0.95] text-[var(--mist-100)]">
              The farmer is usually forced to combine four separate decisions with almost no shared visibility.
            </h2>
            <p className="max-w-md text-sm leading-7 text-[var(--mist-400)]">
              Market information, grade evidence, weather advisories, and selling strategy exist, but they rarely arrive in one workflow that feels built for actual farm pressure.
            </p>
            <div className="rounded-full bg-white/8 p-1">
              <div className="ld-value-meter h-2 rounded-full bg-[linear-gradient(90deg,var(--leaf-400),var(--millet-300))]" />
            </div>
          </div>

          <div className="space-y-0">
            {VALUE_LEAKS.map((item) => (
              <article key={item.title} className="ld-reveal grid gap-4 border-t border-white/8 py-6 md:grid-cols-[110px_minmax(0,1fr)] md:gap-6">
                <div className="space-y-2">
                  <p className="font-display text-5xl leading-none text-[var(--mist-200)]/70">{item.index}</p>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--millet-300)]">{item.kicker}</p>
                </div>
                <div>
                  <p className="font-display text-3xl leading-tight text-[var(--mist-100)]">{item.title}</p>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--mist-400)]">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="system" className="py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="ld-reveal mb-12 max-w-2xl space-y-3">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--millet-300)]">Operating rhythm</p>
            <h2 className="font-display text-[clamp(2.3rem,4vw,4.1rem)] leading-[0.96] text-[var(--mist-100)]">
              A cleaner field-to-sale sequence, instead of four tools pretending they are not connected.
            </h2>
            <p className="text-sm leading-7 text-[var(--mist-400)]">
              Each step has one job. Together they form a stronger farmer workflow that starts from the lot, not from admin overhead.
            </p>
          </div>

          <div className="space-y-8">
            {RHYTHM.map(({ eyebrow, title, body, to, cta, Icon, image }) => (
              <div key={title} className="ld-rhythm-strip grid gap-4 rounded-[32px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4 md:grid-cols-[0.94fr_1.06fr] md:p-5">
                <div className="overflow-hidden rounded-[26px]">
                  <img src={image} alt={title} className="h-full min-h-[280px] w-full object-cover" />
                </div>
                <div className="flex flex-col justify-between gap-5 rounded-[26px] border border-white/8 bg-[rgba(13,12,9,0.56)] p-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/10 bg-white/5 text-[var(--leaf-300)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--millet-300)]">{eyebrow}</p>
                    </div>
                    <p className="mt-5 max-w-xl font-display text-4xl leading-tight text-[var(--mist-100)]">{title}</p>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--mist-400)]">{body}</p>
                  </div>
                  <Link to={to} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--leaf-300)]">
                    {cta}
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-[rgba(255,255,255,0.02)] py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="ld-reveal mb-10 max-w-2xl space-y-3">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--millet-300)]">Useful in the field</p>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.8rem)] leading-[0.97] text-[var(--mist-100)]">
              Practical support that respects Bharat conditions, not just desktop demos.
            </h2>
            <p className="text-sm leading-7 text-[var(--mist-400)]">
              The interface should help when connectivity is uneven, time is short, and the farmer wants action faster than explanation.
            </p>
          </div>

          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={18}
            slidesPerView={1.05}
            breakpoints={{ 760: { slidesPerView: 2.05 }, 1120: { slidesPerView: 4 } }}
            autoplay={{ delay: 3400, disableOnInteraction: false, pauseOnMouseEnter: true }}
            pagination={{ clickable: true }}
            loop
            style={{ paddingBottom: '48px' }}
          >
            {CAPABILITIES.map(({ title, body, Icon, tone }) => (
              <SwiperSlide key={title} style={{ height: 'auto' }}>
                <SurfaceCard className="ld-reveal h-full p-5">
                  <div className="flex h-full flex-col justify-between gap-10">
                    <div>
                      <StatusBadge tone={tone}>{title}</StatusBadge>
                      <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-[20px] border border-white/10 bg-white/5 text-[var(--mist-100)]">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div>
                      <p className="font-display text-3xl leading-tight text-[var(--mist-100)]">{title}</p>
                      <p className="mt-3 text-sm leading-7 text-[var(--mist-400)]">{body}</p>
                    </div>
                  </div>
                </SurfaceCard>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      <section id="trust" className="py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="ld-reveal space-y-5 lg:pr-10">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--millet-300)]">Why trust it</p>
            <h2 className="font-display text-[clamp(2.25rem,4vw,4rem)] leading-[0.96] text-[var(--mist-100)]">
              The goal is not just a nicer interface. It is a clearer farmer decision surface.
            </h2>
            <p className="max-w-md text-sm leading-7 text-[var(--mist-400)]">
              KrishiDoot is strongest when it feels grounded in how farmers actually work: crop in hand, mandi uncertainty, weather pressure, and seasonal memory all at once.
            </p>
            <SurfaceCard className="grain-surface overflow-hidden p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/10 bg-white/5 text-[var(--leaf-300)]">
                  <TimelineIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--mist-500)]">Design principle</p>
                  <p className="mt-1 font-display text-3xl text-[var(--mist-100)]">One chain of decisions, not four disconnected screens.</p>
                </div>
              </div>
            </SurfaceCard>
          </div>

          <div className="space-y-0">
            {SOURCE_LINES.map((line, index) => (
              <div key={line} className="ld-reveal grid gap-4 border-t border-white/8 py-5 md:grid-cols-[90px_minmax(0,1fr)] md:gap-6">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--mist-500)]">Signal {String(index + 1).padStart(2, '0')}</p>
                <p className="font-display text-[1.9rem] leading-tight text-[var(--mist-100)]">{line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="pb-20">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <SurfaceCard className="grain-surface overflow-hidden px-6 py-12 text-center md:px-12">
            <div className="mx-auto max-w-2xl space-y-5">
              <StatusBadge tone="leaf">No sign-up wall</StatusBadge>
              <h2 className="font-display text-[clamp(2.4rem,4vw,4.25rem)] leading-[0.95] text-[var(--mist-100)]">
                Start from the crop lot in front of you, and let the rest of the workflow stay coherent.
              </h2>
              <p className="text-sm leading-7 text-[var(--mist-400)] md:text-base">
                Grade the harvest, compare the right mandi, negotiate with a floor, and keep the season readable before the next sale cycle starts again.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Link to="/grade" className="rounded-full bg-[linear-gradient(135deg,var(--leaf-400),var(--leaf-600))] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(79,111,44,0.28)]">Grade the crop</Link>
                <Link to="/grow" className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-[var(--mist-200)]">Open crop journey</Link>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </section>
    </div>
  )
}
