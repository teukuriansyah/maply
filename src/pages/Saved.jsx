import React from 'react'
import { Database } from 'lucide-react'
import ListSaved from "../components/ListSaved.jsx"

export default function Saved() {
  return (
    <div>
      {/* Title & Deskripsi */}
      <div className="sticky p-4">
        <span className="text-xl font-semibold">Tempat Tersimpan</span>
        <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-200 mt-2">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <Database size={24} />
          </div>
          <div>
            <h1 className="text-blue-700 font-medium">Penyimpanan Lokal Aktif</h1>
            <p className="text-gray-800 text-[12px]">Data tersimpan di room database lokal. Rute navigasi tetap dapat dihitung optimal tanpa koneksi internet</p>
          </div>
        </div>
      </div>
      
      {/* List Saved */}
      <div>
        <ul className="w-full flex flex-col items-center gap-5">
          <li className="w-[90%]"><ListSaved name="Test" address="address" /></li>
          <li className="w-[90%]"><ListSaved name="Test" address="address" /></li>
          <li className="w-[90%]"><ListSaved name="Test" address="address" /></li>
          <li className="w-[90%]"><ListSaved name="Test" address="address" /></li>
        </ul>
      </div>
    </div>
  )
}
