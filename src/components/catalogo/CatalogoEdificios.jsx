import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Search, 
  MapPin, 
  Home, 
  Car, 
  TreePine, 
  CheckCircle2, 
  UserCircle 
} from 'lucide-react';

// Datos de prueba premium
const EDIFICIOS_MOCK = [
  {
    id: 1,
    nombre: 'Torre Zafiro Platinum',
    ciudad: 'Cochabamba',
    direccion: 'Av. América Oeste',
    precioBase: 450,
    moneda: 'USD',
    unidadesDisponibles: 3,
    tieneParqueo: true,
    tieneAreasVerdes: true,
    categoria: 'Lujo',
    imagen: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 2,
    nombre: 'Condominio El Bosque',
    ciudad: 'Cochabamba',
    direccion: 'Zona Norte, Tiquipaya',
    precioBase: 350,
    moneda: 'USD',
    unidadesDisponibles: 1,
    tieneParqueo: true,
    tieneAreasVerdes: true,
    categoria: 'Familiar',
    imagen: 'https://images.unsplash.com/photo-1460472178825-e5240623afd5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 3,
    nombre: 'Edificio Central Skyline',
    ciudad: 'La Paz',
    direccion: 'Sopocachi, Av. Arce',
    precioBase: 550,
    moneda: 'USD',
    unidadesDisponibles: 5,
    tieneParqueo: false,
    tieneAreasVerdes: false,
    categoria: 'Estudio',
    imagen: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 4,
    nombre: 'Residencial Los Pinos',
    ciudad: 'Santa Cruz',
    direccion: 'Equipetrol Norte',
    precioBase: 600,
    moneda: 'USD',
    unidadesDisponibles: 2,
    tieneParqueo: true,
    tieneAreasVerdes: true,
    categoria: 'Lujo',
    imagen: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  }
];

export const CatalogoEdificios = () => {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('Todos');

  const categorias = ['Todos', 'Lujo', 'Familiar', 'Estudio'];

  const edificiosFiltrados = EDIFICIOS_MOCK.filter(edificio => {
    const coincideTexto = 
      edificio.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
      edificio.ciudad.toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideFiltro = filtroActivo === 'Todos' || edificio.categoria === filtroActivo;

    return coincideTexto && coincideFiltro;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      
      {/* Navegación superpuesta */}
      <nav className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-6 lg:px-12 text-white">
        <div className="flex items-center gap-2 font-extrabold text-xl tracking-tight">
          <Building2 size={28} className="text-blue-400" />
          ResidencialOS
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-semibold hover:bg-white/20 transition-colors"
        >
          <UserCircle size={20} />
          <span className="hidden sm:inline">Acceso Usuarios</span>
        </button>
      </nav>

      {/* Header & Buscador (Hero Section) */}
      <header className="relative pt-36 pb-24 px-6 text-center bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
        {/* Imagen de fondo con overlay */}
        <div 
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-15 mix-blend-overlay"
        ></div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-4">
            Encuentra tu espacio ideal.
          </h1>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
            Explora los mejores condominios y edificios con gestión inteligente garantizada por ResidencialOS.
          </p>
          
          {/* Buscador */}
          <div className="flex flex-col sm:flex-row bg-white p-2 sm:rounded-full rounded-2xl shadow-2xl max-w-2xl mx-auto gap-3 sm:gap-0">
            <div className="flex-1 flex items-center px-4 py-2 sm:py-0">
              <Search size={22} className="text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Busca por ciudad o nombre del edificio..." 
                className="w-full pl-3 bg-transparent text-slate-900 outline-none text-base"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl sm:rounded-full font-bold transition-all hover:shadow-lg hover:-translate-y-0.5">
              Buscar
            </button>
          </div>
        </div>
      </header>

      {/* Píldoras de Filtrado */}
      <div className="flex justify-center flex-wrap gap-3 py-10 px-4">
        {categorias.map(cat => (
          <button 
            key={cat}
            className={`px-6 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
              filtroActivo === cat 
                ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
            onClick={() => setFiltroActivo(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de Edificios */}
      <main className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-8 max-w-7xl mx-auto px-6 lg:px-8">
        {edificiosFiltrados.map((edificio) => (
          <article 
            key={edificio.id} 
            className="group flex flex-col bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
          >
            {/* Imagen y Badge */}
            <div className="relative h-60 w-full overflow-hidden">
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 shadow-sm">
                <CheckCircle2 size={14} />
                {edificio.unidadesDisponibles} disp.
              </div>
              <img 
                src={edificio.imagen} 
                alt={edificio.nombre} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              />
            </div>

            {/* Contenido de la Tarjeta */}
            <div className="flex flex-col flex-1 p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-900 mb-1">{edificio.nombre}</h3>
                <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                  <MapPin size={16} />
                  <span>{edificio.direccion}, {edificio.ciudad}</span>
                </div>
              </div>

              {/* Amenidades Rápidas */}
              <div className="flex gap-3 mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-1.5 bg-slate-50 text-slate-600 text-xs font-semibold px-2.5 py-1.5 rounded-md" title="Unidades Residenciales">
                  <Home size={15} className="text-blue-600" />
                </div>
                {edificio.tieneParqueo && (
                  <div className="flex items-center gap-1.5 bg-slate-50 text-slate-600 text-xs font-semibold px-2.5 py-1.5 rounded-md" title="Parqueo Disponible">
                    <Car size={15} className="text-blue-600" />
                  </div>
                )}
                {edificio.tieneAreasVerdes && (
                  <div className="flex items-center gap-1.5 bg-slate-50 text-slate-600 text-xs font-semibold px-2.5 py-1.5 rounded-md" title="Áreas Verdes">
                    <TreePine size={15} className="text-blue-600" />
                  </div>
                )}
              </div>

              {/* Footer con Precio y Botón */}
              <div className="mt-auto flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Alquiler desde</span>
                  <span className="text-xl font-extrabold text-blue-600">${edificio.precioBase} <span className="text-sm font-semibold">{edificio.moneda}</span></span>
                </div>
                <button className="px-4 py-2 border-2 border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-colors">
                  Ver Detalles
                </button>
              </div>
            </div>
          </article>
        ))}
      </main>

      {/* Mensaje de Estado Vacío */}
      {edificiosFiltrados.length === 0 && (
        <div className="text-center py-20 px-4">
          <Building2 size={48} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">No encontramos resultados</h2>
          <p className="text-slate-500">Intenta buscando otra ciudad o ajustando los filtros de categoría.</p>
        </div>
      )}
    </div>
  );
};