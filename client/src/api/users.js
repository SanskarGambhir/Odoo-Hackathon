import api from "./axios.js";

export const getUsers = () => api.get("/api/v1/users");
export const createUser = (data) => api.post("/api/v1/users", data);
export const deleteUser = (id) => api.delete(`/api/v1/users/${id}`);
