document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ---- PRELOADER ----
  window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.classList.add('hidden');
  });

  // ---- LANGUAGE SWITCHER ----
  let langData = {};
  let currentLang = localStorage.getItem('lang') || ((navigator.language || '').slice(0, 2) === 'en' ? 'en' : 'es');

  async function loadLang(lang) {
    try {
      const res = await fetch(`assets/lang/${lang}.json`);
      langData = await res.json();
      applyLang();
      renderProjects();
    } catch (e) {
      console.warn('Failed to load language:', lang);
    }
    const btn = document.getElementById('langToggle');
    if (btn) {
      btn.disabled = false;
      btn.textContent = lang === 'en' ? 'EN' : 'ES';
    }
  }

  function applyLang() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (langData[key]) el.textContent = langData[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (langData[key]) el.setAttribute('placeholder', langData[key]);
    });
    const btn = document.getElementById('langToggle');
    if (btn) btn.textContent = currentLang === 'en' ? 'EN' : 'ES';
  }

  const langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      if (langToggle.disabled) return;
      langToggle.disabled = true;
      langToggle.textContent = '⌛';
      currentLang = currentLang === 'en' ? 'es' : 'en';
      localStorage.setItem('lang', currentLang);
      loadLang(currentLang);
    });
  }

  function getProjects() {
    try {
      const stored = localStorage.getItem('projects');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) {
          return parsed.map(p => {
            const def = DEFAULT_PROJECTS.find(d => d.id === p.id);
            return def ? { ...def, ...p, link: def.link && def.link !== '#' ? def.link : p.link } : p;
          });
        }
      }
    } catch (e) {}
    return DEFAULT_PROJECTS;
  }

  function escapeHtml(str) {
    if (typeof str !== 'string' && typeof str !== 'number') return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  }

  function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '#';
    url = url.trim();
    try {
      const parsed = new URL(url, window.location.origin);
      const protocol = parsed.protocol.toLowerCase();
      if (protocol === 'javascript:' || protocol === 'data:' || protocol === 'vbscript:') return '#';
      return escapeHtml(url);
    } catch {
      if (url.startsWith('javascript:') || url.startsWith('data:') || url.startsWith('vbscript:')) return '#';
      return escapeHtml(url);
    }
  }

  function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    const projects = getProjects();
    const isEn = currentLang === 'en';

    grid.innerHTML = projects.map((p, i) => `
      <article class="project-card reveal" data-category="${escapeHtml(p.category || 'web')}" style="transition-delay:${i * 0.1}s">
        <div class="project-image">
          ${p.image
            ? `<img src="${sanitizeUrl(p.image)}" alt="${escapeHtml(isEn && p.titleEn ? p.titleEn : p.title)}" class="project-img" />`
            : `<div class="project-placeholder">
              <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="40" r="30" stroke="currentColor" stroke-width="3"/>
                <polygon points="35,25 35,55 58,40" fill="currentColor"/>
              </svg>
            </div>
            <div class="project-overlay">
              <span>${isEn ? 'Coming soon' : 'Próximamente'}</span>
            </div>`
          }
        </div>
        <div class="project-body">
          <h3 class="project-title">${escapeHtml(isEn && p.titleEn ? p.titleEn : p.title)}</h3>
          <p class="project-desc">${escapeHtml(isEn && p.descEn ? p.descEn : p.desc)}</p>
          <div class="project-tech">
            ${(p.tech || []).map(t => `<span>${escapeHtml(t)}</span>`).join('')}
          </div>
          <div class="project-links">
            <a href="${sanitizeUrl(p.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm">${isEn ? 'View project' : 'Ver proyecto'}</a>
          </div>
        </div>
      </article>
    `).join('');

    const newReveals = grid.querySelectorAll('.reveal:not(.visible)');
    newReveals.forEach(el => revealObserver.observe(el));
    applyFilter(currentFilter);
  }

  // ---- NAVBAR SCROLL ----
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    const pBar = document.getElementById('progressBar');
    if (pBar) {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      pBar.style.width = total > 0 ? `${(window.pageYOffset / total) * 100}%` : '0%';
    }
  });

  // ---- MOBILE MENU ----
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // ---- ACTIVE NAV LINK ----
  const sections = document.querySelectorAll('section[id]');
  const navLinkEls = document.querySelectorAll('.nav-link');

  function updateActiveLink() {
    const scrollPos = window.pageYOffset + 150;
    let currentId = '';
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = section.getAttribute('id');
      }
    });
    navLinkEls.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
    });
  }

  window.addEventListener('scroll', updateActiveLink);

  // ---- SCROLL REVEAL ----
  const revealEls = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealEls.forEach(el => revealObserver.observe(el));

  // ---- PARTICLES (Hero Canvas) ----
  const canvas = document.getElementById('particlesCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId;
    let mouseX = -1000;
    let mouseY = -1000;

    function resizeCanvas() {
      const hero = canvas.parentElement;
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    }

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.6;
        this.speedY = (Math.random() - 0.5) * 0.6;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.color = Math.random() > 0.7 ? '#2196F3' : '#8BC34A';
        this.pulseSpeed = Math.random() * 0.02 + 0.005;
        this.pulseOffset = Math.random() * Math.PI * 2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.pulseOffset += this.pulseSpeed;

        this.opacity = Math.max(0.05, Math.min(0.6,
          (Math.sin(this.pulseOffset) * 0.3 + 0.4)
        ));

        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120;
          this.x -= dx * force * 0.01;
          this.y -= dy * force * 0.01;
        }

        if (this.x < -10) this.x = canvas.width + 10;
        if (this.x > canvas.width + 10) this.x = -10;
        if (this.y < -10) this.y = canvas.height + 10;
        if (this.y > canvas.height + 10) this.y = -10;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    function initParticles() {
      const count = Math.min(Math.floor(canvas.width * canvas.height / 8000), 80);
      particles = Array.from({ length: count }, () => new Particle());
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = '#8BC34A';
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      drawConnections();
      animId = requestAnimationFrame(animateParticles);
    }

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseleave', () => {
      mouseX = -1000;
      mouseY = -1000;
    });

    canvas.addEventListener('touchmove', e => {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      mouseX = touch.clientX - rect.left;
      mouseY = touch.clientY - rect.top;
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
      mouseX = -1000;
      mouseY = -1000;
    });

    resizeCanvas();
    initParticles();
    animateParticles();

    window.addEventListener('resize', () => {
      resizeCanvas();
      initParticles();
    });
  }

  // ---- FAQ ACCORDION ----
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      if (!item) return;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  // ---- PROJECTS FILTER ----
  function renderFilter() {
    const container = document.getElementById('projectsFilter');
    if (!container) return;
    const isEn = currentLang === 'en';
    container.innerHTML = PROJECT_CATEGORIES.map(cat =>
      `<button class="filter-btn${cat.id === 'all' ? ' active' : ''}" data-filter="${cat.id}">${cat.label[isEn ? 'en' : 'es']}</button>`
    ).join('');
    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilter(btn.getAttribute('data-filter'));
      });
    });
  }

  let currentFilter = 'all';

  function applyFilter(filter) {
    currentFilter = filter;
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    const cards = grid.querySelectorAll('.project-card');
    cards.forEach(card => {
      const cat = card.getAttribute('data-category');
      if (filter === 'all' || cat === filter) {
        card.style.display = '';
        card.classList.add('visible');
      } else {
        card.style.display = 'none';
      }
    });
  }

  // ---- CONTACT FORM ----
  const form = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = langData['contact.form.sending'] || (currentLang === 'en' ? 'Sending...' : 'Enviando...');
      formStatus.textContent = '';
      formStatus.className = 'form-status';

      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();

      if (!name || !email || !message) {
        formStatus.textContent = langData['contact.form.error.required'] || 'Por favor completa todos los campos.';
        formStatus.className = 'form-status error';
        submitBtn.disabled = false;
        submitBtn.textContent = langData['contact.form.submit'] || 'Enviar mensaje';
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        formStatus.textContent = langData['contact.form.error.email'] || 'Por favor ingresa un correo válido.';
        formStatus.className = 'form-status error';
        submitBtn.disabled = false;
        submitBtn.textContent = langData['contact.form.submit'] || 'Enviar mensaje';
        return;
      }

      try {
        const res = await fetch('https://automation-kit.tropicalesjw.workers.dev/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_slug: 'la-oficina',
            name,
            email,
            phone: '',
            message
          })
        });

        if (res.ok) {
          const msg = langData['contact.form.success'] || (currentLang === 'en' ? 'The message has been sent. Check your email to verify it.' : 'Se ha enviado el mensaje. Revisa tu correo electrónico para verificarlo.');
          document.getElementById('modalMessage').textContent = msg;
          document.getElementById('modalOverlay').classList.add('active');
          form.reset();
        } else {
          formStatus.textContent = 'Error al enviar el mensaje.';
          formStatus.className = 'form-status error';
        }
      } catch (err) {
        formStatus.textContent = 'Error de conexión. Intenta de nuevo.';
        formStatus.className = 'form-status error';
      }

      submitBtn.disabled = false;
      submitBtn.textContent = langData['contact.form.submit'] || 'Enviar mensaje';
    });
  }

  // ---- MODAL ----
  document.getElementById('modalClose').addEventListener('click', () => {
    document.getElementById('modalOverlay').classList.remove('active');
  });
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) {
      document.getElementById('modalOverlay').classList.remove('active');
    }
  });

  // ---- PARALLAX TILT ----
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.addEventListener('mousemove', e => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      hero.style.setProperty('--mouse-x', x);
      hero.style.setProperty('--mouse-y', y);
    });
  }

  const tiltCards = document.querySelectorAll('.service-card');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty('--tilt-x', x);
      card.style.setProperty('--tilt-y', y);
    });
    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--tilt-x', 0);
      card.style.setProperty('--tilt-y', 0);
    });
  });

  // ---- INIT ----
  renderFilter();
  loadLang(currentLang);
  renderProjects();

  console.log('🚀 La Oficina — Portfolio loaded');
});






