import api from "./axios.js";

export const getFuelLogs = (params) => api.get("/api/v1/fuel-logs", { params });
export const createFuelLog = (data) => api.post("/api/v1/fuel-logs", data);
