import React from "react";
import { createRoot } from "react-dom/client";
import GTFSExplorer from "./GTFSExplorer.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GTFSExplorer />
  </React.StrictMode>
);
