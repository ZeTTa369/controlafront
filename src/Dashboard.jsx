import { useState } from 'react';
import { 
  Building2, 
  Users, 
  Wallet, 
  Home, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  Menu,
  TrendingUp,
  AlertCircle,
  Plus,
  ChevronDown,
  ChevronRight,
  List,
  Layers,
  UserPlus,
  Receipt,
  FileText,
  CreditCard,
  Wrench
} from 'lucide-react';

// Importamos nuestros componentes de gestión de Edificios
import { NuevoEdificio } from './components/edificios/NuevoEdificio';
import { ListadoEdificios } from './components/edificios/ListadoEdificios';

// Importamos nuestros componentes de gestión de Departamentos/Unidades
import { NuevoDepartamento } from './components/departamentos/NuevoDepartamento';
import { ListadoDepartamentos } from './components/departamentos/ListadoDepartamentos';

// Importamos nuestros componentes de gestión de Usuarios
import { NuevoUsuario } from './components/inquilinos/NuevoUsuario';
import { ListadoUsuarios } from './components/inquilinos/ListadoUsuarios';

// Importamos nuestros componentes de gestión de Conceptos (Finanzas)
import { NuevoConcepto } from './components/conceptos/NuevoConcepto';
import { ListadoConceptos } from './components/conceptos/ListadoConceptos';

// Importamos nuestros componentes de gestión de Contratos
import { NuevoContrato } from './components/contratos/NuevoContrato';
import { ListadoContratos } from './components/contratos/ListadoContratos';

// Importamos nuestros componentes de gestión de Cobros
import { NuevoCobro } from './components/cobros/NuevoCobro';
import { ListadoCobros } from './components/cobros/ListadoCobros';

// Importamos nuestros componentes de gestión de Pagos
import { NuevoPago } from './components/pagos/NuevoPago';
import { ListadoPagos } from './components/pagos/ListadoPagos';

// Importamos nuestros componentes de gestión de Refacciones
import { NuevaRefaccion } from './components/refacciones/NuevaRefaccion';
import { ListadoRefacciones } from './components/refacciones/ListadoRefacciones';

export function Dashboard({ setIsAuthenticated }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('Inicio');

  // Estados para controlar los acordeones del menú lateral
  const [isEdificiosOpen, setIsEdificiosOpen] = useState(false);
  const [isUnidadesOpen, setIsUnidadesOpen] = useState(false);
  const [isUsuariosOpen, setIsUsuariosOpen] = useState(false);
  const [isCobrosOpen, setIsCobrosOpen] = useState(false);
  const [isContratosOpen, setIsContratosOpen] = useState(false);
  const [isRefaccionesOpen, setIsRefaccionesOpen] = useState(false);

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleGuardarEdificio = (nuevoEdificio) => {
    console.log("Edificio guardado con éxito:", nuevoEdificio);
    setActiveMenu('Lista de Edificios');
  };

  const handleGuardarDepartamento = (nuevoDepartamento) => {
    console.log("Departamento guardado con éxito:", nuevoDepartamento);
    setActiveMenu('Lista de Unidades');
  };

  const handleGuardarUsuario = (nuevoUsuario) => {
    console.log("Usuario guardado con éxito:", nuevoUsuario);
    setActiveMenu('Lista de Usuarios');
  };

  const handleGuardarConcepto = (nuevoConcepto) => {
    console.log("Concepto guardado con éxito:", nuevoConcepto);
    setActiveMenu('Lista de Conceptos');
  };

  const handleGuardarContrato = (nuevoContrato) => {
    console.log("Contrato guardado con éxito:", nuevoContrato);
    setActiveMenu('Lista de Contratos');
  };

  const handleGuardarCobro = (nuevoCobro) => {
    console.log("Cobro guardado con éxito:", nuevoCobro);
    setActiveMenu('Lista de Cobros');
  };

  const handleGuardarPago = (nuevoPago) => {
    console.log("Pago guardado con éxito:", nuevoPago);
    setActiveMenu('Lista de Pagos');
  };

  const handleGuardarRefaccion = (nuevaRefaccion) => {
    console.log("Refacción guardada con éxito:", nuevaRefaccion);
    setActiveMenu('Lista de Refacciones');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* SIDEBAR (Menú Lateral) */}
      <aside className={`bg-slate-900 text-slate-300 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-20 flex items-center justify-center border-b border-slate-800 px-4">
          <Building2 size={28} className="text-blue-500 shrink-0" />
          {isSidebarOpen && <span className="ml-3 text-xl font-extrabold text-white tracking-tight">ResidencialOS</span>}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          
          {/* Inicio */}
          <button
            onClick={() => setActiveMenu('Inicio')}
            className={`w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
              activeMenu === 'Inicio' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="shrink-0"><Building2 size={20} /></div>
            {isSidebarOpen && <span className="ml-3 font-semibold text-sm">Inicio</span>}
          </button>

          {/* SECCIÓN DESPLEGABLE: EDIFICIOS */}
          <div>
            <button
              onClick={() => setIsEdificiosOpen(!isEdificiosOpen)}
              className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all duration-200 text-slate-300"
            >
              <div className="flex items-center">
                <div className="shrink-0"><Home size={20} /></div>
                {isSidebarOpen && <span className="ml-3 font-semibold text-sm">Edificios</span>}
              </div>
              {isSidebarOpen && (
                isEdificiosOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
              )}
            </button>

            {isEdificiosOpen && isSidebarOpen && (
              <div className="pl-6 space-y-1 mt-1 border-l border-slate-800 ml-4">
                <button
                  onClick={() => setActiveMenu('Registrar Edificio')}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activeMenu === 'Registrar Edificio' ? 'text-blue-400 font-bold bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <Plus size={16} className="mr-2" /> Registrar Edificio
                </button>
                <button
                  onClick={() => setActiveMenu('Lista de Edificios')}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activeMenu === 'Lista de Edificios' ? 'text-blue-400 font-bold bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <List size={16} className="mr-2" /> Listar Edificios
                </button>
              </div>
            )}
          </div>

          {/* SECCIÓN DESPLEGABLE: UNIDADES / DEPARTAMENTOS */}
          <div>
            <button
              onClick={() => setIsUnidadesOpen(!isUnidadesOpen)}
              className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all duration-200 text-slate-300"
            >
              <div className="flex items-center">
                <div className="shrink-0"><Layers size={20} /></div>
                {isSidebarOpen && <span className="ml-3 font-semibold text-sm">Unidades</span>}
              </div>
              {isSidebarOpen && (
                isUnidadesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
              )}
            </button>

            {isUnidadesOpen && isSidebarOpen && (
              <div className="pl-6 space-y-1 mt-1 border-l border-slate-800 ml-4">
                <button
                  onClick={() => setActiveMenu('Registrar Unidad')}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activeMenu === 'Registrar Unidad' ? 'text-blue-400 font-bold bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <Plus size={16} className="mr-2" /> Registrar Unidad
                </button>
                <button
                  onClick={() => setActiveMenu('Lista de Unidades')}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activeMenu === 'Lista de Unidades' ? 'text-blue-400 font-bold bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <List size={16} className="mr-2" /> Listar Unidades
                </button>
              </div>
            )}
          </div>

          {/* SECCIÓN DESPLEGABLE: USUARIOS (ADMINISTRADORES / CONSERJES) */}
          <div>
            <button
              onClick={() => setIsUsuariosOpen(!isUsuariosOpen)}
              className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all duration-200 text-slate-300"
            >
              <div className="flex items-center">
                <div className="shrink-0"><Users size={20} /></div>
                {isSidebarOpen && <span className="ml-3 font-semibold text-sm">Usuarios</span>}
              </div>
              {isSidebarOpen && (
                isUsuariosOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
              )}
            </button>

            {isUsuariosOpen && isSidebarOpen && (
              <div className="pl-6 space-y-1 mt-1 border-l border-slate-800 ml-4">
                <button
                  onClick={() => setActiveMenu('Registrar Usuario')}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activeMenu === 'Registrar Usuario' ? 'text-blue-400 font-bold bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <UserPlus size={16} className="mr-2" /> Registrar Usuario
                </button>
                <button
                  onClick={() => setActiveMenu('Lista de Usuarios')}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activeMenu === 'Lista de Usuarios' ? 'text-blue-400 font-bold bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <List size={16} className="mr-2" /> Listar Usuarios
                </button>
              </div>
            )}
          </div>

          {/* SECCIÓN DESPLEGABLE: CONTRATOS */}
          <div>
            <button
              onClick={() => setIsContratosOpen(!isContratosOpen)}
              className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all duration-200 text-slate-300"
            >
              <div className="flex items-center">
                <div className="shrink-0"><FileText size={20} /></div>
                {isSidebarOpen && <span className="ml-3 font-semibold text-sm">Contratos</span>}
              </div>
              {isSidebarOpen && (
                isContratosOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
              )}
            </button>

            {isContratosOpen && isSidebarOpen && (
              <div className="pl-6 space-y-1 mt-1 border-l border-slate-800 ml-4">
                <button
                  onClick={() => setActiveMenu('Registrar Contrato')}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activeMenu === 'Registrar Contrato' ? 'text-blue-400 font-bold bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <Plus size={16} className="mr-2" /> Registrar Contrato
                </button>
                <button
                  onClick={() => setActiveMenu('Lista de Contratos')}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activeMenu === 'Lista de Contratos' ? 'text-blue-400 font-bold bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <List size={16} className="mr-2" /> Listar Contratos
                </button>
              </div>
            )}
          </div>

          {/* SECCIÓN DESPLEGABLE: COBROS Y PAGOS */}
          <div>
            <button
              onClick={() => setIsCobrosOpen(!isCobrosOpen)}
              className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all duration-200 text-slate-300"
            >
              <div className="flex items-center">
                <div className="shrink-0"><Wallet size={20} /></div>
                {isSidebarOpen && <span className="ml-3 font-semibold text-sm">Cobros y Pagos</span>}
              </div>
              {isSidebarOpen && (
                isCobrosOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
              )}
            </button>

            {isCobrosOpen && isSidebarOpen && (
              <div className="pl-6 space-y-1 mt-1 border-l border-slate-800 ml-4">
                <button
                  onClick={() => setActiveMenu('Registrar Concepto')}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activeMenu === 'Registrar Concepto' ? 'text-blue-400 font-bold bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <Receipt size={16} className="mr-2" /> Nuevo Concepto
                </button>
                <button
                  onClick={() => setActiveMenu('Lista de Conceptos')}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activeMenu === 'Lista de Conceptos' ? 'text-blue-400 font-bold bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <List size={16} className="mr-2" /> Listar Conceptos
                </button>
                <button
                  onClick={() => setActiveMenu('Registrar Cobro')}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activeMenu === 'Registrar Cobro' ? 'text-blue-400 font-bold bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <Plus size={16} className="mr-2" /> Generar Cobro
                </button>
                <button
                  onClick={() => setActiveMenu('Lista de Cobros')}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activeMenu === 'Lista de Cobros' ? 'text-blue-400 font-bold bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <List size={16} className="mr-2" /> Listar Cobros
                </button>
                <button
                  onClick={() => setActiveMenu('Registrar Pago')}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activeMenu === 'Registrar Pago' ? 'text-blue-400 font-bold bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <CreditCard size={16} className="mr-2" /> Registrar Pago
                </button>
                <button
                  onClick={() => setActiveMenu('Lista de Pagos')}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activeMenu === 'Lista de Pagos' ? 'text-blue-400 font-bold bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <List size={16} className="mr-2" /> Listar Pagos
                </button>
              </div>
            )}
          </div>

          {/* SECCIÓN DESPLEGABLE: REFACCIONES / MANTENIMIENTO */}
          <div>
            <button
              onClick={() => setIsRefaccionesOpen(!isRefaccionesOpen)}
              className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all duration-200 text-slate-300"
            >
              <div className="flex items-center">
                <div className="shrink-0"><Wrench size={20} /></div>
                {isSidebarOpen && <span className="ml-3 font-semibold text-sm">Refacciones</span>}
              </div>
              {isSidebarOpen && (
                isRefaccionesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
              )}
            </button>

            {isRefaccionesOpen && isSidebarOpen && (
              <div className="pl-6 space-y-1 mt-1 border-l border-slate-800 ml-4">
                <button
                  onClick={() => setActiveMenu('Nueva Refaccion')}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activeMenu === 'Nueva Refaccion' ? 'text-blue-400 font-bold bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <Plus size={16} className="mr-2" /> Nueva Refacción
                </button>
                <button
                  onClick={() => setActiveMenu('Lista de Refacciones')}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activeMenu === 'Lista de Refacciones' ? 'text-blue-400 font-bold bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <List size={16} className="mr-2" /> Listar Refacciones
                </button>
              </div>
            )}
          </div>

          {/* Configuración */}
          <button
            onClick={() => setActiveMenu('Configuración')}
            className={`w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
              activeMenu === 'Configuración' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="shrink-0"><Settings size={20} /></div>
            {isSidebarOpen && <span className="ml-3 font-semibold text-sm">Configuración</span>}
          </button>

        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-3 text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-xl transition-colors"
          >
            <LogOut size={20} className="shrink-0" />
            {isSidebarOpen && <span className="ml-3 font-bold text-sm">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-extrabold text-slate-800">{activeMenu}</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="bg-transparent border-none outline-none ml-2 text-sm text-slate-700 w-48"
              />
            </div>

            <button className="relative p-2 text-slate-400 hover:text-slate-600">
              <Bell size={22} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg border border-blue-200">
                A
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-bold text-slate-700">Administrador</p>
                <p className="text-xs text-slate-500 font-medium">Torre Zafiro</p>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENIDO SCROLLABLE SEGÚN LA PESTAÑA ACTIVA */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          
          {/* VISTA INICIO */}
          {activeMenu === 'Inicio' && (
            <>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">Panel General de Gestión</h2>
                  <p className="text-sm text-slate-500">Administra los complejos residenciales, sus unidades y mantenimientos.</p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsEdificiosOpen(true);
                      setActiveMenu('Registrar Edificio');
                    }}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-xl font-bold transition-all hover:-translate-y-0.5"
                  >
                    <Building2 size={18} />
                    Nuevo Edificio
                  </button>
                  <button
                    onClick={() => {
                      setIsUnidadesOpen(true);
                      setActiveMenu('Registrar Unidad');
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
                  >
                    <Plus size={20} />
                    Nueva Unidad
                  </button>
                </div>
              </div>

              {/* Tarjetas de Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Building2 size={24} /></div>
                    <span className="flex items-center text-emerald-500 text-sm font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                      <TrendingUp size={14} className="mr-1" /> +2%
                    </span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-semibold mb-1">Unidades Ocupadas</h3>
                  <p className="text-3xl font-extrabold text-slate-800">42 <span className="text-lg text-slate-400 font-medium">/ 50</span></p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><Wallet size={24} /></div>
                  </div>
                  <h3 className="text-slate-500 text-sm font-semibold mb-1">Ingresos del Mes</h3>
                  <p className="text-3xl font-extrabold text-slate-800">$12,450</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-orange-50 rounded-xl text-orange-500"><AlertCircle size={24} /></div>
                  </div>
                  <h3 className="text-slate-500 text-sm font-semibold mb-1">Pagos Pendientes</h3>
                  <p className="text-3xl font-extrabold text-slate-800">8</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><Users size={24} /></div>
                  </div>
                  <h3 className="text-slate-500 text-sm font-semibold mb-1">Total Inquilinos</h3>
                  <p className="text-3xl font-extrabold text-slate-800">124</p>
                </div>
              </div>
            </>
          )}

          {/* VISTAS DE EDIFICIOS */}
          {activeMenu === 'Registrar Edificio' && (
            <div className="max-w-3xl mx-auto">
              <NuevoEdificio 
                onClose={() => setActiveMenu('Lista de Edificios')} 
                onSave={handleGuardarEdificio}
              />
            </div>
          )}
          {activeMenu === 'Lista de Edificios' && (
            <ListadoEdificios 
              onNuevoEdificioClick={() => { setIsEdificiosOpen(true); setActiveMenu('Registrar Edificio'); }} 
            />
          )}

          {/* VISTAS DE UNIDADES / DEPARTAMENTOS */}
          {activeMenu === 'Registrar Unidad' && (
            <div className="max-w-3xl mx-auto">
              <NuevoDepartamento 
                onClose={() => setActiveMenu('Lista de Unidades')} 
                onSave={handleGuardarDepartamento}
              />
            </div>
          )}
          {activeMenu === 'Lista de Unidades' && (
            <ListadoDepartamentos 
              onNuevoDepartamentoClick={() => { setIsUnidadesOpen(true); setActiveMenu('Registrar Unidad'); }} 
            />
          )}

          {/* VISTAS DE USUARIOS */}
          {activeMenu === 'Registrar Usuario' && (
            <div className="max-w-3xl mx-auto">
              <NuevoUsuario 
                onClose={() => setActiveMenu('Lista de Usuarios')} 
                onSave={handleGuardarUsuario}
              />
            </div>
          )}
          {activeMenu === 'Lista de Usuarios' && (
            <ListadoUsuarios 
              onNuevoUsuarioClick={() => { setIsUsuariosOpen(true); setActiveMenu('Registrar Usuario'); }} 
            />
          )}

          {/* VISTAS DE CONTRATOS */}
          {activeMenu === 'Registrar Contrato' && (
            <div className="max-w-4xl mx-auto">
              <NuevoContrato 
                onClose={() => setActiveMenu('Lista de Contratos')} 
                onSave={handleGuardarContrato}
              />
            </div>
          )}
          {activeMenu === 'Lista de Contratos' && (
            <ListadoContratos 
              onNuevoContratoClick={() => { setIsContratosOpen(true); setActiveMenu('Registrar Contrato'); }} 
            />
          )}

          {/* VISTAS DE CONCEPTOS (FINANZAS) */}
          {activeMenu === 'Registrar Concepto' && (
            <div className="max-w-2xl mx-auto">
              <NuevoConcepto 
                onClose={() => setActiveMenu('Lista de Conceptos')} 
                onSave={handleGuardarConcepto}
              />
            </div>
          )}
          {activeMenu === 'Lista de Conceptos' && (
            <ListadoConceptos 
              onNuevoConceptoClick={() => { setIsCobrosOpen(true); setActiveMenu('Registrar Concepto'); }} 
            />
          )}

          {/* VISTAS DE COBROS */}
          {activeMenu === 'Registrar Cobro' && (
            <div className="max-w-3xl mx-auto">
              <NuevoCobro 
                onClose={() => setActiveMenu('Lista de Cobros')} 
                onSave={handleGuardarCobro}
              />
            </div>
          )}
          {activeMenu === 'Lista de Cobros' && (
            <ListadoCobros 
              onNuevoCobroClick={() => { setIsCobrosOpen(true); setActiveMenu('Registrar Cobro'); }} 
            />
          )}

          {/* VISTAS DE PAGOS */}
          {activeMenu === 'Registrar Pago' && (
            <div className="max-w-3xl mx-auto">
              <NuevoPago 
                onClose={() => setActiveMenu('Lista de Pagos')} 
                onSave={handleGuardarPago}
              />
            </div>
          )}
          {activeMenu === 'Lista de Pagos' && (
            <ListadoPagos 
              onNuevoPagoClick={() => { setIsCobrosOpen(true); setActiveMenu('Registrar Pago'); }} 
            />
          )}

          {/* VISTAS DE REFACCIONES */}
          {activeMenu === 'Nueva Refaccion' && (
            <div className="max-w-3xl mx-auto">
              <NuevaRefaccion 
                onClose={() => setActiveMenu('Lista de Refacciones')} 
                onSave={handleGuardarRefaccion}
              />
            </div>
          )}
          {activeMenu === 'Lista de Refacciones' && (
            <ListadoRefacciones 
              onNuevaRefaccionClick={() => { setIsRefaccionesOpen(true); setActiveMenu('Nueva Refaccion'); }} 
            />
          )}

          {/* OTRAS VISTAS */}
          {activeMenu === 'Configuración' && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Configuración del Sistema</h2>
              <p className="text-slate-500">Ajustes generales de la plataforma.</p>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}