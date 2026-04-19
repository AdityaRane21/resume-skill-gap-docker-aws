import axios from "axios"

const getBaseURL = () => {
    const rawBaseURL = import.meta.env.VITE_API_BASE_URL || ""
    return rawBaseURL.endsWith("/api") ? rawBaseURL.slice(0, -4) : rawBaseURL
}

const api = axios.create({
    baseURL: getBaseURL(),
    withCredentials: true
})

export async function register({ username, email, password }) {

    try {
        const response = await api.post('/api/auth/register', {
            username, email, password
        })

        return response.data

    } catch (err) {
        console.error("Registration error:", err.response?.data || err.message)
        throw err
    }

}

export async function login({ email, password }) {

    try {

        const response = await api.post("/api/auth/login", {
            email, password
        })

        return response.data

    } catch (err) {
        console.error("Login error:", err.response?.data || err.message)
        throw err
    }

}

export async function logout() {
    try {

        const response = await api.get("/api/auth/logout")

        return response.data

    } catch (err) {

    }
}

export async function getMe() {

    try {

        const response = await api.get("/api/auth/get-me")

        return response.data

    } catch (err) {
        console.error("Get user error:", err.response?.data || err.message)
        throw err
    }

}