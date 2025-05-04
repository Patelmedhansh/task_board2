import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { LoaderProvider } from "./context/LoaderContext";
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LoaderProvider>
        <App />
      </LoaderProvider>
    </BrowserRouter>
  </React.StrictMode>
);
