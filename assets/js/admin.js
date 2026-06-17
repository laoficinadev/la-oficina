let projects = [];
let editingId = null;

function authenticate() {
  const pass = document.getElementById('adminPass').value;
  if (pass === 'laoficina') {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    loadProjects();
  } else {
    document.getElementById('loginError').textContent = 'Contraseña incorrecta';
  }
}

function loadProjects() {
  try {
    const stored = localStorage.getItem('projects');
    projects = stored ? JSON.parse(stored) : getDefaultProjects();
  } catch (e) {
    projects = getDefaultProjects();
  }
  renderProjects();
  updateStats();
}

function getDefaultProjects() {
  return [
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
        <strong>${p.title}</strong>
        <span class="admin-project-tech">${(p.tech || []).join(', ')}</span>
      </div>
      <div class="admin-project-actions">
        <button class="btn-admin btn-edit" onclick="editProject('${p.id}')">Editar</button>
        <button class="btn-admin btn-delete" onclick="deleteProject('${p.id}')">Eliminar</button>
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
  const link = document.getElementById('projectLink').value.trim();

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
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminPass').value = '';
  document.getElementById('loginError').textContent = '';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginScreen').style.display = 'flex';
});
