import { useState, useEffect } from "react";
import {
  Home,
  Hash,
  Layers,
  BedDouble,
  Bath,
  DollarSign,
  Building2,
  Info,
  X,
  Tag,
  Compass,
  Droplets,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { BASE_URL, getAuthHeaders, handleResponse } from "../../api/config";

export function NuevoDepartamento({
  onClose,
  onSave,
  departamentoAEditar = null,
}) {
  const [edificios, setEdificios] = useState([]);
  const [loadingEdificios, setLoadingEdificios] = useState(true);

  const [formData, setFormData] = useState({
    edificioId: "",
    piso: "",
    numero: "",
    bloque: "FRONTAL",
    medidor_agua: "INDEPENDIENTE",
    medidor_luz: "INDEPENDIENTE",
    tipoDepartamento: "DEPARTAMENTO",
    habitaciones: "1",
    banos: "1",
    precioMensual: "",
    observaciones: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Cargar edificios dinámicamente desde la API
  useEffect(() => {
    cargarEdificios();
  }, []);

  // 2. Precarga en modo edición
  useEffect(() => {
    if (departamentoAEditar) {
      setFormData({
        edificioId:
          departamentoAEditar.id_edificio ||
          departamentoAEditar.edificioId ||
          "",
        piso: departamentoAEditar.piso || "",
        numero:
          departamentoAEditar.numero_departamento ||
          departamentoAEditar.numero ||
          "",
        bloque: departamentoAEditar.bloque || "FRONTAL",
        medidor_agua: departamentoAEditar.medidor_agua || "INDEPENDIENTE",
        medidor_luz: departamentoAEditar.medidor_luz || "INDEPENDIENTE",
        tipoDepartamento: departamentoAEditar.estado || "DEPARTAMENTO",
        habitaciones: departamentoAEditar.habitaciones || "1",
        banos: departamentoAEditar.banos || "1",
        precioMensual:
          departamentoAEditar.precio_alquiler ||
          departamentoAEditar.precioMensual ||
          "",
        observaciones: departamentoAEditar.observaciones || "",
      });
    }
  }, [departamentoAEditar]);

  const cargarEdificios = async () => {
    try {
      const response = await fetch(`${BASE_URL}/edificios`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response);
      setEdificios(data || []);

      if (Array.isArray(data) && data.length > 0 && !departamentoAEditar) {
        setFormData((prev) => ({
          ...prev,
          edificioId: data[0].id_edificio || data[0].id,
        }));
      }
    } catch (error) {
      console.error("Error al cargar la lista de edificios:", error);
    } finally {
      setLoadingEdificios(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isEdit = Boolean(departamentoAEditar);
    const id = departamentoAEditar?.id_departamento || departamentoAEditar?.id;
    const toastId = toast.loading(isEdit ? "Actualizando..." : "Guardando...");

    const url = isEdit
      ? `${BASE_URL}/departamentos/${id}`
      : `${BASE_URL}/departamentos`;
    const method = isEdit ? "PATCH" : "POST";

    const payload = {
      id_edificio: Number(formData.edificioId),
      piso: Number(formData.piso) || 1,
      numero_departamento: String(formData.numero),
      bloque: formData.bloque,
      medidor_agua: formData.medidor_agua,
      medidor_luz: formData.medidor_luz,
      estado: formData.tipoDepartamento,
      habitaciones: Number(formData.habitaciones),
      banos: Number(formData.banos),
      precio_alquiler: Number(formData.precioMensual),
      observaciones: formData.observaciones || null,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await handleResponse(response);
      toast.success(
        isEdit ? "¡Departamento actualizado!" : "¡Departamento registrado!",
        { id: toastId },
      );

      if (onSave) onSave(data);
      if (onClose) onClose();
    } catch (error) {
      toast.error(error.message || "Error al guardar departamento", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-w-2xl mx-auto relative animate-fade-in">
      {/* Cabecera del Formulario */}
      <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <Home size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">
              {departamentoAEditar
                ? "Editar Unidad / Departamento"
                : "Registrar Nueva Unidad / Departamento"}
            </h2>
            <p className="text-sm text-slate-400">
              Ubicación, bloque, medidores y tipo de inmueble
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Cuerpo del Formulario */}
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {/* Selección del Edificio */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Edificio / Condominio *
          </label>
          <div className="relative flex items-center group">
            <Building2
              size={18}
              className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none"
            />
            <select
              name="edificioId"
              required
              value={formData.edificioId}
              onChange={handleChange}
              disabled={loadingEdificios}
              className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white font-medium appearance-none"
            >
              <option value="" disabled>
                {loadingEdificios
                  ? "Cargando edificios..."
                  : "Selecciona el edificio al que pertenece..."}
              </option>
              {edificios.map((e) => (
                <option
                  key={e.id_edificio || e.id}
                  value={e.id_edificio || e.id}
                >
                  {e.nombre} - {e.direccion}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fila: Piso, Número y Bloque */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Piso / Nivel *
            </label>
            <div className="relative flex items-center group">
              <Layers
                size={18}
                className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none"
              />
              <input
                type="number"
                name="piso"
                required
                min="0"
                placeholder="Ej. 1, 2..."
                value={formData.piso}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Unidad / Depto *
            </label>
            <div className="relative flex items-center group">
              <Hash
                size={18}
                className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none"
              />
              <input
                type="text"
                name="numero"
                required
                placeholder="Ej. 101, Depto A"
                value={formData.numero}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Bloque *
            </label>
            <div className="relative flex items-center group">
              <Compass
                size={18}
                className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none"
              />
              <select
                name="bloque"
                value={formData.bloque}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white font-bold appearance-none cursor-pointer text-sm"
              >
                <option value="FRONTAL">Bloque Frontal</option>
                <option value="TRASERO">Bloque Trasero</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sección: Configuración de Medidores */}
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Configuración de Servicios y Medidores
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Droplets size={15} className="text-blue-500" /> Medidor de Agua
              </label>
              <select
                name="medidor_agua"
                value={formData.medidor_agua}
                onChange={handleChange}
                className="w-full py-2.5 px-3 border-2 border-slate-200 rounded-xl text-sm font-semibold bg-white outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="INDEPENDIENTE">Medidor Independiente</option>
                <option value="COMPARTIDO">Medidor Compartido</option>
                <option value="NO_TIENE">No tiene medidor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Zap size={15} className="text-amber-500" /> Medidor de Luz
              </label>
              <select
                name="medidor_luz"
                value={formData.medidor_luz}
                onChange={handleChange}
                className="w-full py-2.5 px-3 border-2 border-slate-200 rounded-xl text-sm font-semibold bg-white outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="INDEPENDIENTE">Medidor Independiente</option>
                <option value="COMPARTIDO">Medidor Compartido</option>
                <option value="NO_TIENE">No tiene medidor</option>
              </select>
            </div>
          </div>
        </div>

        {/* Fila: Tipo de Inmueble y Precio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Tipo de Inmueble
            </label>
            <div className="relative flex items-center group">
              <Tag
                size={18}
                className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none"
              />
              <select
                name="tipoDepartamento"
                value={formData.tipoDepartamento}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white font-semibold appearance-none"
              >
                <option value="CUARTO">Cuarto</option>
                <option value="MONOAMBIENTE">Monoambiente</option>
                <option value="GARZONIER">Garzonier</option>
                <option value="DEPARTAMENTO">Departamento</option>
                <option value="GALERIA_TIENDA">Galería - Tienda</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Precio Sugerido (Bs / Mes) *
            </label>
            <div className="relative flex items-center group">
              <DollarSign
                size={18}
                className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors"
              />
              <input
                type="number"
                step="0.01"
                name="precioMensual"
                required
                placeholder="Ej. 1500"
                value={formData.precioMensual}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white font-extrabold text-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Fila: Habitaciones y Baños */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Habitaciones
            </label>
            <div className="relative flex items-center group">
              <BedDouble
                size={18}
                className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors"
              />
              <input
                type="number"
                name="habitaciones"
                min="0"
                required
                value={formData.habitaciones}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Baños
            </label>
            <div className="relative flex items-center group">
              <Bath
                size={18}
                className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors"
              />
              <input
                type="number"
                name="banos"
                min="0"
                step="0.5"
                required
                value={formData.banos}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Observaciones (Opcional)
          </label>
          <div className="relative flex items-center group">
            <Info
              size={18}
              className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <input
              type="text"
              name="observaciones"
              placeholder="Ej. Vista a la calle, incluye parqueo..."
              value={formData.observaciones}
              onChange={handleChange}
              className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 active:scale-95"
          >
            {isSubmitting
              ? "Guardando..."
              : departamentoAEditar
                ? "Guardar Cambios"
                : "Registrar Unidad"}
          </button>
        </div>
      </form>
    </div>
  );
}