import api from "./axios.js";
export const downloadReportPdf = async (report) => {
  const res = await api.get("/api/v1/reports/export.pdf", {
    params: { report },
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${report}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const getFuelEfficiencyReport = () => api.get("/api/v1/reports/fuel-efficiency");
export const getFleetUtilizationReport = () => api.get("/api/v1/reports/fleet-utilization");
export const getOperationalCostReport = () => api.get("/api/v1/reports/operational-cost");
export const getVehicleRoiReport = () => api.get("/api/v1/reports/vehicle-roi");
export const getReportCsvUrl = (report) =>
  `${api.defaults.baseURL}/api/v1/reports/export.csv?report=${report}`;
