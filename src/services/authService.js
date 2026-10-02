import { BASE_URL, getAuthHeaders, handleResponse } from "../api/config";

const API_URL = `${BASE_URL}/auth`;

export async function login(credentials) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await handleResponse(res);
  if (data.access_token) {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));
  }
  return data;
}

export async function getProfile() {
  const res = await fetch(`${API_URL}/profile`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
}

/**
 * Cambiar la contraseña del usuario actualmente autenticado
 */
export async function cambiarPasswordPropia(datos) {
  const res = await fetch(`${API_URL}/cambiar-password`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(datos),
  });
  return handleResponse(res);
}

/**
 * Reseteo administrativo de contraseña para cualquier usuario por ID
 */
export async function resetearPasswordAdmin(idUsuario, datos) {
  const res = await fetch(`${API_URL}/resetear-password/${idUsuario}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(datos),
  });
  return handleResponse(res);
}

export async function recuperarPassword(data) {
  const res = await fetch(`${API_URL}/recuperar-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}