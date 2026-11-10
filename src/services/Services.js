import axios from "axios"

const api = axios.create({
    baseURL: "https://nominatim.openstreetmap.org/search"
})

export async function getListSearch(q) {
    if (!q || q.trim() === "") return []

    // Clean up any accidental leading slashes (e.g. "/monas" -> "monas")
    const cleanQuery = q.startsWith('/') ? q.slice(1) : q

    try {
        const { data } = await api.get("", {
            params: {
                format: "jsonv2",
                q: cleanQuery,
                limit: 5,
                countrycodes: "id"
            }
        })
        return data
    } catch (error) {
        if (error.response && error.response.status === 429) {
            console.warn("Nominatim rate limit reached (429). Slow down typing.")
        } else {
            console.error("Search error:", error)
        }
        return []
    }
}