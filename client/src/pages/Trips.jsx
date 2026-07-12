import { useState, useMemo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MapPin,
  Truck,
  User,
  Weight,
  Route as RouteIcon,
  Send,
  CheckCircle2,
  XCircle,
  Package,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useData } from '../contexts/DataContext';
import * as tripsApi from '../api/trips.js';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';

const CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Chennai',
  'Kolkata',
  'Hyderabad',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Surat',
  'Nagpur',
  'Indore',
  'Bhopal',
  'Chandigarh',
];

const TAB_CONFIG = [
  { value: 'DISPATCHED', label: 'Active', icon: Send },
  { value: 'DRAFT', label: 'Draft', icon: Package },
  { value: 'COMPLETED', label: 'Completed', icon: CheckCircle2 },
  { value: 'CANCELLED', label: 'Cancelled', icon: XCircle },
];

const EMPTY_MESSAGES = {
  DISPATCHED: {
    title: 'No active trips',
    description: 'Dispatched trips will appear here.',
  },
  DRAFT: {
    title: 'No draft trips',
    description: 'Create a new trip to get started.',
  },
  COMPLETED: {
    title: 'No completed trips',
    description: 'Completed trips will appear here.',
  },
  CANCELLED: {
    title: 'No cancelled trips',
    description: 'Cancelled trips will appear here.',
  },
};

export default function Trips() {
  const {
    vehicles,
    drivers,
    trips,
    isLoading,
    addTrip,
    dispatchTrip,
    completeTrip,
    cancelTrip,
  } = useData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('DISPATCHED');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completingTrip, setCompletingTrip] = useState(null);
  const [actionError, setActionError] = useState('');

  const form = useForm({
    defaultValues: {
      source: '',
      destination: '',
      vehicleId: '',
      driverId: '',
      cargoWeightKg: '',
      plannedDistance: '',
    },
    mode: 'onChange',
  });

  const completeForm = useForm({
    defaultValues: { endOdometer: '', fuelConsumedL: '', revenue: '' },
  });

  const watchSource = form.watch('source');
  const watchVehicleId = form.watch('vehicleId');
  const watchCargo = form.watch('cargoWeightKg');

  const selectedVehicle = useMemo(
    () => availableVehicles.find((v) => v.id === watchVehicleId),
    [availableVehicles, watchVehicleId]
  );

  const cargoExceedsCapacity = useMemo(() => {
    if (!selectedVehicle || !watchCargo) return false;
    return Number(watchCargo) > selectedVehicle.maxLoadKg;
  }, [selectedVehicle, watchCargo]);

  const tripsByStatus = useMemo(() => {
    const grouped = { DISPATCHED: [], DRAFT: [], COMPLETED: [], CANCELLED: [] };
    trips.forEach((t) => {
      if (grouped[t.status]) grouped[t.status].push(t);
    });
    return grouped;
  }, [trips]);

  function getVehicleName(vehicleId) {
    const v = vehicles.find((v) => v.id === vehicleId);
    return v ? `${v.name} (${v.registrationNo})` : 'Unassigned';
  }

  function getDriverName(driverId) {
    const d = drivers.find((d) => d.id === driverId);
    return d ? d.name : 'Unassigned';
  }

  const openCreateDialog = useCallback(async () => {
    setFormError('');
    form.reset({
      source: '',
      destination: '',
      vehicleId: '',
      driverId: '',
      cargoWeightKg: '',
      plannedDistance: '',
    });
    setDialogOpen(true);
    try {
      const [vehiclesRes, driversRes] = await Promise.all([
        tripsApi.getAvailableVehicles(),
        tripsApi.getAvailableDrivers(),
      ]);
      setAvailableVehicles(vehiclesRes.data.data);
      setAvailableDrivers(driversRes.data.data);
    } catch {
      setFormError('Failed to load available vehicles/drivers.');
    }
  }, [form]);

  async function onSubmit(data) {
    setFormError('');
    setIsSubmitting(true);
    try {
      await addTrip({
        source: data.source,
        destination: data.destination,
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        cargoWeightKg: Number(data.cargoWeightKg),
        plannedDistance: Number(data.plannedDistance),
      });
      setDialogOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create trip.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDispatch(tripId) {
    setActionError('');
    try {
      await dispatchTrip(tripId);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to dispatch trip.');
    }
  }

  async function handleCancel(tripId) {
    setActionError('');
    try {
      await cancelTrip(tripId);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to cancel trip.');
    }
  }

  function openCompleteDialog(trip) {
    setCompletingTrip(trip);
    completeForm.reset({ endOdometer: '', fuelConsumedL: '', revenue: '' });
    setActionError('');
    setCompleteDialogOpen(true);
  }

  async function onCompleteSubmit(data) {
    setActionError('');
    try {
      await completeTrip(completingTrip.id, {
        endOdometer: Number(data.endOdometer),
        fuelConsumedL: data.fuelConsumedL ? Number(data.fuelConsumedL) : undefined,
        revenue: data.revenue ? Number(data.revenue) : undefined,
      });
      setCompleteDialogOpen(false);
      setCompletingTrip(null);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to complete trip.');
    }
  }

  const isFormValid = form.formState.isValid && !cargoExceedsCapacity;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-border border-t-[#714B67] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Trip Dispatch" subtitle="Manage and dispatch fleet trips">
        <Button
          onClick={openCreateDialog}
          className="bg-[#714B67] hover:bg-[#5A3C52] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Trip
        </Button>
      </PageHeader>

      {actionError && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {actionError}
        </div>
      )}

      {/* Dispatch Board Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/80/80 p-1 rounded-lg w-full grid grid-cols-4">
          {TAB_CONFIG.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="data-[state=active]:bg-card data-[state=active]:text-[#714B67] data-[state=active]:shadow-sm rounded-md text-sm font-medium transition-all"
            >
              <Icon className="w-4 h-4 mr-1.5" />
              {label}
              <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-muted-foreground/20/80 text-muted-foreground min-w-[20px]">
                {tripsByStatus[value].length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_CONFIG.map(({ value }) => (
          <TabsContent key={value} value={value} className="mt-4">
            {tripsByStatus[value].length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <EmptyState
                  icon={Package}
                  title={EMPTY_MESSAGES[value].title}
                  description={EMPTY_MESSAGES[value].description}
                  action={
                    value === 'DRAFT' ? (
                      <Button
                        onClick={openCreateDialog}
                        variant="outline"
                        className="border-[#714B67] text-[#714B67] hover:bg-[#714B67]/5"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Trip
                      </Button>
                    ) : null
                  }
                />
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {tripsByStatus[value].map((trip, idx) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      index={idx}
                      getVehicleName={getVehicleName}
                      getDriverName={getDriverName}
                      onDispatch={handleDispatch}
                      onComplete={openCompleteDialog}
                      onCancel={handleCancel}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Create Trip Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              Create New Trip
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {formError && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Source */}
              <div className="space-y-1.5">
                <Label>
                  Source <span className="text-[#E46E78]">*</span>
                </Label>
                <Controller
                  control={form.control}
                  name="source"
                  rules={{ required: 'Source is required' }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source city" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.source && (
                  <p className="text-xs text-[#E46E78]">{form.formState.errors.source.message}</p>
                )}
              </div>

              {/* Destination */}
              <div className="space-y-1.5">
                <Label>
                  Destination <span className="text-[#E46E78]">*</span>
                </Label>
                <Controller
                  control={form.control}
                  name="destination"
                  rules={{
                    required: 'Destination is required',
                    validate: (val) =>
                      val !== watchSource || 'Destination must differ from source',
                  }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination city" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.filter((c) => c !== watchSource).map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.destination && (
                  <p className="text-xs text-[#E46E78]">{form.formState.errors.destination.message}</p>
                )}
              </div>

              {/* Vehicle */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label>
                  Vehicle <span className="text-[#E46E78]">*</span>
                </Label>
                <Controller
                  control={form.control}
                  name="vehicleId"
                  rules={{ required: 'Vehicle is required' }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an available vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVehicles.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground/60">
                            No available vehicles
                          </div>
                        ) : (
                          availableVehicles.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.name} ({v.registrationNo}) - Max: {v.maxLoadKg}kg
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.vehicleId && (
                  <p className="text-xs text-[#E46E78]">{form.formState.errors.vehicleId.message}</p>
                )}
              </div>

              {/* Driver */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label>
                  Driver <span className="text-[#E46E78]">*</span>
                </Label>
                <Controller
                  control={form.control}
                  name="driverId"
                  rules={{ required: 'Driver is required' }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an available driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDrivers.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground/60">
                            No available drivers with valid license
                          </div>
                        ) : (
                          availableDrivers.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name} ({d.licenseCategory})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.driverId && (
                  <p className="text-xs text-[#E46E78]">{form.formState.errors.driverId.message}</p>
                )}
              </div>

              {/* Cargo Weight */}
              <div className="space-y-1.5">
                <Label htmlFor="cargoWeightKg">
                  Cargo Weight (kg) <span className="text-[#E46E78]">*</span>
                </Label>
                <Input
                  id="cargoWeightKg"
                  type="number"
                  min={1}
                  placeholder="e.g. 5000"
                  {...form.register('cargoWeightKg', {
                    required: 'Cargo weight is required',
                    min: { value: 1, message: 'Must be greater than 0' },
                  })}
                />
                {form.formState.errors.cargoWeightKg && (
                  <p className="text-xs text-[#E46E78]">
                    {form.formState.errors.cargoWeightKg.message}
                  </p>
                )}
                {cargoExceedsCapacity && (
                  <p className="text-xs text-[#E46E78] font-semibold flex items-center gap-1 bg-[#E46E78]/10 px-2 py-1.5 rounded-md mt-1">
                    <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Cargo weight ({watchCargo}kg) exceeds vehicle capacity ({selectedVehicle?.maxLoadKg}kg)
                  </p>
                )}
              </div>

              {/* Planned Distance */}
              <div className="space-y-1.5">
                <Label htmlFor="plannedDistance">
                  Planned Distance (km) <span className="text-[#E46E78]">*</span>
                </Label>
                <Input
                  id="plannedDistance"
                  type="number"
                  min={1}
                  placeholder="e.g. 1200"
                  {...form.register('plannedDistance', {
                    required: 'Planned distance is required',
                    min: { value: 1, message: 'Must be greater than 0' },
                  })}
                />
                {form.formState.errors.plannedDistance && (
                  <p className="text-xs text-[#E46E78]">
                    {form.formState.errors.plannedDistance.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="bg-[#714B67] hover:bg-[#5A3C52] text-white disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Trip'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complete Trip Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              Complete Trip
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={completeForm.handleSubmit(onCompleteSubmit)} className="space-y-4 mt-2">
            {actionError && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {actionError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="endOdometer">
                Final Odometer (km) <span className="text-[#E46E78]">*</span>
              </Label>
              <Input
                id="endOdometer"
                type="number"
                {...completeForm.register('endOdometer', { required: 'Final odometer is required' })}
              />
              {completeForm.formState.errors.endOdometer && (
                <p className="text-xs text-[#E46E78]">{completeForm.formState.errors.endOdometer.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fuelConsumedL">Fuel Consumed (L)</Label>
              <Input id="fuelConsumedL" type="number" {...completeForm.register('fuelConsumedL')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="revenue">Revenue (₹)</Label>
              <Input id="revenue" type="number" {...completeForm.register('revenue')} />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCompleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#21B799] hover:bg-[#1a9a80] text-white">
                Mark Completed
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Trip Card Component ─── */
function TripCard({
  trip,
  index,
  getVehicleName,
  getDriverName,
  onDispatch,
  onComplete,
  onCancel,
}) {
  const canDispatch = trip.vehicleId && trip.driverId;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-foreground text-sm">
          Trip #{trip.id.slice(0, 8)}
        </h3>
        <StatusBadge status={trip.status} />
      </div>

      <div className="space-y-2.5 text-sm">
        {/* Route */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4 text-[#714B67] flex-shrink-0" />
          <span>
            {trip.source}{' '}
            <span className="text-[#714B67] font-semibold mx-1">→</span>{' '}
            {trip.destination}
          </span>
        </div>

        {/* Vehicle */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Truck className="w-4 h-4 text-[#5B899E] flex-shrink-0" />
          <span>{getVehicleName(trip.vehicleId)}</span>
        </div>

        {/* Driver */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="w-4 h-4 text-[#5B899E] flex-shrink-0" />
          <span>{getDriverName(trip.driverId)}</span>
        </div>

        {/* Cargo */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Weight className="w-4 h-4 text-[#5B899E] flex-shrink-0" />
          <span>{trip.cargoWeightKg} kg</span>
        </div>

        {/* Planned Distance */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <RouteIcon className="w-4 h-4 text-[#5B899E] flex-shrink-0" />
          <span>{trip.plannedDistance} km planned</span>
        </div>
      </div>

      {/* Action Buttons */}
      {(trip.status === 'DRAFT' || trip.status === 'DISPATCHED') && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
          {trip.status === 'DRAFT' && (
            <>
              <Button
                size="sm"
                disabled={!canDispatch}
                onClick={() => onDispatch(trip.id)}
                className="flex-1 bg-[#21B799] hover:bg-[#1a9a80] text-white disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Dispatch
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCancel(trip.id)}
                className="flex-1 border-[#E46E78] text-[#E46E78] hover:bg-[#E46E78]/5"
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                Cancel
              </Button>
            </>
          )}
          {trip.status === 'DISPATCHED' && (
            <>
              <Button
                size="sm"
                onClick={() => onComplete(trip)}
                className="flex-1 bg-[#21B799] hover:bg-[#1a9a80] text-white"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCancel(trip.id)}
                className="flex-1 border-[#E46E78] text-[#E46E78] hover:bg-[#E46E78]/5"
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                Cancel
              </Button>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}
