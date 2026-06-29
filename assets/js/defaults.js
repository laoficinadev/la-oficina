const PROJECT_CATEGORIES = [
  { id: 'all', label: { es: 'Todos', en: 'All' } },
  { id: 'web', label: { es: 'Web', en: 'Web' } },
  { id: 'app', label: { es: 'App', en: 'App' } },
  { id: 'automation', label: { es: 'Automatización', en: 'Automation' } }
];

const DEFAULT_PROJECTS = [
  {
    id: 'proj-1',
    title: 'Reproductor Multimedia',
    titleEn: 'Media Player',
    desc: 'Reproductor web con soporte para múltiples formatos, listas dinámicas y control de reproducción.',
    descEn: 'Web player with multi-format support, dynamic playlists and playback control.',
    tech: ['HTML', 'CSS', 'JavaScript', 'PHP', 'Python'],
    link: '#',
    icon: 'play',
    image: 'assets/img/reproductor.jpeg',
    category: 'web'
  },
  {
    id: 'proj-3',
    title: 'Viajes de Camiones',
    titleEn: 'Truck Trips',
    desc: 'Plataforma de contratación de viajes de carga con seguimiento en tiempo real y cotización instantánea.',
    descEn: 'Cargo trip booking platform with real-time tracking and instant quotes.',
    tech: ['HTML', 'CSS', 'JavaScript', 'PHP', 'SQL'],
    link: 'https://hamletsgonzalez-glitch.github.io/pagina-transporte-scorp/',
    icon: 'truck',
    image: 'assets/img/viajes-camiones.png',
    category: 'web'
  }
];
