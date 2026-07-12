import api from "./axios.js";

export const getMaintenanceLogs = (params) => api.get("/api/v1/maintenance", { params });
export const getMaintenanceLog = (id) => api.get(`/api/v1/maintenance/${id}`);
export const createMaintenanceLog = (data) => api.post("/api/v1/maintenance", data);
export const closeMaintenanceLog = (id) => api.patch(`/api/v1/maintenance/${id}/close`);
