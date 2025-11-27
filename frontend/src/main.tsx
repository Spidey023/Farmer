import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import FarmerContextProvider from "./store/context/FarmerContext.tsx";

createRoot(document.getElementById("root")!).render(
  <FarmerContextProvider>
    <App />
  </FarmerContextProvider>
);
