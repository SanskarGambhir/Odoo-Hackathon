import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  CircleCheck,
  Wrench,
  Route,
  Clock,
  Users,
  BarChart3,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useData } from '../contexts/DataContext';
import PageHeader from '../components/shared/PageHeader';
import KpiCard from '../components/shared/KpiCard';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';

const VEHICLE_TYPES = ['All', 'Truck', 'Bus', 'Van', 'Car'];
const TRIP_STATUSES = ['All', 'DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'];
const STATUS_COLORS = {
  AVAILABLE: '#21B799',
  ON_TRIP: '#5B899E',
  IN_SHOP: '#E4A900',
  RETIRED: '#9CA3AF',
};

const CHART_COLORS = ['#21B799', '#5B899E', '#E4A900', '#9CA3AF', '#714B67', '#E46E78'];

export default function Dashboard() {
  const { vehicles, drivers, trips, analytics } = useData();

  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  // Derive unique regions from vehicles
  const regions = useMemo(() => {
    const regionSet = new Set(vehicles.map((v) => v.region).filter(Boolean));
    return ['All', ...Array.from(regionSet)];
  }, [vehicles]);

  // Filter trips based on local state
  const filteredTrips = useMemo(() => {
    let result = [...trips];

    if (typeFilter !== 'All') {
      const vehicleIdsOfType = new Set(
        vehicles.filter((v) => v.type === typeFilter).map((v) => v.id)
      );
      result = result.filter((t) => vehicleIdsOfType.has(t.vehicleId));
    }

    if (statusFilter !== 'All') {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (regionFilter !== 'All') {
      const vehicleIdsInRegion = new Set(
        vehicles.filter((v) => v.region === regionFilter).map((v) => v.id)
      );
      result = result.filter((t) => vehicleIdsInRegion.has(t.vehicleId));
    }

    // Sort by createdAt descending and take first 8
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return result.slice(0, 8);
  }, [trips, vehicles, typeFilter, statusFilter, regionFilter]);

  // Lookup helpers
  const vehicleMap = useMemo(
    () => new Map(vehicles.map((v) => [v.id, v])),
    [vehicles]
  );
  const driverMap = useMemo(
    () => new Map(drivers.map((d) => [d.id, d])),
    [drivers]
  );

  const getVehicleName = (id) => {
    const v = vehicleMap.get(id);
    return v ? `${v.registrationNumber}` : '—';
  };

  const getDriverName = (id) => {
    const d = driverMap.get(id);
    return d ? d.name : '—';
  };

  // KPI definitions
  const kpis = [
    {
      title: 'Active Vehicles',
      value: analytics.activeVehicles ?? 0,
      icon: Truck,
      color: '#714B67',
    },
    {
      title: 'Available',
      value: analytics.availableVehicles ?? 0,
      icon: CircleCheck,
      color: '#21B799',
    },
    {
      title: 'In Maintenance',
      value: analytics.inMaintenance ?? 0,
      icon: Wrench,
      color: '#E4A900',
    },
    {
      title: 'Active Trips',
      value: analytics.activeTrips ?? 0,
      icon: Route,
      color: '#5B899E',
    },
    {
      title: 'Pending Trips',
      value: analytics.pendingTrips ?? 0,
      icon: Clock,
      color: '#E4A900',
    },
    {
      title: 'Drivers On Duty',
      value: analytics.driversOnDuty ?? 0,
      icon: Users,
      color: '#017E84',
    },
    {
      title: 'Fleet Utilization',
      value: analytics.fleetUtilization ?? 0,
      suffix: '%',
      icon: BarChart3,
      color: '#714B67',
    },
  ];

  // Pie chart data
  const pieData = useMemo(() => {
    if (!analytics.vehicleStatusDist) return [];
    return Object.entries(analytics.vehicleStatusDist).map(([name, value]) => ({
      name,
      value,
    }));
  }, [analytics.vehicleStatusDist]);

  const formatEta = (eta) => {
    if (!eta) return '—';
    const date = new Date(eta);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Operations Dashboard" subtitle="Real-time fleet overview and trip monitoring" />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {kpis.map((kpi, index) => (
          <KpiCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            suffix={kpi.suffix}
            icon={kpi.icon}
            color={kpi.color}
            index={index}
          />
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] h-9 text-sm">
              <SelectValue placeholder="Vehicle Type" />
            </SelectTrigger>
            <SelectContent>
              {VEHICLE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === 'All' ? 'All Types' : type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {TRIP_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === 'All' ? 'All Statuses' : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region === 'All' ? 'All Regions' : region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Main Content: Trips Table + Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Trips Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Recent Trips</h3>
            <p className="text-sm text-gray-500 mt-0.5">Latest 8 trips from the fleet</p>
          </div>

          {filteredTrips.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Route}
                title="No trips found"
                description="No trips match the selected filters."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Trip ID
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Vehicle
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Driver
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      ETA
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrips.map((trip, idx) => (
                    <TableRow
                      key={trip.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <TableCell className="font-mono text-sm text-gray-700">
                        {trip.id}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {getVehicleName(trip.vehicleId)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {getDriverName(trip.driverId)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={trip.status} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatEta(trip.eta)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>

        {/* Vehicle Status Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Vehicle Distribution</h3>
            <p className="text-sm text-gray-500 mt-0.5">Status breakdown across fleet</p>
          </div>

          <div className="p-4 h-[320px]">
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <EmptyState
                  icon={BarChart3}
                  title="No data"
                  description="Vehicle distribution data is unavailable."
                />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name] || CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                      fontSize: '13px',
                    }}
                    formatter={(value, name) => [`${value} vehicles`, name]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-xs text-gray-600">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
