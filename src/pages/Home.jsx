import { useEffect, useState, useRef } from 'react'
import { Map, setWorkerUrl } from 'maplibre-gl'
import { Crosshair } from 'lucide-react'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'

export default function Home() {
  const mapInstance = useRef(null)
  const [myPosition, setMyPosition] = useState(null)
  const [is3D, setIs3D] = useState(false)

  function goToMyLocation() {
    const map = mapInstance.current
    map.flyTo({
      center: myPosition,
      zoom: 16.5,
      duration: 2000,
      essential: true
    })
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
      <div className="absolute z-20 top-4 w-full border">
        <input className="w-[90%] outline-0 bg-white rounded-lg" />
      </div>
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-3">
        <button className="p-3 bg-white rounded-lg shadow-md hover:bg-gray-100 flex items-center justify-center text-gray-700 aspect-square" onClick={goToMyLocation}> <Crosshair size={22}/></button>
        <div className="flex flex-col bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <button className={`text-2xl p-4 ${!is3D ? "bg-gray-200" : ""} text-gray-700 font-medium`} onClick={() => setIs3D(false)}>2D</button>
          <button className={`text-2xl p-4 ${is3D ? "bg-gray-200" : ""} text-gray-700 font-medium`} onClick={() => setIs3D(true)}>3D</button>
        </div>
      </div>
    </div>
  )
}
