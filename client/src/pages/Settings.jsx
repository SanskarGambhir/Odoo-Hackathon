import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
  Minus,
  Shield,
  Building2,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import PageHeader from '../components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { cn } from '@/lib/utils';

const RBAC_MATRIX = [
  {
    role: 'Fleet Manager',
    fleet: true,
    drivers: false,
    trips: false,
    fuelExpenses: false,
    analytics: true,
  },
  {
    role: 'Dispatcher',
    fleet: false,
    drivers: false,
    trips: true,
    fuelExpenses: false,
    analytics: false,
  },
  {
    role: 'Safety Officer',
    fleet: false,
    drivers: true,
    trips: false,
    fuelExpenses: false,
    analytics: false,
  },
  {
    role: 'Financial Analyst',
    fleet: false,
    drivers: false,
    trips: false,
    fuelExpenses: true,
    analytics: true,
  },
];

const PermissionIcon = ({ allowed }) =>
  allowed ? (
    <CheckCircle2 className="w-5 h-5 text-[#21B799] mx-auto" />
  ) : (
    <Minus className="w-5 h-5 text-gray-300 mx-auto" />
  );

export default function Settings() {
  const { settings, updateSettings } = useData();
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      depotName: settings.depotName || '',
      currency: settings.currency || 'INR',
      distanceUnit: settings.distanceUnit || 'km',
    },
  });

  const onSubmit = (data) => {
    updateSettings(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Platform configuration" />

      {/* General Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl shadow-sm border overflow-hidden"
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/50">
          <div className="w-9 h-9 rounded-lg bg-[#714B67]/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#714B67]" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">General Settings</h3>
            <p className="text-sm text-muted-foreground/80">Configure your depot and preferences</p>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Depot Name */}
            <div className="space-y-2">
              <Label htmlFor="depotName">Depot Name</Label>
              <Input
                id="depotName"
                placeholder="Enter depot name"
                {...register('depotName')}
              />
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                onValueChange={(val) => setValue('currency', val)}
                value={watch('currency')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Distance Unit */}
            <div className="space-y-2">
              <Label>Distance Unit</Label>
              <Select
                onValueChange={(val) => setValue('distanceUnit', val)}
                value={watch('distanceUnit')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="km">Kilometers (km)</SelectItem>
                  <SelectItem value="miles">Miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" className="bg-[#714B67] hover:bg-[#5A3C52] text-white">
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
            {saved && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-[#21B799] text-sm font-medium"
              >
                <CheckCircle2 className="w-4 h-4" />
                Settings saved successfully
              </motion.div>
            )}
          </div>
        </form>
      </motion.div>

      {/* RBAC Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card rounded-xl shadow-sm border overflow-hidden"
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/50">
          <div className="w-9 h-9 rounded-lg bg-[#5B899E]/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#5B899E]" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Role-Based Access Control</h3>
            <p className="text-sm text-muted-foreground/80">Permission matrix for system roles</p>
          </div>
        </div>
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/80">
                <TableHead className="font-semibold text-muted-foreground w-[180px]">Role</TableHead>
                <TableHead className="font-semibold text-muted-foreground text-center">Fleet</TableHead>
                <TableHead className="font-semibold text-muted-foreground text-center">Drivers</TableHead>
                <TableHead className="font-semibold text-muted-foreground text-center">Trips</TableHead>
                <TableHead className="font-semibold text-muted-foreground text-center">
                  Fuel & Expenses
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground text-center">Analytics</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RBAC_MATRIX.map((row, index) => (
                <motion.tr
                  key={row.role}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium text-foreground">{row.role}</TableCell>
                  <TableCell className="text-center">
                    <PermissionIcon allowed={row.fleet} />
                  </TableCell>
                  <TableCell className="text-center">
                    <PermissionIcon allowed={row.drivers} />
                  </TableCell>
                  <TableCell className="text-center">
                    <PermissionIcon allowed={row.trips} />
                  </TableCell>
                  <TableCell className="text-center">
                    <PermissionIcon allowed={row.fuelExpenses} />
                  </TableCell>
                  <TableCell className="text-center">
                    <PermissionIcon allowed={row.analytics} />
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </div>
  );
}
