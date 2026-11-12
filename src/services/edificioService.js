import { BASE_URL, getAuthHeaders, handleResponse } from "../api/config";

const API_URL = `${BASE_URL}/edificios`;

// Listar todos los edificios registrados
export async function listarEdificios() {
  const res = await fetch(API_URL, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Obtener los detalles de un edificio por su ID
export async function obtenerEdificio(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}