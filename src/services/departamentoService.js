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