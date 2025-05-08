import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { LoaderProvider } from "./context/LoaderContext";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LoaderProvider>
          <App />
        </LoaderProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
