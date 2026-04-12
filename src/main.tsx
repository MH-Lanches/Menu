import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Root element not found!");
} else {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (error) {
    console.error("Failed to render app:", error);
    rootElement.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0a0f;color:white;font-family:sans-serif;padding:20px;text-align:center;">
        <div>
          <h1 style="font-size:24px;margin-bottom:16px;">⚠️ Erro ao carregar MH Lanches</h1>
          <p style="color:#aaa;margin-bottom:16px;">Por favor, verifique o console do navegador para mais detalhes.</p>
          <p style="color:#ff6b35;font-size:14px;">${error instanceof Error ? error.message : 'Erro desconhecido'}</p>
        </div>
      </div>
    `;
  }
}
