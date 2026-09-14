import axios from "axios";
const api=axios.create({
  //baseURL: "https://mocki.io/v1/7445d5f5-ef8f-4ba9-9555-c3fdee5f1c6a", 
  baseURL: "https://6a9d0088a1b37296ad4bc59e.mockapi.io/api/",

  timeout: 10000, 
    headers: {
        "Content-Type": "application/json", 
        "Authorization": "Bearer YOUR_API_KEY",
    },
});

export default api;