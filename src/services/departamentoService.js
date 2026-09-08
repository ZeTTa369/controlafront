import { BASE_URL, getAuthHeaders, handleResponse } from "../api/config";

const API_URL = `${BASE_URL}/departamentos`;

export async function listarDepartamentos() {
  const res = await fetch(API_URL, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function obtenerDepartamento(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function crearDepartamento(data) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function actualizarDepartamento(id, data) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ================= FOTOS DE DEPARTAMENTOS =================

export async function obtenerFotosDepartamento(idDepartamento) {
  const res = await fetch(`${API_URL}/${idDepartamento}/fotos`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function subirFotosDepartamento(idDepartamento, formData) {
  const headers = getAuthHeaders();
  // El navegador debe generar el Content-Type con boundary automáticamente
  delete headers["Content-Type"];

  const res = await fetch(`${API_URL}/${idDepartamento}/fotos`, {
    method: "POST",
    headers,
    body: formData,
  });
  return handleResponse(res);
}

export async function eliminarFotoDepartamento(idFoto) {
  const res = await fetch(`${API_URL}/fotos/${idFoto}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}