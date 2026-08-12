// CONFIGURACIÓN DE CONEXIÓN AL BACKEND
const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Limpieza de barra final
export const BASE_URL = rawUrl.trim().replace(/\/$/, "");

// Helper global para headers con Token JWT
export function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Helper global para procesar respuestas de fetch
export async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = "Ocurrió un error en la petición";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      if (Array.isArray(errorMessage)) {
        errorMessage = errorMessage.join(", ");
      }
    } catch {
      errorMessage = await response.text();
    }
    throw new Error(errorMessage || `Error Status: ${response.status}`);
  }
  return response.json();
}