import { useState, useRef } from "react";
import {
  Building2,
  MapPin,
  X,
  UploadCloud,
  Compass,
  Layers,
  Loader2,
  Trash2,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";
import { BASE_URL, getAuthHeaders, handleResponse } from "../../api/config";

// Provincias limitadas según requerimiento
const PROVINCIAS_COCHABAMBA = ["Cochabamba", "Tiquipaya"];

export function NuevoEdificio({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    nombre: "",
    ciudad: "Cochabamba",
    provincia: "Cochabamba",
    direccion: "",
    ubicacion_url: "",
    categoria: "Vivienda Familiar",
    totalDepartamentos: "1",
    tieneParqueoMoto: false,
    tieneAscensor: false,
    tieneConserje: false,
    tieneCamaras: false,
    imagen: "",
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona un archivo de imagen válido");
      return;
    }

    setUploadingImage(true);
    const toastId = toast.loading("Subiendo imagen a Cloudinary...");

    try {
      const data = new FormData();
      data.append("file", file);

      const headers = getAuthHeaders();
      delete headers["Content-Type"];

      const res = await fetch(`${BASE_URL}/upload/imagen`, {
        method: "POST",
        headers,
        body: data,
      });

      const json = await handleResponse(res);
      setFormData(prev => ({ ...prev, imagen: json.url }));
      toast.success("¡Imagen subida correctamente!", { id: toastId });
    } catch (error) {
      toast.error(error.message || "Error al subir la imagen", { id: toastId });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imagen: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.direccion.trim()) {
      toast.error("Por favor completa el nombre y la dirección del edificio");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Guardando edificio...");

    try {
      const payload = {
        nombre: formData.nombre.trim(),
        direccion: formData.direccion.trim(),
        ciudad: formData.ciudad,
        provincia: formData.provincia,
        imagen: formData.imagen || null,
        ubicacion_url: formData.ubicacion_url.trim() || null,
        total_departamentos: Number(formData.totalDepartamentos) || 1,
        estado: formData.categoria,
        tiene_parqueo_moto: formData.tieneParqueoMoto,
        tiene_ascensor: formData.tieneAscensor,
        tiene_conserje: formData.tieneConserje,
        tiene_camaras: formData.tieneCamaras,
      };

      const response = await fetch(`${BASE_URL}/edificios`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await handleResponse(response);
      toast.success("¡Edificio guardado exitosamente!", { id: toastId });

      if (onSave) onSave(data);
      if (onClose) onClose();
    } catch (error) {
      toast.error(error.message || "Error al guardar edificio", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-w-2xl mx-auto relative animate-fade-in">
      {/* Cabecera */}
      <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">Registrar Nuevo Edificio</h2>
            <p className="text-xs text-slate-400">
              Ubicación geográfica, capacidad, portada y características
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {/* Nombre */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Nombre del Edificio / Condominio *
          </label>
          <div className="relative flex items-center group">
            <Building2
              size={18}
              className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none"
            />
            <input
              type="text"
              name="nombre"
              required
              placeholder="Ej. Torre Zafiro Platinum"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white text-sm font-semibold"
            />
          </div>
        </div>

        {/* Ciudad y Provincia */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Departamento / Ciudad *
            </label>
            <div className="relative flex items-center group">
              <MapPin
                size={18}
                className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none"
              />
              <input
                type="text"
                name="ciudad"
                readOnly
                value={formData.ciudad}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-100 outline-none text-sm font-semibold cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Provincia / Municipio *
            </label>
            <div className="relative flex items-center group">
              <Compass
                size={18}
                className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none"
              />
              <select
                name="provincia"
                value={formData.provincia}
                onChange={handleChange}
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white text-sm font-semibold appearance-none cursor-pointer"
              >
                {PROVINCIAS_COCHABAMBA.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Dirección / Calle / Zona *
          </label>
          <div className="relative flex items-center group">
            <MapPin
              size={18}
              className="absolute left-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none"
            />
            <input
              type="text"
              name="direccion"
              required
              placeholder="Ej. Av. América Oeste #123, Cala Cala"
              value={formData.direccion}
              onChange={handleChange}
              className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white text-sm font-medium"
            />
          </div>
        </div>

        {/* Enlace de Google Maps */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Enlace de Google Maps (Ubicación)
            </label>
            <span className="text-[11px] font-semibold text-slate-400">Opcional</span>
          </div>
          <div className="relative flex items-center group">
            <MapPin
              size={18}
              className="absolute left-4 text-blue-500 group-focus-within:text-blue-600 transition-colors pointer-events-none"
            />
            <input
              type="url"
              name="ubicacion_url"
              placeholder="Ej. https://maps.app.goo.gl/... o https://goo.gl/maps/..."
              value={formData.ubicacion_url}
              onChange={handleChange}
              className="w-full py-3.5 pl-11 pr-12 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white text-sm font-medium"
            />
            {formData.ubicacion_url.trim() && (
              <a
                href={formData.ubicacion_url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-3.5 text-slate-400 hover:text-blue-600 p-1 rounded-md transition-colors"
                title="Probar enlace"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Pega el link compartido desde Google Maps para que los clientes puedan abrir la ubicación en el catálogo.
          </p>
        </div>

        {/* Categoría y Capacidad */}
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
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white text-sm font-semibold appearance-none cursor-pointer"
              >
                <option value="Vivienda Familiar">Vivienda Familiar</option>
                <option value="Tienda Comercial">Tienda Comercial</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Capacidad Total de Departamentos *
            </label>
            <input
              type="number"
              name="totalDepartamentos"
              min="1"
              required
              placeholder="Ej. 20"
              value={formData.totalDepartamentos}
              onChange={handleChange}
              className="w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white text-sm font-bold"
            />
          </div>
        </div>

        {/* Subida de Portada */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Foto de Portada del Edificio
          </label>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {!formData.imagen ? (
            <div
              onClick={() => !uploadingImage && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                uploadingImage
                  ? "border-blue-400 bg-blue-50/50"
                  : "border-slate-200 bg-slate-50 hover:bg-blue-50/30 hover:border-blue-400"
              }`}
            >
              {uploadingImage ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={32} className="animate-spin text-blue-600" />
                  <p className="text-xs font-bold text-blue-700">Subiendo a Cloudinary...</p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-blue-100/60 text-blue-600 rounded-2xl mb-2">
                    <UploadCloud size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    Haz clic para seleccionar o subir una foto
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Formatos soportados: PNG, JPG, WEBP (Hasta 10MB)
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 h-44 group">
              <img
                src={formData.imagen}
                alt="Portada Edificio"
                className="w-full h-full object-cover group-hover:opacity-85 transition-opacity"
              />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <span className="bg-emerald-500/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1">
                  <CheckCircle2 size={13} /> Subida
                </span>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="bg-red-600/90 hover:bg-red-700 text-white p-1.5 rounded-lg shadow-md transition-all cursor-pointer"
                  title="Eliminar imagen"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Amenidades y Características con Emojis */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Características y Servicios
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Parqueo para Moto */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl border-2 border-slate-200 bg-slate-50 hover:bg-blue-50/40 hover:border-blue-400 transition-all cursor-pointer select-none">
              <input
                type="checkbox"
                name="tieneParqueoMoto"
                checked={formData.tieneParqueoMoto}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>🏍️</span> Parqueo Moto
              </span>
            </label>

            {/* Ascensor */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl border-2 border-slate-200 bg-slate-50 hover:bg-blue-50/40 hover:border-blue-400 transition-all cursor-pointer select-none">
              <input
                type="checkbox"
                name="tieneAscensor"
                checked={formData.tieneAscensor}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>🛗</span> Ascensor
              </span>
            </label>

            {/* Conserje */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl border-2 border-slate-200 bg-slate-50 hover:bg-blue-50/40 hover:border-blue-400 transition-all cursor-pointer select-none">
              <input
                type="checkbox"
                name="tieneConserje"
                checked={formData.tieneConserje}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>👮</span> Conserje
              </span>
            </label>

            {/* Cámaras de Seguridad */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl border-2 border-slate-200 bg-slate-50 hover:bg-blue-50/40 hover:border-blue-400 transition-all cursor-pointer select-none">
              <input
                type="checkbox"
                name="tieneCamaras"
                checked={formData.tieneCamaras}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>📹</span> Cámaras
              </span>
            </label>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors uppercase tracking-wider cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || uploadingImage}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/20 transition-all uppercase tracking-wider disabled:opacity-50 active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Guardando...
              </>
            ) : (
              "Registrar Edificio"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}