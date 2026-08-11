import axios from "axios"

const BASE_URL = "http://127.0.0.1:8000/api"

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

let isRefreshing = false
let refreshPromise = null
let isLoggedOut = false   // 🔥 THE KEY FIX

export const markLoggedOut = () => {
  isLoggedOut = true
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (isLoggedOut) {
      return Promise.reject(error)
    }

const noRefreshUrls = [
  "/accounts/login/",
  "/accounts/logout/",
  "/accounts/refresh/",
]

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !noRefreshUrls.some((url) => originalRequest.url.includes(url))
    ) {
      originalRequest._retry = true

      try {
        if (!isRefreshing) {
          isRefreshing = true
          refreshPromise = axios
            .post(`${BASE_URL}/accounts/refresh/`, {}, { withCredentials: true })
            .finally(() => {
              isRefreshing = false
              refreshPromise = null    // RESET so next cycle creates a new promise
            })
        }

        await refreshPromise
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        isLoggedOut = true
        // window.location.href = "/login"
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  
  }
)

export default axiosInstance
