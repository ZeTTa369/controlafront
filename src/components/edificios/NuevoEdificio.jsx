import { useState } from "react";
import {
  Building2,
  MapPin,
  Car,
  TreePine,
  X,
  Image as ImageIcon,
  Layers,
} from "lucide-react";
import toast from "react-hot-toast";
import { BASE_URL, getAuthHeaders, handleResponse } from "../../api/config";

export function NuevoEdificio({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    nombre: "",
    ciudad: "Cochabamba",
    direccion: "",
    categoria: "Lujo",
    totalPisos: "1",
    tieneParqueo: true,
    tieneAreasVerdes: true,
    imagen: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Guardando edificio...");

    try {
      const response = await fetch(`${BASE_URL}/edificios`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          direccion: `${formData.direccion.trim()}, ${formData.ciudad}`,
          total_departamentos: Number(formData.total_departamentos) || 1,
          estado: formData.categoria, // Usamos estado para almacenar la categoría (Lujo, Familiar, etc.)
        }),
      });

      const data = await handleResponse(response);
      toast.success("¡Edificio guardado exitosamente!", { id: toastId });

      if (onSave) onSave(data);
      if (onClose) onClose();
    } catch (error) {
      toast.error(error.message || "Error al guardar edificio", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-w-2xl mx-auto relative">
      {/* Cabecera del Formulario */}
      <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">Registrar Nuevo Edificio</h2>
            <p className="text-xs text-slate-400">
              Ingresa los datos generales del complejo residencial
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Cuerpo del Formulario */}
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {/* Nombre del Edificio */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Nombre del Edificio / Condominio
          </label>
          <div className="relative flex items-center group">
            <Building2
              size={18}
              className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <input
              type="text"
              name="nombre"
              required
              placeholder="Ej. Torre Gaviota"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white text-sm font-medium"
            />
          </div>
        </div>

        {/* Fila Ciudad y Dirección */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Ciudad
            </label>
            <select
              name="ciudad"
              value={formData.ciudad}
              onChange={handleChange}
              className="w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white text-sm font-semibold"
            >
              <option value="Cochabamba">Cochabamba</option>
              <option value="La Paz">La Paz</option>
              <option value="Santa Cruz">Santa Cruz</option>
              <option value="Tarija">Tarija</option>
              <option value="Sucre">Sucre</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Dirección / Zona
            </label>
            <div className="relative flex items-center group">
              <MapPin
                size={18}
                className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors"
              />
              <input
                type="text"
                name="direccion"
                required
                placeholder="Ej. Av. América Oeste #123"
                value={formData.direccion}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Fila: Categoría y Total de Pisos (Sin Precio Base) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Categoría
            </label>
            <div className="relative flex items-center group">
              <Layers
                size={18}
                className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none"
              />
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white text-sm font-semibold appearance-none"
              >
                <option value="Lujo">Lujo</option>
                <option value="Familiar">Familiar</option>
                <option value="Estudio">Estudio</option>
                <option value="Comercial">Comercial</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Cantidad de Pisos
            </label>
            <input
              type="number"
              name="totalPisos"
              min="1"
              required
              placeholder="Ej. 5"
              value={formData.totalPisos}
              onChange={handleChange}
              className="w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white text-sm font-bold"
            />
          </div>
        </div>

        {/* URL de la Portada */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            URL Imagen de Portada (Opcional)
          </label>
          <div className="relative flex items-center group mb-2">
            <ImageIcon
              size={18}
              className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <input
              type="url"
              name="imagen"
              placeholder="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00"
              value={formData.imagen}
              onChange={handleChange}
              className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white text-xs font-mono"
            />
          </div>

          {formData.imagen && (
            <div className="h-28 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative">
              <img
                src={formData.imagen}
                alt="Vista previa"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          )}
        </div>

        {/* Checkboxes de Amenidades */}
        <div className="flex gap-8 pt-2">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              name="tieneParqueo"
              checked={formData.tieneParqueo}
              onChange={handleChange}
              className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Car size={16} className="text-blue-600" /> Incluye Parqueo
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              name="tieneAreasVerdes"
              checked={formData.tieneAreasVerdes}
              onChange={handleChange}
              className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <TreePine size={16} className="text-blue-600" /> Áreas Verdes
            </span>
          </label>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors uppercase tracking-wider"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/20 transition-all uppercase tracking-wider disabled:opacity-50"
          >
            {isSubmitting ? "Guardando..." : "Registrar Edificio"}
          </button>
        </div>
      </form>
    </div>
  );
}