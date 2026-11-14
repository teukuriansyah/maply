import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home.jsx"
import Saved from "./pages/Saved.jsx"
import Activity from "./pages/Activity.jsx"
import Settings from "./pages/Settings.jsx"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element=<Home/> />
        <Route path="/saved" element=<Saved/> />
        <Route path="/activity" element=<Activity/> />
        <Route path="/settings" element=<Settings/> />
      </Routes>
    </BrowserRouter>
  )
}