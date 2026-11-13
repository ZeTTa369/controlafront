import { BASE_URL, getAuthHeaders, handleResponse } from "../api/config";

const API_URL = `${BASE_URL}/conceptos`;

// Listar todos los conceptos registrados
export async function listarConceptos() {
  const res = await fetch(API_URL, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Obtener el detalle de un concepto por su ID
export async function obtenerConcepto(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Registrar un nuevo concepto de cobro
export async function crearConcepto(data) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// Actualizar datos o estado de un concepto existente
export async function actualizarConcepto(id, data) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// Desactivar logicamente un concepto por su ID
export async function eliminarConcepto(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}