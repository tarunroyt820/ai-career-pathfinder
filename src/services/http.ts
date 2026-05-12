import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
let refreshPromise: Promise<string> | null = null;

const clearSessionAndRedirect = () => {
    localStorage.removeItem("nextro_token");
    localStorage.removeItem("nextro_refresh_token");
    window.location.href = "/login";
};

const refreshAccessToken = async (): Promise<string> => {
    if (!refreshPromise) {
        const refreshToken = localStorage.getItem("nextro_refresh_token");
        if (!refreshToken) {
            throw new Error("Missing refresh token");
        }

        refreshPromise = axios
            .post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken })
            .then((res) => {
                const newToken = res.data.token;
                localStorage.setItem("nextro_token", newToken);
                return newToken;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
};

axios.interceptors.request.use((config) => {
    const requestUrl = String(config.url || "");
    const isAuthRoute = requestUrl.includes("/api/auth/");

    if (!isAuthRoute) {
        const token = localStorage.getItem("nextro_token");
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
    }

    return config;
});

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const requestUrl = String(originalRequest?.url || "");
        const isAuthRoute = requestUrl.includes("/api/auth/");

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !isAuthRoute
        ) {
            originalRequest._retry = true;

            if (!localStorage.getItem("nextro_refresh_token")) {
                clearSessionAndRedirect();
                return Promise.reject(error);
            }

            try {
                const newToken = await refreshAccessToken();
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

                return axios(originalRequest);
            } catch (refreshError) {
                const status = (refreshError as { response?: { status?: number } })?.response?.status;
                if (status === 401 || status === 403) {
                    clearSessionAndRedirect();
                }

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

export default axios;
