import React from "react";
import { createRoot } from "react-dom/client";
import AuthGate from "./AuthGate";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Elemento raiz não encontrado.");
}

createRoot(root).render(
  <React.StrictMode>
    <AuthGate />
  </React.StrictMode>,
);
