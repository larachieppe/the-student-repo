import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./assets/styles/index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import PortalRedirect from "./PortalRedirect";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PortalRedirect />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
