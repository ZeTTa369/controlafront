import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Search, 
  MapPin, 
  Home, 
  CheckCircle2, 
  UserCircle,
  Loader2,
  X,
  BedDouble,
  Bath,
  Layers,
  Compass,
  PhoneCall,
  Camera,
  ChevronLeft,
  ChevronRight,
  ImageIcon
} from 'lucide-react';
import { BASE_URL, handleResponse } from '../../api/config';

export const CatalogoEdificios = () => {
  const navigate = useNavigate();
  const [edificios, setEdificios] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');

  // Modal 1: Unidades del edificio seleccionado
  const [edificioSeleccionado, setEdificioSeleccionado] = useState(null);

  // Modal 2: Visor de Fotos del Departamento
  const [deptoParaFotos, setDeptoParaFotos] = useState(null);
  const [fotosDepto, setFotosDepto] = useState([]);
  const [fotoActivaIndex, setFotoActivaIndex] = useState(0);
  const [cargandoFotos, setCargandoFotos] = useState(false);

  useEffect(() => {
    cargarDatosPublicos();
  }, []);

  const cargarDatosPublicos = async () => {
    setLoading(true);
    try {
      const [resEdificios, resDeptos] = await Promise.all([
        fetch(`${BASE_URL}/edificios`).catch(() => null),
        fetch(`${BASE_URL}/departamentos`).catch(() => null),
      ]);

      const dataEdificios = resEdificios && resEdificios.ok ? await handleResponse(resEdificios) : [];
      const dataDeptos = resDeptos && resDeptos.ok ? await handleResponse(resDeptos) : [];

      setEdificios(Array.isArray(dataEdificios) ? dataEdificios : []);
      setDepartamentos(Array.isArray(dataDeptos) ? dataDeptos : []);
    } catch (error) {
      console.error('Error cargando catálogo público:', error);
    } finally {
      setLoading(false);
    }
  };

  // Abrir fotos de un departamento específico
  const handleAbrirFotos = async (depto) => {
    const idDepto = depto.id_departamento || depto.id;
    setDeptoParaFotos(depto);
    setFotosDepto([]);
    setFotoActivaIndex(0);
    setCargandoFotos(true);

    try {
      const res = await fetch(`${BASE_URL}/departamentos/${idDepto}/fotos`);
      if (res.ok) {
        const data = await handleResponse(res);
        setFotosDepto(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error cargando fotos de la unidad:', err);
    } finally {
      setCargandoFotos(false);
    }
  };

  // Navegación en el carrusel de fotos
  const fotoAnterior = () => {
    if (!fotosDepto.length) return;
    setFotoActivaIndex((prev) => (prev === 0 ? fotosDepto.length - 1 : prev - 1));
  };

  const fotoSiguiente = () => {
    if (!fotosDepto.length) return;
    setFotoActivaIndex((prev) => (prev === fotosDepto.length - 1 ? 0 : prev + 1));
  };

  // Enriquecer cada edificio con sus departamentos disponibles y su precio base real
  const edificiosConMetricas = useMemo(() => {
    return edificios.map((ed) => {
      const idEd = ed.id_edificio || ed.id;

      const deptosEdificio = departamentos.filter(
        (d) => Number(d.id_edificio) === Number(idEd)
      );

      const deptosDisponibles = deptosEdificio.filter(
        (d) => (d.estado || 'DISPONIBLE').toUpperCase() === 'DISPONIBLE'
      );

      const precios = deptosDisponibles.length > 0 
        ? deptosDisponibles.map((d) => Number(d.precio_alquiler || 0))
        : deptosEdificio.map((d) => Number(d.precio_alquiler || 0));

      const precioBase = precios.length > 0 ? Math.min(...precios) : 0;

      const cat = ed.estado === 'Tienda Comercial' || ed.categoria === 'Tienda Comercial'
        ? 'Tienda Comercial'
        : 'Vivienda Familiar';

      return {
        ...ed,
        idEd,
        categoriaNormalizada: cat,
        unidadesDisponibles: deptosDisponibles.length,
        deptosDisponiblesList: deptosDisponibles,
        precioBase,
        imagenPortada: ed.imagen || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      };
    });
  }, [edificios, departamentos]);

  const categoriasPills = ['Todos', 'Vivienda Familiar', 'Tienda Comercial'];

  const edificiosFiltrados = useMemo(() => {
    return edificiosConMetricas.filter((ed) => {
      const term = busqueda.toLowerCase().trim();
      const coincideTexto = 
        !term || 
        (ed.nombre || '').toLowerCase().includes(term) ||
        (ed.ciudad || '').toLowerCase().includes(term) ||
        (ed.direccion || '').toLowerCase().includes(term);

      const coincideCat = 
        filtroCategoria === 'Todos' || 
        ed.categoriaNormalizada === filtroCategoria;

      return coincideTexto && coincideCat;
    });
  }, [edificiosConMetricas, busqueda, filtroCategoria]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* Navegación Superior */}
      <nav className="absolute top-0 left-0 right-0 z-40 flex justify-between items-center px-6 py-6 lg:px-12 text-white">
        <div className="flex items-center gap-2 font-black text-2xl tracking-tight">
          <Building2 size={30} className="text-blue-500" />
          <span>ResidencialOS</span>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold hover:bg-white/20 transition-all cursor-pointer shadow-lg active:scale-95 text-sm"
        >
          <UserCircle size={20} />
          <span>Acceso Sistema</span>
        </button>
      </nav>

      {/* Header Hero */}
      <header className="relative pt-36 pb-28 px-6 text-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 overflow-hidden">
        <div 
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"
        />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 font-extrabold text-xs uppercase tracking-wider mb-6">
            ✨ Disponibilidad Inmediata en Cochabamba y Tiquipaya
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-5 leading-tight">
            Departamentos y Locales en Alquiler
          </h1>
          <p className="text-base md:text-lg text-slate-300 mb-10 max-w-2xl mx-auto font-medium">
            Encuentra tu próximo hogar o espacio comercial en los mejores condominios con servicios y comodidad garantizada.
          </p>
          
          {/* Buscador */}
          <div className="flex flex-col sm:flex-row bg-white p-2.5 rounded-2xl sm:rounded-full shadow-2xl max-w-2xl mx-auto gap-3 sm:gap-0 border border-white/10">
            <div className="flex-1 flex items-center px-4 py-2 sm:py-0">
              <Search size={22} className="text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Busca por edificio, calle, zona o municipio..." 
                className="w-full pl-3 bg-transparent text-slate-900 outline-none text-sm md:text-base font-semibold placeholder:text-slate-400"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              {busqueda && (
                <button onClick={() => setBusqueda('')} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              )}
            </div>
            <button 
              type="button" 
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl sm:rounded-full font-black text-sm transition-all shadow-lg shadow-blue-600/30 active:scale-95 cursor-pointer"
            >
              Explorar
            </button>
          </div>
        </div>
      </header>

      {/* Píldoras de Filtrado */}
      <div className="flex justify-center flex-wrap gap-2.5 py-8 px-4">
        {categoriasPills.map((cat) => (
          <button 
            key={cat}
            className={`px-6 py-2 rounded-full text-xs md:text-sm font-extrabold border transition-all duration-200 cursor-pointer ${
              filtroCategoria === cat 
                ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
            onClick={() => setFiltroCategoria(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Listado de Edificios */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
            <Loader2 size={36} className="animate-spin text-blue-600" />
            <span className="text-sm font-bold">Cargando catálogo en vivo...</span>
          </div>
        ) : edificiosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {edificiosFiltrados.map((edificio) => {
              const tieneDisponibles = edificio.unidadesDisponibles > 0;

              return (
                <article 
                  key={edificio.idEd} 
                  onClick={() => setEdificioSeleccionado(edificio)}
                  className="group flex flex-col bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
                >
                  {/* Portada e Indicador de Disponibilidad */}
                  <div className="relative h-64 w-full overflow-hidden bg-slate-900">
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-black shadow-md">
                      {tieneDisponibles ? (
                        <>
                          <CheckCircle2 size={15} className="text-emerald-600" />
                          <span className="text-emerald-700">{edificio.unidadesDisponibles} disp.</span>
                        </>
                      ) : (
                        <span className="text-slate-500 font-bold">Ocupado</span>
                      )}
                    </div>

                    <div className="absolute top-4 right-4 z-10 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-black px-3 py-1 rounded-lg">
                      {edificio.categoriaNormalizada}
                    </div>

                    <img 
                      src={edificio.imagenPortada} 
                      alt={edificio.nombre} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                  </div>

                  {/* Contenido */}
                  <div className="flex flex-col flex-1 p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-black text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors">
                        {edificio.nombre}
                      </h3>
                      <div className="flex items-start gap-1.5 text-slate-500 text-xs font-semibold">
                        <MapPin size={15} className="shrink-0 text-slate-400 mt-0.5" />
                        <span>{edificio.direccion}, {edificio.provincia || edificio.ciudad}</span>
                      </div>
                    </div>

                    {/* Amenidades con Emojis */}
                    <div className="flex flex-wrap gap-2 mb-6 pb-5 border-b border-slate-100">
                      {Boolean(edificio.tiene_parqueo_moto ?? edificio.tieneParqueoMoto ?? edificio.tiene_parqueo) && (
                        <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-xl" title="Parqueo para Moto">
                          <span>🏍️</span> Moto
                        </span>
                      )}
                      {Boolean(edificio.tiene_ascensor ?? edificio.tieneAscensor) && (
                        <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-xl" title="Ascensor">
                          <span>🛗</span> Ascensor
                        </span>
                      )}
                      {Boolean(edificio.tiene_conserje ?? edificio.tieneConserje) && (
                        <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-xl" title="Conserje">
                          <span>👮</span> Conserje
                        </span>
                      )}
                      {Boolean(edificio.tiene_camaras ?? edificio.tieneCamaras) && (
                        <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-xl" title="Cámaras de Seguridad">
                          <span>📹</span> Seguridad
                        </span>
                      )}
                    </div>

                    {/* Footer con Precio en Bs. y Botón */}
                    <div className="mt-auto flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Alquiler desde
                        </span>
                        <span className="text-xl font-black text-blue-600">
                          Bs. {edificio.precioBase.toFixed(2)}
                          <span className="text-xs font-semibold text-slate-400 ml-1">/ mes</span>
                        </span>
                      </div>

                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEdificioSeleccionado(edificio);
                        }}
                        className="px-4 py-2.5 bg-slate-900 text-white hover:bg-blue-600 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        Ver Unidades ({edificio.unidadesDisponibles})
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto">
            <Building2 size={48} className="text-slate-300 mx-auto mb-3" />
            <h2 className="text-lg font-black text-slate-800 mb-1">No se encontraron edificios</h2>
            <p className="text-xs text-slate-500">Prueba con otra búsqueda o cambia el filtro de categoría.</p>
          </div>
        )}
      </main>

      {/* ================= MODAL: UNIDADES DISPONIBLES DEL EDIFICIO ================= */}
      {edificioSeleccionado && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-up">
            
            {/* Cabecera del Modal */}
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 rounded-xl text-white">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight">
                    {edificioSeleccionado.nombre}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {edificioSeleccionado.direccion} • {edificioSeleccionado.ciudad}
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setEdificioSeleccionado(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Listado de Unidades */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Unidades Disponibles para Alquilar ({edificioSeleccionado.unidadesDisponibles})
                </h4>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Disponibilidad inmediata
                </span>
              </div>

              {edificioSeleccionado.deptosDisponiblesList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {edificioSeleccionado.deptosDisponiblesList.map((depto) => {
                    const idDepto = depto.id_departamento || depto.id;
                    const precio = Number(depto.precio_alquiler || 0);

                    return (
                      <div 
                        key={idDepto}
                        className="p-5 rounded-2xl border-2 border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-500 transition-all shadow-sm flex flex-col justify-between group"
                      >
                        <div>
                          {/* Número de Depto, Tipo y Botón de Ver Fotos */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                              Unidad {depto.numero_departamento || depto.numero}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleAbrirFotos(depto)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                title="Ver fotografías de la unidad"
                              >
                                <Camera size={13} />
                                <span>Fotos</span>
                              </button>

                              <span className="text-[11px] font-black px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                                {depto.tipo_inmueble || 'Departamento'}
                              </span>
                            </div>
                          </div>

                          {/* Piso y Bloque */}
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-3">
                            <span className="flex items-center gap-1">
                              <Layers size={13} className="text-slate-400" /> Piso {depto.piso || 1}
                            </span>
                            {depto.bloque && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-blue-600">
                                  <Compass size={13} /> Bloque {depto.bloque}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Habitaciones y Baños */}
                          <div className="flex items-center gap-4 text-xs font-bold text-slate-700 mb-3">
                            <span className="flex items-center gap-1">
                              <BedDouble size={14} className="text-blue-600" /> {depto.habitaciones || 1} hab.
                            </span>
                            <span className="flex items-center gap-1">
                              <Bath size={14} className="text-blue-600" /> {depto.banos || 1} baños
                            </span>
                          </div>

                          {depto.observaciones && (
                            <p className="text-xs text-slate-500 italic line-clamp-2 mb-3 bg-white p-2 rounded-lg border border-slate-100">
                              "{depto.observaciones}"
                            </p>
                          )}
                        </div>

                        {/* Precio y Contacto */}
                        <div className="pt-3 border-t border-slate-200 flex items-center justify-between mt-2">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Renta Mensual</span>
                            <span className="text-base font-black text-blue-600">
                              Bs. {precio.toFixed(2)}
                            </span>
                          </div>

                          <a
                            href={`https://wa.me/59170000000?text=${encodeURIComponent(
                              `Hola, estoy interesado en alquilar la Unidad ${depto.numero_departamento || depto.numero} en ${edificioSeleccionado.nombre}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95"
                          >
                            <PhoneCall size={13} /> Consultar
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-400">
                  <Home size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-bold text-slate-600">No hay unidades disponibles en este momento</p>
                  <p className="text-xs text-slate-400 mt-0.5">Todas las unidades de este edificio se encuentran ocupadas o bajo contrato.</p>
                </div>
              )}
            </div>

            {/* Pie del modal */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setEdificioSeleccionado(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL: VISOR DE FOTOS DE LA UNIDAD ================= */}
      {deptoParaFotos && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden flex flex-col animate-scale-up max-h-[92vh]">
            
            {/* Cabecera del Visor */}
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Camera size={20} className="text-blue-400" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    Fotografías: Unidad {deptoParaFotos.numero_departamento || deptoParaFotos.numero}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {edificioSeleccionado?.nombre || 'Edificio'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDeptoParaFotos(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenedor del Carrusel / Galería */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[360px] bg-slate-950">
              {cargandoFotos ? (
                <div className="flex flex-col items-center gap-3 text-slate-400 py-12">
                  <Loader2 size={36} className="animate-spin text-blue-500" />
                  <span className="text-xs font-semibold">Cargando fotografías en alta calidad...</span>
                </div>
              ) : fotosDepto.length > 0 ? (
                <div className="w-full flex flex-col items-center gap-4">
                  {/* Imagen Principal en Grande */}
                  <div className="relative w-full max-w-2xl h-80 sm:h-96 rounded-2xl overflow-hidden bg-black flex items-center justify-center group shadow-2xl">
                    <img 
                      src={fotosDepto[fotoActivaIndex]?.url} 
                      alt="Foto departamento" 
                      className="w-full h-full object-contain"
                    />

                    {/* Botones de navegación si hay más de una foto */}
                    {fotosDepto.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={fotoAnterior}
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/70 hover:bg-blue-600 text-white p-2 rounded-full backdrop-blur-md transition-all cursor-pointer"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          type="button"
                          onClick={fotoSiguiente}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900/70 hover:bg-blue-600 text-white p-2 rounded-full backdrop-blur-md transition-all cursor-pointer"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}

                    {/* Indicador de foto actual */}
                    <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-full">
                      {fotoActivaIndex + 1} / {fotosDepto.length}
                    </div>
                  </div>

                  {/* Tira de Miniaturas Inferiores */}
                  {fotosDepto.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto max-w-full py-2 px-2">
                      {fotosDepto.map((f, idx) => (
                        <button
                          key={f.id_departamento_foto || idx}
                          type="button"
                          onClick={() => setFotoActivaIndex(idx)}
                          className={`relative w-16 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                            fotoActivaIndex === idx 
                              ? 'border-blue-500 scale-105 shadow-md shadow-blue-500/30' 
                              : 'border-slate-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img 
                            src={f.url} 
                            alt="Miniatura" 
                            className="w-full h-full object-cover" 
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400">
                  <ImageIcon size={48} className="mx-auto mb-3 text-slate-600" />
                  <p className="text-base font-bold text-slate-200">Sin fotografías registradas</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Esta unidad aún no tiene imágenes subidas a su galería. Puedes consultar directamente por WhatsApp.
                  </p>
                </div>
              )}
            </div>

            {/* Pie del Visor */}
            <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center shrink-0">
              <span className="text-xs text-slate-400 font-medium">
                {fotosDepto.length} {fotosDepto.length === 1 ? 'fotografía disponible' : 'fotografías disponibles'}
              </span>
              <button
                type="button"
                onClick={() => setDeptoParaFotos(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Volver a Unidades
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};