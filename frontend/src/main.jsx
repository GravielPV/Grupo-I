import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import PharmacyProvider from "./context/PharmacyProvider.jsx";
import AuthProvider from "./context/AuthProvider.jsx";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <PharmacyProvider>
    <StrictMode>
      <App />
    </StrictMode>
    </PharmacyProvider>
  </AuthProvider>,
);
