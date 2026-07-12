import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  Wrench,
  Plus,
  CheckCircle2,
  Info,
  ArrowRightLeft,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const SERVICE_TYPES = [
  'Oil Change',
  'Brake Service',
  'Tire Replacement',
  'Engine Overhaul',
  'General Service',
  'Transmission Repair',
];

export default function Maintenance() {
  const { vehicles, maintenance, addMaintenance, closeMaintenance } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      vehicleId: '',
      serviceType: '',
      cost: '',
      date: '',
      status: 'OPEN',
    },
  });

  const activeVehicles = vehicles.filter((v) => v.status !== 'RETIRED');

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle ? vehicle.name : vehicleId;
  };

  const sortedMaintenance = [...maintenance].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const onSubmit = (data) => {
    addMaintenance({
      vehicleId: data.vehicleId,
      serviceType: data.serviceType,
      cost: Number(data.cost),
      date: data.date,
      status: data.status,
    });
    reset();
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance" subtitle="Vehicle service management">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#714B67] hover:bg-[#5A3C52] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Maintenance
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Create Maintenance Record
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              {/* Vehicle Select */}
              <div className="space-y-2">
                <Label htmlFor="vehicleId">Vehicle</Label>
                <Select
                  onValueChange={(val) => setValue('vehicleId', val)}
                  value={watch('vehicleId')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeVehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} — {v.registrationNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service Type */}
              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type</Label>
                <Select
                  onValueChange={(val) => setValue('serviceType', val)}
                  value={watch('serviceType')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cost */}
              <div className="space-y-2">
                <Label htmlFor="cost">Cost (₹)</Label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="0"
                  {...register('cost', { required: 'Cost is required' })}
                />
                {errors.cost && (
                  <p className="text-sm text-[#E46E78]">{errors.cost.message}</p>
                )}
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  {...register('date', { required: 'Date is required' })}
                />
                {errors.date && (
                  <p className="text-sm text-[#E46E78]">{errors.date.message}</p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  onValueChange={(val) => setValue('status', val)}
                  value={watch('status')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#714B67] hover:bg-[#5A3C52] text-white"
              >
                Create Record
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Transition Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-start gap-3 rounded-lg border border-[#5B899E]/30 bg-[#5B899E]/5 p-4"
      >
        <ArrowRightLeft className="w-5 h-5 text-[#5B899E] mt-0.5 shrink-0" />
        <div className="text-sm text-gray-600">
          <p className="font-medium text-[#5B899E] mb-1">Vehicle Status Transitions</p>
          <p>
            When a maintenance record is <span className="font-semibold text-[#E4A900]">opened</span>,
            the vehicle status automatically changes to{' '}
            <span className="font-semibold">IN_SHOP</span>. When the record is{' '}
            <span className="font-semibold text-[#21B799]">closed</span>, the vehicle
            returns to <span className="font-semibold">AVAILABLE</span>.
          </p>
        </div>
      </motion.div>

      {/* Maintenance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border overflow-hidden"
      >
        {sortedMaintenance.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No maintenance records"
            description="Create your first maintenance record to start tracking vehicle services."
            action={
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-[#714B67] hover:bg-[#5A3C52] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Maintenance
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="font-semibold text-gray-700">ID</TableHead>
                <TableHead className="font-semibold text-gray-700">Vehicle</TableHead>
                <TableHead className="font-semibold text-gray-700">Service Type</TableHead>
                <TableHead className="font-semibold text-gray-700">Cost</TableHead>
                <TableHead className="font-semibold text-gray-700">Date</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMaintenance.map((record, index) => (
                <motion.tr
                  key={record.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b last:border-b-0 hover:bg-gray-50/50 transition-colors"
                >
                  <TableCell className="font-mono text-sm text-gray-500">
                    {record.id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {getVehicleName(record.vehicleId)}
                  </TableCell>
                  <TableCell>{record.serviceType}</TableCell>
                  <TableCell className="font-medium">
                    ₹{Number(record.cost).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {new Date(record.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={record.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {record.status === 'OPEN' ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => closeMaintenance(record.id)}
                              className="border-[#21B799] text-[#21B799] hover:bg-[#21B799]/10"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Close
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Closing returns the vehicle to AVAILABLE status</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="inline-flex items-center text-[#21B799]">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>
    </div>
  );
}
