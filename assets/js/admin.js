let projects = [];
let editingId = null;
let loginAttempts = 0;
let loginBlockedUntil = 0;
let loginTimer = null;
let inactivityTimer = null;
const INACTIVITY_LIMIT = 15 * 60 * 1000;
const STARTUP_CHECK = true;

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  if (document.getElementById('adminPanel').style.display === 'block') {
    sessionStorage.setItem('adminAuth', Date.now());
    inactivityTimer = setTimeout(forceLogout, INACTIVITY_LIMIT);
  }
}

function forceLogout() {
  alert('Sesión expirada por inactividad.');
  logout();
}

function checkSession() {
  const auth = sessionStorage.getItem('adminAuth');
  if (!auth) return false;
  const elapsed = Date.now() - Number(auth);
  if (elapsed > INACTIVITY_LIMIT) {
    sessionStorage.removeItem('adminAuth');
    return false;
  }
  return true;
}

const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];

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
    return url;
  } catch {
    if (url.startsWith('javascript:') || url.startsWith('data:') || url.startsWith('vbscript:')) return '#';
    return url;
  }
}

function authenticate() {
  const now = Date.now();
  if (now < loginBlockedUntil) {
    const secs = Math.ceil((loginBlockedUntil - now) / 1000);
    document.getElementById('loginError').textContent = `Demasiados intentos. Espera ${secs} segundos.`;
    return;
  }
  clearInterval(loginTimer);
  const pass = document.getElementById('adminPass').value;
  if (pass === 'laoficina') {
    loginAttempts = 0;
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    sessionStorage.setItem('adminAuth', Date.now());
    resetInactivityTimer();
    activityEvents.forEach(ev => document.addEventListener(ev, resetInactivityTimer, { passive: true }));
    loadProjects();
  } else {
    loginAttempts++;
    document.getElementById('loginError').textContent = 'Contraseña incorrecta';
    if (loginAttempts >= 3) {
      loginBlockedUntil = Date.now() + 30000;
      loginAttempts = 0;
      const inp = document.getElementById('adminPass');
      inp.disabled = true;
      const btn = document.querySelector('.login-box button');
      btn.disabled = true;
      loginTimer = setInterval(() => {
        const rem = Math.ceil((loginBlockedUntil - Date.now()) / 1000);
        if (rem <= 0) {
          clearInterval(loginTimer);
          inp.disabled = false;
          btn.disabled = false;
          document.getElementById('loginError').textContent = '';
        } else {
          document.getElementById('loginError').textContent = `Demasiados intentos. Espera ${rem} segundos.`;
        }
      }, 500);
    }
  }
}

function loadProjects() {
  try {
    const stored = localStorage.getItem('projects');
    projects = stored ? JSON.parse(stored) : [...DEFAULT_PROJECTS];
  } catch (e) {
    projects = [...DEFAULT_PROJECTS];
  }
  renderProjects();
  updateStats();
}

function saveProjects() {
  localStorage.setItem('projects', JSON.stringify(projects));
  renderProjects();
  updateStats();
}

function updateStats() {
  document.getElementById('projectCount').textContent = projects.length;
}

function renderProjects() {
  const list = document.getElementById('projectsList');
  if (!list) return;
  if (projects.length === 0) {
    list.innerHTML = '<div class="admin-empty">No hay proyectos. Agrega el primero.</div>';
    return;
  }
  list.innerHTML = projects.map((p, i) => `
    <div class="admin-project-item">
      <div class="admin-project-order">
        <button onclick="moveProject(${i}, -1)" ${i === 0 ? 'disabled' : ''} title="Subir">&#9650;</button>
        <span>${i + 1}</span>
        <button onclick="moveProject(${i}, 1)" ${i === projects.length - 1 ? 'disabled' : ''} title="Bajar">&#9660;</button>
      </div>
      <div class="admin-project-info">
        <strong>${escapeHtml(p.title)}</strong>
        <span class="admin-project-tech">${escapeHtml((p.tech || []).join(', '))}</span>
      </div>
      <div class="admin-project-actions">
        <button class="btn-admin btn-edit" onclick="editProject('${escapeHtml(p.id)}')">Editar</button>
        <button class="btn-admin btn-delete" onclick="deleteProject('${escapeHtml(p.id)}')">Eliminar</button>
      </div>
    </div>
  `).join('');
}

function moveProject(idx, dir) {
  const target = idx + dir;
  if (target < 0 || target >= projects.length) return;
  [projects[idx], projects[target]] = [projects[target], projects[idx]];
  saveProjects();
}

function showForm(p) {
  editingId = p ? p.id : null;
  document.getElementById('formTitle').textContent = p ? 'Editar proyecto' : 'Nuevo proyecto';
  document.getElementById('projectTitle').value = p ? p.title : '';
  document.getElementById('projectTitleEn').value = p ? (p.titleEn || '') : '';
  document.getElementById('projectDesc').value = p ? p.desc : '';
  document.getElementById('projectDescEn').value = p ? (p.descEn || '') : '';
  document.getElementById('projectTech').value = p ? (p.tech || []).join(', ') : '';
  document.getElementById('projectLink').value = p ? p.link : '';
  document.getElementById('formSection').style.display = 'block';
  document.getElementById('formSection').scrollIntoView({ behavior: 'smooth' });
}

function cancelForm() {
  editingId = null;
  document.getElementById('formSection').style.display = 'none';
}

function saveForm() {
  const title = document.getElementById('projectTitle').value.trim();
  const titleEn = document.getElementById('projectTitleEn').value.trim();
  const desc = document.getElementById('projectDesc').value.trim();
  const descEn = document.getElementById('projectDescEn').value.trim();
  const tech = document.getElementById('projectTech').value.split(',').map(s => s.trim()).filter(Boolean);
    const link = sanitizeUrl(document.getElementById('projectLink').value.trim());

  if (!title || !desc) {
    alert('Título y descripción son obligatorios.');
    return;
  }

  if (editingId) {
    const idx = projects.findIndex(p => p.id === editingId);
    if (idx !== -1) {
      projects[idx] = { ...projects[idx], title, titleEn, desc, descEn, tech, link };
    }
  } else {
    const id = 'proj-' + Date.now();
    projects.push({ id, title, titleEn, desc, descEn, tech, link, icon: 'play' });
  }

  saveProjects();
  cancelForm();
}

function editProject(id) {
  const p = projects.find(proj => proj.id === id);
  if (p) showForm(p);
}

function deleteProject(id) {
  if (!confirm('¿Eliminar este proyecto?')) return;
  projects = projects.filter(p => p.id !== id);
  saveProjects();
}

function exportProjects() {
  const data = JSON.stringify(projects, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'proyectos.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importProjects() {
  const input = document.getElementById('importFile');
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error('Formato inválido');
      if (!confirm(`¿Importar ${data.length} proyectos? Esto reemplazará los actuales.`)) return;
      projects = data;
      saveProjects();
      alert('Proyectos importados correctamente.');
    } catch (err) {
      alert('Error al importar: formato de archivo inválido.');
    }
  };
  reader.readAsText(file);
  input.value = '';
}

function resetDefaults() {
  if (!confirm('¿Restaurar proyectos por defecto? Se perderán los cambios actuales.')) return;
  localStorage.removeItem('projects');
  loadProjects();
}

function logout() {
  clearTimeout(inactivityTimer);
  sessionStorage.removeItem('adminAuth');
  activityEvents.forEach(ev => document.removeEventListener(ev, resetInactivityTimer));
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminPass').value = '';
  document.getElementById('loginError').textContent = '';
}

document.addEventListener('DOMContentLoaded', () => {
  if (STARTUP_CHECK && checkSession()) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    sessionStorage.setItem('adminAuth', Date.now());
    resetInactivityTimer();
    activityEvents.forEach(ev => document.addEventListener(ev, resetInactivityTimer, { passive: true }));
    loadProjects();
  } else {
    document.getElementById('loginScreen').style.display = 'flex';
  }
});
