import { BASE_URL, getAuthHeaders, handleResponse } from "../api/config";

const API_COBROS = `${BASE_URL}/cobros`;
const API_PAGOS = `${BASE_URL}/pagos`;

// COBROS
export async function listarCobros() {
  const res = await fetch(API_COBROS, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function obtenerCobro(id) {
  const res = await fetch(`${API_COBROS}/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// PAGOS
export async function registrarPago(pagoData) {
  const res = await fetch(API_PAGOS, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(pagoData),
  });
  return handleResponse(res);
}

export async function listarPagosPorCobro(idCobro) {
  const res = await fetch(`${API_PAGOS}/cobro/${idCobro}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}