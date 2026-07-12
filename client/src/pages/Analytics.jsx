import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useState as useStateAlias } from 'react'; // skip if already imported
import { Download, Loader2 } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { Button } from '../components/ui/button';
import {
  Fuel,
  Truck,
  IndianRupee,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useData } from '../contexts/DataContext';
import * as reportsApi from '../api/reports.js';
import PageHeader from '../components/shared/PageHeader';
import KpiCard from '../components/shared/KpiCard';

const STATUS_COLORS = {
  AVAILABLE: '#21B799',
  ON_TRIP: '#714B67',
  IN_SHOP: '#E4A900',
  RETIRED: '#9CA3AF',
};

const CustomTooltip = ({ active, payload, label, prefix = '₹' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-lg shadow-lg border px-4 py-3 text-sm">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color || entry.fill }} className="mt-1">
            {prefix}{Number(entry.value).toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { vehicles } = useData();

  const [fuelEfficiency, setFuelEfficiency] = useState([]);
  const [fleetUtilization, setFleetUtilization] = useState(null);
  const [operationalCost, setOperationalCost] = useState([]);
  const [vehicleRoi, setVehicleRoi] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('fuel-efficiency');
const [isExporting, setIsExporting] = useState(false);

const handleGenerateReport = async () => {
  setIsExporting(true);
  try {
    await reportsApi.downloadReportPdf(selectedReport);
  } catch (err) {
    console.error(err);
  } finally {
    setIsExporting(false);
  }
};

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [feRes, fuRes, ocRes, roiRes] = await Promise.all([
          reportsApi.getFuelEfficiencyReport(),
          reportsApi.getFleetUtilizationReport(),
          reportsApi.getOperationalCostReport(),
          reportsApi.getVehicleRoiReport(),
        ]);
        setFuelEfficiency(feRes.data.data);
        setFleetUtilization(fuRes.data.data);
        setOperationalCost(ocRes.data.data);
        setVehicleRoi(roiRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const avgFuelEfficiency = useMemo(() => {
    const totalDistance = fuelEfficiency.reduce((s, v) => s + (v.totalDistance || 0), 0);
    const totalLiters = fuelEfficiency.reduce((s, v) => s + (v.totalFuelLiters || 0), 0);
    return totalLiters > 0 ? Number((totalDistance / totalLiters).toFixed(1)) : 0;
  }, [fuelEfficiency]);

  const totalOperationalCost = useMemo(
    () => operationalCost.reduce((s, v) => s + (v.totalOperationalCost || 0), 0),
    [operationalCost]
  );

  const avgVehicleRoi = useMemo(() => {
    const withRoi = vehicleRoi.filter((v) => v.roi != null);
    if (withRoi.length === 0) return 0;
    const sum = withRoi.reduce((s, v) => s + v.roi, 0);
    return Number(((sum / withRoi.length) * 100).toFixed(1));
  }, [vehicleRoi]);

  const kpis = [
    {
      title: 'Fuel Efficiency',
      value: avgFuelEfficiency,
      suffix: 'km/L',
      icon: Fuel,
      color: '#017E84',
    },
    {
      title: 'Fleet Utilization',
      value: fleetUtilization?.fleetUtilizationPercent ?? 0,
      suffix: '%',
      icon: Truck,
      color: '#714B67',
    },
    {
      title: 'Operational Cost',
      value: Math.round(totalOperationalCost / 1000),
      suffix: 'K ₹',
      icon: IndianRupee,
      color: '#E4A900',
    },
    {
      title: 'Avg. Vehicle ROI',
      value: avgVehicleRoi,
      suffix: '%',
      icon: TrendingUp,
      color: '#21B799',
    },
  ];

  const fuelEfficiencyChartData = useMemo(
    () =>
      fuelEfficiency
        .filter((v) => v.fuelEfficiencyKmPerL != null)
        .map((v) => ({ name: v.registrationNo, value: v.fuelEfficiencyKmPerL })),
    [fuelEfficiency]
  );

  const topCostliestVehicles = useMemo(
    () =>
      [...operationalCost]
        .sort((a, b) => b.totalOperationalCost - a.totalOperationalCost)
        .slice(0, 5)
        .map((v) => ({ name: v.registrationNo, cost: v.totalOperationalCost })),
    [operationalCost]
  );

  const statusDistData = useMemo(() => {
    const counts = { AVAILABLE: 0, ON_TRIP: 0, IN_SHOP: 0, RETIRED: 0 };
    vehicles.forEach((v) => {
      if (counts[v.status] != null) counts[v.status] += 1;
    });
    return Object.entries(counts)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] || '#9CA3AF' }));
  }, [vehicles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#714B67] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Fleet performance insights" />
  <div className="flex items-center gap-2">
    <Select value={selectedReport} onValueChange={setSelectedReport}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select report" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="fuel-efficiency">Fuel Efficiency</SelectItem>
        <SelectItem value="fleet-utilization">Fleet Utilization</SelectItem>
        <SelectItem value="operational-cost">Operational Cost</SelectItem>
        <SelectItem value="vehicle-roi">Vehicle ROI</SelectItem>
      </SelectContent>
    </Select>
    <Button onClick={handleGenerateReport} disabled={isExporting}>
      {isExporting ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      Generate PDF
    </Button>
  </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <KpiCard key={kpi.title} {...kpi} index={index} />
        ))}
      </div>

      {/* Charts Row: Fuel Efficiency + Costliest Vehicles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel Efficiency by Vehicle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Fuel Efficiency</h3>
          <p className="text-sm text-gray-500 mb-4">Distance per liter, by vehicle</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fuelEfficiencyChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickFormatter={(v) => `${v} km/L`}
              />
              <Tooltip content={<CustomTooltip prefix="" />} />
              <Bar dataKey="value" fill="#017E84" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Costliest Vehicles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Top Costliest Vehicles</h3>
          <p className="text-sm text-gray-500 mb-4">Vehicles with highest operational costs</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={topCostliestVehicles}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cost" fill="#E46E78" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Vehicle Status Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm border p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Vehicle Status Distribution</h3>
        <p className="text-sm text-gray-500 mb-4">Current status breakdown of fleet vehicles</p>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusDistData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={110}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
              labelLine={{ stroke: '#9CA3AF' }}
            >
              {statusDistData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [value, name]}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
