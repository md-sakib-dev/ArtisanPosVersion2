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

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;