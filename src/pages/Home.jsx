import { useEffect, useState, useRef } from 'react'
import { Map, setWorkerUrl } from 'maplibre-gl'
import { Crosshair } from 'lucide-react'
import { getListSearch } from '../services/Services' 
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'

export default function Home() {
  const mapInstance = useRef(null)
  const [myPosition, setMyPosition] = useState(null)
  const [is3D, setIs3D] = useState(false)
  const [isShowList, setIsShowList] = useState(false)
  const [listSearch, setListSearch] = useState([])
  const [query, setQuery] = useState("")

  function goToMyLocation() {
    const map = mapInstance.current
    map.flyTo({
      center: myPosition,
      zoom: 16.5,
      duration: 2000,
      essential: true
    })
  }

  async function getSelectedPlace(id) {
    console.log(id)
    setIsShowList(false)
  }

  async function getAllListSearch(e) {
    setQuery(e)
    const data = await getListSearch(e)
    setListSearch(data)
  }
  
  useEffect(() => {
    setWorkerUrl(workerUrl)

    if (!mapInstance.current) {
      mapInstance.current = new Map({
        container: 'map',
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [106.827153, -6.175110],
        zoom: is3D ? 50 : 16,
        bearing: is3D ? -17 : 0,
        pitch: is3D ? 55 : 0
      })

      mapInstance.current.on('load', () => {
        const map = mapInstance.current

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
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        })

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (p) => {
              const { longitude, latitude } = p.coords
              setMyPosition([p.coords.longitude, p.coords.latitude])

              map.setCenter([longitude, latitude])
              map.setZoom(is3D ? 50 : 16)

              const source = map.getSource('user-location')
              if (source) {
                source.setData({
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                  },
                  properties: {}
                })
              }
            },
            (error) => {
              console.error("Gagal mendapatkan lokasi:", error)
              alert("Tidak dapat mengambil lokasi Anda.")
            }
          )
        } else {
          alert("Geolocation tidak didukung oleh browser ini.")
        }
      })
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [is3D])

  return (
    <div id="map" className="h-screen w-full relative">
      <div className="absolute z-20 top-4 w-full flex flex-col items-center">
        <input className="w-[95%] outline-0 bg-white rounded-lg p-3"  placeholder="Search items..." onFocus={() => setIsShowList(true)} onBlur={() => setIsShowList(false)} value={query} onChange={(e) => getAllListSearch(e.target.value)}/>
        {
          isShowList ? <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden w-[95%] mt-2">
          {listSearch.length > 0 ? (
            listSearch.map((item,i) => (
              <li key={i}>
                <button onMouseDown={e => e.preventDefault()} onClick={() => getSelectedPlace(item)} className="w-full text-left p-3 flex flex-col bg-white hover:bg-gray-50 cursor-pointer">
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <span className="text-gray-800">{item.display_name}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="p-4 text-center text-gray-500">No items found</li>
          )}
        </ul> : null}
      </div>
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-3">
        <button className="p-3 bg-white rounded-lg shadow-md hover:bg-gray-100 flex items-center justify-center text-gray-700 aspect-square" onClick={goToMyLocation}> <Crosshair size={22}/></button>
        <div className="flex flex-col bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <button className={`text-2xl p-4 ${!is3D ? "bg-gray-200" : ""} text-gray-700 font-semibold cursor-pointer`} onClick={() => setIs3D(false)}>2D</button>
          <button className={`text-2xl p-4 ${is3D ? "bg-gray-200" : ""} text-gray-700 font-semibold cursor-pointer`} onClick={() => setIs3D(true)}>3D</button>
        </div>
      </div>
    </div>
  )
}
