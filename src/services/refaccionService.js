import { BASE_URL, getAuthHeaders, handleResponse } from "../api/config";

const API_URL = `${BASE_URL}/refacciones`;

export async function listarRefacciones() {
  const res = await fetch(API_URL, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function crearRefaccion(data) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function actualizarRefaccion(id, data) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}