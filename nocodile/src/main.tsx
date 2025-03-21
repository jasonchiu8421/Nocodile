import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import "./index.css"
import Index from "./routes/index.tsx"
import Preprocessing from "./routes/preprocessing.tsx"
import Performance from "./routes/performance.tsx"
import Training from "./routes/training.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route index element={<Index />} />
        <Route path="/preprocessing" element={<Preprocessing />} />
        <Route path="/training" element={<Training />} />
        <Route path="/performance" element={<Performance />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
