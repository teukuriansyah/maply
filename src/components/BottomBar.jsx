import { Link } from "react-router-dom"

export default function BottomBar() {
  return (
    <div className="h-16 w-full bg-white px-6 flex items-center justify-between shadow-[0_-2px_10px_rgba(0,0,0,0.08)] border-t border-gray-100">
      <Link to="/" className="text-sm font-medium text-gray-700">Home</Link>
      <Link to="/saved" className="text-sm font-medium text-gray-700">Saved</Link>
      <Link to="/settings" className="text-sm font-medium text-gray-700">Settings</Link>
    </div>
  )
}