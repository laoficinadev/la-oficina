document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ---- PRELOADER ----
  window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.classList.add('hidden');
  });

  // ---- THEME TOGGLE ----
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeAriaLabel(theme);
  }

  function updateThemeAriaLabel(theme) {
    if (!themeToggle) return;
    themeToggle.setAttribute('aria-label',
      currentLang === 'en'
        ? (theme === 'light' ? 'Dark mode' : 'Light mode')
        : (theme === 'light' ? 'Modo oscuro' : 'Modo claro'));
  }

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) html.setAttribute('data-theme', savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      setTheme(current === 'light' ? 'dark' : 'light');
    });
  }

  // ---- LANGUAGE SWITCHER ----
  let currentLang = localStorage.getItem('lang') || 'es';
  let langData = {};

  async function loadLang(lang) {
    try {
      const res = await fetch(`assets/lang/${lang}.json`);
      langData = await res.json();
      applyLang();
      renderProjects();
    } catch (e) {
      console.warn('Failed to load language:', lang);
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
    updateThemeAriaLabel(html.getAttribute('data-theme'));
  }

  const langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'es' : 'en';
      localStorage.setItem('lang', currentLang);
      loadLang(currentLang);
    });
  }

  // ---- DEFAULT PROJECTS ----
  const DEFAULT_PROJECTS = [
    {
      id: 'proj-1',
      title: 'Reproductor Multimedia',
      titleEn: 'Media Player',
      desc: 'Reproductor web con soporte para múltiples formatos, listas dinámicas y control de reproducción.',
      descEn: 'Web player with multi-format support, dynamic playlists and playback control.',
      tech: ['HTML', 'CSS', 'JavaScript', 'PHP', 'Python'],
      link: '#',
      icon: 'play'
    },
    {
      id: 'proj-2',
      title: 'Red Social',
      titleEn: 'Social Network',
      desc: 'Plataforma social con autenticación, publicaciones con imágenes, perfiles de usuario y feed en tiempo real.',
      descEn: 'Social platform with authentication, image posts, user profiles and real-time feed.',
      tech: ['Next.js', 'React', 'TypeScript', 'Supabase', 'Tailwind'],
      link: '#',
      icon: 'network'
    },
    {
      id: 'proj-3',
      title: 'Viajes de Camiones',
      titleEn: 'Truck Trips',
      desc: 'Plataforma de contratación de viajes de carga con seguimiento en tiempo real y cotización instantánea.',
      descEn: 'Cargo trip booking platform with real-time tracking and instant quotes.',
      tech: ['HTML', 'CSS', 'JavaScript', 'PHP', 'SQL'],
      link: '#',
      icon: 'truck'
    }
  ];

  function getProjects() {
    try {
      const stored = localStorage.getItem('projects');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch (e) {}
    return DEFAULT_PROJECTS;
  }

  function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    const projects = getProjects();
    const isEn = currentLang === 'en';

    grid.innerHTML = projects.map(p => `
      <article class="project-card reveal">
        <div class="project-image">
          <div class="project-placeholder">
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="30" stroke="currentColor" stroke-width="3"/>
              <polygon points="35,25 35,55 58,40" fill="currentColor"/>
            </svg>
          </div>
          <div class="project-overlay">
            <span>${isEn ? 'Coming soon' : 'Próximamente'}</span>
          </div>
        </div>
        <div class="project-body">
          <h3 class="project-title">${isEn && p.titleEn ? p.titleEn : p.title}</h3>
          <p class="project-desc">${isEn && p.descEn ? p.descEn : p.desc}</p>
          <div class="project-tech">
            ${p.tech.map(t => `<span>${t}</span>`).join('')}
          </div>
          <div class="project-links">
            <a href="${p.link}" class="btn btn-sm">${isEn ? 'View project' : 'Ver proyecto'}</a>
          </div>
        </div>
      </article>
    `).join('');

    const newReveals = grid.querySelectorAll('.reveal:not(.visible)');
    newReveals.forEach(el => revealObserver.observe(el));
  }

  // ---- NAVBAR SCROLL ----
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
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

  // ---- THREE.JS ----
  const container = document.getElementById('three-container');
  if (container && typeof THREE !== 'undefined') {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 22;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const geometries = [
      new THREE.TorusKnotGeometry(1.8, 0.6, 100, 16),
      new THREE.OctahedronGeometry(1.6),
      new THREE.IcosahedronGeometry(1.5),
      new THREE.TorusGeometry(1.8, 0.4, 16, 48),
      new THREE.DodecahedronGeometry(1.4)
    ];

    const colors = [0x8BC34A, 0x2196F3, 0x6B8E23, 0x64B5F6, 0x9CCC65];
    const meshes = [];

    geometries.forEach((geo, i) => {
      const mat = new THREE.MeshPhysicalMaterial({
        color: colors[i],
        wireframe: true,
        metalness: 0.1,
        roughness: 0.4,
        transparent: true,
        opacity: 0.25 + Math.random() * 0.15
      });
      const mesh = new THREE.Mesh(geo, mat);
      const radius = 5 + Math.random() * 4;
      const angle = (i / geometries.length) * Math.PI * 2;
      mesh.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 8 - 4
      );
      mesh.userData = {
        rotSpeedX: (Math.random() - 0.5) * 0.015,
        rotSpeedY: (Math.random() - 0.5) * 0.015,
        rotSpeedZ: (Math.random() - 0.5) * 0.01,
        floatSpeed: 0.002 + Math.random() * 0.003,
        floatOffset: Math.random() * Math.PI * 2,
        baseY: mesh.position.y
      };
      scene.add(mesh);
      meshes.push(mesh);
    });

    let mouseX = 0, mouseY = 0;

    container.addEventListener('mousemove', e => {
      const rect = container.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    });

    container.addEventListener('touchmove', e => {
      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      mouseX = (touch.clientX - rect.left) / rect.width - 0.5;
      mouseY = (touch.clientY - rect.top) / rect.height - 0.5;
    }, { passive: true });

    window.addEventListener('resize', () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    let clock = new THREE.Clock();

    function animateThree() {
      requestAnimationFrame(animateThree);
      const t = clock.getElapsedTime();
      meshes.forEach(mesh => {
        mesh.rotation.x += mesh.userData.rotSpeedX;
        mesh.rotation.y += mesh.userData.rotSpeedY;
        mesh.rotation.z += mesh.userData.rotSpeedZ;
        mesh.position.y = mesh.userData.baseY + Math.sin(t * mesh.userData.floatSpeed * 10 + mesh.userData.floatOffset) * 1.2;
      });
      camera.position.x += (mouseX * 3 - camera.position.x) * 0.03;
      camera.position.y += (-mouseY * 2 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    }

    animateThree();
  }

  // ---- CONTACT FORM ----
  const form = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');

  function detectPlatform() {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return 'android';
    if (/iPad|iPhone|iPod/i.test(ua)) return 'ios';
    return 'pc';
  }

  function buildBody(name, email, message) {
    return `${currentLang === 'en' ? 'Name' : 'Nombre'}: ${name}\n${currentLang === 'en' ? 'Email' : 'Email'}: ${email}\n\n${currentLang === 'en' ? 'Message' : 'Mensaje'}:\n${message}`;
  }

  function openMailtoUrl(name, email, message) {
    const subject = `${currentLang === 'en' ? 'Contact from La Oficina' : 'Contacto desde La Oficina'} - ${name}`;
    const body = buildBody(name, email, message);
    const a = document.createElement('a');
    a.href = `mailto:theoffice7075@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function openGmailWeb(name, email, message) {
    const subject = `${currentLang === 'en' ? 'Contact from La Oficina' : 'Contacto desde La Oficina'} - ${name}`;
    const body = buildBody(name, email, message);
    const params = new URLSearchParams({
      view: 'cm', fs: '1',
      to: 'theoffice7075@gmail.com',
      su: subject, body: body
    });
    return `https://mail.google.com/mail/?${params.toString()}`;
  }

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = langData['contact.form.sending'] || (currentLang === 'en' ? 'Redirecting...' : 'Redirigiendo...');
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

      const platform = detectPlatform();

      switch (platform) {
        case 'pc':
          formStatus.textContent = langData['contact.form.success'] || (currentLang === 'en' ? 'Opening Gmail...' : 'Abriendo Gmail...');
          formStatus.className = 'form-status success';
          await new Promise(r => setTimeout(r, 400));
          window.open(openGmailWeb(name, email, message), '_blank');
          break;
        case 'android':
        case 'ios':
          formStatus.textContent = currentLang === 'en' ? 'Opening your email...' : 'Abriendo tu correo...';
          formStatus.className = 'form-status success';
          await new Promise(r => setTimeout(r, 400));
          openMailtoUrl(name, email, message);
          break;
      }

      submitBtn.disabled = false;
      submitBtn.textContent = langData['contact.form.submit'] || 'Enviar mensaje';
    });
  }

  // ---- PARALLAX ----
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

  // ---- INIT ----
  loadLang(currentLang);
  renderProjects();

  console.log('🚀 La Oficina — Portfolio loaded');
});
