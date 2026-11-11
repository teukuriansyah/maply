import { useEffect, useState, useRef } from 'react'
import { Map, setWorkerUrl } from 'maplibre-gl'
import { Keyboard } from '@capacitor/keyboard';
import { Crosshair, X } from 'lucide-react'
import { getListSearch } from '../services/Services' 
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'

export default function Home() {
  const mapInstance = useRef(null)
  const debounceTimer = useRef(null)
  const [myPosition, setMyPosition] = useState(null)
  const [is3D, setIs3D] = useState(false)
  const [isShowList, setIsShowList] = useState(false)
  const [listSearch, setListSearch] = useState([])
  const [query, setQuery] = useState("")
  const [selectedPlaceInfo, setSelectedPlaceInfo] = useState(null)

  function goToMyLocation() {
    const map = mapInstance.current
    if (!map || !myPosition) return
    map.flyTo({
      center: myPosition,
      zoom: 16.5,
      duration: 2000,
      essential: true
    })
  }

  async function getSelectedPlace(item) {
    setIsShowList(false)
    const map = mapInstance.current
    if (!map || !item.lon || !item.lat) return
    map.flyTo({
      center: [parseFloat(item.lon), parseFloat(item.lat)],
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

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

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
  
  useEffect(() => {
    setWorkerUrl(workerUrl)

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
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        })

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (p) => {
              const { longitude, latitude } = p.coords
              setMyPosition([longitude, latitude])

              map.setCenter([longitude, latitude])
              map.setZoom(16)

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

      map.on('click', (e) => {
        const bbox = [
          [e.point.x - 5, e.point.y - 5],
          [e.point.x + 5, e.point.y + 5]
        ];
        const features = map.queryRenderedFeatures(bbox);

        if (!features || features.length === 0) return;

        const clickedFeature = features.find(f => f.properties && f.properties.name);
        if (!clickedFeature) return;

        const props = clickedFeature.properties;
        
        setSelectedPlaceInfo({
          name: props.name,
          category: props.class || props.subclass || clickedFeature.layer.id,
          lng: e.lngLat.lng.toFixed(4),
          lat: e.lngLat.lat.toFixed(4)
        });
      });

      map.on('mousemove', (e) => {
        const features = map.queryRenderedFeatures(e.point);
        const hasName = features.some(f => f.properties && f.properties.name);
        map.getCanvas().style.cursor = hasName ? 'pointer' : '';
      });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

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

  return (
    <div className="h-screen w-full relative overflow-hidden bg-white">
      {/* Layer Peta */}
      <div id="map" className="h-full w-full absolute inset-0 z-10" />

      {/* Search Bar */}
      <div className="fixed z-30 top-4 w-full flex flex-col items-center pointer-events-none">
        <input className="w-[95%] outline-0 bg-white rounded-lg p-3 shadow-md pointer-events-auto" placeholder="Search items..." onFocus={() => setIsShowList(true)} value={query} onChange={handleSearchChange} />
        {isShowList && (
          <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden w-[95%] mt-2 bg-white shadow-lg pointer-events-auto max-h-60 overflow-y-auto">
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
      <div className={`absolute right-4 z-20 flex flex-col gap-3 transition-all duration-300 ease-in-out ${selectedPlaceInfo == null ? 'bottom-6' : selectedPlaceInfo.name.length > 33 && selectedPlaceInfo.category.length > 38 ? "bottom-[250px]" : selectedPlaceInfo.name.length > 33 || selectedPlaceInfo.category.length > 38 ? "bottom-[170px]" : "bottom-[140px]"}`}>
        <button className="p-3 bg-white rounded-lg shadow-md hover:bg-gray-100 flex items-center justify-center text-gray-700 aspect-square cursor-pointer" onClick={goToMyLocation}><Crosshair size={22}/></button>
        <div className="flex flex-col bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <button className={`${!is3D ? "bg-gray-200" : ""} font-medium text-xl text-gray-700 p-3 outline-0 cursor-pointer`} onClick={() => toggle3DMode(false)}>2D</button>
          <button className={`${is3D ? "bg-gray-200" : ""} font-medium text-xl text-gray-700 p-3 outline-0 cursor-pointer`} onClick={() => toggle3DMode(true)}>3D</button>
        </div>
      </div>

      {/* Bottom Sheet Detail Lokasi */}
      <div className={`absolute bottom-0 left-0 w-full z-30 bg-white rounded-t-2xl shadow-2xl p-4 transition-transform duration-300 ease-in-out border-t border-gray-200 ${selectedPlaceInfo ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3"></div>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{selectedPlaceInfo?.name}</h2>
            <p className="text-sm text-gray-500 capitalize">{selectedPlaceInfo?.category.split("_").join(" ")}</p>
            {selectedPlaceInfo?.lat && (<p className="text-xs text-gray-400 mt-1">Koordinat: {selectedPlaceInfo.lat}, {selectedPlaceInfo.lng}</p>)}
          </div>
          <button onClick={() => setSelectedPlaceInfo(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 cursor-pointer"><X size={20}/></button>
        </div>
      </div>
    </div>
  )
}
