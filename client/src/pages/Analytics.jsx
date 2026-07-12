import { motion } from 'framer-motion';
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
import PageHeader from '../components/shared/PageHeader';
import KpiCard from '../components/shared/KpiCard';
import { cn } from '@/lib/utils';

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
  const { analytics } = useData();

  const kpis = [
    {
      title: 'Fuel Efficiency',
      value: analytics.fuelEfficiency,
      suffix: 'km/L',
      icon: Fuel,
      color: '#017E84',
    },
    {
      title: 'Fleet Utilization',
      value: analytics.fleetUtilization,
      suffix: '%',
      icon: Truck,
      color: '#714B67',
    },
    {
      title: 'Operational Cost',
      value: Math.round((analytics.totalOperationalCost || 0) / 1000),
      suffix: 'K ₹',
      icon: IndianRupee,
      color: '#E4A900',
    },
    {
      title: 'Vehicle ROI',
      value: analytics.vehicleROI,
      suffix: '%',
      icon: TrendingUp,
      color: '#21B799',
    },
  ];

  const statusDistData = (analytics.vehicleStatusDist || []).map((item) => ({
    ...item,
    fill: STATUS_COLORS[item.name] || '#9CA3AF',
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Fleet performance insights" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <KpiCard key={kpi.title} {...kpi} index={index} />
        ))}
      </div>

      {/* Charts Row: Revenue + Costliest Vehicles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Monthly Revenue</h3>
          <p className="text-sm text-gray-500 mb-4">Revenue trend across months</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.monthlyRevenueData || []} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="#714B67" radius={[4, 4, 0, 0]} />
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
              data={analytics.vehicleCosts || []}
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
