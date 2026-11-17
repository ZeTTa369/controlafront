import { BASE_URL, getAuthHeaders, handleResponse } from "../api/config";

const API_COBROS = `${BASE_URL}/cobros`;
const API_PAGOS = `${BASE_URL}/pagos`;

// Obtener listado general de cobros
export async function listarCobros() {
  const res = await fetch(API_COBROS, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Obtener un cobro especifico por su identificador
export async function obtenerCobro(id) {
  const res = await fetch(`${API_COBROS}/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Registrar un pago o excepcion sobre un cobro especifico
export async function pagarCobro(idCobro, pagoData) {
  const res = await fetch(`${API_COBROS}/${idCobro}/pagar`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(pagoData),
  });
  return handleResponse(res);
}

// Registrar un pago directo (si la ruta /pagos esta habilitada)
export async function registrarPago(pagoData) {
  const res = await fetch(API_PAGOS, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(pagoData),
  });
  return handleResponse(res);
}

// Listar el historial de pagos asociados a un cobro
export async function listarPagosPorCobro(idCobro) {
  const res = await fetch(`${API_PAGOS}/cobro/${idCobro}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function actualizarCobrosLote(items) {
  const res = await fetch(`${BASE_URL}/cobros/actualizar-lote`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ items }),
  });
  return handleResponse(res);
}

export async function subirReciboPdfCloudinary(pdfBlob, nombreArchivo) {
  const formData = new FormData();
  formData.append('recibo', pdfBlob, nombreArchivo);

  const headers = getAuthHeaders();
  delete headers['Content-Type'];

  const res = await fetch(`${BASE_URL}/cobros/subir-recibo-pdf`, {
    method: 'POST',
    headers,
    body: formData,
  });
  return handleResponse(res);
}