import React from "react";
import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import './index.css'
import { ChangeProvider } from "./components/customhook/spaceinfo"; // Import the provider

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChangeProvider>
      <App />
    </ChangeProvider>
  </StrictMode>
);
