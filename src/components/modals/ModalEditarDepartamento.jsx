import { useState, useEffect } from "react";
import {
  Home,
  Hash,
  Layers,
  BedDouble,
  Bath,
  Building2,
  Info,
  X,
  Tag,
  Compass,
  Droplets,
  Zap,
  UploadCloud,
  Trash2,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { BASE_URL, getAuthHeaders, handleResponse } from "../../api/config";
import {
  subirFotosDepartamento,
  obtenerFotosDepartamento,
  eliminarFotoDepartamento,
} from "../../services/departamentoService";

export function ModalEditarDepartamento({ departamento, onClose, onSuccess, onSave }) {
  const [edificios, setEdificios] = useState([]);
  const [loadingEdificios, setLoadingEdificios] = useState(true);

  const [formData, setFormData] = useState({
    edificioId: "",
    piso: "",
    numero: "",
    bloque: "",
    medidor_agua: "COMPARTIDO",
    medidor_luz: "INDEPENDIENTE",
    tipoDepartamento: "DEPARTAMENTO",
    habitaciones: "1",
    banos: "1",
    precioMensual: "",
    observaciones: "",
  });

  // Estados para manejo de fotos
  const [archivosFotos, setArchivosFotos] = useState([]);
  const [previewsLocales, setPreviewsLocales] = useState([]);
  const [fotosGuardadas, setFotosGuardadas] = useState([]);
  const [cargandoFotos, setCargandoFotos] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    cargarEdificios();
  }, []);

  // Precargar datos y fotos del departamento seleccionado
  useEffect(() => {
    if (departamento) {
      const idDepto = departamento.id_departamento || departamento.id;

      setFormData({
        edificioId: departamento.id_edificio || departamento.edificioId || "",
        piso: departamento.piso ?? "",
        numero: departamento.numero_departamento || departamento.numero || "",
        bloque: departamento.bloque || "",
        medidor_agua: departamento.medidor_agua || "COMPARTIDO",
        medidor_luz: departamento.medidor_luz || "INDEPENDIENTE",
        tipoDepartamento: departamento.tipo_inmueble || departamento.estado || "DEPARTAMENTO",
        habitaciones: String(departamento.habitaciones ?? 1),
        banos: String(departamento.banos ?? 1),
        precioMensual: String(departamento.precio_alquiler || departamento.precioMensual || ""),
        observaciones: departamento.observaciones || "",
      });

      if (idDepto) {
        cargarFotosExistentes(idDepto);
      }
    }
  }, [departamento]);

  const cargarFotosExistentes = async (idDepto) => {
    setCargandoFotos(true);
    try {
      const data = await obtenerFotosDepartamento(idDepto);
      setFotosGuardadas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar fotos guardadas:", err);
    } finally {
      setCargandoFotos(false);
    }
  };

  const cargarEdificios = async () => {
    try {
      const response = await fetch(`${BASE_URL}/edificios`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response);
      setEdificios(data || []);
    } catch (error) {
      console.error("Error cargando lista de edificios:", error);
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

  const handleFotosChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const nuevasPreviews = files.map((file) => URL.createObjectURL(file));

    setArchivosFotos((prev) => [...prev, ...files]);
    setPreviewsLocales((prev) => [...prev, ...nuevasPreviews]);
  };

  const quitarFotoLocal = (index) => {
    URL.revokeObjectURL(previewsLocales[index]);
    setArchivosFotos((prev) => prev.filter((_, i) => i !== index));
    setPreviewsLocales((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEliminarFotoGuardada = async (idFoto) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta fotografía?")) return;
    const toastId = toast.loading("Eliminando fotografía...");
    try {
      await eliminarFotoDepartamento(idFoto);
      setFotosGuardadas((prev) =>
        prev.filter((f) => f.id_departamento_foto !== idFoto)
      );
      toast.success("Fotografía eliminada", { id: toastId });
    } catch (err) {
      toast.error(err.message || "Error al eliminar fotografía", { id: toastId });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const id = departamento?.id_departamento || departamento?.id;
    if (!id) {
      toast.error("Identificador de departamento inválido");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Actualizando departamento...");

    const payload = {
      id_edificio: Number(formData.edificioId),
      piso: Number(formData.piso) || 1,
      numero_departamento: String(formData.numero).trim(),
      bloque: formData.bloque ? formData.bloque : null,
      medidor_agua: formData.medidor_agua,
      medidor_luz: formData.medidor_luz,
      tipo_inmueble: formData.tipoDepartamento,
      habitaciones: Number(formData.habitaciones),
      banos: Number(formData.banos),
      precio_alquiler: Number(formData.precioMensual),
      observaciones: formData.observaciones?.trim() || null,
    };

    try {
      const response = await fetch(`${BASE_URL}/departamentos/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const deptoActualizado = await handleResponse(response);

      if (archivosFotos.length > 0) {
        toast.loading("Subiendo fotografías a Cloudinary...", { id: toastId });
        const formDataFotos = new FormData();
        archivosFotos.forEach((file) => {
          formDataFotos.append("fotos", file);
        });

        await subirFotosDepartamento(id, formDataFotos);
      }

      toast.success("¡Departamento actualizado exitosamente!", { id: toastId });

      if (onSuccess) onSuccess(deptoActualizado);
      if (onSave) onSave(deptoActualizado);
      if (onClose) onClose();
    } catch (error) {
      toast.error(error.message || "Error al actualizar el departamento", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!departamento) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden w-full max-w-2xl max-h-[92vh] flex flex-col relative animate-scale-up">
        
        {/* Cabecera */}
        <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white">
              <Home size={24} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold">Editar Unidad / Departamento</h2>
              <p className="text-xs text-slate-400">
                Ubicación, bloque, galería de fotos, medidores y tipo de inmueble
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1">
          
          {/* Selección del Edificio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
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
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white text-sm font-medium appearance-none cursor-pointer"
              >
                <option value="" disabled>
                  {loadingEdificios
                    ? "Cargando edificios..."
                    : "Selecciona el edificio al que pertenece..."}
                </option>
                {edificios.map((e) => (
                  <option key={e.id_edificio || e.id} value={e.id_edificio || e.id}>
                    {e.nombre} - {e.direccion}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila: Piso, Número y Bloque */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
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
                  className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white text-sm font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
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
                  className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white text-sm font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Bloque <span className="text-[11px] font-normal text-slate-400">(Opcional)</span>
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
                  <option value="">Sin bloque / No especificado</option>
                  <option value="Exterior">Exterior</option>
                  <option value="Interior">Interior</option>
                </select>
              </div>
            </div>
          </div>

          {/* Configuración de Medidores */}
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
                  <option value="COMPARTIDO">Medidor Compartido (Por defecto)</option>
                  <option value="INDEPENDIENTE">Medidor Independiente</option>
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
                </select>
              </div>
            </div>
          </div>

          {/* Fila: Tipo de Inmueble y Precio en Bs. */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
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
                  className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white text-sm font-semibold appearance-none cursor-pointer"
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Precio Sugerido (Bs / Mes) *
              </label>
              <div className="relative flex items-center group">
                <span className="absolute left-4 text-xs font-black text-slate-400 group-focus-within:text-blue-600 transition-colors select-none">
                  Bs.
                </span>
                <input
                  type="number"
                  step="0.01"
                  name="precioMensual"
                  required
                  placeholder="Ej. 1500"
                  value={formData.precioMensual}
                  onChange={handleChange}
                  className="w-full py-3.5 pl-12 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white font-extrabold text-blue-600 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Fila: Habitaciones y Baños */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
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
                  className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white text-sm font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
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
                  className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white text-sm font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Galería y Fotos */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Fotografías del Departamento
              </label>
              <span className="text-xs text-slate-400">Cloudinary (JPG, PNG, WEBP)</span>
            </div>

            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/40 transition-all rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer">
              <UploadCloud size={30} className="text-slate-400 mb-1.5" />
              <span className="text-xs font-bold text-slate-700">
                Haz clic para seleccionar fotos adicionales
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Puedes seleccionar múltiples imágenes
              </span>
              <input
                type="file"
                multiple
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFotosChange}
                className="hidden"
              />
            </label>

            {previewsLocales.length > 0 && (
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-2">
                  Nuevas fotos por subir ({previewsLocales.length})
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {previewsLocales.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-video sm:aspect-square rounded-xl overflow-hidden border border-slate-200 group shadow-sm"
                    >
                      <img
                        src={url}
                        alt="Nueva selección"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => quitarFotoLocal(idx)}
                        className="absolute top-1.5 right-1.5 bg-slate-900/80 hover:bg-red-600 text-white p-1 rounded-full transition-colors cursor-pointer"
                        title="Quitar selección"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cargandoFotos ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <Loader2 size={14} className="animate-spin text-blue-600" /> Cargando fotos guardadas...
              </div>
            ) : fotosGuardadas.length > 0 ? (
              <div className="pt-3 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Fotos Guardadas ({fotosGuardadas.length})
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {fotosGuardadas.map((f) => (
                    <div
                      key={f.id_departamento_foto}
                      className="relative aspect-video sm:aspect-square rounded-xl overflow-hidden border border-slate-200 group shadow-sm"
                    >
                      <img
                        src={f.url}
                        alt="Foto departamento"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleEliminarFotoGuardada(f.id_departamento_foto)}
                        className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full opacity-90 transition-all cursor-pointer shadow-md"
                        title="Eliminar foto"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
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
                className="w-full py-3.5 pl-11 pr-4 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 outline-none transition-all focus:border-blue-600 focus:bg-white text-sm font-medium"
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors uppercase tracking-wider cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/20 transition-all uppercase tracking-wider disabled:opacity-50 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}