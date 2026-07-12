import api from "./axios.js";

export const getFuelEfficiencyReport = () => api.get("/api/v1/reports/fuel-efficiency");
export const getFleetUtilizationReport = () => api.get("/api/v1/reports/fleet-utilization");
export const getOperationalCostReport = () => api.get("/api/v1/reports/operational-cost");
export const getVehicleRoiReport = () => api.get("/api/v1/reports/vehicle-roi");
export const getReportCsvUrl = (report) =>
  `${api.defaults.baseURL}/api/v1/reports/export.csv?report=${report}`;
