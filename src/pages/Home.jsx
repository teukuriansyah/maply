import { useEffect, useState, useRef } from 'react'
import { Map, setWorkerUrl, LngLatBounds } from 'maplibre-gl'
import { Keyboard } from '@capacitor/keyboard';
import { Crosshair, X, Bookmark, Navigation, Clock, Route, MapPin } from 'lucide-react'
import { getListSearch } from '../services/SearchList' 
import { showRoute } from "../services/ShowRoute.js"
import BottomBar from "../components/BottomBar"
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
  const [routeInfo, setRouteInfo] = useState(null)

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
    clearRoute()

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

  async function showingRoute() {
    const map = mapInstance.current
    if (!map || !myPosition || !selectedPlaceInfo) {
      alert("Pastikan lokasi Anda dan tujuan sudah tersedia.")
      return
    }

    const startLng = myPosition[0]
    const startLat = myPosition[1]
    const endLng = parseFloat(selectedPlaceInfo.lng)
    const endLat = parseFloat(selectedPlaceInfo.lat)

    try {
      const data = await showRoute(startLng,startLat,endLng,endLat)

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        const routeGeometry = route.geometry
        const routeSource = map.getSource('route-source')

        if (routeSource) {
          routeSource.setData({
            type: 'Feature',
            properties: {},
            geometry: routeGeometry
          })
        }

        const distanceMeters = route.distance || 0
        const durationSeconds = route.duration || 0

        const formattedDistance = distanceMeters >= 1000 
          ? `${(distanceMeters / 1000).toFixed(1)} km` 
          : `${Math.round(distanceMeters)} m`

        const totalMinutes = Math.max(1, Math.round(durationSeconds / 60))
        const formattedDuration = totalMinutes >= 60 
          ? `${Math.floor(totalMinutes / 60)} jam ${totalMinutes % 60} mnt` 
          : `${totalMinutes} mnt`

        setRouteInfo({
          distance: formattedDistance,
          duration: formattedDuration
        })

        const coordinates = routeGeometry.coordinates
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord)
        }, new LngLatBounds(coordinates[0], coordinates[0]))

        map.fitBounds(bounds, {
          padding: { top: 80, bottom: 280, left: 40, right: 40 },
          duration: 1500
        })
      }
    } catch (error) {
      console.error("Gagal memuat rute:", error)
      alert("Gagal mengambil data rute.")
    }
  }

  function clearRoute() {
    const map = mapInstance.current
    setRouteInfo(null)
    if (!map) return

    const routeSource = map.getSource('route-source')
    if (routeSource) {
      routeSource.setData({
        type: 'FeatureCollection',
        features: []
      })
    }
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
        map.addSource('route-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        })

        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#2563eb',
            'line-width': 6,
            'line-opacity': 0.85
          }
        })

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
        
        clearRoute()
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
      <div className={`absolute right-4 z-20 flex flex-col gap-3 transition-all duration-300 ease-in-out ${selectedPlaceInfo == null ? 'bottom-24' : routeInfo ? 'bottom-[345px]' : selectedPlaceInfo.name.length > 33 && selectedPlaceInfo.category.length > 38 ? "bottom-[375px]" : selectedPlaceInfo.name.length > 33 || selectedPlaceInfo.category.length > 38 ? "bottom-[300px]" : "bottom-[265px]"}`}>
        <button className="p-3 bg-white rounded-xl shadow-md hover:bg-gray-100 flex items-center justify-center text-gray-700 aspect-square cursor-pointer" onClick={goToMyLocation}><Crosshair size={22}/></button>
        <div className="flex flex-col bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <button className={`${!is3D ? "bg-gray-200" : ""} font-medium text-xl text-gray-700 p-3 outline-none cursor-pointer`} onClick={() => toggle3DMode(false)}>2D</button>
          <button className={`${is3D ? "bg-gray-200" : ""} font-medium text-xl text-gray-700 p-3 outline-none cursor-pointer`} onClick={() => toggle3DMode(true)}>3D</button>
        </div>
      </div>

      {/* Bottom Sheet Detail Lokasi & Navigasi */}
      <div className={`absolute bottom-16 left-0 w-full z-30 bg-white rounded-t-2xl shadow-2xl p-4 transition-transform duration-300 ease-in-out border-t border-gray-200 ${selectedPlaceInfo ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3"></div>
        
        {routeInfo ? (
          <div>
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  Menuju Tujuan
                </div>
                <h2 className="text-lg font-bold text-gray-900 truncate">{selectedPlaceInfo?.name}</h2>
                <p className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1">
                  <MapPin size={12} className="shrink-0 text-gray-400" />
                  {selectedPlaceInfo.category.split("_").map(d => d.split("").map((j,i) => i == 0 ? j.toUpperCase() : j.toLowerCase()).join("")).join(" ")}
                </p>
              </div>
              <button onClick={() => {setSelectedPlaceInfo(null); clearRoute()}} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 cursor-pointer shrink-0">
                <X size={20}/>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 my-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-medium">Estimasi Waktu</p>
                  <p className="text-base font-bold text-gray-900">{routeInfo.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 border-l border-gray-200 pl-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <Route size={18} />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-medium">Jarak Tempuh</p>
                  <p className="text-base font-bold text-gray-900">{routeInfo.distance}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={goToMyLocation} className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-full py-2.5 px-4 flex items-center justify-center gap-1.5 cursor-pointer text-sm">
                <Crosshair size={16} /> Fokus Lokasi Saya
              </button>
              <button onClick={() => {setSelectedPlaceInfo(null); clearRoute()}} className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-full py-2.5 px-4 cursor-pointer text-sm">
                Selesai
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start">
            <div className="min-w-0 flex-1 pr-3">
              <div>
                <h2 className="text-lg font-bold text-gray-800 break-words">{selectedPlaceInfo?.name}</h2>
                <p className="text-sm text-gray-500 capitalize break-words">{selectedPlaceInfo?.category.split("_").join(" ")}</p>
                {selectedPlaceInfo?.lat && (<p className="text-xs text-gray-400 mt-1">Koordinat: {selectedPlaceInfo.lat}, {selectedPlaceInfo.lng}</p>)}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <button onClick={showingRoute} className="bg-blue-700 text-white font-semibold rounded-full px-4 py-2 flex items-center justify-center gap-1.5 w-full cursor-pointer">
                  <Navigation size={14} /> Rute
                </button>
                <button className="font-semibold rounded-full px-4 py-2 flex items-center gap-1.5">
                  <Bookmark />
                </button>
              </div>
            </div>
            <button onClick={() => {setSelectedPlaceInfo(null);clearRoute()}} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 cursor-pointer shrink-0"><X size={20}/></button>
          </div>
        )}
      </div>

      {/* Container BottomBar */}
      <div className="fixed bottom-0 left-0 w-full z-40">
        <BottomBar/>
      </div>
    </div>
  )
}
