import { BASE_URL, getAuthHeaders, handleResponse } from "../api/config";

const API_URL = `${BASE_URL}/contratos`;

export async function crearContrato(data) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function forzarEjecucionCron() {
  const res = await fetch(`${API_URL}/ejecutar-cron-cobros`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}