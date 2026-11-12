import axios from "axios"

const api = axios.create({
    baseURL: "https://router.project-osrm.org/route/v1/driving"
})

export async function showRoute(startLng, startLat, endLng, endLat) {
  const { data } = await api.get(`/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`)
  return data
}