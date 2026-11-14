
import { useState, useEffect } from 'react'
import { Preferences } from '@capacitor/preferences'
import { Database } from 'lucide-react'
import ListSaved from "../components/ListSaved.jsx"
import BottomBar from "../components/BottomBar.jsx"

export default function Saved() {
  const [dataSaved, setDataSaved] = useState([])

  async function fetchingSaved() {
    try {
      const { value } = await Preferences.get({ key: 'data' })
      const data = value ? JSON.parse(value) : {}

      setDataSaved(Array.isArray(data.rawSaved) ? data.rawSaved : [])
    } catch (error) {
      console.error("Gagal mengambil data:", error)
      setDataSaved([])
    }
  }

  async function removeSavedLocation(lng, lat) {
    const rawSaved = dataSaved.filter(item => item && !(item.lng === lng && item.lat === lat))

    setDataSaved(rawSaved)

    try {
      const { value } = await Preferences.get({ key: 'data' })
      const data = value ? JSON.parse(value) : {}

      await Preferences.set({
        key: 'data',
        value: JSON.stringify({
          ...data,
          rawSaved
        })
      })
    } catch (error) {
      console.error("Gagal menghapus lokasi:", error)
    }
  }

  useEffect(() => {
    fetchingSaved()
  }, [])

  return (
    <div>
      {/* Title & Deskripsi */}
      <div className="sticky top-0 bg-white p-4">
        <span className="text-xl font-semibold">Tempat Tersimpan</span>
        <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-200 mt-2">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><Database size={24} /></div>
          <div>
            <h1 className="text-blue-700 font-medium">Penyimpanan Lokal Aktif</h1>
            <p className="text-gray-800 text-[12px]">Data tersimpan di penyimpanan lokal perangkat.</p>
          </div>
        </div>
      </div>

      {/* List Saved */}
      <div>
        <ul className="w-full flex flex-col items-center gap-5 pb-8">
          {dataSaved.map(d => <li key={`${d.lng}-${d.lat}`} className="w-[90%]"><ListSaved name={d.name} address={d.address.split("_").join(" ")} clear={() => removeSavedLocation(d.lng, d.lat)} /></li>)}
        </ul>
      </div>

      {/* BottomBar */}
      <div className="fixed bottom-0 w-full"><BottomBar /></div>
    </div>
  )
}
