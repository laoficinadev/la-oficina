const ADMIN_HASH = 'd8a07aa665857d3b8b480f5ae27f9584edcab9d6b882d03b2f5d298fa7d2c514';

function hashPass(pass) {
  const buf = new TextEncoder().encode(pass);
  return crypto.subtle.digest('SHA-256', buf).then(h => {
    const hex = Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex;
  });
}
let editingId = null;
let loginTimer = null;

function getLoginState() {
  try {
    return JSON.parse(localStorage.getItem('loginState')) || { attempts: 0, blockedUntil: 0 };
  } catch { return { attempts: 0, blockedUntil: 0 }; }
}

function saveLoginState(s) {
  localStorage.setItem('loginState', JSON.stringify(s));
}
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

function auditLog(action, detail) {
  try {
    const logs = JSON.parse(localStorage.getItem('auditLog') || '[]');
    logs.push({ action, detail, time: new Date().toISOString() });
    while (logs.length > 200) logs.shift();
    localStorage.setItem('auditLog', JSON.stringify(logs));
  } catch {}
}

function getAuditLog() {
  try {
    return JSON.parse(localStorage.getItem('auditLog') || '[]');
  } catch { return []; }
}

function clearAuditLog() {
  if (!confirm('¿Borrar todo el registro de actividad?')) return;
  localStorage.removeItem('auditLog');
  renderAuditLog();
}

function renderAuditLog() {
  const container = document.getElementById('auditLogContent');
  const logs = getAuditLog();
  if (logs.length === 0) {
    container.innerHTML = '<div class="admin-empty">Sin actividad registrada.</div>';
    return;
  }
  container.innerHTML = '<table class="audit-table"><thead><tr><th>Fecha</th><th>Acción</th><th>Detalle</th></tr></thead><tbody>' +
    logs.slice().reverse().map(l => `<tr><td>${escapeHtml(new Date(l.time).toLocaleString())}</td><td>${escapeHtml(l.action)}</td><td>${escapeHtml(l.detail)}</td></tr>`).join('') +
    '</tbody></table>';
}

async function authenticate() {
  const state = getLoginState();
  const now = Date.now();
  if (now < state.blockedUntil) {
    const secs = Math.ceil((state.blockedUntil - now) / 1000);
    document.getElementById('loginError').textContent = `Demasiados intentos. Espera ${secs} segundos.`;
    return;
  }
  clearInterval(loginTimer);
  const pass = document.getElementById('adminPass').value;
  const inputHash = await hashPass(pass);
  if (inputHash === ADMIN_HASH) {
    saveLoginState({ attempts: 0, blockedUntil: 0 });
    auditLog('login', 'Inicio de sesión exitoso');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    sessionStorage.setItem('adminAuth', Date.now());
    resetInactivityTimer();
    activityEvents.forEach(ev => document.addEventListener(ev, resetInactivityTimer, { passive: true }));
    loadProjects();
  } else {
    state.attempts++;
    auditLog('login_fail', `Intento fallido #${state.attempts}`);
    document.getElementById('loginError').textContent = 'Contraseña incorrecta';
    if (state.attempts >= 3) {
      const delay = Math.min(30 * Math.pow(2, state.attempts - 3), 1800) * 1000;
      state.blockedUntil = now + delay;
      state.attempts = 0;
      saveLoginState(state);
      const inp = document.getElementById('adminPass');
      inp.disabled = true;
      const btn = document.getElementById('loginBtn');
      btn.disabled = true;
      loginTimer = setInterval(() => {
        const rem = Math.ceil((state.blockedUntil - Date.now()) / 1000);
        if (rem <= 0) {
          clearInterval(loginTimer);
          inp.disabled = false;
          btn.disabled = false;
          document.getElementById('loginError').textContent = '';
        } else {
          document.getElementById('loginError').textContent = `Demasiados intentos. Espera ${rem} segundos.`;
        }
      }, 500);
    } else {
      saveLoginState(state);
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
        <button data-action="move" data-idx="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''} title="Subir">&#9650;</button>
        <span>${i + 1}</span>
        <button data-action="move" data-idx="${i}" data-dir="1" ${i === projects.length - 1 ? 'disabled' : ''} title="Bajar">&#9660;</button>
      </div>
      <div class="admin-project-info">
        <strong>${escapeHtml(p.title)}</strong>
        <span class="admin-project-tech">${escapeHtml((p.tech || []).join(', '))}</span>
      </div>
      <div class="admin-project-actions">
        <button class="btn-admin btn-edit" data-action="edit" data-id="${escapeHtml(p.id)}">Editar</button>
        <button class="btn-admin btn-delete" data-action="delete" data-id="${escapeHtml(p.id)}">Eliminar</button>
      </div>
    </div>
  `).join('');
}

function moveProject(idx, dir) {
  const target = idx + dir;
  if (target < 0 || target >= projects.length) return;
  [projects[idx], projects[target]] = [projects[target], projects[idx]];
  saveProjects();
  auditLog('reorder', `Proyecto movido de posición ${idx + 1} a ${target + 1}`);
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
    auditLog('edit', `Proyecto editado: "${title}"`);
  } else {
    const id = 'proj-' + Date.now();
    projects.push({ id, title, titleEn, desc, descEn, tech, link, icon: 'play' });
    auditLog('create', `Proyecto creado: "${title}"`);
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
  const p = projects.find(proj => proj.id === id);
  projects = projects.filter(proj => proj.id !== id);
  saveProjects();
  if (p) auditLog('delete', `Proyecto eliminado: "${p.title}"`);
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
  auditLog('export', `Exportados ${projects.length} proyectos`);
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
      auditLog('import', `Importados ${data.length} proyectos`);
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
  auditLog('reset', 'Proyectos restaurados a defaults');
  loadProjects();
}

function logout() {
  clearTimeout(inactivityTimer);
  sessionStorage.removeItem('adminAuth');
  auditLog('logout', 'Cierre de sesión');
  activityEvents.forEach(ev => document.removeEventListener(ev, resetInactivityTimer));
  const url = new URL('/admin.html', window.location.origin);
  url.searchParams.set('logout', '1');
  window.location.href = url.href;
}

document.addEventListener('DOMContentLoaded', () => {
  // Event delegation for project list actions
  document.getElementById('projectsList').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'move') moveProject(Number(btn.dataset.idx), Number(btn.dataset.dir));
    else if (action === 'edit') editProject(btn.dataset.id);
    else if (action === 'delete') deleteProject(btn.dataset.id);
  });

  // Button event listeners
  document.getElementById('loginBtn').addEventListener('click', authenticate);
  document.getElementById('adminPass').addEventListener('keydown', e => { if (e.key === 'Enter') authenticate(); });
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('newProjectBtn').addEventListener('click', () => showForm(null));
  document.getElementById('exportBtn').addEventListener('click', exportProjects);
  document.getElementById('resetBtn').addEventListener('click', resetDefaults);
  document.getElementById('saveBtn').addEventListener('click', saveForm);
  document.getElementById('cancelBtn').addEventListener('click', cancelForm);
  document.getElementById('importFile').addEventListener('change', importProjects);
  document.getElementById('auditBtn').addEventListener('click', () => {
    const section = document.getElementById('auditLogSection');
    if (section.style.display === 'block') {
      section.style.display = 'none';
    } else {
      section.style.display = 'block';
      renderAuditLog();
    }
  });
  document.getElementById('clearAuditBtn').addEventListener('click', clearAuditLog);

  if (window.__workerAuth) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    sessionStorage.setItem('adminAuth', Date.now());
    resetInactivityTimer();
    activityEvents.forEach(ev => document.addEventListener(ev, resetInactivityTimer, { passive: true }));
    loadProjects();
    return;
  }

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
