import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { defaultSettings } from '../data/mockData';
import { useAuth } from './AuthContext';
import * as vehiclesApi from '../api/vehicles.js';
import * as driversApi from '../api/drivers.js';
import * as tripsApi from '../api/trips.js';
import * as maintenanceApi from '../api/maintenance.js';
import * as fuelApi from '../api/fuel.js';
import * as expensesApi from '../api/expenses.js';

const DataContext = createContext(null);

const upsert = (list, item) => {
  const exists = list.some((x) => x.id === item.id);
  return exists ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];
};

export function DataProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshVehicles = useCallback(async () => {
    const { data } = await vehiclesApi.getVehicles();
    setVehicles(data.data);
  }, []);

  const refreshDrivers = useCallback(async () => {
    const { data } = await driversApi.getDrivers();
    setDrivers(data.data);
  }, []);

  const refreshTrips = useCallback(async () => {
    const { data } = await tripsApi.getTrips();
    setTrips(data.data);
  }, []);

  const refreshMaintenance = useCallback(async () => {
    const { data } = await maintenanceApi.getMaintenanceLogs();
    setMaintenance(data.data);
  }, []);

  const refreshFuelLogs = useCallback(async () => {
    const { data } = await fuelApi.getFuelLogs();
    setFuelLogs(data.data);
  }, []);

  const refreshExpenses = useCallback(async () => {
    const { data } = await expensesApi.getExpenses();
    setExpenses(data.data);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    (async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          refreshVehicles(),
          refreshDrivers(),
          refreshTrips(),
          refreshMaintenance(),
          refreshFuelLogs(),
          refreshExpenses(),
        ]);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load fleet data');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isAuthenticated, refreshVehicles, refreshDrivers, refreshTrips, refreshMaintenance, refreshFuelLogs, refreshExpenses]);

  // ========== VEHICLE CRUD ==========
  const addVehicle = useCallback(async (data) => {
    const { data: res } = await vehiclesApi.createVehicle(data);
    setVehicles((prev) => [...prev, res.data]);
    return res.data;
  }, []);

  const updateVehicle = useCallback(async (id, data) => {
    const { data: res } = await vehiclesApi.updateVehicle(id, data);
    setVehicles((prev) => upsert(prev, res.data));
    return res.data;
  }, []);

  // Vehicles are soft-deleted server-side (status -> RETIRED), not removed
  const deleteVehicle = useCallback(async (id) => {
    const { data: res } = await vehiclesApi.deleteVehicle(id);
    setVehicles((prev) => upsert(prev, res.data));
    return res.data;
  }, []);

  // ========== DRIVER CRUD ==========
  const addDriver = useCallback(async (data) => {
    const { data: res } = await driversApi.createDriver(data);
    setDrivers((prev) => [...prev, res.data]);
    return res.data;
  }, []);

  const updateDriver = useCallback(async (id, data) => {
    const { data: res } = await driversApi.updateDriver(id, data);
    setDrivers((prev) => upsert(prev, res.data));
    return res.data;
  }, []);

  const deleteDriver = useCallback(async (id) => {
    await driversApi.deleteDriver(id);
    setDrivers((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const suspendDriver = useCallback(async (id) => {
    const { data: res } = await driversApi.suspendDriver(id);
    setDrivers((prev) => upsert(prev, res.data));
    return res.data;
  }, []);

  // ========== TRIP CRUD + DISPATCH LOGIC ==========
  const addTrip = useCallback(async (data) => {
    const { data: res } = await tripsApi.createTrip(data);
    setTrips((prev) => [...prev, res.data]);
    return res.data;
  }, []);

  const dispatchTrip = useCallback(async (tripId) => {
    const { data: res } = await tripsApi.dispatchTrip(tripId);
    setTrips((prev) => upsert(prev, res.data));
    await Promise.all([refreshVehicles(), refreshDrivers()]);
    return res.data;
  }, [refreshVehicles, refreshDrivers]);

  const completeTrip = useCallback(async (tripId, data) => {
    const { data: res } = await tripsApi.completeTrip(tripId, data);
    setTrips((prev) => upsert(prev, res.data));
    await Promise.all([refreshVehicles(), refreshDrivers()]);
    return res.data;
  }, [refreshVehicles, refreshDrivers]);

  const cancelTrip = useCallback(async (tripId) => {
    const { data: res } = await tripsApi.cancelTrip(tripId);
    setTrips((prev) => upsert(prev, res.data));
    await Promise.all([refreshVehicles(), refreshDrivers()]);
    return res.data;
  }, [refreshVehicles, refreshDrivers]);

  // ========== MAINTENANCE CRUD ==========
  const addMaintenance = useCallback(async (data) => {
    const { data: res } = await maintenanceApi.createMaintenanceLog(data);
    setMaintenance((prev) => [...prev, res.data]);
    await refreshVehicles();
    return res.data;
  }, [refreshVehicles]);

  const closeMaintenance = useCallback(async (id) => {
    const { data: res } = await maintenanceApi.closeMaintenanceLog(id);
    setMaintenance((prev) => upsert(prev, res.data));
    await refreshVehicles();
    return res.data;
  }, [refreshVehicles]);

  // ========== FUEL LOG CRUD ==========
  const addFuelLog = useCallback(async (data) => {
    const { data: res } = await fuelApi.createFuelLog(data);
    setFuelLogs((prev) => [...prev, res.data]);
    return res.data;
  }, []);

  // ========== EXPENSE CRUD ==========
  const addExpense = useCallback(async (data) => {
    const { data: res } = await expensesApi.createExpense(data);
    setExpenses((prev) => [...prev, res.data]);
    return res.data;
  }, []);

  // ========== SETTINGS (client-side only, no backend endpoint) ==========
  const updateSettings = useCallback((data) => {
    setSettings((prev) => ({ ...prev, ...data }));
  }, []);

  const value = {
    // State
    vehicles, drivers, trips, maintenance, fuelLogs, expenses, settings,
    isLoading, error,
    // Refetch
    refreshVehicles, refreshDrivers, refreshTrips, refreshMaintenance, refreshFuelLogs, refreshExpenses,
    // Vehicle ops
    addVehicle, updateVehicle, deleteVehicle,
    // Driver ops
    addDriver, updateDriver, deleteDriver, suspendDriver,
    // Trip ops
    addTrip, dispatchTrip, completeTrip, cancelTrip,
    // Maintenance ops
    addMaintenance, closeMaintenance,
    // Fuel ops
    addFuelLog,
    // Expense ops
    addExpense,
    // Settings ops
    updateSettings,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export default DataContext;
