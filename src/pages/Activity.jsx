import { useState, useEffect } from 'react'
import ListActivity from "../components/ListActivity"
import BottomBar from "../components/BottomBar.jsx"

export default function Activity() {
  const [dataActivity, setDataActivity] = useState([])

  async function fetchingActivity() {
    try {
      const { value } = await Preferences.get({ key: 'data' })
      const data = value ? JSON.parse(value) : {}

      setDataActivity(Array.isArray(data.rawActivity.reverse()) ? data.rawActivity : [])
    } catch (error) {
      console.error("Gagal mengambil data:", error)
      setDataActivity([])
    }
  }

  useEffect(() => {
    fetchingActivity()
  },[])
  return (
    <div className="h-screen">
      <div className="p-4">
        <h1 className="font-medium text-xl">Riwayat Aktvitas</h1>
        <p className="text-sm text-gray-800">Perjalanan & rute yang baru saja selesai</p>
      </div>
      <div className="p-4">
        <ul className="flex flex-col gap-4">
          {dataActivity.map(d => <li><ListActivity from="text" to="test"/></li>)}
        </ul>
      </div>
      <div className="fixed bottom-0 w-full"><BottomBar /></div>
    </div>
  )
}