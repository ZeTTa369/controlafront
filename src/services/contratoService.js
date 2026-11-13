import { BASE_URL, getAuthHeaders, handleResponse } from "../api/config";

const API_URL = `${BASE_URL}/contratos`;

// Listar todos los contratos registrados en el sistema
export async function listarContratos() {
  const res = await fetch(API_URL, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Obtener un contrato especifico por su ID con sus relaciones
export async function obtenerContrato(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Crear un nuevo contrato con inquilino, montos y conceptos asociados
export async function crearContrato(data) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// Actualizar datos de un contrato existente (fechas, montos, estado)
export async function actualizarContrato(id, data) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// Cambiar el estado del contrato (ej. ACTIVO, FINALIZADO, RESCINDIDO)
export async function cambiarEstadoContrato(id, nuevoEstado) {
  const res = await fetch(`${API_URL}/${id}/estado`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ estado: nuevoEstado }),
  });
  return handleResponse(res);
}

// Eliminar o rescindir un contrato por su ID
export async function eliminarContrato(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Obtener el historial o contrato vigente de un departamento especifico
export async function obtenerContratosPorDepartamento(idDepartamento) {
  const res = await fetch(`${API_URL}/departamento/${idDepartamento}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Obtener los contratos asociados a un inquilino/usuario por su ID
export async function obtenerContratosPorUsuario(idUsuario) {
  const res = await fetch(`${API_URL}/usuario/${idUsuario}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Registrar lote de habitantes para un contrato
export async function registrarHabitantesBatch(habitantesPayload) {
  const res = await fetch(`${BASE_URL}/habitantes/batch`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(habitantesPayload),
  });
  return handleResponse(res);
}

// Subir lote de documentos de respaldo (PDFs e imagenes) asociados a un contrato
export async function subirDocumentosContrato(idContrato, itemsDocumentos) {
  const formData = new FormData();
  const nombres = [];

  itemsDocumentos.forEach((item) => {
    formData.append("documentos", item.file);
    nombres.push(item.etiqueta || item.file.name);
  });

  formData.append("nombres", JSON.stringify(nombres));

  const headers = getAuthHeaders();
  delete headers["Content-Type"];

  const res = await fetch(`${API_URL}/${idContrato}/documentos`, {
    method: "POST",
    headers,
    body: formData,
  });
  return handleResponse(res);
}

// Obtener documentos activos vinculados a un contrato
export async function obtenerDocumentosContrato(idContrato) {
  const res = await fetch(`${API_URL}/${idContrato}/documentos`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Eliminar logicamente un documento de contrato
export async function eliminarDocumentoContrato(idDocumento) {
  const res = await fetch(`${API_URL}/documentos/${idDocumento}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Forzar manualmente la ejecucion del cron de generacion de cobros
export async function forzarEjecucionCron() {
  const res = await fetch(`${API_URL}/ejecutar-cron-cobros`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function finalizarContrato(idContrato, fechaFin) {
  const res = await fetch(`${API_URL}/${idContrato}/finalizar`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ fecha_fin: fechaFin }),
  });
  return handleResponse(res);
}