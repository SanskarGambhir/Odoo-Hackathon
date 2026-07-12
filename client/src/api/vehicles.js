import api from "./axios.js";

export const getVehicles = (params) => api.get("/api/v1/vehicles", { params });
export const getVehicle = (id) => api.get(`/api/v1/vehicles/${id}`);
export const createVehicle = (data) => api.post("/api/v1/vehicles", data);
export const updateVehicle = (id, data) => api.patch(`/api/v1/vehicles/${id}`, data);
export const deleteVehicle = (id) => api.delete(`/api/v1/vehicles/${id}`);
