import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000", // change if your server uses a different host/port
  headers: {
    "Content-Type": "application/json",
  },
});

// attach token automatically if present
instance.interceptors.request.use(
  (cfg) => {
    try {
      const token = localStorage.getItem("token");
      if (token) cfg.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      // ignore (some environments may block localStorage)
    }
    return cfg;
  },
  (err) => Promise.reject(err)
);

export default instance;
