// ─────────────────────────────────────────
// SAEEMAX — script.js
// Nav scroll state, hamburger, contact tabs,
// hero canvas animation, portfolio video modal
// ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  // ── Footer year ──
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ── Nav scroll state ──
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ── Mobile hamburger menu ──
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileClose = document.getElementById('mobileClose');
  const openMobile = () => mobileMenu.classList.add('open');
  const closeMobile = () => mobileMenu.classList.remove('open');
  hamburger?.addEventListener('click', openMobile);
  mobileClose?.addEventListener('click', closeMobile);
  mobileMenu?.querySelectorAll('.mobile-link').forEach(link => link.addEventListener('click', closeMobile));

  // ── Contact tabs ──
  const tabs = document.querySelectorAll('.contact-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.contact-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab)?.classList.add('active');
    });
  });

  // ── Portfolio: demos.json-driven cards + video modal ──
  const portfolioGrid = document.getElementById('portfolioGrid');
  const portfolioFallback = document.getElementById('portfolioFallback');
  const modal = document.getElementById('videoModal');
  const modalPlayer = document.getElementById('videoModalPlayer');
  const modalTag = document.getElementById('videoModalTag');
  const modalTitle = document.getElementById('videoModalTitle');
  const modalDesc = document.getElementById('videoModalDesc');
  const modalMeta = document.getElementById('videoModalMeta');

  // Picks an icon for a tool pill by keyword match; falls back to a generic dot.
  const TOOL_ICONS = [
    [/make\.com/i, 'fa-solid fa-circle-nodes'],
    [/gemini/i, 'fa-solid fa-microchip'],
    [/google/i, 'fa-brands fa-google'],
    [/linkedin/i, 'fa-brands fa-linkedin'],
    [/instagram/i, 'fa-brands fa-instagram'],
    [/api/i, 'fa-solid fa-plug'],
    [/schedul/i, 'fa-solid fa-clock'],
    [/module/i, 'fa-solid fa-layer-group'],
  ];
  const toolIcon = (tool) => (TOOL_ICONS.find(([re]) => re.test(tool)) || [null, 'fa-solid fa-circle'])[1];

  let demos = [];

  const openModal = (demo) => {
    modalPlayer.src = 'media/' + demo.video;
    modalTag.textContent = demo.tag;
    modalTitle.textContent = demo.title;
    modalDesc.textContent = demo.description;
    modalMeta.innerHTML = demo.tools.map(t => `<span><i class="${toolIcon(t)}"></i> ${t}</span>`).join('');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    modalPlayer.play().catch(() => {});
  };

  const closeModal = () => {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    modalPlayer.pause();
    modalPlayer.removeAttribute('src');
    modalPlayer.load();
  };

  document.getElementById('videoModalClose')?.addEventListener('click', closeModal);
  document.getElementById('videoModalOverlay')?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('open')) closeModal();
  });

  const demoCardHTML = (demo, index) => `
    <div class="portfolio-card portfolio-card-video" data-index="${index}">
      <div class="portfolio-thumb aspect-horizontal">
        <video src="media/${demo.video}" autoplay muted loop playsinline preload="none" aria-label="${demo.title} demo preview"></video>
        <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
      </div>
      <div class="portfolio-card-label">
        <div class="portfolio-tag">${demo.tag}</div>
        <h3>${demo.title}</h3>
      </div>
    </div>`;

  const skeletonHTML = Array.from({ length: 3 }, () => `
    <div class="portfolio-card portfolio-skeleton">
      <div class="skeleton-thumb"></div>
      <div class="skeleton-label"></div>
    </div>`).join('');

  if (portfolioGrid) {
    portfolioGrid.insertAdjacentHTML('afterbegin', skeletonHTML);

    fetch('media/demos.json')
      .then(res => { if (!res.ok) throw new Error('demos.json fetch failed'); return res.json(); })
      .then(data => {
        demos = [...data].sort((a, b) => a.order - b.order);
        portfolioGrid.querySelectorAll('.portfolio-skeleton').forEach(el => el.remove());
        portfolioGrid.insertAdjacentHTML('afterbegin', demos.map(demoCardHTML).join(''));

        portfolioGrid.querySelectorAll('.portfolio-card-video video').forEach(video => {
          video.addEventListener('error', () => video.closest('.portfolio-thumb')?.classList.add('video-error'));
          // preload="none" means the autoplay attribute alone won't start loading — kick it off manually.
          video.play().catch(() => {});
        });

        portfolioGrid.addEventListener('click', (e) => {
          const card = e.target.closest('.portfolio-card-video');
          if (!card) return;
          const demo = demos[Number(card.dataset.index)];
          if (demo) openModal(demo);
        });
      })
      .catch(() => {
        portfolioGrid.querySelectorAll('.portfolio-skeleton').forEach(el => el.remove());
        if (portfolioFallback) portfolioFallback.hidden = false;
      });
  }

  // ── Hero canvas: Make.com-style node graph with yellow particle trails ──
  const canvas = document.getElementById('flowCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width, height, nodes, particles;
  const NODE_COUNT = 22;
  const LINK_DIST = 180;
  const PARTICLE_COUNT = 14;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = canvas.width = rect.width;
    height = canvas.height = rect.height;
  }

  function buildNodes() {
    nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      r: 2 + Math.random() * 2
    }));
  }

  function buildParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, spawnParticle);
  }

  function spawnParticle() {
    const from = nodes[Math.floor(Math.random() * nodes.length)];
    let nearest = null, nearestDist = Infinity;
    for (const n of nodes) {
      if (n === from) continue;
      const d = Math.hypot(n.x - from.x, n.y - from.y);
      if (d < LINK_DIST && d < nearestDist) { nearest = n; nearestDist = d; }
    }
    return { from, to: nearest || nodes[(nodes.indexOf(from) + 1) % nodes.length], t: 0, speed: 0.004 + Math.random() * 0.006 };
  }

  function step() {
    ctx.clearRect(0, 0, width, height);

    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
    }

    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK_DIST) {
          ctx.strokeStyle = `rgba(240,244,255,${0.12 * (1 - d / LINK_DIST)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const n of nodes) {
      ctx.fillStyle = 'rgba(240,244,255,0.5)';
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const p of particles) {
      p.t += p.speed;
      if (p.t >= 1) { Object.assign(p, spawnParticle()); }
      const x = p.from.x + (p.to.x - p.from.x) * p.t;
      const y = p.from.y + (p.to.y - p.from.y) * p.t;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, 8);
      grad.addColorStop(0, 'rgba(255,239,10,0.9)');
      grad.addColorStop(1, 'rgba(255,239,10,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffef0a';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!reduceMotion) requestAnimationFrame(step);
  }

  resize();
  buildNodes();
  buildParticles();
  window.addEventListener('resize', () => { resize(); buildNodes(); buildParticles(); }, { passive: true });

  step(); // draws one frame always; keeps looping itself unless reduced motion is on
});
