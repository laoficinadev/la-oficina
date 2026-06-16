/* =============================================
   LA OFICINA — Main JavaScript
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ---- NAVBAR SCROLL EFFECT ----
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  });

  // ---- MOBILE MENU ----
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // ---- ACTIVE NAV LINK ON SCROLL ----
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

  // ---- SCROLL REVEAL (Intersection Observer) ----
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

        // Mouse interaction
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120;
          this.x -= dx * force * 0.01;
          this.y -= dy * force * 0.01;
        }

        // Wrap around
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

    // Touch for mobile
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
    return `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`;
  }

  function openMailto(name, email, message) {
    const subject = `Contacto desde La Oficina - ${name}`;
    const body = buildBody(name, email, message);
    return `mailto:theoffice7075@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function openGmailWeb(name, email, message) {
    const subject = `Contacto desde La Oficina - ${name}`;
    const body = buildBody(name, email, message);
    const params = new URLSearchParams({
      view: 'cm',
      fs: '1',
      to: 'theoffice7075@gmail.com',
      su: subject,
      body: body
    });
    return `https://mail.google.com/mail/?${params.toString()}`;
  }

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = 'Redirigiendo...';
      formStatus.textContent = '';
      formStatus.className = 'form-status';

      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();

      if (!name || !email || !message) {
        formStatus.textContent = 'Por favor completa todos los campos.';
        formStatus.className = 'form-status error';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar mensaje';
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        formStatus.textContent = 'Por favor ingresa un correo válido.';
        formStatus.className = 'form-status error';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar mensaje';
        return;
      }

      const platform = detectPlatform();
      let url;

      switch (platform) {
        case 'pc':
          url = openGmailWeb(name, email, message);
          formStatus.textContent = 'Abriendo Gmail...';
          formStatus.className = 'form-status success';
          await new Promise(r => setTimeout(r, 400));
          window.open(url, '_blank');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Enviar mensaje';
          return;
        case 'android':
          url = openGmailWeb(name, email, message);
          break;
        case 'ios':
          url = openMailto(name, email, message);
          break;
      }

      formStatus.textContent = 'Abriendo tu correo...';
      formStatus.className = 'form-status success';

      // Small delay so the user sees the status
      await new Promise(r => setTimeout(r, 600));
      window.location.href = url;

      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar mensaje';
    });
  }

  // ---- PARALLAX EFFECT ON HERO GRADIENTS (optional touch) ----
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

  console.log('🚀 La Oficina — Portfolio loaded');
});
