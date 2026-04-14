import axios from "axios";

export const api = axios.create({
  baseURL: "http://18.118.165.40:5000/api/v1", // your backend URL
  withCredentials: true, // required for JWT cookies
});

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   console.log("api", token);

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });
