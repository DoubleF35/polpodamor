/* ═══════════════════════════════════════════════════════════
   POLPO D'AMOR — Osteria · Torino
   Piatto scroll-driven (video scrub su canvas) + GSAP + Lenis
   ═══════════════════════════════════════════════════════════ */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const isNarrow = innerWidth < 720;

const clamp01 = (v) => Math.min(1, Math.max(0, v));

/* ──────────────────────────────────────────────────
   Smooth scroll (Lenis) + ancore
   ────────────────────────────────────────────────── */
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ autoRaf: false, duration: 1.15 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ──────────────────────────────────────────────────
   Preloader: esce quando i frame sono pronti
   ────────────────────────────────────────────────── */
const loader = document.getElementById('loader');
const loadbar = loader.querySelector('.loader__bar span');
let revealed = false;
const reveal = () => {
  if (revealed) return;
  revealed = true;
  loader.classList.add('done');
  document.body.classList.add('is-loaded');
  ScrollTrigger.refresh();
};
// rete di sicurezza: mai oltre i 6 secondi
setTimeout(reveal, 6000);

/* ──────────────────────────────────────────────────
   Header: solido + nascosto in discesa
   ────────────────────────────────────────────────── */
const hdr = document.getElementById('hdr');
let lastY = 0;
const onScrollY = (y) => {
  hdr.classList.toggle('is-solid', y > 40);
  hdr.classList.toggle('is-hidden', y > 640 && y > lastY + 4 && !document.body.classList.contains('menu-open'));
  if (Math.abs(y - lastY) > 4) lastY = y;
};
if (lenis) lenis.on('scroll', ({ scroll }) => onScrollY(scroll));
else addEventListener('scroll', () => onScrollY(scrollY), { passive: true });

/* ──────────────────────────────────────────────────
   Menu overlay mobile
   ────────────────────────────────────────────────── */
const burger = document.getElementById('burger');
const moverlay = document.getElementById('moverlay');
function closeMenu() {
  burger.classList.remove('is-open');
  moverlay.classList.remove('is-open');
  document.body.classList.remove('menu-open');
  burger.setAttribute('aria-expanded', 'false');
  moverlay.setAttribute('aria-hidden', 'true');
  if (lenis) lenis.start();
}
burger.addEventListener('click', () => {
  const open = !moverlay.classList.contains('is-open');
  if (!open) return closeMenu();
  burger.classList.add('is-open');
  moverlay.classList.add('is-open');
  document.body.classList.add('menu-open');
  burger.setAttribute('aria-expanded', 'true');
  moverlay.setAttribute('aria-hidden', 'false');
  if (lenis) lenis.stop();
});

/* ──────────────────────────────────────────────────
   Cursore custom + bottoni magnetici
   ────────────────────────────────────────────────── */
if (finePointer && !reduceMotion) {
  const cur = document.querySelector('.cursor');
  const dot = cur.querySelector('.cursor__dot');
  const ring = cur.querySelector('.cursor__ring');
  const pos = { x: -100, y: -100 };
  const ringPos = { ...pos };
  addEventListener('pointermove', (e) => {
    pos.x = e.clientX; pos.y = e.clientY;
    dot.style.left = pos.x + 'px';
    dot.style.top = pos.y + 'px';
  });
  gsap.ticker.add(() => {
    ringPos.x += (pos.x - ringPos.x) * 0.16;
    ringPos.y += (pos.y - ringPos.y) * 0.16;
    ring.style.left = ringPos.x + 'px';
    ring.style.top = ringPos.y + 'px';
  });
  const hoverables = 'a, button, input, select, textarea, [data-cursor]';
  document.addEventListener('pointerover', (e) => { if (e.target.closest(hoverables)) cur.classList.add('is-hover'); });
  document.addEventListener('pointerout', (e) => { if (e.target.closest(hoverables)) cur.classList.remove('is-hover'); });
  addEventListener('pointerdown', () => cur.classList.add('is-down'));
  addEventListener('pointerup', () => cur.classList.remove('is-down'));

  document.querySelectorAll('.btn--magnetic').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, {
        x: (e.clientX - r.left - r.width / 2) * 0.22,
        y: (e.clientY - r.top - r.height / 2) * 0.3,
        duration: 0.4, ease: 'power3.out',
      });
    });
    btn.addEventListener('pointerleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, .45)' }));
  });
}

/* ──────────────────────────────────────────────────
   Reveal on scroll
   ────────────────────────────────────────────────── */
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('revealed'); io.unobserve(en.target); }
  });
}, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

/* ──────────────────────────────────────────────────
   Form prenotazione (demo)
   ────────────────────────────────────────────────── */
const form = document.getElementById('bookform');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  form.classList.add('sent');
});

document.getElementById('year').textContent = new Date().getFullYear();

/* ──────────────────────────────────────────────────
   Menù del giorno (PDF caricato dal proprietario
   tramite il Worker Cloudflare — vedi worker/)
   ────────────────────────────────────────────────── */
(function menuDelGiorno() {
  const api = (window.MENU_API || '').replace(/\/+$/, '');
  if (!api) return;
  fetch(api + '/menu/info')
    .then((r) => (r.ok ? r.json() : null))
    .then((info) => {
      if (!info || !info.exists) return;
      const box = document.getElementById('menu-today');
      const link = document.getElementById('menu-today-link');
      const dateEl = document.getElementById('menu-today-date');
      link.href = api + '/menu';
      const d = new Date(info.updatedAt);
      const oggi = d.toDateString() === new Date().toDateString();
      const ora = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      const giorno = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
      dateEl.textContent = oggi
        ? 'appena uscito dalla cucina — aggiornato alle ' + ora
        : 'di ' + giorno;
      box.hidden = false;
    })
    .catch(() => { /* worker non raggiungibile: il riquadro resta nascosto */ });
})();

/* ══════════════════════════════════════════════════
   IL PIATTO SI COMPONE — video scrub su canvas
   Il video (480×480, sfondo bianco) viene decodificato
   una sola volta in N fotogrammi; lo scroll guida il
   fotogramma, la posizione e la scala del piatto.
   ══════════════════════════════════════════════════ */
let prog = 0;
let renderOn = true;

function initDish() {
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    document.body.classList.add('no-webgl');
    reveal();
    return;
  }

  const DPR = Math.min(devicePixelRatio || 1, 2);
  function sizeCanvas() {
    canvas.width = Math.round(innerWidth * DPR);
    canvas.height = Math.round(innerHeight * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }
  sizeCanvas();
  addEventListener('resize', sizeCanvas);

  /* Stati della "camera" 2D: hero → assemblaggio → beauty-shot.
     x: offset orizzontale (frazione della larghezza viewport)
     y: offset verticale (frazione dell'altezza viewport)
     s: scala del piatto, bob: ampiezza del galleggiamento   */
  const VIEW = isNarrow ? {
    hero: { x: 0, y: 0.34, s: 0.95 },
    asm: { x: 0, y: -0.02, s: 0.92 },
    fin: { x: 0, y: -0.12, s: 0.94 },
  } : {
    hero: { x: 0.22, y: 0.0, s: 0.94 },
    asm: { x: 0, y: -0.02, s: 1.0 },
    fin: { x: 0, y: -0.13, s: 1.03 },
  };
  const view = { frame: 0, x: VIEW.hero.x, y: VIEW.hero.y, s: VIEW.hero.s, bob: reduceMotion ? 0 : 1 };

  /* ── Estrazione fotogrammi (decodifica una volta sola) ──
     Su desktop catturiamo a 720px per restare nitidi;
     su mobile bastano 480px (e metà memoria).            */
  const N_FRAMES = isNarrow ? 56 : 64;
  const CAP_SIZE = isNarrow ? 480 : 720;
  const frames = [];

  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  const sources = ['assets/piatto.mp4', 'assets/piatto.webm'];
  let srcIdx = 0;
  video.src = sources[srcIdx];

  function grabFrame(size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    c.getContext('2d').drawImage(video, 0, 0, size, size);
    frames.push(c);
    loadbar.style.animation = 'none';
    loadbar.style.width = Math.round((frames.length / N_FRAMES) * 100) + '%';
  }

  const capSize = () => Math.min(video.videoWidth || CAP_SIZE, CAP_SIZE);

  /* Cattura durante la riproduzione: nessun seek, un solo passaggio di decodifica */
  function extractViaPlayback() {
    return new Promise((resolve, reject) => {
      const size = capSize();
      const dur = video.duration || 3.2;
      const step = dur / (N_FRAMES - 1);
      let next = 0, settled = false;
      const done = (ok, err) => { if (settled) return; settled = true; ok ? resolve() : reject(err); };
      const onFrame = (_, meta) => {
        while (next < N_FRAMES && meta.mediaTime >= next * step - step / 2) {
          grabFrame(size);
          next++;
        }
        if (next >= N_FRAMES) { video.pause(); done(true); return; }
        video.requestVideoFrameCallback(onFrame);
      };
      video.requestVideoFrameCallback(onFrame);
      video.addEventListener('ended', () => {
        while (frames.length && next < N_FRAMES) { grabFrame(size); next++; } // l'ultimo frame riempie gli slot rimasti
        done(frames.length >= N_FRAMES, new Error('estrazione incompleta'));
      }, { once: true });
      video.currentTime = 0;
      video.playbackRate = 2; // cattura in metà tempo; gli slot per mediaTime restano corretti
      video.play().catch((e) => done(false, e));
    });
  }

  /* Fallback per browser senza requestVideoFrameCallback: seek frame per frame */
  function seekTo(t) {
    return new Promise((resolve) => {
      let done = false;
      const ok = () => { if (done) return; done = true; video.removeEventListener('seeked', ok); resolve(); };
      video.addEventListener('seeked', ok);
      video.currentTime = t;
      setTimeout(ok, 2000); // mai bloccarsi su un 'seeked' perso
    });
  }
  async function extractViaSeek() {
    try { await video.play(); video.pause(); } catch (e) { /* autoplay negato: il seek basta */ }
    const dur = video.duration || 3.2;
    const size = capSize();
    for (let i = 0; i < N_FRAMES; i++) {
      await seekTo((i / (N_FRAMES - 1)) * dur * 0.995);
      grabFrame(size);
    }
  }

  async function extractFrames() {
    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
      try { await extractViaPlayback(); reveal(); return; }
      catch (e) { frames.length = 0; }
    }
    await extractViaSeek();
    reveal();
  }

  let started = false;
  const begin = () => { if (started) return; started = true; extractFrames().catch(() => { document.body.classList.add('no-webgl'); reveal(); }); };
  video.addEventListener('loadeddata', begin);
  video.addEventListener('canplay', begin);
  video.addEventListener('error', () => {
    srcIdx += 1;
    if (srcIdx < sources.length) { video.src = sources[srcIdx]; video.load(); }
    else { document.body.classList.add('no-webgl'); reveal(); }
  });
  video.load();

  /* ── Timeline master (scrub sullo scroll) ── */
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  tl.to(view, { x: VIEW.asm.x, y: VIEW.asm.y, s: VIEW.asm.s, duration: 0.13, ease: 'power2.inOut' }, 0);
  tl.to(view, { bob: 0, duration: 0.13 }, 0);
  tl.to(view, { frame: N_FRAMES - 1, duration: 0.73 }, 0.13);
  tl.to(view, { x: VIEW.fin.x, y: VIEW.fin.y, s: VIEW.fin.s, duration: 0.14, ease: 'power2.inOut' }, 0.86);

  /* Caption / rail / ghost / finale */
  const caps = [...document.querySelectorAll('.exp__cap')];
  const railItems = [...document.querySelectorAll('.exp__rail li')];
  const ghost = document.querySelector('.exp__ghost');
  const finalEl = document.querySelector('.exp__final');
  const STEPS = [0, 0.4, 0.62, 0.82];
  let ghostStep = -1;

  function updatePhase(p) {
    prog = p;
    caps.forEach((c) => {
      const f = parseFloat(c.dataset.from), t = parseFloat(c.dataset.to);
      c.classList.toggle('on', p >= f && p < t);
    });
    let step = 0;
    for (let i = 0; i < STEPS.length; i++) if (p >= STEPS[i]) step = i;
    railItems.forEach((li, i) => li.classList.toggle('on', i === step));
    if (step !== ghostStep) {
      ghostStep = step;
      ghost.textContent = ['01', '02', '03', '04'][step];
      gsap.fromTo(ghost, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power1.out' });
    }
    finalEl.classList.toggle('on', p >= parseFloat(finalEl.dataset.from));
  }

  ScrollTrigger.create({
    trigger: '#esperienza',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.7,
    animation: tl,
    onUpdate: (self) => updatePhase(self.progress),
  });

  /* Parallasse hero in uscita */
  gsap.to('.hero__content', {
    yPercent: -16, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 25%', scrub: true },
  });
  gsap.to('.hero__cue', {
    opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '12% top', scrub: true },
  });

  /* Dissolvenza canvas quando entra il mondo dei contenuti */
  gsap.fromTo(canvas, { opacity: 1 }, {
    opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.world', start: 'top 92%', end: 'top 45%', scrub: true },
  });
  ScrollTrigger.create({
    trigger: '.world',
    start: 'top 40%',
    onEnter: () => { renderOn = false; },
    onLeaveBack: () => { renderOn = true; },
  });

  /* Parallasse mouse */
  const par = { x: 0, y: 0 }, parT = { x: 0, y: 0 };
  if (finePointer && !reduceMotion) {
    addEventListener('pointermove', (e) => {
      parT.x = (e.clientX / innerWidth - 0.5) * 2;
      parT.y = (e.clientY / innerHeight - 0.5) * 2;
    });
  }

  /* Render loop (ticker GSAP condiviso) */
  gsap.ticker.add((time) => {
    if (!renderOn || document.hidden || !frames.length) return;

    par.x += (parT.x - par.x) * 0.04;
    par.y += (parT.y - par.y) * 0.04;

    ctx.clearRect(0, 0, innerWidth, innerHeight);

    const idx = Math.min(frames.length - 1, Math.max(0, Math.round(view.frame)));
    /* tetto a 940px: oltre, l'ingrandimento mangia la nitidezza */
    const base = isNarrow
      ? Math.min(innerWidth * 1.05, innerHeight * 0.62)
      : Math.min(innerHeight * 0.96, innerWidth * 0.6, 940);
    const size = base * view.s;
    const bobY = Math.sin(time * 0.9) * 9 * view.bob;
    const cx = innerWidth * (0.5 + view.x) + par.x * 16 * (1 - prog * 0.7);
    const cy = innerHeight * (0.5 + view.y) + bobY + par.y * 10 * (1 - prog * 0.7);

    ctx.drawImage(frames[idx], cx - size / 2, cy - size / 2, size, size);
  });
}

try {
  initDish();
} catch (err) {
  console.error('Animazione non disponibile:', err);
  document.body.classList.add('no-webgl');
  reveal();
}

ScrollTrigger.refresh();
