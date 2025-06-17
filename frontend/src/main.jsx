import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { AppContextProvider } from "./context/AppContexts.jsx";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <HashRouter>
    <AppContextProvider>
      <App />
    </AppContextProvider>
  </HashRouter>
);
