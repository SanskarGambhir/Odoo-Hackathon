import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  initialVehicles, initialDrivers, initialTrips,
  initialMaintenance, initialFuelLogs, initialExpenses,
  defaultSettings, monthlyRevenueData,
} from '../data/mockData';

const DataContext = createContext(null);

let nextId = 100;
const genId = (prefix) => `${prefix}-${String(++nextId).padStart(3, '0')}`;

export function DataProvider({ children }) {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [drivers, setDrivers] = useState(initialDrivers);
  const [trips, setTrips] = useState(initialTrips);
  const [maintenance, setMaintenance] = useState(initialMaintenance);
  const [fuelLogs, setFuelLogs] = useState(initialFuelLogs);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [settings, setSettings] = useState(defaultSettings);

  // ========== VEHICLE CRUD ==========
  const addVehicle = useCallback((data) => {
    const vehicle = { ...data, id: genId('VH') };
    setVehicles(prev => [...prev, vehicle]);
    return vehicle;
  }, []);

  const updateVehicle = useCallback((id, data) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...data } : v));
  }, []);

  const deleteVehicle = useCallback((id) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  }, []);

  // ========== DRIVER CRUD ==========
  const addDriver = useCallback((data) => {
    const driver = { ...data, id: genId('DR') };
    setDrivers(prev => [...prev, driver]);
    return driver;
  }, []);

  const updateDriver = useCallback((id, data) => {
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
  }, []);

  const deleteDriver = useCallback((id) => {
    setDrivers(prev => prev.filter(d => d.id !== id));
  }, []);

  // ========== TRIP CRUD + DISPATCH LOGIC ==========
  const addTrip = useCallback((data) => {
    const trip = { ...data, id: genId('TR'), status: 'DRAFT', createdAt: new Date().toISOString(), revenue: 0 };
    setTrips(prev => [...prev, trip]);
    return trip;
  }, []);

  const updateTrip = useCallback((id, data) => {
    setTrips(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, []);

  const dispatchTrip = useCallback((tripId) => {
    setTrips(prev => prev.map(t => {
      if (t.id === tripId && t.status === 'DRAFT') {
        // Calculate ETA (rough: 50km/h average)
        const hours = (t.plannedDistanceKm || 500) / 50;
        const eta = new Date(Date.now() + hours * 3600000).toISOString();
        // Set revenue estimate (₹60/km)
        const revenue = (t.plannedDistanceKm || 500) * 60;
        // Update vehicle status
        if (t.vehicleId) {
          setVehicles(vPrev => vPrev.map(v => v.id === t.vehicleId ? { ...v, status: 'ON_TRIP' } : v));
        }
        // Update driver status
        if (t.driverId) {
          setDrivers(dPrev => dPrev.map(d => d.id === t.driverId ? { ...d, status: 'ON_TRIP' } : d));
        }
        return { ...t, status: 'DISPATCHED', eta, revenue };
      }
      return t;
    }));
  }, []);

  const completeTrip = useCallback((tripId) => {
    setTrips(prev => prev.map(t => {
      if (t.id === tripId && t.status === 'DISPATCHED') {
        // Release vehicle
        if (t.vehicleId) {
          setVehicles(vPrev => vPrev.map(v => v.id === t.vehicleId ? { ...v, status: 'AVAILABLE' } : v));
        }
        // Release driver
        if (t.driverId) {
          setDrivers(dPrev => dPrev.map(d => d.id === t.driverId ? { ...d, status: 'AVAILABLE' } : d));
        }
        return { ...t, status: 'COMPLETED' };
      }
      return t;
    }));
  }, []);

  const cancelTrip = useCallback((tripId) => {
    setTrips(prev => prev.map(t => {
      if (t.id === tripId && (t.status === 'DRAFT' || t.status === 'DISPATCHED')) {
        // Release vehicle
        if (t.vehicleId) {
          setVehicles(vPrev => vPrev.map(v => v.id === t.vehicleId ? { ...v, status: 'AVAILABLE' } : v));
        }
        // Release driver
        if (t.driverId) {
          setDrivers(dPrev => dPrev.map(d => d.id === t.driverId ? { ...d, status: 'AVAILABLE' } : d));
        }
        return { ...t, status: 'CANCELLED', revenue: 0 };
      }
      return t;
    }));
  }, []);

  // ========== MAINTENANCE CRUD ==========
  const addMaintenance = useCallback((data) => {
    const record = { ...data, id: genId('MN') };
    setMaintenance(prev => [...prev, record]);
    // If OPEN, set vehicle to IN_SHOP
    if (data.status === 'OPEN' && data.vehicleId) {
      setVehicles(prev => prev.map(v => v.id === data.vehicleId ? { ...v, status: 'IN_SHOP' } : v));
    }
    return record;
  }, []);

  const closeMaintenance = useCallback((id) => {
    setMaintenance(prev => prev.map(m => {
      if (m.id === id && m.status === 'OPEN') {
        // Set vehicle back to AVAILABLE (unless RETIRED)
        if (m.vehicleId) {
          setVehicles(vPrev => vPrev.map(v => {
            if (v.id === m.vehicleId && v.status !== 'RETIRED') {
              return { ...v, status: 'AVAILABLE' };
            }
            return v;
          }));
        }
        return { ...m, status: 'CLOSED' };
      }
      return m;
    }));
  }, []);

  // ========== FUEL LOG CRUD ==========
  const addFuelLog = useCallback((data) => {
    const log = { ...data, id: genId('FL') };
    setFuelLogs(prev => [...prev, log]);
    return log;
  }, []);

  // ========== EXPENSE CRUD ==========
  const addExpense = useCallback((data) => {
    const expense = { ...data, id: genId('EX') };
    setExpenses(prev => [...prev, expense]);
    return expense;
  }, []);

  // ========== SETTINGS ==========
  const updateSettings = useCallback((data) => {
    setSettings(prev => ({ ...prev, ...data }));
  }, []);

  // ========== COMPUTED VALUES ==========
  const analytics = useMemo(() => {
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.status !== 'RETIRED').length;
    const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;
    const inMaintenance = vehicles.filter(v => v.status === 'IN_SHOP').length;
    const onTrip = vehicles.filter(v => v.status === 'ON_TRIP').length;

    const activeTrips = trips.filter(t => t.status === 'DISPATCHED').length;
    const pendingTrips = trips.filter(t => t.status === 'DRAFT').length;
    const completedTrips = trips.filter(t => t.status === 'COMPLETED');

    const driversOnDuty = drivers.filter(d => d.status === 'ON_TRIP').length;

    const fleetUtilization = totalVehicles > 0 ? Math.round((onTrip / activeVehicles) * 100) : 0;

    const totalFuelCost = fuelLogs.reduce((sum, fl) => sum + fl.cost, 0);
    const totalFuelLiters = fuelLogs.reduce((sum, fl) => sum + fl.liters, 0);
    const totalMaintenanceCost = maintenance.reduce((sum, m) => sum + m.cost, 0);
    const totalExpenseCost = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalExpenseCost;

    const totalDistance = completedTrips.reduce((sum, t) => sum + (t.plannedDistanceKm || 0), 0);
    const fuelEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters).toFixed(1) : 0;

    const totalRevenue = trips.reduce((sum, t) => sum + (t.revenue || 0), 0);

    const totalAcquisitionCost = vehicles.reduce((sum, v) => sum + (v.acquisitionCost || 0), 0);
    const vehicleROI = totalAcquisitionCost > 0
      ? (((totalRevenue - (totalMaintenanceCost + totalFuelCost)) / totalAcquisitionCost) * 100).toFixed(1)
      : 0;

    // Vehicle status distribution
    const vehicleStatusDist = [
      { name: 'Available', value: availableVehicles, fill: '#21B799' },
      { name: 'On Trip', value: onTrip, fill: '#5B899E' },
      { name: 'In Shop', value: inMaintenance, fill: '#E4A900' },
      { name: 'Retired', value: vehicles.filter(v => v.status === 'RETIRED').length, fill: '#E46E78' },
    ];

    // Top costliest vehicles
    const vehicleCosts = vehicles.map(v => {
      const vFuel = fuelLogs.filter(f => f.vehicleId === v.id).reduce((s, f) => s + f.cost, 0);
      const vMaint = maintenance.filter(m => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0);
      const vExp = expenses.filter(e => e.vehicleId === v.id).reduce((s, e) => s + e.amount, 0);
      return { name: v.name, cost: vFuel + vMaint + vExp, id: v.id };
    }).sort((a, b) => b.cost - a.cost).slice(0, 5);

    return {
      totalVehicles, activeVehicles, availableVehicles, inMaintenance, onTrip,
      activeTrips, pendingTrips, driversOnDuty, fleetUtilization,
      totalFuelCost, totalMaintenanceCost, totalExpenseCost, totalOperationalCost,
      fuelEfficiency, totalRevenue, vehicleROI,
      vehicleStatusDist, vehicleCosts, monthlyRevenueData,
    };
  }, [vehicles, drivers, trips, maintenance, fuelLogs, expenses]);

  const value = {
    // State
    vehicles, drivers, trips, maintenance, fuelLogs, expenses, settings, analytics,
    // Vehicle ops
    addVehicle, updateVehicle, deleteVehicle,
    // Driver ops
    addDriver, updateDriver, deleteDriver,
    // Trip ops
    addTrip, updateTrip, dispatchTrip, completeTrip, cancelTrip,
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
