import { useEffect, useState, useRef } from 'react'
import { Map, setWorkerUrl } from 'maplibre-gl'
import { Keyboard } from '@capacitor/keyboard'
import { Crosshair, X, Bookmark, MapPin, Navigation } from 'lucide-react'
import { getListSearch } from '../services/SearchList.js'
import { Preferences } from '@capacitor/preferences'
import { Geolocation } from '@capacitor/geolocation'
import BottomBar from "../components/BottomBar.jsx"
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'

export default function Home() {
  const mapInstance = useRef(null)
  const debounceTimer = useRef(null)

  const [activity, setActivity] = useState([])
  const [saved, setSaved] = useState([])
  const [myPosition, setMyPosition] = useState(null)
  const [is3D, setIs3D] = useState(false)
  const [isShowList, setIsShowList] = useState(false)
  const [listSearch, setListSearch] = useState([])
  const [query, setQuery] = useState("")
  const [selectedPlaceInfo, setSelectedPlaceInfo] = useState(null)

  function goToMyLocation() {
    printCurrentPosition()
  }

  async function getSelectedPlace(item) {
    setIsShowList(false)

    const map = mapInstance.current
    if (!map || !item.lon || !item.lat) return

    const lng = parseFloat(item.lon)
    const lat = parseFloat(item.lat)

    map.flyTo({
      center: [lng, lat],
      zoom: 16,
      duration: 2000
    })

    Keyboard.hide()

    setSelectedPlaceInfo({
      name: item.name,
      category: item.display_name || 'Lokasi Pilihan',
      lng: item.lon,
      lat: item.lat
    })
  }

  function handleSearchChange(e) {
    const value = e.target.value
    setQuery(value)
    setSelectedPlaceInfo(null)

    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    debounceTimer.current = setTimeout(async () => {
      if (value.trim().length > 1) {
        const data = await getListSearch(value)
        setListSearch(data)
        setIsShowList(true)
      } else {
        setListSearch([])
        setIsShowList(false)
      }
    }, 400)
  }

  function toggle3DMode(mode) {
    setIs3D(mode)

    const map = mapInstance.current
    if (!map) return

    map.easeTo({
      pitch: mode ? 55 : 0,
      bearing: mode ? -17 : 0,
      duration: 1000
    })
  }

  async function setSavedLocation(name, address, lng, lat) {
    const alreadySaved = saved.some(item => item && item.lng === lng && item.lat === lat)
    if (alreadySaved) return

    const payload = { name, address, lng, lat }
    const rawSaved = [...saved.filter(Boolean), payload]

    setSaved(rawSaved)

    await Preferences.set({
      key: 'data',
      value: JSON.stringify({ rawActivity: activity, rawSaved })
    })
  }

  async function removeSavedLocation(lng, lat) {
    const rawSaved = saved.filter(item => item && !(item.lng === lng && item.lat === lat))
    setSaved(rawSaved)

    await Preferences.set({
      key: 'data',
      value: JSON.stringify({ rawActivity: activity, rawSaved })
    })
  }

  async function getSavedLocation() {
    try {
      const { value } = await Preferences.get({ key: 'data' })
      const data = value ? JSON.parse(value) : {}

      setActivity(Array.isArray(data.rawActivity) ? data.rawActivity : [])
      setSaved(Array.isArray(data.rawSaved) ? data.rawSaved.filter(item => item && item.lng != null && item.lat != null) : [])
    } catch (error) {
      console.error("Gagal mengambil data tersimpan:", error)
      setActivity([])
      setSaved([])
    }
  }

  async function printCurrentPosition() {
    try {
      let permission = await Geolocation.checkPermissions()

      if (permission.location !== 'granted') {
        permission = await Geolocation.requestPermissions()
      }

      if (permission.location !== 'granted') {
        alert("Izin lokasi ditolak.")
        return
      }

      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      })

      const { longitude, latitude } = coordinates.coords
      const position = [longitude, latitude]

      setMyPosition(position)

      const map = mapInstance.current

      if (map) {
        map.flyTo({
          center: position,
          zoom: 16,
          duration: 1500
        })

        const source = map.getSource('user-location')

        if (source) {
          source.setData({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: position
            },
            properties: {}
          })
        }
      }
    } catch (error) {
      console.error("Gagal mendapatkan lokasi:", error)
      alert("Tidak dapat mengambil lokasi Anda.")
    }
  }

  useEffect(() => {
    setWorkerUrl(workerUrl)
    getSavedLocation()

    if (!mapInstance.current) {
      mapInstance.current = new Map({
        container: 'map',
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [106.827153, -6.175110],
        zoom: 16,
        bearing: 0,
        pitch: 0
      })

      const map = mapInstance.current

      map.on('load', () => {
        map.addSource('user-location', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        })

        map.addLayer({
          id: 'user-location-circle',
          type: 'circle',
          source: 'user-location',
          paint: {
            'circle-radius': 10,
            'circle-color': '#3b82f6',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff'
          }
        })

        printCurrentPosition()
      })

      map.on('click', (e) => {
        const bbox = [
          [e.point.x - 5, e.point.y - 5],
          [e.point.x + 5, e.point.y + 5]
        ]

        const features = map.queryRenderedFeatures(bbox)
        if (!features || features.length === 0) return

        const clickedFeature = features.find(f => f.properties && f.properties.name)
        if (!clickedFeature) return

        const props = clickedFeature.properties

        setSelectedPlaceInfo({
          name: props.name,
          category: props.class || props.subclass || clickedFeature.layer.id,
          lng: e.lngLat.lng.toFixed(4),
          lat: e.lngLat.lat.toFixed(4)
        })
      })

      map.on('mousemove', (e) => {
        const features = map.queryRenderedFeatures(e.point)
        const hasName = features.some(f => f.properties && f.properties.name)
        map.getCanvas().style.cursor = hasName ? 'pointer' : ''
      })
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }

      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  const isSelectedPlaceSaved = selectedPlaceInfo
    ? saved.some(item => item && item.lng === selectedPlaceInfo.lng && item.lat === selectedPlaceInfo.lat)
    : false

  return (
    <div className="h-dvh w-full relative overflow-hidden bg-white">
      {/* Layer Peta */}
      <div id="map" className="absolute inset-0 z-10 h-full w-full" onClick={() => setIsShowList(false)} />

      {/* Search Bar */}
      <div className="absolute top-4 left-0 z-30 flex w-full flex-col items-center px-2 pointer-events-none">
        <input className="w-full outline-none bg-white rounded-xl p-3 shadow-md pointer-events-auto border border-gray-100" placeholder="Search items..." onFocus={() => setIsShowList(true)} value={query} onChange={handleSearchChange} />
        {isShowList && (
          <ul className="w-full max-h-60 mt-2 overflow-y-auto divide-y divide-gray-200 border border-gray-200 rounded-xl bg-white shadow-lg pointer-events-auto">
            {listSearch.length > 0 ? (
              listSearch.map((item, i) => (
                <li key={i}>
                  <button onMouseDown={e => e.preventDefault()} onClick={() => getSelectedPlace(item)} className="w-full text-left p-3 flex flex-col bg-white hover:bg-gray-50 cursor-pointer">
                    <span className="font-medium text-gray-800">{item.name}</span>
                    <span className="text-gray-800 text-sm">{item.display_name}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="p-4 text-center text-gray-500">No items found</li>
            )}
          </ul>
        )}
      </div>

      {/* Tombol Kanan Bawah */}
      <div className={`absolute right-4 z-20 flex flex-col gap-3 transition-all duration-300 ease-in-out ${selectedPlaceInfo == null ? 'bottom-24' : selectedPlaceInfo.name.length > 33 && selectedPlaceInfo.category.length > 38 ? "bottom-[375px]" : selectedPlaceInfo.name.length > 33 || selectedPlaceInfo.category.length > 38 ? "bottom-[300px]" : "bottom-[265px]"}`}>
        <button className="p-3 bg-white rounded-xl shadow-md hover:bg-gray-100 flex items-center justify-center text-gray-700 aspect-square cursor-pointer" onClick={goToMyLocation}><Crosshair size={22}/></button>
        <div className="flex flex-col bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <button className={`${!is3D ? "bg-gray-200" : ""} font-medium text-xl text-gray-700 p-3 outline-none cursor-pointer`} onClick={() => toggle3DMode(false)}>2D</button>
          <button className={`${is3D ? "bg-gray-200" : ""} font-medium text-xl text-gray-700 p-3 outline-none cursor-pointer`} onClick={() => toggle3DMode(true)}>3D</button>
        </div>
      </div>

      {/* Bottom Sheet Detail Lokasi */}
      <div className={`absolute bottom-16 left-0 w-full z-30 bg-white rounded-t-2xl shadow-2xl p-4 transition-transform duration-300 ease-in-out border-t border-gray-200 ${selectedPlaceInfo ? 'translate-y-0' : 'translate-y-full'}`}>
        {selectedPlaceInfo && (
          <>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3"></div>
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1 pr-3">
                <h2 className="text-lg font-bold text-gray-800 break-words">{selectedPlaceInfo.name}</h2>
                <p className="text-sm text-gray-500 capitalize break-words">{selectedPlaceInfo.category.split("_").join(" ")}</p>
                {selectedPlaceInfo.lat && <p className="text-xs text-gray-400 mt-1">Koordinat: {selectedPlaceInfo.lat}, {selectedPlaceInfo.lng}</p>}
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => { const map = mapInstance.current; if (map) map.flyTo({ center: [parseFloat(selectedPlaceInfo.lng), parseFloat(selectedPlaceInfo.lat)], zoom: 17, duration: 1500 }) }} className="bg-blue-700 text-white font-semibold rounded-full px-4 py-2 flex items-center justify-center gap-1.5 flex-1 cursor-pointer"><Navigation size={14}/>Tunjukkan Rute</button>
                  <button className="font-semibold rounded-full px-4 py-2 flex items-center gap-1.5" onClick={() => { if (!selectedPlaceInfo) return; if (isSelectedPlaceSaved) { removeSavedLocation(selectedPlaceInfo.lng, selectedPlaceInfo.lat) } else { setSavedLocation(selectedPlaceInfo.name, selectedPlaceInfo.category, selectedPlaceInfo.lng, selectedPlaceInfo.lat) } }} aria-label={isSelectedPlaceSaved ? "Remove bookmark" : "Add bookmark"}><Bookmark fill={isSelectedPlaceSaved ? "currentColor" : "none"} /></button>
                </div>
              </div>
              <button onClick={() => setSelectedPlaceInfo(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 cursor-pointer shrink-0"><X size={20}/></button>
            </div>
          </>
        )}
      </div>

      {/* Container BottomBar */}
      <div className="fixed bottom-0 left-0 w-full z-40"><BottomBar/></div>
    </div>
  )
}
