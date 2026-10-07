import axios from "axios";
import {getAccessToken} from "./authToken";
const api=axios.create({
  baseURL: "http://192.168.1.133:5000/api/",

  timeout: 10000, 
    headers: {
        "Content-Type": "application/json", 
       
    },
});
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    /*
     * The API sends no Cache-Control header, so browsers may
     * heuristically cache GET responses and show stale data.
     * Ask the server/browser for a fresh copy every time.
     */
    if (!config.headers["Cache-Control"]) {
      config.headers["Cache-Control"] = "no-cache";
      config.headers.Pragma = "no-cache";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;