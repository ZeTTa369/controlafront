import { BASE_URL, getAuthHeaders, handleResponse } from "../api/config";

const API_URL = `${BASE_URL}/usuarios`;

export async function listarUsuarios() {
  const res = await fetch(API_URL, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function obtenerUsuario(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function crearUsuario(data) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function actualizarUsuario(id, data) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function eliminarUsuario(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}