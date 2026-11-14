import { useState, useEffect } from 'react'
import { Preferences } from '@capacitor/preferences'
import ListActivity from "../components/ListActivity"
import BottomBar from "../components/BottomBar.jsx"

export default function Activity() {
  const [dataActivity, setDataActivity] = useState([])

  async function fetchingActivity() {
    try {
      const { value } = await Preferences.get({ key: 'data' })
      const data = value ? JSON.parse(value) : {}
      const rawActivity = Array.isArray(data.rawActivity) ? data.rawActivity : []

      setDataActivity([...rawActivity].reverse())
    } catch (error) {
      console.error("Gagal mengambil data:", error)
      setDataActivity([])
    }
  }

  useEffect(() => {
    fetchingActivity()
  }, [])

  return (
    <div className="h-screen">
      <div className="p-4">
        <h1 className="font-medium text-xl">Riwayat Aktivitas</h1>
        <p className="text-sm text-gray-800">Perjalanan & rute yang baru saja selesai</p>
      </div>
      <div className="p-4">
        <ul className="flex flex-col gap-4">
          {dataActivity.map((d, index) => <li key={index}><ListActivity from={d.from} to={d.to} /></li>)}
        </ul>
      </div>
      <div className="fixed bottom-0 w-full"><BottomBar /></div>
    </div>
  )
}