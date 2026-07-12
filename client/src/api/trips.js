import api from "./axios.js";

export const getAvailableVehicles = () => api.get("/api/v1/trips/available-vehicles");
export const getAvailableDrivers = () => api.get("/api/v1/trips/available-drivers");
export const getTrips = (params) => api.get("/api/v1/trips", { params });
export const getTrip = (id) => api.get(`/api/v1/trips/${id}`);
export const createTrip = (data) => api.post("/api/v1/trips", data);
export const dispatchTrip = (id) => api.post(`/api/v1/trips/${id}/dispatch`);
export const completeTrip = (id, data) => api.post(`/api/v1/trips/${id}/complete`, data);
export const cancelTrip = (id) => api.post(`/api/v1/trips/${id}/cancel`);
