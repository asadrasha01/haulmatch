import React, { useCallback, useEffect, useRef, useState } from 'react';
import { startHeroCanvas } from './heroCanvas';

export interface QuickStartPrefill {
  cdlClass: 'Class A' | 'Class B';
  yearsExperience: number;
  zip: string;
}

interface DriverHomeProps {
  onCarrierLogin: () => void;
  onQuickStart: (prefill: QuickStartPrefill) => void;
  onOpenStatusPortal?: () => void;
  scrollToId: (id: string) => void;
  applicationSlot: React.ReactNode;
}

/* ------------------------------ design tokens ----------------------------- */
const INK = '#121315';
const DEEP = '#0c0d0f';
const PAPER = '#f3f0e9';
const PAPER_ALT = '#e9e5dc';
const AMBER = '#f0a23b';
const AMBER_TEXT = '#b86d0e';
const BODY = '#45474b';
const MUTED = '#5d5f63';
const MUTED2 = '#6a6c70';
const RULE = 'rgba(18,19,21,0.12)';

const DISPLAY = "'Barlow Condensed', sans-serif";
const MONO = "'IBM Plex Mono', monospace";

const SIDE_PAD = 'clamp(20px, 4vw, 48px)';
const SECTION_PAD = 'clamp(72px, 9vw, 128px)';

const mono = (size: number, color: string, spacing = '0.1em'): React.CSSProperties => ({
  fontFamily: MONO,
  fontSize: size,
  letterSpacing: spacing,
  textTransform: 'uppercase',
  color
});

const h2Style: React.CSSProperties = {
  margin: 0,
  fontFamily: DISPLAY,
  fontWeight: 800,
  fontSize: 'clamp(44px, 6vw, 84px)',
  lineHeight: 0.92,
  textTransform: 'uppercase'
};

const container: React.CSSProperties = {
  maxWidth: 1320,
  margin: '0 auto',
  padding: `0 ${SIDE_PAD}`
};

/* ------------------------------- sample data ------------------------------ */
const EQ: Record<string, number> = { 'Dry van': 0.58, Reefer: 0.62, Flatbed: 0.66, Tanker: 0.68 };
const EX: Record<string, number> = { 'Under 1': 0, '1–2 yrs': 0.03, '3–5 yrs': 0.06, '5+ yrs': 0.09 };
const HM: Record<string, [number, number]> = { OTR: [2900, 0], Regional: [2450, 0.02], Local: [1900, 0.05] };

const PRIVACY_PROFILES = [
  {
    id: 'HM-20418',
    tag: 'Reefer',
    fluency: 98,
    phone: '(214) 555-0187',
    email: 'r.cole@mailbox.com',
    specs: [
      ['CDL', 'Class A · 4 yrs'],
      ['Endorsements', 'HazMat, Tanker'],
      ['Equipment', 'Reefer, Dry van'],
      ['Home-time', 'Every 2 weeks']
    ] as const,
    clips: [
      {
        code: 'Q1',
        shortLabel: 'Experience',
        title: 'Q1 · Equipment & Regional Lanes',
        startSec: 0,
        durationSec: 42,
        stamp: '0:00–0:42',
        transcript:
          'Four years running 53-ft temperature-controlled reefer and dry van freight across Texas and the Midwest, averaging 2,750 miles a week with zero service failures.'
      },
      {
        code: 'Q2',
        shortLabel: 'Safety & HOS',
        title: 'Q2 · Pre-Trip, ELD & Weather',
        startSec: 42,
        durationSec: 42,
        stamp: '0:42–1:24',
        transcript:
          'Every shift starts with a 15-minute walk-around—fifth wheel locking jaws, brake air lines, and tires. Clean MVR and zero HOS violations on Samsara ELD.'
      },
      {
        code: 'Q3',
        shortLabel: 'Home-Time',
        title: 'Q3 · Fleet Fit & Retention',
        startSec: 84,
        durationSec: 36,
        stamp: '1:24–2:00',
        transcript:
          'Looking for a regional carrier that honors bi-weekly 48-hour home resets and keeps late-model sleepers maintained so I can stay long-term.'
      }
    ] as const
  },
  {
    id: 'CDL-6319',
    tag: 'Flatbed',
    fluency: 96,
    phone: '(312) 555-4421',
    email: 'd.kowalski@outlook.com',
    specs: [
      ['CDL', 'Class A · 11 yrs'],
      ['Endorsements', 'Tanker, Doubles, TWIC'],
      ['Equipment', 'Flatbed, Stepdeck'],
      ['Home-time', 'Every weekend']
    ] as const,
    clips: [
      {
        code: 'Q1',
        shortLabel: 'Experience',
        title: 'Q1 · Securement & Heavy Haul',
        startSec: 0,
        durationSec: 42,
        stamp: '0:00–0:42',
        transcript:
          'Over a decade pulling flatbed and conestoga trailers across the Midwest and Northeast. Expert in steel coil securement, chains, straps, and corner protectors.'
      },
      {
        code: 'Q2',
        shortLabel: 'Safety & HOS',
        title: 'Q2 · Load Checks & DOT Compliance',
        startSec: 42,
        durationSec: 42,
        stamp: '0:42–1:24',
        transcript:
          'Always re-check load tension within the first 50 miles as mandated by DOT. Eleven years with zero cargo shifts, clean MVR, and 100% compliant ELD logs.'
      },
      {
        code: 'Q3',
        shortLabel: 'Home-Time',
        title: 'Q3 · Fleet Fit & Retention',
        startSec: 84,
        durationSec: 36,
        stamp: '1:24–2:00',
        transcript:
          'Looking for a regional flatbed fleet where weekend home-time is honored and tarp pay is fair. Ready to commit long-term and earn the 90-day stay bonus.'
      }
    ] as const
  },
  {
    id: 'CDL-9943',
    tag: 'Tanker',
    fluency: 97,
    phone: '(317) 555-7164',
    email: 'c.mendoza@yahoo.com',
    specs: [
      ['CDL', 'Class A · 8 yrs'],
      ['Endorsements', 'HazMat + Tanker (X), TWIC'],
      ['Equipment', 'Liquid & Pneumatic Tanker'],
      ['Home-time', 'Every weekend']
    ] as const,
    clips: [
      {
        code: 'Q1',
        shortLabel: 'Experience',
        title: 'Q1 · HazMat & Pressurized Tanker',
        startSec: 0,
        durationSec: 42,
        stamp: '0:00–0:42',
        transcript:
          'Eight years commercial driving with five years pulling smooth-bore and baffled liquid tankers. TSA background-cleared with active TWIC for port and refinery entry.'
      },
      {
        code: 'Q2',
        shortLabel: 'Safety & HOS',
        title: 'Q2 · Surge Control & Valve Checks',
        startSec: 42,
        durationSec: 42,
        stamp: '0:42–1:24',
        transcript:
          'Liquid surge requires smooth progressive braking and taking ramps 10–15 mph below advisory speed. I inspect discharge valves and gaskets at every single stop.'
      },
      {
        code: 'Q3',
        shortLabel: 'Home-Time',
        title: 'Q3 · Fleet Fit & Retention',
        startSec: 84,
        durationSec: 36,
        stamp: '1:24–2:00',
        transcript:
          'Seeking a safety-first chemical or bulk carrier with well-maintained tanker trailers and hourly detention/loading pay.'
      }
    ] as const
  }
] as const;

const WAVE_BARS = [
  0.34, 0.62, 0.48, 0.85, 0.72, 0.4, 0.92, 0.66, 0.52, 0.78, 0.96, 0.58,
  0.44, 0.82, 0.7, 0.38, 0.88, 0.64, 0.5, 0.76, 0.9, 0.55, 0.42, 0.68
] as const;

const STATS = [
  { to: 1480, pre: '', suf: '', dec: 0, label: 'Verified drivers placed' },
  { to: 94.8, pre: '', suf: '%', dec: 1, label: 'Still driving at day 90' },
  { to: 2.1, pre: '$', suf: 'M', dec: 1, label: 'Bonuses paid to drivers' },
  { to: 48, pre: '', suf: ' hrs', dec: 0, label: 'Median time to first offer' }
] as const;

const STOPS = [
  {
    mile: 'MILE 01', time: '3 min', timeColor: INK, title: 'Apply once',
    body: 'CDL class, endorsements, equipment, home-time and pay target. One form, saved for every fleet.'
  },
  {
    mile: 'MILE 02', time: '2 min', timeColor: INK, title: 'Record your intro',
    body: 'Answer a few on-screen questions from your phone. Carriers meet a driver, not a résumé.'
  },
  {
    mile: 'MILE 03', time: '~48 hrs', timeColor: INK, title: 'Carriers compete',
    body: 'Offers arrive with CPM, weekly pay and home-time in writing. Your contact stays hidden until you say yes.'
  },
  {
    mile: 'MILE 04', time: 'Day 90', timeColor: AMBER_TEXT, title: 'Collect $1,500',
    body: 'Stay 90 days with the carrier you chose and we pay you directly. No strings, no clawback games.'
  }
] as const;

const COMPARE_ROWS = [
  ['Applications', '15 separate forms', 'One, shared with every vetted fleet'],
  ['Your phone number', 'Passed around on day one', 'Hidden until a carrier signs our agreement'],
  ['Pay', '"Up to" ranges, details on the call', 'CPM and weekly pay in writing, before you talk'],
  ["After you're hired", "You're on your own", 'A driver agent, plus $1,500 at day 90']
] as const;

const ROAD_MARKERS = ['Apply', 'How it works', 'The $1,500', 'Compare', 'Destination'];

const mask = (s: string, n: number) => s.slice(0, n) + s.slice(n).replace(/[A-Za-z0-9]/g, '•');

/* -------------------------------- component ------------------------------- */
export const DriverHome: React.FC<DriverHomeProps> = ({
  onCarrierLogin,
  onQuickStart,
  onOpenStatusPortal,
  scrollToId,
  applicationSlot
}) => {
  /* state */
  const [calc, setCalc] = useState({ equip: 'Reefer', exp: '1–2 yrs', home: 'Regional', zip: '' });
  const [day, setDay] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const still =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return still || !('IntersectionObserver' in window) ? 47 : 0;
  });
  const [unlocked, setUnlocked] = useState(false);
  const [reveal, setReveal] = useState(0);
  const [profileIdx, setProfileIdx] = useState<0 | 1 | 2>(0);
  const [vidPlaying, setVidPlaying] = useState(false);
  const [vidChapter, setVidChapter] = useState<0 | 1 | 2>(0);
  const [vidTick, setVidTick] = useState(0);
  const [qsLicense, setQsLicense] = useState('Class A CDL');
  const [qsExp, setQsExp] = useState('1–2 years');
  const [qsZip, setQsZip] = useState('');

  const dayTouched = useRef(false);
  const revealTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  /* element refs (design-handoff scroll choreography) */
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const roadRef = useRef<HTMLDivElement | null>(null);
  const trailRef = useRef<HTMLDivElement | null>(null);
  const rigRef = useRef<HTMLDivElement | null>(null);
  const rigInnerRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const routeRef = useRef<HTMLDivElement | null>(null);
  const routeFillRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<Array<HTMLDivElement | null>>([]);
  const secsRef = useRef<Array<HTMLElement | null>>([]);
  const revealsRef = useRef<HTMLElement[]>([]);
  const countsRef = useRef<HTMLElement[]>([]);
  const stepsRef = useRef<HTMLElement[]>([]);
  const lastY = useRef(0);

  const setMarker = (el: HTMLDivElement | null, i: number) => { markersRef.current[i] = el; };
  const setSec = (i: number) => (el: HTMLElement | null) => { secsRef.current[i] = el; };
  const setReveal_ = useCallback((el: HTMLElement | null) => {
    if (el && revealsRef.current.indexOf(el) < 0) revealsRef.current.push(el);
  }, []);
  const setCount = useCallback((el: HTMLElement | null) => {
    if (el && countsRef.current.indexOf(el) < 0) countsRef.current.push(el);
  }, []);
  const setStep = useCallback((el: HTMLElement | null) => {
    if (el && stepsRef.current.indexOf(el) < 0) stepsRef.current.push(el);
  }, []);

  /* hero canvas */
  useEffect(() => {
    if (!canvasRef.current) return;
    return startHeroCanvas(canvasRef.current, '/truck-wet.png');
  }, []);

  /* scroll choreography: right-edge road, route fill, sticky bar */
  useEffect(() => {
    let raf = 0;
    let glide = 0;
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // The rig eases toward its scroll target every frame instead of snapping,
    // so it glides smoothly on touch devices where native scroll is jumpy.
    const rig = { current: 10, target: 10 };
    const paintRig = () => {
      glide = 0;
      const delta = rig.target - rig.current;
      rig.current = Math.abs(delta) < 0.15 ? rig.target : rig.current + delta * 0.14;
      if (rigRef.current) rigRef.current.style.transform = `translate3d(0, ${rig.current - 10}px, 0)`;
      if (trailRef.current) trailRef.current.style.height = `${Math.max(0, rig.current + 10)}px`;
      if (rig.current !== rig.target) glide = requestAnimationFrame(paintRig);
    };

    const update = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      const max = Math.max(1, document.documentElement.scrollHeight - vh);
      const prog = Math.min(1, Math.max(0, y / max));
      const road = roadRef.current;
      if (road) {
        const span = road.clientHeight - 20 - 70;
        rig.target = 10 + prog * span;
        if (reduceMotion) {
          rig.current = rig.target;
          paintRig();
        } else if (!glide) {
          glide = requestAnimationFrame(paintRig);
        }
        if (rigInnerRef.current && Math.abs(y - lastY.current) > 2) {
          rigInnerRef.current.style.transform = y < lastY.current ? 'rotate(180deg)' : 'none';
        }
        markersRef.current.forEach((m, i) => {
          const s = secsRef.current[i];
          if (!m || !s) return;
          const mp = Math.min(1, Math.max(0, (s.offsetTop - (i ? vh * 0.2 : 0)) / max));
          m.style.top = `${10 + mp * span + 52}px`;
          m.style.transform = 'translateY(-50%)';
          const lbl = m.firstChild as HTMLElement | null;
          if (lbl) lbl.style.opacity = Math.abs(mp - prog) < 0.05 ? '1' : '0';
        });
      }
      const sticky = stickyRef.current;
      if (sticky) {
        const smallScreen = window.innerWidth < 760;
        const show = smallScreen && y > vh * 0.85 && y < max - vh * 0.6;
        sticky.style.display = smallScreen ? 'flex' : 'none';
        sticky.style.transform = show ? 'none' : 'translateY(120%)';
        sticky.style.opacity = show ? '1' : '0';
      }
      lastY.current = y;
      const route = routeRef.current;
      if (route) {
        const r = route.getBoundingClientRect();
        const rp = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (vh * 0.55)));
        if (routeFillRef.current) routeFillRef.current.style.width = `${rp * 100}%`;
        stepsRef.current.forEach((s, i) => {
          const on = rp >= i / 4 + 0.02;
          s.style.opacity = on ? '1' : '0.28';
          s.style.transform = on ? 'none' : 'translateY(8px)';
        });
      }
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; update(); });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(glide);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  /* reveal-on-scroll + counters + day-tracker auto-run */
  useEffect(() => {
    const still =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still || !('IntersectionObserver' in window)) {
      return;
    }
    const reveals = revealsRef.current;
    const counts = countsRef.current;
    reveals.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(28px)';
      el.style.transition = 'opacity .9s ease, transform 1.1s cubic-bezier(.16,.84,.24,1)';
    });
    stepsRef.current.forEach((el) => {
      el.style.transition = 'opacity .5s ease, transform .6s cubic-bezier(.16,.84,.24,1)';
    });
    const countUp = (el: HTMLElement) => {
      const to = Number(el.dataset.to);
      const dec = Number(el.dataset.dec);
      const pre = el.dataset.pre || '';
      const suf = el.dataset.suf || '';
      const t0 = performance.now();
      const D = 1400;
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / D);
        const e = 1 - Math.pow(1 - k, 3);
        el.textContent =
          pre +
          (to * e).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) +
          suf;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const runDays = () => {
      if (dayTouched.current) return;
      const t0 = performance.now();
      const D = 1800;
      const step = (now: number) => {
        if (dayTouched.current) return;
        const k = Math.min(1, (now - t0) / D);
        const e = 1 - Math.pow(1 - k, 3);
        setDay(Math.round(47 * e));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          io.unobserve(el);
          if (reveals.indexOf(el) >= 0) {
            el.style.opacity = '1';
            el.style.transform = 'none';
          }
          if (counts.indexOf(el) >= 0) countUp(el);
          if (el === secsRef.current[2]) runDays();
        });
      },
      { threshold: 0.25 }
    );
    reveals.concat(counts).forEach((el) => io.observe(el));
    if (secsRef.current[2]) io.observe(secsRef.current[2]!);
    return () => io.disconnect();
  }, []);

  /* privacy demo */
  useEffect(() => () => { if (revealTimer.current) clearInterval(revealTimer.current); }, []);

  useEffect(() => {
    if (!vidPlaying) return;
    const id = setInterval(() => {
      setVidTick((prev) => {
        const next = prev + 1;
        if (next >= 40) {
          setVidChapter((c) => ((c + 1) % 3) as 0 | 1 | 2);
          return 0;
        }
        return next;
      });
    }, 150);
    return () => clearInterval(id);
  }, [vidPlaying]);

  const onUnlock = () => {
    if (revealTimer.current) clearInterval(revealTimer.current);
    if (unlocked) {
      setUnlocked(false);
      setReveal(0);
      return;
    }
    setUnlocked(true);
    setReveal(0);
    let n = 0;
    revealTimer.current = setInterval(() => {
      n++;
      setReveal(n);
      if (n >= 16 && revealTimer.current) clearInterval(revealTimer.current);
    }, 55);
  };

  /* calculator values (sample formula from the handoff — wire to real offers) */
  const cpm = EQ[calc.equip] + EX[calc.exp] + HM[calc.home][1];
  const mi = HM[calc.home][0];
  const lo = cpm - 0.02;
  const hi = cpm + 0.02;
  const r10 = (v: number) => Math.round(v / 10) * 10;
  const usd = (v: number) => '$' + v.toLocaleString('en-US');
  const zipOk = calc.zip.length === 5;
  const weekly = usd(r10(lo * mi)) + '–' + usd(r10(hi * mi)).slice(1);
  const cpmText = '$' + lo.toFixed(2) + '–' + hi.toFixed(2);
  const yearly =
    '$' + Math.round((lo * mi * 50) / 1000) + 'k–' + Math.round((hi * mi * 50) / 1000) + 'k';
  const offers = zipOk ? `${6 + (parseInt(calc.zip, 10) % 17)} near ${calc.zip}` : 'Enter ZIP';
  const activeProfile = PRIVACY_PROFILES[profileIdx];
  const n16 = unlocked ? reveal : 0;
  const phoneText = mask(activeProfile.phone, Math.round((n16 / 16) * activeProfile.phone.length));
  const emailText = mask(activeProfile.email, Math.round((n16 / 16) * activeProfile.email.length));
  const left = 90 - day;
  const dayNote = left > 0 ? `${left} days to $1,500` : '$1,500 sent';

  const chip = (label: string, selected: boolean, pick: () => void) => (
    <button
      key={label}
      type="button"
      onClick={pick}
      style={{
        padding: '10px 16px',
        fontSize: 15,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        border: `1px solid ${selected ? INK : 'rgba(18,19,21,0.25)'}`,
        background: selected ? INK : 'transparent',
        color: selected ? '#fff' : INK,
        borderRadius: 0
      }}
    >
      {label}
    </button>
  );

  const chipGroup = (label: string, options: string[], key: 'equip' | 'exp' | 'home') => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={mono(11, MUTED)}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map((o) => chip(o, calc[key] === o, () => setCalc((c) => ({ ...c, [key]: o }))))}
      </div>
    </div>
  );

  const anchor = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToId(id);
  };

  const onQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cdlClass: 'Class A' | 'Class B' = qsLicense === 'Class B CDL' ? 'Class B' : 'Class A';
    const years =
      qsExp === 'Under 1 year' ? 0 : qsExp === '1–2 years' ? 1 : qsExp === '3–5 years' ? 4 : 6;
    onQuickStart({ cdlClass, yearsExperience: years, zip: qsZip });
  };

  const heroFieldLabel = mono(11, 'rgba(255,255,255,0.5)');
  const heroField: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '14px 18px',
    background: 'rgba(14,15,17,0.86)'
  };
  const heroInput: React.CSSProperties = {
    appearance: 'none',
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: 17,
    fontWeight: 500,
    padding: 0,
    outline: 'none',
    cursor: 'pointer',
    borderRadius: 0
  };

  const markerLabel: React.CSSProperties = {
    ...mono(11, '#fff', '0.08em'),
    whiteSpace: 'nowrap',
    background: INK,
    padding: '4px 8px',
    opacity: 0,
    transition: 'opacity .3s'
  };

  const dark = { background: INK, color: '#fff' } as const;

  return (
    <div className="hm-page" style={{ fontFamily: "'Barlow', system-ui, sans-serif", color: INK, background: PAPER }}>
      {/* ------------------------------ fixed header ------------------------------ */}
      <header
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: 'rgba(12,13,15,0.62)',
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <div
          className="hm-home-header-inner"
          style={{
            maxWidth: 1320, margin: '0 auto', padding: `14px ${SIDE_PAD}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24
          }}
        >
          <a href="#apply" onClick={anchor('apply')} style={{ display: 'flex', alignItems: 'baseline', gap: 10, color: '#fff' }}>
            <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 26, letterSpacing: '0.02em' }}>HAULMATCH</span>
            <span style={{ ...mono(11, 'rgba(255,255,255,0.55)', '0.08em'), textTransform: 'none' }}>CDL-A</span>
          </a>
          <nav
            className="hm-home-nav"
            style={{
              display: 'flex', alignItems: 'center', gap: 'clamp(14px, 2.4vw, 32px)',
              fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.82)',
              flexWrap: 'wrap', justifyContent: 'flex-end'
            }}
          >
            <a href="#how" onClick={anchor('how')} className="hm-hide-mobile">How it works</a>
            <a href="#bonus" onClick={anchor('bonus')} className="hm-hide-mobile">The $1,500</a>
            <a
              href="#carriers"
              onClick={(e) => { e.preventDefault(); onCarrierLogin(); }}
            >
              For carriers
            </a>
            {onOpenStatusPortal && (
              <a
                href="#status"
                onClick={(e) => { e.preventDefault(); onOpenStatusPortal(); }}
                style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}
              >
                Track Status
              </a>
            )}
            <a
              href="#driver-application"
              onClick={anchor('driver-application')}
              className="hm-btn-amber"
              style={{ padding: '10px 18px', background: AMBER, color: INK, fontWeight: 600 }}
            >
              Apply
            </a>
          </nav>
        </div>
      </header>

      {/* --------------------------- right-edge scroll road --------------------------- */}
      <div ref={roadRef} className="hm-scroll-road" style={{ position: 'fixed', right: 16, top: 92, bottom: 24, width: 26, zIndex: 40, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(18,19,21,0.6)', borderRadius: 13, backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />
        <div className="hm-road-line" style={{ position: 'absolute', left: 12, width: 2, top: 10, bottom: 10, background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.32) 0 8px, rgba(255,255,255,0) 8px 18px)' }} />
        <div ref={trailRef} className="hm-road-line" style={{ position: 'absolute', left: 12, width: 2, top: 10, height: 0, background: AMBER, willChange: 'height' }} />
        {ROAD_MARKERS.map((label, i) => (
          <div key={label} ref={(el) => setMarker(el, i)} style={{ position: 'absolute', right: 0, top: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="hm-road-label" style={markerLabel}>{label}</span>
            <span className="hm-road-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER, marginRight: 10 }} />
          </div>
        ))}
        <div ref={rigRef} className="hm-road-rig" style={{ position: 'absolute', left: 6, top: 10, width: 14, height: 70, willChange: 'transform' }}>
          <div
            ref={rigInnerRef}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              transition: 'transform .45s cubic-bezier(.4,0,.2,1)', transformOrigin: '50% 40%'
            }}
          >
            <div style={{ width: 14, height: 40, background: '#e9e6df', borderRadius: 2, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25)' }} />
            <div style={{ width: 14, height: 14, background: AMBER, borderRadius: '3px 3px 5px 5px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 2 }}>
              <div style={{ width: 10, height: 3, background: INK, borderRadius: 1 }} />
            </div>
            <div style={{ width: 22, height: 18, marginTop: -2, background: 'linear-gradient(to bottom, rgba(255,236,200,0.75), rgba(255,236,200,0))', clipPath: 'polygon(30% 0, 70% 0, 100% 100%, 0 100%)' }} />
          </div>
        </div>
      </div>

      {/* ----------------------------------- hero ----------------------------------- */}
      <section
        id="apply"
        ref={setSec(0)}
        style={{
          position: 'relative', minHeight: '100vh', background: DEEP,
          overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
        }}
      >
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '62% 52%', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,10,12,0.88) 0%, rgba(10,10,12,0.58) 34%, rgba(10,10,12,0.12) 58%, rgba(10,10,12,0) 76%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,12,0.45) 0%, rgba(10,10,12,0) 20%, rgba(10,10,12,0) 60%, rgba(10,10,12,0.88) 100%)' }} />

        <div style={{ position: 'relative', maxWidth: 1320, width: '100%', margin: '0 auto', padding: `clamp(88px, 11vh, 112px) ${SIDE_PAD} clamp(28px, 4.5vh, 44px)` }}>
          <div style={{ ...mono(11, AMBER, '0.14em'), marginBottom: 14 }}>
            CDL-A placement · 48 states · 40+ vetted fleets
          </div>
          <h1
            ref={setReveal_}
            style={{
              margin: 0, fontFamily: DISPLAY, fontWeight: 800,
              fontSize: 'clamp(42px, 5.4vw, 76px)', lineHeight: 0.92,
              letterSpacing: '-0.005em', textTransform: 'uppercase', color: '#fff', maxWidth: '14ch'
            }}
          >
            Get hired. Keep driving. <span style={{ color: AMBER }}>Pocket $1,500.</span>
          </h1>
          <p style={{ margin: '18px 0 0', maxWidth: 460, fontSize: 'clamp(15px, 1.15vw, 17px)', lineHeight: 1.5, color: 'rgba(255,255,255,0.82)', textWrap: 'pretty' }}>
            One application. A 2-minute video intro. Offers from carriers with pay and home-time in
            writing, and $1,500 from us when you hit day 90.
          </p>

          <form
            onSubmit={onQuickSubmit}
            style={{
              marginTop: 28, display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 1,
              background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.14)', maxWidth: 840
            }}
          >
            <label style={heroField}>
              <span style={heroFieldLabel}>License</span>
              <select value={qsLicense} onChange={(e) => setQsLicense(e.target.value)} style={heroInput}>
                <option>Class A CDL</option>
                <option>Class A permit (CLP)</option>
                <option>Class B CDL</option>
              </select>
            </label>
            <label style={heroField}>
              <span style={heroFieldLabel}>Experience</span>
              <select value={qsExp} onChange={(e) => setQsExp(e.target.value)} style={heroInput}>
                <option>Under 1 year</option>
                <option>1–2 years</option>
                <option>3–5 years</option>
                <option>5+ years</option>
              </select>
            </label>
            <label style={heroField}>
              <span style={heroFieldLabel}>Home ZIP</span>
              <input
                inputMode="numeric"
                maxLength={5}
                placeholder="75201"
                value={qsZip}
                onChange={(e) => setQsZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                style={{ ...heroInput, cursor: 'text', width: '100%' }}
              />
            </label>
            <button
              type="submit"
              className="hm-btn-amber"
              style={{
                border: 'none', background: AMBER, color: INK, fontWeight: 600, fontSize: 17,
                padding: '18px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: 12, whiteSpace: 'nowrap', borderRadius: 0
              }}
            >
              <span>Start application</span>
              <span>→</span>
            </button>
          </form>
          <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: '8px 24px', fontFamily: MONO, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
            <span>~3 minutes</span>
            <span>No recruiter calls</span>
            <span>Your number stays hidden</span>
          </div>
        </div>
      </section>

      {/* -------------------------------- stats strip -------------------------------- */}
      <section style={{ background: PAPER, borderBottom: `1px solid ${RULE}` }}>
        <div style={{ ...container, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {STATS.map((s, i) => (
            <div
              key={s.label}
              style={{
                padding: i === 0 ? '36px 24px 32px 0' : '36px 24px 32px',
                borderRight: i < STATS.length - 1 ? `1px solid ${RULE}` : 'none'
              }}
            >
              <div
                ref={setCount}
                data-to={s.to}
                data-pre={s.pre}
                data-suf={s.suf}
                data-dec={s.dec}
                style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 'clamp(44px, 5vw, 64px)', lineHeight: 1 }}
              >
                {s.pre + s.to.toLocaleString('en-US', { minimumFractionDigits: s.dec, maximumFractionDigits: s.dec }) + s.suf}
              </div>
              <div style={{ marginTop: 8, ...mono(12, MUTED, '0.06em') }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------- how it works -------------------------------- */}
      <section id="how" ref={setSec(1)} style={{ background: PAPER }}>
        <div style={{ ...container, padding: `${SECTION_PAD} ${SIDE_PAD}`, maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px 64px', alignItems: 'end', marginBottom: 64 }}>
            <h2 ref={setReveal_} style={h2Style}>
              Four stops.<br />One application.
            </h2>
            <p style={{ margin: 0, maxWidth: 460, fontSize: 18, lineHeight: 1.55, color: BODY, textWrap: 'pretty' }}>
              No more filling out the same form for fifteen fleets. You apply once; vetted carriers
              come to you with real numbers.
            </p>
          </div>

          <div
            ref={routeRef}
            style={{
              position: 'relative', display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: 0, borderTop: `3px solid ${INK}`
            }}
          >
            <div style={{ position: 'absolute', left: 0, right: 0, top: -3, height: 3, pointerEvents: 'none' }}>
              <div ref={routeFillRef} style={{ height: 3, width: '0%', background: AMBER }} />
            </div>
            {STOPS.map((s, i) => (
              <div key={s.mile} ref={setStep} style={{ padding: i === STOPS.length - 1 ? '28px 0 8px 0' : '28px 28px 8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: MONO, fontSize: 13, color: MUTED }}>{s.mile}</span>
                  <span style={{ fontFamily: MONO, fontSize: 13, color: s.timeColor, whiteSpace: 'nowrap', fontWeight: s.timeColor === AMBER_TEXT ? 500 : 400 }}>{s.time}</span>
                </div>
                <h3 style={{ margin: '28px 0 10px', fontFamily: DISPLAY, fontWeight: 700, fontSize: 32, textTransform: 'uppercase', lineHeight: 1 }}>{s.title}</h3>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: BODY, textWrap: 'pretty' }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------- pay calculator -------------------------------- */}
      <section id="pay" style={{ background: PAPER, borderTop: `1px solid ${RULE}` }}>
        <div
          style={{
            maxWidth: 1320, margin: '0 auto', padding: `${SECTION_PAD} ${SIDE_PAD}`,
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))',
            gap: '48px 72px', alignItems: 'start'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <div style={{ ...mono(12, AMBER_TEXT, '0.14em'), marginBottom: 18 }}>Pay check</div>
              <h2 ref={setReveal_} style={h2Style}>
                What would<br />you make?
              </h2>
            </div>
            {chipGroup('Equipment', ['Dry van', 'Reefer', 'Flatbed', 'Tanker'], 'equip')}
            {chipGroup('Experience', ['Under 1', '1–2 yrs', '3–5 yrs', '5+ yrs'], 'exp')}
            {chipGroup('Home-time', ['OTR', 'Regional', 'Local'], 'home')}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 220 }}>
              <span style={mono(11, MUTED)}>Home ZIP</span>
              <input
                inputMode="numeric"
                maxLength={5}
                placeholder="75201"
                value={calc.zip}
                onChange={(e) => setCalc((c) => ({ ...c, zip: e.target.value.replace(/\D/g, '').slice(0, 5) }))}
                style={{ padding: '12px 14px', fontSize: 17, border: '1px solid rgba(18,19,21,0.25)', background: '#fff', color: INK, outline: 'none', borderRadius: 0 }}
              />
            </label>
          </div>
          <div style={{ ...dark, padding: 'clamp(28px, 3vw, 44px)' }}>
            <div style={mono(11, 'rgba(255,255,255,0.55)')}>Estimated weekly gross</div>
            <div style={{ margin: '14px 0 28px', fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(52px, 6vw, 88px)', lineHeight: 0.95, color: AMBER, whiteSpace: 'nowrap' }}>
              {weekly}
            </div>
            {(
              [
                ['Cents per mile', cpmText],
                ['Miles per week', '≈' + mi.toLocaleString('en-US')],
                ['Yearly, 50 weeks', yearly],
                ['Open offers', offers]
              ] as Array<[string, string]>
            ).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderTop: '1px solid rgba(255,255,255,0.12)', fontSize: 16 }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{k}</span>
                <span style={{ fontFamily: MONO, whiteSpace: 'nowrap' }}>{v}</span>
              </div>
            ))}
            <a
              href="#driver-application"
              onClick={anchor('driver-application')}
              className="hm-btn-amber"
              style={{ marginTop: 24, padding: '18px 22px', background: AMBER, color: INK, fontWeight: 600, fontSize: 17, display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap' }}
            >
              <span>See these offers</span>
              <span>→</span>
            </a>
            <div style={{ marginTop: 16, fontFamily: MONO, fontSize: 11, lineHeight: 1.6, color: 'rgba(255,255,255,0.45)' }}>
              Sample ranges for illustration. Live numbers come from current carrier offers.
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------- $1,500 bonus -------------------------------- */}
      <section id="bonus" ref={setSec(2)} style={dark}>
        <div
          style={{
            maxWidth: 1320, margin: '0 auto', padding: `${SECTION_PAD} ${SIDE_PAD}`,
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
            gap: '56px 80px', alignItems: 'center'
          }}
        >
          <div>
            <div style={{ ...mono(12, AMBER, '0.14em'), marginBottom: 20 }}>Why we pay you</div>
            <div ref={setReveal_} style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(96px, 16vw, 220px)', lineHeight: 0.82, color: AMBER }}>
              $1,500
            </div>
            <p style={{ margin: '32px 0 0', maxWidth: 480, fontSize: 18, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', textWrap: 'pretty' }}>
              Carriers pay us a placement fee. We split it with the driver who stays. That keeps us
              honest: we only win when the job is actually good.
            </p>
          </div>
          <div style={{ border: '1px solid rgba(255,255,255,0.14)', padding: 'clamp(24px, 3vw, 40px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 44, lineHeight: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                Day {day}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap' }}>{dayNote}</div>
            </div>
            <div style={{ position: 'relative', height: 10, background: 'rgba(255,255,255,0.1)', margin: '28px 0 10px' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(day / 90) * 100}%`, background: AMBER }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
              <span>0</span><span>30</span><span>60</span><span>90</span>
            </div>
            <input
              type="range"
              min={0}
              max={90}
              value={day}
              onChange={(e) => { dayTouched.current = true; setDay(Number(e.target.value)); }}
              aria-label="Days on the job"
              style={{ width: '100%', margin: '24px 0 0', accentColor: AMBER }}
            />
            <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.12)', display: 'grid', gap: 14, fontSize: 15, lineHeight: 1.5, color: 'rgba(255,255,255,0.75)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 12 }}>
                <span style={{ fontFamily: MONO, fontSize: 12, color: 'rgba(255,255,255,0.45)', paddingTop: 2 }}>DAY 1</span>
                <span>Your driver agent checks in after your first dispatch.</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 12 }}>
                <span style={{ fontFamily: MONO, fontSize: 12, color: 'rgba(255,255,255,0.45)', paddingTop: 2 }}>ANY DAY</span>
                <span>Carrier breaks a home-time or miles promise? We move you to another fleet without missing a paycheck.</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 12 }}>
                <span style={{ fontFamily: MONO, fontSize: 12, color: AMBER, paddingTop: 2 }}>DAY 90</span>
                <span style={{ color: '#fff' }}>$1,500 direct deposit from HaulMatch.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------- comparison -------------------------------- */}
      <section id="compare" ref={setSec(3)} style={{ background: PAPER }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: `${SECTION_PAD} ${SIDE_PAD}` }}>
          <h2 ref={setReveal_} style={{ ...h2Style, margin: '0 0 48px', maxWidth: '14ch' }}>
            Built for the driver, not the recruiter
          </h2>
          <div style={{ borderTop: `3px solid ${INK}` }}>
            <div
              className="hm-compare-header"
              style={{
                display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) minmax(0, 1.4fr) minmax(0, 1.4fr)',
                gap: '16px 32px', padding: '14px 0', borderBottom: '1px solid rgba(18,19,21,0.15)',
                ...mono(12, MUTED, '0.08em')
              }}
            >
              <span />
              <span>The usual way</span>
              <span style={{ color: INK }}>HaulMatch</span>
            </div>
            {COMPARE_ROWS.map(([label, usual, ours]) => (
              <div
                key={label}
                ref={setReveal_}
                className="hm-compare-row"
                style={{
                  display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) minmax(0, 1.4fr) minmax(0, 1.4fr)',
                  gap: '16px 32px', padding: '22px 0',
                  borderBottom: '1px solid rgba(18,19,21,0.15)', fontSize: 17, lineHeight: 1.45
                }}
              >
                <span style={{ fontWeight: 600 }}>{label}</span>
                <span style={{ color: MUTED2 }}>{usual}</span>
                <span>{ours}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------- privacy demo -------------------------------- */}
      <section id="privacy" style={{ background: PAPER_ALT }}>
        <div
          style={{
            maxWidth: 1320, margin: '0 auto', padding: `${SECTION_PAD} ${SIDE_PAD}`,
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
            gap: '48px 80px', alignItems: 'center'
          }}
        >
          <div>
            <div style={{ ...mono(12, AMBER_TEXT, '0.14em'), marginBottom: 18 }}>Privacy</div>
            <h2 ref={setReveal_} style={h2Style}>Carriers see the driver. Not your number.</h2>
            <p style={{ margin: '28px 0 0', maxWidth: 460, fontSize: 18, lineHeight: 1.55, color: BODY, textWrap: 'pretty' }}>
              Your phone and email stay locked until a carrier signs our placement agreement. This is
              exactly what they see.
            </p>
          </div>
          <div style={{ background: '#fff', border: '1px solid rgba(18,19,21,0.14)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid rgba(18,19,21,0.1)', flexWrap: 'wrap', ...mono(11, MUTED2, '0.08em') }}>
              <span style={{ whiteSpace: 'nowrap' }}>Carrier view · Driver {activeProfile.id}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {PRIVACY_PROFILES.map((p, idx) => {
                  const selected = profileIdx === idx;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setProfileIdx(idx as 0 | 1 | 2);
                        setVidChapter(0);
                        setVidTick(0);
                      }}
                      style={{
                        padding: '4px 9px',
                        fontFamily: MONO,
                        fontSize: 10,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        border: `1px solid ${selected ? INK : 'rgba(18,19,21,0.2)'}`,
                        background: selected ? INK : 'transparent',
                        color: selected ? '#fff' : INK,
                        borderRadius: 0,
                        cursor: 'pointer'
                      }}
                    >
                      {p.tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive 3-Question Carrier Screening Video Player */}
            {(() => {
              const activeClip = activeProfile.clips[vidChapter];
              const words = activeClip.transcript.split(' ');
              const highlightedWords = vidPlaying
                ? Math.max(3, Math.min(words.length, Math.ceil(((vidTick + 1) / 40) * words.length)))
                : words.length;
              const elapsedInClip = Math.round((vidTick / 40) * activeClip.durationSec);
              const totalElapsedSec = activeClip.startSec + (vidPlaying ? elapsedInClip : 14);
              const mm = Math.floor(totalElapsedSec / 60);
              const ss = (totalElapsedSec % 60).toString().padStart(2, '0');
              const totalProgressPct = Math.min(100, ((activeClip.startSec + (vidPlaying ? elapsedInClip : 14)) / 120) * 100);

              return (
                <div style={{ background: DEEP, color: '#fff', borderBottom: '1px solid rgba(18,19,21,0.1)' }}>
                  {/* Video Stage */}
                  <div
                    style={{
                      position: 'relative',
                      padding: '16px 20px 18px',
                      backgroundImage:
                        'linear-gradient(180deg, rgba(12,13,15,0.78) 0%, rgba(12,13,15,0.68) 45%, rgba(12,13,15,0.96) 100%), url(/hero-highway.jpg)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center 40%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 224
                    }}
                  >
                    {/* Top Telemetry & Verification Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(18,19,21,0.85)', border: '1px solid rgba(255,255,255,0.14)', padding: '4px 10px' }}>
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: vidPlaying ? AMBER : '#10b981',
                            boxShadow: vidPlaying ? `0 0 8px ${AMBER}` : 'none'
                          }}
                        />
                        <span style={mono(10, '#fff', '0.08em')}>
                          {vidPlaying ? `Playing ${activeClip.code}` : 'Async video intro'} · {mm}:{ss} / 2:00
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ ...mono(10, '#d1fae5', '0.07em'), background: 'rgba(16,185,129,0.16)', border: '1px solid rgba(16,185,129,0.4)', padding: '4px 8px', whiteSpace: 'nowrap' }}>
                          ✓ DQ + MVR Verified
                        </span>
                        <span style={{ ...mono(10, AMBER, '0.07em'), background: 'rgba(240,162,59,0.14)', border: '1px solid rgba(240,162,59,0.45)', padding: '4px 8px', whiteSpace: 'nowrap' }}>
                          AI Fluency {activeProfile.fluency}/100
                        </span>
                      </div>
                    </div>

                    {/* Center Play Control + Animated Voice Waveform */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '18px 0 16px' }}>
                      <button
                        type="button"
                        onClick={() => setVidPlaying((p) => !p)}
                        aria-label={vidPlaying ? 'Pause driver intro preview' : 'Play driver intro preview'}
                        className="hm-btn-amber"
                        style={{
                          width: 48,
                          height: 48,
                          flexShrink: 0,
                          background: AMBER,
                          color: INK,
                          border: 'none',
                          borderRadius: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: MONO,
                          fontSize: 15,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {vidPlaying ? '❚❚' : '▶'}
                      </button>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 8 }}>
                          <span style={{ ...mono(11, AMBER, '0.08em'), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {activeClip.title}
                          </span>
                          <span style={{ ...mono(10, 'rgba(255,255,255,0.5)', '0.06em'), whiteSpace: 'nowrap' }}>
                            {vidPlaying ? 'Live audio stream' : 'Click play to preview'}
                          </span>
                        </div>

                        {/* 24-Bar Voice Waveform */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 28 }}>
                          {WAVE_BARS.map((base, idx) => {
                            const wave = vidPlaying
                              ? Math.max(0.18, Math.min(1, base * (0.65 + 0.45 * Math.sin((vidTick + idx * 1.7) * 0.65))))
                              : base * 0.55;
                            const isPassed = (idx / WAVE_BARS.length) * 40 <= (vidPlaying ? vidTick : 14);
                            return (
                              <span
                                key={idx}
                                style={{
                                  flex: 1,
                                  height: `${Math.round(wave * 100)}%`,
                                  background: isPassed ? AMBER : 'rgba(255,255,255,0.24)',
                                  transition: 'height 140ms ease, background 140ms ease'
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Live Speech-to-Text Caption Box */}
                    <div
                      style={{
                        background: 'rgba(12,13,15,0.88)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        padding: '10px 14px',
                        fontSize: 13.5,
                        lineHeight: 1.45,
                        color: 'rgba(255,255,255,0.9)'
                      }}
                    >
                      <span style={{ ...mono(10, 'rgba(255,255,255,0.45)', '0.08em'), marginRight: 8 }}>
                        CC
                      </span>
                      “
                      {words.map((w, i) => (
                        <span
                          key={i}
                          style={{
                            color: i < highlightedWords ? '#fff' : 'rgba(255,255,255,0.38)',
                            transition: 'color 120ms ease'
                          }}
                        >
                          {w}
                          {i < words.length - 1 ? ' ' : ''}
                        </span>
                      ))}
                      ”
                    </div>
                  </div>

                  {/* Progress Scrubber Bar */}
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.12)', position: 'relative' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${totalProgressPct}%`,
                        background: AMBER,
                        transition: 'width 150ms linear'
                      }}
                    />
                  </div>

                  {/* 3-Question Chapter Switcher Strip */}
                  <div className="hm-chapter-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: '#121315' }}>
                    {activeProfile.clips.map((clip, idx) => {
                      const active = vidChapter === idx;
                      return (
                        <button
                          key={clip.code}
                          type="button"
                          onClick={() => {
                            setVidChapter(idx as 0 | 1 | 2);
                            setVidTick(0);
                            setVidPlaying(true);
                          }}
                          style={{
                            padding: '10px 12px',
                            border: 'none',
                            borderRight: idx < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                            background: active ? 'rgba(240,162,59,0.12)' : 'transparent',
                            color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                            textAlign: 'left',
                            cursor: 'pointer',
                            borderRadius: 0,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            gap: 6
                          }}
                        >
                          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: active ? AMBER : 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {clip.code} · {clip.shortLabel}
                          </span>
                          <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                            {clip.stamp}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px 24px', borderBottom: '1px solid rgba(18,19,21,0.1)' }}>
              {activeProfile.specs.map(([k, v]) => (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={mono(10, MUTED2)}>{k}</span>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'baseline' }}>
                <span style={{ fontSize: 15, color: MUTED2 }}>Phone</span>
                <span style={{ fontFamily: MONO, fontSize: 17, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{phoneText}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'baseline' }}>
                <span style={{ fontSize: 15, color: MUTED2 }}>Email</span>
                <span style={{ fontFamily: MONO, fontSize: 17, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{emailText}</span>
              </div>
              <button
                type="button"
                onClick={onUnlock}
                style={{
                  marginTop: 8, padding: '16px 20px', border: `1px solid ${INK}`,
                  background: unlocked ? '#fff' : AMBER, color: INK, fontWeight: 600, fontSize: 16,
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 12,
                  textAlign: 'left', borderRadius: 0
                }}
              >
                <span>{unlocked ? 'Agreement signed · contact released' : 'Sign placement agreement to unlock'}</span>
                <span>{unlocked ? 'Reset' : '→'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------- the real application --------------------------- */}
      <section id="driver-application" style={{ background: PAPER, borderTop: `1px solid ${RULE}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: `${SECTION_PAD} ${SIDE_PAD}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px 64px', alignItems: 'end', marginBottom: 48 }}>
            <div>
              <div style={{ ...mono(12, AMBER_TEXT, '0.14em'), marginBottom: 18 }}>Start here · 3 stops</div>
              <h2 style={{ ...h2Style, margin: 0 }}>The application.</h2>
            </div>
            <p style={{ margin: 0, maxWidth: 480, fontSize: 18, lineHeight: 1.55, color: BODY, textWrap: 'pretty' }}>
              Complete your CDL profile, verify your license and DOT medical card via instant OCR,
              and record a 2-minute video intro. Your contact details remain locked until you accept a carrier.
            </p>
          </div>
          {applicationSlot}
        </div>
      </section>

      {/* ----------------------------- final CTA + footer ----------------------------- */}
      <section ref={setSec(4)} style={{ background: DEEP, color: '#fff', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div
          style={{
            maxWidth: 1320, margin: '0 auto', padding: `clamp(64px, 8vw, 108px) ${SIDE_PAD}`,
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
            gap: '48px 72px', alignItems: 'center'
          }}
        >
          <div>
            <div style={{ ...mono(12, AMBER, '0.14em'), marginBottom: 18 }}>
              Live dispatch demand · 48 states
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: DISPLAY,
                fontWeight: 800,
                fontSize: 'clamp(44px, 5.8vw, 80px)',
                lineHeight: 0.92,
                textTransform: 'uppercase',
                color: '#fff',
                maxWidth: '13ch'
              }}
            >
              Your next carrier is <span style={{ color: AMBER }}>already looking.</span>
            </h2>
            <p style={{ margin: '24px 0 0', maxWidth: 460, fontSize: 17, lineHeight: 1.55, color: 'rgba(255,255,255,0.74)', textWrap: 'pretty' }}>
              Skip the recruiter call centers. Put your verified CDL, MVR, and 2-minute intro in
              front of 40+ vetted fleets that put weekly pay and home-time in writing first.
            </p>
          </div>

          <div style={{ background: INK, border: '1px solid rgba(255,255,255,0.14)', padding: 'clamp(24px, 3vw, 36px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.12)', marginBottom: 18 }}>
              <span style={mono(11, 'rgba(255,255,255,0.55)', '0.08em')}>Network Dispatch Board</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...mono(11, '#10b981', '0.08em') }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                42 Fleets Hiring Now
              </span>
            </div>

            {(
              [
                ['Written offer turnaround', 'Under 48 hours'],
                ['Average Class A weekly gross', '$1,850 – $2,340 / wk'],
                ['Day-90 retention bonus', '$1,500 direct deposit'],
                ['Driver fee & cold calls', '$0 · Zero spam']
              ] as Array<[string, string]>
            ).map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  fontSize: 15
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.62)' }}>{k}</span>
                <span style={{ fontFamily: MONO, color: '#fff', whiteSpace: 'nowrap' }}>{v}</span>
              </div>
            ))}

            <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a
                href="#driver-application"
                onClick={anchor('driver-application')}
                className="hm-btn-amber"
                style={{
                  padding: '18px 24px',
                  background: AMBER,
                  color: INK,
                  fontWeight: 600,
                  fontSize: 17,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>Start application</span>
                <span>→</span>
              </a>
              <button
                type="button"
                onClick={onCarrierLogin}
                style={{
                  padding: '13px 20px',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.82)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  borderRadius: 0
                }}
              >
                <span>Hiring CDL-A drivers? Open Carrier ATS Portal</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
        <div id="carriers" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div
            style={{
              maxWidth: 1320, margin: '0 auto', padding: `28px ${SIDE_PAD}`,
              display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
              gap: '16px 32px', fontSize: 14, color: 'rgba(255,255,255,0.55)'
            }}
          >
            <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '0.02em' }}>HAULMATCH</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 24px', whiteSpace: 'nowrap' }}>
              <a href="#carriers" onClick={(e) => { e.preventDefault(); onCarrierLogin(); }}>Hiring drivers? Carrier login →</a>
              <a href="#bonus" onClick={anchor('bonus')}>Bonus terms</a>
              <a href="#privacy" onClick={anchor('privacy')}>Privacy</a>
              <a href="#driver-application" onClick={anchor('driver-application')}>Contact</a>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------ mobile sticky bar ------------------------------ */}
      <div
        ref={stickyRef}
        className="hm-mobile-sticky"
        style={{
          position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 60, display: 'none', gap: 8,
          transition: 'transform .35s cubic-bezier(.16,.84,.24,1), opacity .35s',
          transform: 'translateY(120%)', opacity: 0
        }}
      >
        <a
          href="#driver-application"
          onClick={anchor('driver-application')}
          className="hm-btn-amber"
          style={{
            flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px', background: AMBER, color: INK, fontWeight: 600, fontSize: 17,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
          }}
        >
          <span>Apply in 3 minutes</span>
          <span>→</span>
        </a>
      </div>
    </div>
  );
};
