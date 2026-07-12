import api from "./axios.js";

export const getDrivers = (params) => api.get("/api/v1/drivers", { params });
export const getDriver = (id) => api.get(`/api/v1/drivers/${id}`);
export const createDriver = (data) => api.post("/api/v1/drivers", data);
export const updateDriver = (id, data) => api.patch(`/api/v1/drivers/${id}`, data);
export const suspendDriver = (id) => api.patch(`/api/v1/drivers/${id}/suspend`);
export const deleteDriver = (id) => api.delete(`/api/v1/drivers/${id}`);
