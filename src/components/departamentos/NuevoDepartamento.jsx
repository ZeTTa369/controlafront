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
    numero: "",
    piso: "",
    habitaciones: "1",
    banos: "1",
    precioMensual: "",
    estado: "DISPONIBLE",
    observaciones: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Cargar edificios dinámicamente desde la API
  useEffect(() => {
    cargarEdificios();
  }, []);

  // 2. Si venimos en modo edición, precargamos el formulario
  useEffect(() => {
    if (departamentoAEditar) {
      setFormData({
        edificioId:
          departamentoAEditar.id_edificio ||
          departamentoAEditar.edificioId ||
          "",
        numero: departamentoAEditar.numero || "",
        piso: departamentoAEditar.piso || "",
        habitaciones: departamentoAEditar.habitaciones || "1",
        banos: departamentoAEditar.banos || "1",
        precioMensual:
          departamentoAEditar.precio_alquiler ||
          departamentoAEditar.precioMensual ||
          "",
        estado: departamentoAEditar.estado || "DISPONIBLE",
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

      // Si estamos creando y hay edificios, seleccionamos el primero por defecto
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

    // Nombres de propiedades exactos esperados por el DTO de NestJS
    const payload = {
      id_edificio: Number(formData.edificioId),
      numero_departamento: String(formData.numero),
      piso: Number(formData.piso) || 1,
      habitaciones: Number(formData.habitaciones), // <-- Cambiado (antes cant_habitaciones)
      banos: Number(formData.banos), // <-- Cambiado (antes cant_banos)
      precio_alquiler: Number(formData.precioMensual), // <-- Cambiado (antes monto_renta)
      estado: formData.estado,
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
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-w-2xl mx-auto relative">
      {/* Cabecera del Formulario */}
      <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <Home size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">
              {departamentoAEditar
                ? "Editar Departamento"
                : "Registrar Nuevo Departamento"}
            </h2>
            <p className="text-sm text-slate-400">
              Da de alta o modifica los datos de la unidad
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
        {/* Selección del Edificio al que pertenece */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Edificio / Condominio
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

        {/* Fila: Número y Piso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Número de Unidad
            </label>
            <div className="relative flex items-center group">
              <Hash
                size={18}
                className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors"
              />
              <input
                type="text"
                name="numero"
                required
                placeholder="Ej. 4B, 101, PB-2"
                value={formData.numero}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Piso / Nivel
            </label>
            <div className="relative flex items-center group">
              <Layers
                size={18}
                className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors"
              />
              <input
                type="number"
                name="piso"
                required
                min="1"
                placeholder="Ej. 4"
                value={formData.piso}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white font-bold"
              />
            </div>
          </div>
        </div>

        {/* Fila: Habitaciones, Baños, Precio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Precio (Bs / Mes)
            </label>
            <div className="relative flex items-center group">
              <DollarSign
                size={18}
                className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors"
              />
              <input
                type="number"
                name="precioMensual"
                required
                placeholder="2500"
                value={formData.precioMensual}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white font-extrabold text-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Fila: Estado y Observaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Estado Actual
            </label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white font-semibold"
            >
              <option value="DISPONIBLE">Disponible</option>
              <option value="OCUPADO">Ocupado</option>
              <option value="MANTENIMIENTO">En Mantenimiento</option>
            </select>
          </div>

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
                placeholder="Ej. Recién pintado, amoblado..."
                value={formData.observaciones}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white"
              />
            </div>
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
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            {isSubmitting
              ? "Guardando..."
              : departamentoAEditar
                ? "Guardar Cambios"
                : "Registrar Departamento"}
          </button>
        </div>
      </form>
    </div>
  );
}
