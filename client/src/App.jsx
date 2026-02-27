import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div className="p-8">
                <div className="max-w-6xl mx-auto">
                  <header className="mb-8 text-center">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                      OpsMind AI
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">
                      Enterprise SOP Agent (RAG + Llama)
                    </p>
                  </header>

                  <main>
                    <Dashboard />
                  </main>

                  <footer className="mt-12 text-center text-gray-500 text-sm">
                    &copy; 2025 Zaalima Development - AI Engineering Division
                  </footer>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
