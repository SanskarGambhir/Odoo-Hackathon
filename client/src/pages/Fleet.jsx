import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Ban,
  Truck,
  MapPin,
  Gauge,
  Weight,
  IndianRupee,
  Hash,
  AlertCircle,
} from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useData } from '../contexts/DataContext';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import ConfirmDialog from '../components/shared/ConfirmDialog';

const VEHICLE_TYPES = ['Truck', 'Bus', 'Van', 'Car'];
const VEHICLE_STATUSES = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];
const REGIONS = ['North', 'South', 'East', 'West', 'Central'];
const ALL_TYPES = ['All', ...VEHICLE_TYPES];
const ALL_STATUSES = ['All', ...VEHICLE_STATUSES];

const fmt = (num) =>
  num != null ? Number(num).toLocaleString('en-IN') : '—';

const fmtCurrency = (num) =>
  num != null ? `₹${Number(num).toLocaleString('en-IN')}` : '—';

const defaultFormValues = {
  registrationNo: '',
  name: '',
  type: '',
  maxLoadKg: '',
  odometer: '',
  acquisitionCost: '',
  region: '',
};

export default function Fleet() {
  const { vehicles, isLoading, addVehicle, updateVehicle, deleteVehicle } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [viewingVehicle, setViewingVehicle] = useState(null);
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({ defaultValues: defaultFormValues });

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    let result = [...vehicles];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.registrationNo?.toLowerCase().includes(q) ||
          v.name?.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== 'All') {
      result = result.filter((v) => v.type === typeFilter);
    }

    if (statusFilter !== 'All') {
      result = result.filter((v) => v.status === statusFilter);
    }

    return result;
  }, [vehicles, searchQuery, typeFilter, statusFilter]);

  // Open add dialog
  const handleAdd = () => {
    setEditingVehicle(null);
    setFormError('');
    reset(defaultFormValues);
    setFormDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormError('');
    reset({
      registrationNo: vehicle.registrationNo || '',
      name: vehicle.name || '',
      type: vehicle.type || '',
      maxLoadKg: vehicle.maxLoadKg ?? '',
      odometer: vehicle.odometer ?? '',
      acquisitionCost: vehicle.acquisitionCost ?? '',
      region: vehicle.region || '',
    });
    setFormDialogOpen(true);
  };

  // Open view dialog
  const handleView = (vehicle) => {
    setViewingVehicle(vehicle);
    setViewDialogOpen(true);
  };

  // Open retire (soft-delete) dialog
  const handleDeleteClick = (vehicle) => {
    setDeletingVehicle(vehicle);
    setDeleteDialogOpen(true);
  };

  // Confirm retire
  const handleConfirmDelete = async () => {
    if (deletingVehicle) {
      try {
        await deleteVehicle(deletingVehicle.id);
      } catch (err) {
        // surfaced silently on the list; vehicle status simply won't change
        console.error(err);
      }
    }
    setDeleteDialogOpen(false);
    setDeletingVehicle(null);
  };

  // Form submit
  const onSubmit = async (data) => {
    setFormError('');
    setIsSubmitting(true);
    const payload = {
      registrationNo: data.registrationNo,
      name: data.name,
      type: data.type,
      maxLoadKg: data.maxLoadKg ? Number(data.maxLoadKg) : 0,
      odometer: data.odometer ? Number(data.odometer) : 0,
      acquisitionCost: data.acquisitionCost ? Number(data.acquisitionCost) : 0,
      region: data.region || undefined,
    };

    try {
      if (editingVehicle) {
        // registrationNo is immutable once created on the backend
        const updatePayload = { ...payload };
        delete updatePayload.registrationNo;
        await updateVehicle(editingVehicle.id, updatePayload);
      } else {
        await addVehicle(payload);
      }
      setFormDialogOpen(false);
      setEditingVehicle(null);
      reset(defaultFormValues);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#714B67] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Fleet Registry" subtitle="Manage your vehicle inventory">
        <Button
          onClick={handleAdd}
          className="bg-[#714B67] hover:bg-[#5A3C52] text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
        </Button>
      </PageHeader>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by registration or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 text-sm bg-gray-50/50"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {ALL_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === 'All' ? 'All Types' : t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === 'All' ? 'All Statuses' : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Vehicles Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        {filteredVehicles.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={Truck}
              title="No vehicles found"
              description={
                searchQuery || typeFilter !== 'All' || statusFilter !== 'All'
                  ? 'No vehicles match the current filters. Try adjusting your search.'
                  : 'Get started by adding your first vehicle to the fleet.'
              }
              action={
                !searchQuery && typeFilter === 'All' && statusFilter === 'All' ? (
                  <Button
                    onClick={handleAdd}
                    className="bg-[#714B67] hover:bg-[#5A3C52] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Vehicle
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Reg. Number
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Max Load
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Odometer
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Acq. Cost
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow
                    key={vehicle.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <TableCell className="font-mono text-sm font-medium text-gray-900">
                      {vehicle.registrationNo}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {vehicle.name}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {vehicle.type}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {fmt(vehicle.maxLoadKg)} kg
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {fmt(vehicle.odometer)} km
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {fmtCurrency(vehicle.acquisitionCost)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={vehicle.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-[#5B899E] hover:bg-[#5B899E]/10"
                          onClick={() => handleView(vehicle)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-[#714B67] hover:bg-[#714B67]/10"
                          onClick={() => handleEdit(vehicle)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={vehicle.status === 'RETIRED'}
                          className="h-8 w-8 text-gray-500 hover:text-[#E46E78] hover:bg-[#E46E78]/10 disabled:opacity-30"
                          onClick={() => handleDeleteClick(vehicle)}
                          title="Retire vehicle"
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      {/* Add / Edit Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {editingVehicle
                ? 'Update the details for this vehicle.'
                : 'Enter the details for the new vehicle.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {formError && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {/* Registration Number */}
              <div className="space-y-1.5">
                <Label htmlFor="registrationNo" className="text-sm font-medium">
                  Registration Number *
                </Label>
                <Input
                  id="registrationNo"
                  placeholder="MH-01-AB-1234"
                  disabled={!!editingVehicle}
                  className={`h-9 text-sm ${errors.registrationNo ? 'border-red-400' : ''}`}
                  {...register('registrationNo', {
                    required: 'Registration number is required',
                  })}
                />
                {errors.registrationNo && (
                  <p className="text-xs text-red-500">{errors.registrationNo.message}</p>
                )}
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium">
                  Vehicle Name *
                </Label>
                <Input
                  id="name"
                  placeholder="Fleet Runner 01"
                  className={`h-9 text-sm ${errors.name ? 'border-red-400' : ''}`}
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Type *</Label>
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: 'Vehicle type is required' }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={`h-9 text-sm ${errors.type ? 'border-red-400' : ''}`}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <p className="text-xs text-red-500">{errors.type.message}</p>
                )}
              </div>

              {/* Max Load Kg */}
              <div className="space-y-1.5">
                <Label htmlFor="maxLoadKg" className="text-sm font-medium">
                  Max Load (kg) *
                </Label>
                <Input
                  id="maxLoadKg"
                  type="number"
                  placeholder="5000"
                  className={`h-9 text-sm ${errors.maxLoadKg ? 'border-red-400' : ''}`}
                  {...register('maxLoadKg', {
                    required: 'Max load is required',
                    min: { value: 0, message: 'Must be positive' },
                  })}
                />
                {errors.maxLoadKg && (
                  <p className="text-xs text-red-500">{errors.maxLoadKg.message}</p>
                )}
              </div>

              {/* Odometer */}
              <div className="space-y-1.5">
                <Label htmlFor="odometer" className="text-sm font-medium">
                  Odometer (km)
                </Label>
                <Input
                  id="odometer"
                  type="number"
                  placeholder="0"
                  className="h-9 text-sm"
                  {...register('odometer', { min: { value: 0, message: 'Must be positive' } })}
                />
              </div>

              {/* Acquisition Cost */}
              <div className="space-y-1.5">
                <Label htmlFor="acquisitionCost" className="text-sm font-medium">
                  Acquisition Cost (₹) *
                </Label>
                <Input
                  id="acquisitionCost"
                  type="number"
                  placeholder="1500000"
                  className={`h-9 text-sm ${errors.acquisitionCost ? 'border-red-400' : ''}`}
                  {...register('acquisitionCost', {
                    required: 'Acquisition cost is required',
                    min: { value: 0, message: 'Must be positive' },
                  })}
                />
                {errors.acquisitionCost && (
                  <p className="text-xs text-red-500">{errors.acquisitionCost.message}</p>
                )}
              </div>

              {/* Region */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Region</Label>
                <Controller
                  name="region"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormDialogOpen(false)}
                className="gap-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#714B67] hover:bg-[#5A3C52] text-white gap-2"
              >
                {isSubmitting ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#714B67]" />
              Vehicle Details
            </DialogTitle>
          </DialogHeader>

          {viewingVehicle && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <DetailItem
                icon={<Hash className="w-4 h-4" />}
                label="Reg. Number"
                value={viewingVehicle.registrationNo}
              />
              <DetailItem
                icon={<Truck className="w-4 h-4" />}
                label="Name"
                value={viewingVehicle.name}
              />
              <DetailItem
                icon={<Truck className="w-4 h-4" />}
                label="Type"
                value={viewingVehicle.type}
              />
              <DetailItem
                icon={<Weight className="w-4 h-4" />}
                label="Max Load"
                value={`${fmt(viewingVehicle.maxLoadKg)} kg`}
              />
              <DetailItem
                icon={<Gauge className="w-4 h-4" />}
                label="Odometer"
                value={`${fmt(viewingVehicle.odometer)} km`}
              />
              <DetailItem
                icon={<IndianRupee className="w-4 h-4" />}
                label="Acq. Cost"
                value={fmtCurrency(viewingVehicle.acquisitionCost)}
              />
              <DetailItem
                icon={<MapPin className="w-4 h-4" />}
                label="Region"
                value={viewingVehicle.region || '—'}
              />
              <div className="col-span-2">
                <span className="text-xs text-gray-500 block mb-1">Status</span>
                <StatusBadge status={viewingVehicle.status} />
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              className="bg-[#714B67] hover:bg-[#5A3C52] text-white gap-2"
              onClick={() => {
                setViewDialogOpen(false);
                if (viewingVehicle) handleEdit(viewingVehicle);
              }}
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retire Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Retire Vehicle"
        description={`Are you sure you want to retire "${deletingVehicle?.registrationNo || ''}"? Retired vehicles are hidden from dispatch selection.`}
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </div>
  );
}

// Helper component for view dialog detail items
function DetailItem({ icon, label, value }) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-gray-500 flex items-center gap-1.5">
        {icon && <span className="text-gray-400">{icon}</span>}
        {label}
      </span>
      <p className="text-sm font-medium text-gray-900">{value ?? '—'}</p>
    </div>
  );
}
