// ─────────────────────────────────────────
// SAEEMAX — script.js
// Nav, mobile menu, scroll reveals, work ledger,
// how-it-works pinned state, pricing receipt, FAQ pane
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
  hamburger?.addEventListener('click', () => mobileMenu.classList.add('open'));
  mobileClose?.addEventListener('click', () => mobileMenu.classList.remove('open'));
  mobileMenu?.querySelectorAll('.mobile-link').forEach(link =>
    link.addEventListener('click', () => mobileMenu.classList.remove('open')));

  // ── Scroll reveals: entrance for the real content of every section ──
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    const revealSelectors = [
      '.hero-headline', '.hero-sub', '.hero-actions', '.hero-stage',
      '.features-heading', '.features-panel', '.feat-item',
      '.how-heading', '.how-step',
      '.work-header', '.work-filters', '.work-tile',
      '.pricing-intro > *', '.receipt',
      '.faq-list > *', '.faq-answer',
      '.letter-photo-col', '.letter-body > *',
      '.contact-intro > *', '.contact-panel'
    ];
    const revealEls = document.querySelectorAll(revealSelectors.join(','));
    revealEls.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${(i % 6) * 70}ms`;
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  }

  // ── Work: demo grid sourced from YouTube (title contains " - Make Demo"),
  // newest first, fetched via a Netlify function so no video files live in
  // this repo. Falls back to a small static list (baked from the channel at
  // the time this was built) when the function isn't reachable yet — a
  // local file:// preview, or before YOUTUBE_API_KEY is set in Netlify. ──
  const PLATFORM_ICONS = {
    youtube: 'fa-brands fa-youtube',
    linkedin: 'fa-brands fa-linkedin',
    instagram: 'fa-brands fa-instagram',
    hubspot: 'fa-brands fa-hubspot',
    sheets: 'fa-brands fa-google',
  };

  // Same trailing-hashtag strip the Netlify function applies to live
  // YouTube descriptions — kept here too so a manually-edited STATIC_DEMOS
  // description behaves the same way.
  function stripTrailingHashtags(text) {
    const lines = (text || '').split('\n');
    while (lines.length && /^(\s*#\S+)+\s*$/.test(lines[lines.length - 1])) lines.pop();
    while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
    return lines.join('\n').trim();
  }

  function detectPlatform(title) {
    const t = title.toLowerCase();
    if (t.includes('instagram')) return { platform: 'instagram', platformLabel: 'Instagram' };
    if (t.includes('linkedin')) return { platform: 'linkedin', platformLabel: 'LinkedIn' };
    if (t.includes('youtube')) return { platform: 'youtube', platformLabel: 'YouTube' };
    if (t.includes('hubspot') || t.includes('crm') || t.includes('lead')) return { platform: 'hubspot', platformLabel: 'HubSpot' };
    if (t.includes('sheet') || t.includes('report')) return { platform: 'sheets', platformLabel: 'Sheets' };
    return { platform: 'other', platformLabel: 'Automation' };
  }

  const STATIC_DEMOS = [
    { videoId: '3FClgPIlIsE', title: 'Lead Response + CRM (Hubspot, Slack, Gmail)', publishedAt: '2026-10-17', description:
`A lead submits a form.. seconds later: a HubSpot contact and deal, a Slack alert with a response deadline, a confirmation email to the lead, and an automatic sheet log. Watch it run live, including what happens when the same lead submits twice.

Built with Make.com, HubSpot, Tally, Slack, Gmail and Google Sheets.

If leads are slipping through the cracks in your business, comment LEADS and I'll show you how this would work for you.

0:00 The problem
0:18 System Setup
0:55 Lead submits the form
1:11 Lead captured on CRM, Slack, email, sheet
2:12 Duplicate or Same lead sends again
2:56 Conclusion` },
    { videoId: 'mlQ9ZkwmPz0', title: 'Instagram Daily Posts Automated', publishedAt: '2026-10-10', description:
`No more manually posting every day.

This system reads my content calendar, pulls the ready-made post from Google Drive with the caption and hashtags, then posts automatically on the scheduled day. Reels, carousels, image posts... all handled.

Runs daily without me touching it. Status flips from pending to posted and you can verify it live on the feed.

The kind of setup agencies could run across multiple client accounts from one content library.` },
    { videoId: '5n_rwDr39Wg', title: 'Linkedin Posts Automated', publishedAt: '2026-10-05', description:
`Just automated my entire LinkedIn content calendar with Make.com.

One scenario handles posting: checks what post is due for the day, grabs the right media from my Google Drive, writes the caption, and posts it at the right time.

All without me touching anything.

Took a while to get right but it's live and running daily now.` },
    { videoId: 'K5lAQeg3fHU', title: 'YouTube Video to Short Clips + Captions', publishedAt: '2026-09-20', description:
`No more manually watching through long videos to find what's worth clipping.

This Make.com scenario takes a YouTube URL, pulls the full transcript, runs it through Gemini AI, and outputs the best shortform moments — with time ranges and platform-specific captions for Instagram, TikTok, LinkedIn, YouTube Shorts, and Facebook. All saved to a text file in Google Drive automatically.

One URL in. Everything else runs.

Built with Make.com, RapidAPI (YouTube Transcript), and Gemini AI.` },
  ];

  const workGrid = document.getElementById('workGrid');
  const workFilters = document.getElementById('workFilters');
  const workModal = document.getElementById('workModal');
  const workModalFrame = document.getElementById('workModalFrame');
  const workModalTag = document.getElementById('workModalTag');
  const workModalDesc = document.getElementById('workModalDesc');
  let demos = [];

  const tileHTML = (demo, index) => `
    <button class="work-tile" data-index="${index}" data-platform="${demo.platform}">
      <div class="work-tile-thumb" data-video-id="${demo.videoId}">
        <img src="https://i.ytimg.com/vi/${demo.videoId}/maxresdefault.jpg" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${demo.videoId}/mqdefault.jpg'" alt="${demo.title}" loading="lazy">
        <span class="work-tile-play" aria-hidden="true"><i class="fa-solid fa-play"></i></span>
        <span class="work-tile-badge"><i class="${PLATFORM_ICONS[demo.platform] || 'fa-solid fa-gear'}"></i></span>
      </div>
      <div class="work-tile-label">
        <span class="work-tile-title">${demo.title}</span>
        <span class="work-tile-tag">${demo.platformLabel}</span>
      </div>
    </button>`;

  function renderFilters() {
    const seen = new Map();
    demos.forEach(d => { if (!seen.has(d.platform)) seen.set(d.platform, d.platformLabel); });
    const chips = [...seen.entries()].map(([platform, label]) =>
      `<button class="work-filter" data-platform="${platform}"><i class="${PLATFORM_ICONS[platform] || ''}"></i>${label}</button>`
    ).join('');
    workFilters.insertAdjacentHTML('beforeend', chips);
  }

  function applyFilter(platform) {
    workFilters.querySelectorAll('.work-filter').forEach(f => f.classList.toggle('active', f.dataset.platform === platform));
    workGrid.querySelectorAll('.work-tile').forEach(tile => {
      tile.hidden = platform !== 'all' && tile.dataset.platform !== platform;
    });
  }

  function openWorkModal(demo) {
    workModalFrame.src = `https://www.youtube.com/embed/${demo.videoId}?autoplay=1&rel=0`;
    workModalFrame.title = demo.title;
    workModalTag.textContent = demo.platformLabel;
    workModalDesc.textContent = demo.description;
    workModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeWorkModal() {
    workModal.classList.remove('open');
    document.body.style.overflow = '';
    workModalFrame.src = '';
  }
  document.getElementById('workModalClose')?.addEventListener('click', closeWorkModal);
  document.getElementById('workModalOverlay')?.addEventListener('click', closeWorkModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && workModal?.classList.contains('open')) closeWorkModal(); });

  async function loadDemos() {
    try {
      const res = await fetch('/.netlify/functions/demos');
      const data = await res.json();
      if (!res.ok || !Array.isArray(data) || !data.length) throw new Error(data.error || 'no demos returned');
      return data;
    } catch {
      return STATIC_DEMOS;
    }
  }

  if (workGrid) {
    loadDemos().then(data => {
      demos = [...data]
        .map(d => ({ ...d, ...detectPlatform(d.title), description: stripTrailingHashtags(d.description) }))
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      workGrid.innerHTML = demos.map(tileHTML).join('');
      renderFilters();

      // Preview tiles autoplay a silent, looping embed once scrolled into
      // view (not all at once on load — each tile is its own YouTube
      // player, so loading every one up front would be heavy).
      const previewIO = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const thumb = entry.target;
          previewIO.unobserve(thumb);
          const id = thumb.dataset.videoId;
          const iframe = document.createElement('iframe');
          iframe.className = 'work-tile-video';
          iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&playsinline=1&rel=0`;
          iframe.setAttribute('allow', 'autoplay; encrypted-media');
          iframe.setAttribute('frameborder', '0');
          iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
          thumb.appendChild(iframe);
        });
      }, { threshold: 0.4 });
      workGrid.querySelectorAll('.work-tile-thumb').forEach(t => previewIO.observe(t));

      workFilters.addEventListener('click', (e) => {
        const chip = e.target.closest('.work-filter');
        if (chip) applyFilter(chip.dataset.platform);
      });
      workGrid.addEventListener('click', (e) => {
        const tile = e.target.closest('.work-tile');
        if (tile) openWorkModal(demos[Number(tile.dataset.index)]);
      });
    });
  }

  // ── How it works: connectors are positioned over the real number
  // elements so "01" always sits exactly above its own heading, then the
  // yellow line sweeps left-to-right when the row is in view ──
  const howRow = document.getElementById('howRow');
  if (howRow) {
    const howConnectors = [document.getElementById('howConnector1'), document.getElementById('howConnector2')];
    function drawHowConnectors() {
      if (window.innerWidth <= 900) return;
      const nums = [...howRow.querySelectorAll('.how-num')];
      if (nums.length < 2) return;
      const rowBox = howRow.getBoundingClientRect();
      for (let i = 0; i < howConnectors.length; i++) {
        const a = nums[i].getBoundingClientRect();
        const b = nums[i + 1].getBoundingClientRect();
        const gap = 14;
        const left = a.right - rowBox.left + gap;
        const width = Math.max(0, b.left - rowBox.left - gap - left);
        const top = a.top - rowBox.top + a.height / 2 - 2;
        Object.assign(howConnectors[i].style, { left: `${left}px`, top: `${top}px`, width: `${width}px` });
      }
    }
    drawHowConnectors();
    window.addEventListener('load', drawHowConnectors);
    document.fonts?.ready.then(drawHowConnectors);
    let howResizeTimer;
    window.addEventListener('resize', () => { clearTimeout(howResizeTimer); howResizeTimer = setTimeout(drawHowConnectors, 150); });

    const howIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => entry.target.classList.toggle('in-view', entry.isIntersecting));
    }, { threshold: 0.4 });
    howIO.observe(howRow);
  }

  // ── Work that repeats: draw the connecting line through the real icon
  // positions (so it never crosses the text), then replay the yellow flow
  // each time the column re-enters view ──
  const featCols = document.querySelectorAll('.feat-col');
  if (featCols.length) {
    function drawFeatLine(col) {
      const svg = col.querySelector('.feat-line');
      const icons = [...col.querySelectorAll('.feat-icon')];
      if (!svg || icons.length < 2) return;
      const box = col.getBoundingClientRect();
      const pts = icons.map(icon => {
        const r = icon.getBoundingClientRect();
        return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
      });
      svg.setAttribute('width', box.width);
      svg.setAttribute('height', box.height);
      // one straight segment per icon-to-icon gap, so the flow can light
      // each segment in turn instead of one curve crossing the whole column
      for (let i = 1; i < pts.length; i++) {
        const d = `M${pts[i - 1].x},${pts[i - 1].y} L${pts[i].x},${pts[i].y}`;
        svg.querySelectorAll(`[data-seg="${i}"]`).forEach(p => p.setAttribute('d', d));
      }
    }
    const drawAllFeatLines = () => featCols.forEach(drawFeatLine);
    drawAllFeatLines();
    window.addEventListener('load', drawAllFeatLines);
    document.fonts?.ready.then(drawAllFeatLines);
    let resizeTimer;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(drawAllFeatLines, 150); });

    const featIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => entry.target.classList.toggle('in-view', entry.isIntersecting));
    }, { threshold: 0.35 });
    featCols.forEach(col => featIO.observe(col));
  }

  // ── Pricing: live receipt calculator ──
  const pricingOptions = document.getElementById('pricingOptions');
  const receiptLines = document.getElementById('receiptLines');
  const receiptTotal = document.getElementById('receiptTotal');
  const receiptTotalLabel = document.getElementById('receiptTotalLabel');
  const receiptNote = document.getElementById('receiptNote');
  const BUNDLE_PRICE = 1597;

  function updateReceipt() {
    const checked = [...pricingOptions.querySelectorAll('input:checked')];
    receiptLines.innerHTML = checked.map(c =>
      `<li><span>${c.dataset.label}</span><span>$${c.value}</span></li>`).join('');

    const sum = checked.reduce((t, c) => t + Number(c.value), 0);
    const allFour = checked.length === pricingOptions.querySelectorAll('input').length;

    if (allFour) {
      receiptTotalLabel.textContent = 'Full Growth Stack';
      receiptTotal.textContent = `$${BUNDLE_PRICE.toLocaleString()}`;
      receiptNote.textContent = `All 4 systems, bundled. You save $${(sum - BUNDLE_PRICE).toLocaleString()}.`;
    } else {
      receiptTotalLabel.textContent = 'Total';
      receiptTotal.textContent = checked.length ? `$${sum.toLocaleString()}` : '$0';
      receiptNote.textContent = checked.length ? 'Tick all four for the bundled rate.' : 'Pick at least one system.';
    }
  }
  pricingOptions?.addEventListener('change', updateReceipt);
  updateReceipt();

  // ── Contact: message / call tabs + mailto send ──
  const contactTabs = document.querySelectorAll('.contact-tab');
  const calendlyStage = document.getElementById('calendlyStage');
  let calendlyLoaded = false;

  function loadCalendly() {
    if (calendlyLoaded || !calendlyStage) return;
    calendlyLoaded = true;
    const widget = document.createElement('div');
    widget.className = 'calendly-inline-widget';
    widget.dataset.url = 'https://calendly.com/faarisrazi?primary_color=ffef0a&text_color=0d1a42&background_color=ffffff';
    widget.style.cssText = 'min-width:320px;height:700px;';
    calendlyStage.appendChild(widget);
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);
  }

  function activateContactTab(name) {
    const tab = [...contactTabs].find(t => t.dataset.tab === name);
    if (!tab) return;
    contactTabs.forEach(t => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', t === tab); });
    document.querySelectorAll('.contact-tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === name));
    if (name === 'call') loadCalendly();
  }
  contactTabs.forEach(tab => tab.addEventListener('click', () => activateContactTab(tab.dataset.tab)));
  document.querySelectorAll('a[data-tab-target]').forEach(a =>
    a.addEventListener('click', () => activateContactTab(a.dataset.tabTarget)));

  document.getElementById('contactForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const { name, email, message } = e.target.elements;
    const subject = encodeURIComponent(`Automation enquiry from ${name.value}`);
    const body = encodeURIComponent(`${message.value}\n\n— ${name.value} (${email.value})`);
    window.location.href = `mailto:faaris@saeemax.com?subject=${subject}&body=${body}`;
  });

  // ── FAQ: question list + answer pane ──
  const faqQs = document.querySelectorAll('.faq-q');
  const faqAs = document.querySelectorAll('.faq-answer p');
  faqQs.forEach(q => {
    q.addEventListener('click', () => {
      faqQs.forEach(el => el.classList.toggle('active', el === q));
      faqAs.forEach(el => el.classList.toggle('active', el.dataset.index === q.dataset.index));
    });
  });

});
