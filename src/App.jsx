import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";

// Contexto de autenticación
import { AuthProvider } from "./context/AuthContext";

// Importamos nuestras páginas
import { CatalogoEdificios } from "./components/catalogo/CatalogoEdificios";
import { Login } from "./Login";
import { Dashboard } from "./Dashboard";

export default function App() {
  // Inicializamos el estado revisando el localStorage o el token
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isAuth") === "true" || Boolean(localStorage.getItem("token"));
  });

  // Sincronizamos el estado con el storage cada vez que cambie
  useEffect(() => {
    localStorage.setItem("isAuth", isAuthenticated);
  }, [isAuthenticated]);

  return (
    <AuthProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          className: "text-sm font-semibold rounded-2xl",
          style: {
            background: '#ffffff',
            color: '#1e293b',
            border: '1px solid #f1f5f9',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }
        }}
      />

      <Routes>
        <Route path="/" element={<CatalogoEdificios />} />

        {/* Ruta Login */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login setIsAuthenticated={setIsAuthenticated} />
            )
          }
        />

        {/* Ruta Dashboard con Sub-rutas */}
        <Route
          path="/dashboard/*"
          element={
            isAuthenticated ? (
              <Dashboard setIsAuthenticated={setIsAuthenticated} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}