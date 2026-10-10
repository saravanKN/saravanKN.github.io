const themeToggle = document.querySelector('.theme-toggle');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
let chosenTheme = null;
try {
  const saved = localStorage.getItem('portfolio-theme');
  if (saved === 'dark' || saved === 'light') chosenTheme = saved;
} catch {}
const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  const dark = theme === 'dark';
  const label = `Switch to ${dark ? 'light' : 'dark'} mode`;
  themeToggle.setAttribute('aria-label', label);
  themeToggle.setAttribute('title', label);
  themeToggle.setAttribute('aria-pressed', String(dark));
  window.dispatchEvent(new Event('themechange'));
};
applyTheme(chosenTheme || (systemTheme.matches ? 'dark' : 'light'));
themeToggle.addEventListener('click', () => {
  chosenTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('portfolio-theme', chosenTheme); } catch {}
  applyTheme(chosenTheme);
});
systemTheme.addEventListener('change', (event) => {
  if (!chosenTheme) applyTheme(event.matches ? 'dark' : 'light');
});

const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('#site-nav');
const setMenu = (open) => {
  nav.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.innerHTML = `${open ? 'Close' : 'Menu'} <span aria-hidden="true">${open ? '−' : '+'}</span>`;
};
menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav.classList.contains('is-open')) {
    setMenu(false);
    menuButton.focus();
  }
});
window.matchMedia('(min-width: 801px)').addEventListener('change', (event) => {
  if (event.matches) setMenu(false);
});
document.querySelector('#year').textContent = new Date().getFullYear();
const progress = document.querySelector('.reading-progress span');
const updateProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0}%`;
};
window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress);
updateProgress();
document.querySelectorAll('details').forEach((details) => {
  const label = details.querySelector(':scope > summary > small');
  const symbol = details.querySelector(':scope > summary .toggle-symbol');
  const updateDetails = () => {
    if (label) label.textContent = details.open ? 'Hide details' : 'View details';
    if (symbol) symbol.textContent = details.open ? '−' : '+';
    updateProgress();
  };
  details.addEventListener('toggle', updateDetails);
  updateDetails();
});
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.section-content, .project, .role, .architecture-copy, .expertise-grid, .education-grid').forEach((element) => {
    element.classList.add('reveal');
    revealObserver.observe(element);
  });
  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
  });
}
// Duplicate only the decorative strip; the original supplies accessible labels.
const rail = document.querySelector('.tech-rail-track');
const railGroup = rail.querySelector('.tech-rail-group');
const railClone = railGroup.cloneNode(true);
railClone.setAttribute('aria-hidden', 'true');
rail.append(railClone);
const motionToggle = document.querySelector('.motion-toggle');
motionToggle.addEventListener('click', () => {
  const paused = document.body.classList.toggle('motion-paused');
  motionToggle.setAttribute('aria-pressed', String(paused));
  window.dispatchEvent(new Event('motionchange'));
  motionToggle.innerHTML = `${paused ? 'Resume motion' : 'Pause motion'} <span aria-hidden="true">${paused ? '▷' : 'Ⅱ'}</span>`;
});

// A small data constellation: nearby packets respond, then settle back into place.
(() => {
  const hero = document.querySelector('.hero');
  const canvas = hero.querySelector('.data-particles');
  const context = canvas.getContext('2d');
  if (!context) return;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const colors = ['101,125,205', '138,128,188', '101,157,150'];
  const nightColors = ['151,177,255', '188,162,230', '123,197,184'];
  let width = 0;
  let height = 0;
  let particles = [];
  let pointer = null;
  let frame = 0;
  let lastTime = 0;
  let visible = true;
  let resizeFrame = 0;
  let protectedAreas = [];
  const canAnimate = () => finePointer.matches && !reducedMotion.matches &&
    !document.hidden && visible && !document.body.classList.contains('motion-paused');

  const resize = () => {
    const bounds = hero.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    protectedAreas = [...hero.querySelectorAll('.hero-person, h1, .hero-copy, .hero-actions, .hero-footnote')].map((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left - bounds.left - 12, right: rect.right - bounds.left + 12,
        top: rect.top - bounds.top - 12, bottom: rect.bottom - bounds.top + 12 };
    });
    let seed = 42;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const count = Math.min(240, Math.round(width * height / 4800));
    particles = Array.from({ length: count }, () => {
      const x = random() * width;
      const y = random() * height;
      return { x, y, homeX: x, homeY: y, phase: random() * Math.PI * 2,
        radius: .8 + random() * .9, colorIndex: Math.floor(random() * colors.length),
        packet: random() > .8 };
    });
    pointer = null;
    draw(0);
    syncAnimation();
  };
  const draw = (time) => {
    context.clearRect(0, 0, width, height);
    const active = canAnimate();
    const dark = document.documentElement.dataset.theme === 'dark';
    const palette = dark ? nightColors : colors;
    const nearby = [];
    for (const particle of particles) {
      let targetX = particle.homeX + (active ? Math.sin(time * .00016 + particle.phase) * 5 : 0);
      let targetY = particle.homeY + (active ? Math.cos(time * .00012 + particle.phase) * 4 : 0);
      let influence = 0;
      if (pointer && active) {
        const dx = particle.homeX - pointer.x;
        const dy = particle.homeY - pointer.y;
        const distance = Math.hypot(dx, dy);
        influence = Math.max(0, 1 - distance / 170);
        if (influence > 0 && distance > 0) {
          const force = influence * influence * 38;
          targetX += dx / distance * force;
          targetY += dy / distance * force;
        }
      }
      particle.x += (targetX - particle.x) * .085;
      particle.y += (targetY - particle.y) * .085;
      const behindContent = protectedAreas.some((rect) => particle.x > rect.left && particle.x < rect.right &&
        particle.y > rect.top && particle.y < rect.bottom);
      const edgeFade = Math.min(1, particle.y / 50, (height - particle.y) / 65);
      const alpha = Math.max(0, edgeFade) * (behindContent ? .09 : .3 + influence * .45);
      context.fillStyle = `rgba(${palette[particle.colorIndex]},${alpha})`;
      context.beginPath();
      if (particle.packet) {
        context.ellipse(particle.x, particle.y, particle.radius * .65, particle.radius * 1.65, .6, 0, Math.PI * 2);
      } else {
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      }
      context.fill();
      if (influence > .22 && !behindContent) nearby.push(particle);
    }
    // Connections are local to the pointer, keeping the rest of the page quiet.
    for (let i = 0; i < nearby.length; i++) {
      for (let j = i + 1; j < nearby.length; j++) {
        const distance = Math.hypot(nearby[i].x - nearby[j].x, nearby[i].y - nearby[j].y);
        if (distance > 76) continue;
        context.strokeStyle = `rgba(${dark ? '151,177,255' : '119,140,196'},${(1 - distance / 76) * .2})`;
        context.lineWidth = .6;
        context.beginPath();
        context.moveTo(nearby[i].x, nearby[i].y);
        context.lineTo(nearby[j].x, nearby[j].y);
        context.stroke();
      }
    }
  };
  const tick = (time) => {
    frame = 0;
    if (!canAnimate()) return;
    if (time - lastTime >= 32) {
      draw(time);
      lastTime = time;
    }
    frame = requestAnimationFrame(tick);
  };
  function syncAnimation() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (canAnimate()) frame = requestAnimationFrame(tick);
    else if (reducedMotion.matches || !finePointer.matches) {
      pointer = null;
      particles.forEach((particle) => { particle.x = particle.homeX; particle.y = particle.homeY; });
      draw(0);
    }
  }
  hero.addEventListener('pointermove', (event) => {
    if (!canAnimate() || event.pointerType === 'touch') return;
    const bounds = hero.getBoundingClientRect();
    pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer = null; });
  window.addEventListener('blur', () => { pointer = null; });
  document.addEventListener('visibilitychange', syncAnimation);
  window.addEventListener('motionchange', syncAnimation);
  window.addEventListener('themechange', () => draw(lastTime));
  reducedMotion.addEventListener('change', syncAnimation);
  finePointer.addEventListener('change', syncAnimation);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) pointer = null;
      syncAnimation();
    }).observe(hero);
  }
  const queueResize = () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(resize);
  };
  if ('ResizeObserver' in window) new ResizeObserver(queueResize).observe(hero);
  else window.addEventListener('resize', queueResize);
  document.fonts?.ready.then(queueResize);
  resize();
})();
