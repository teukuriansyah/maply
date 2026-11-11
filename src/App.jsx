import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home.jsx"
import Saved from "./pages/Saved.jsx"
import Settings from "./pages/Settings.jsx"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element=<Home/> />
        <Route path="/saved" element=<Saved/> />
        <Route path="/settings" element=<Settings/> />
      </Routes>
    </BrowserRouter>
  )
}