import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App";
import { ConfirmProvider } from "./components/common/ConfirmProvider";
import { AuthProvider } from "./context/AuthContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <ConfirmProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
          }}
        />
      </ConfirmProvider>
    </AuthProvider>
  </React.StrictMode>
);