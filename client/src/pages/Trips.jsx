import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MapPin,
  Truck,
  User,
  Weight,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  Package,
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
    addTrip,
    dispatchTrip,
    completeTrip,
    cancelTrip,
  } = useData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('DISPATCHED');

  const form = useForm({
    defaultValues: {
      source: '',
      destination: '',
      vehicleId: '',
      driverId: '',
      cargoWeightKg: '',
      plannedDistanceKm: '',
    },
    mode: 'onChange',
  });

  const watchSource = form.watch('source');
  const watchVehicleId = form.watch('vehicleId');
  const watchCargo = form.watch('cargoWeightKg');

  const availableVehicles = useMemo(
    () => vehicles.filter((v) => v.status === 'AVAILABLE'),
    [vehicles]
  );

  const availableDrivers = useMemo(
    () =>
      drivers.filter(
        (d) =>
          d.status === 'AVAILABLE' && new Date(d.licenseExpiry) > new Date()
      ),
    [drivers]
  );

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === watchVehicleId),
    [vehicles, watchVehicleId]
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
    return v ? v.name : 'Unassigned';
  }

  function getDriverName(driverId) {
    const d = drivers.find((d) => d.id === driverId);
    return d ? d.name : 'Unassigned';
  }

  function formatEta(eta) {
    if (!eta) return '-';
    return new Date(eta).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function openCreateDialog() {
    form.reset({
      source: '',
      destination: '',
      vehicleId: '',
      driverId: '',
      cargoWeightKg: '',
      plannedDistanceKm: '',
    });
    setDialogOpen(true);
  }

  function onSubmit(data) {
    addTrip({
      source: data.source,
      destination: data.destination,
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      cargoWeightKg: Number(data.cargoWeightKg),
      plannedDistanceKm: Number(data.plannedDistanceKm),
    });
    setDialogOpen(false);
  }

  const isFormValid =
    form.formState.isValid && !cargoExceedsCapacity;

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

      {/* Dispatch Board Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gray-100/80 p-1 rounded-lg w-full grid grid-cols-4">
          {TAB_CONFIG.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="data-[state=active]:bg-white data-[state=active]:text-[#714B67] data-[state=active]:shadow-sm rounded-md text-sm font-medium transition-all"
            >
              <Icon className="w-4 h-4 mr-1.5" />
              {label}
              <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-200/80 text-gray-600 min-w-[20px]">
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
                      formatEta={formatEta}
                      dispatchTrip={dispatchTrip}
                      completeTrip={completeTrip}
                      cancelTrip={cancelTrip}
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
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Create New Trip
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
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
                          <div className="px-3 py-2 text-sm text-gray-400">
                            No available vehicles
                          </div>
                        ) : (
                          availableVehicles.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.name} ({v.registrationNumber}) - Max: {v.maxLoadKg}kg
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
                          <div className="px-3 py-2 text-sm text-gray-400">
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
                <Label htmlFor="plannedDistanceKm">
                  Planned Distance (km) <span className="text-[#E46E78]">*</span>
                </Label>
                <Input
                  id="plannedDistanceKm"
                  type="number"
                  min={1}
                  placeholder="e.g. 1200"
                  {...form.register('plannedDistanceKm', {
                    required: 'Planned distance is required',
                    min: { value: 1, message: 'Must be greater than 0' },
                  })}
                />
                {form.formState.errors.plannedDistanceKm && (
                  <p className="text-xs text-[#E46E78]">
                    {form.formState.errors.plannedDistanceKm.message}
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
                disabled={!isFormValid}
                className="bg-[#714B67] hover:bg-[#5A3C52] text-white disabled:opacity-50"
              >
                Create Trip
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
  formatEta,
  dispatchTrip,
  completeTrip,
  cancelTrip,
}) {
  const canDispatch = trip.vehicleId && trip.driverId;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-gray-900 text-sm">
          Trip #{trip.id}
        </h3>
        <StatusBadge status={trip.status} />
      </div>

      <div className="space-y-2.5 text-sm">
        {/* Route */}
        <div className="flex items-center gap-2 text-gray-700">
          <MapPin className="w-4 h-4 text-[#714B67] flex-shrink-0" />
          <span>
            {trip.source}{' '}
            <span className="text-[#714B67] font-semibold mx-1">→</span>{' '}
            {trip.destination}
          </span>
        </div>

        {/* Vehicle */}
        <div className="flex items-center gap-2 text-gray-600">
          <Truck className="w-4 h-4 text-[#5B899E] flex-shrink-0" />
          <span>{getVehicleName(trip.vehicleId)}</span>
        </div>

        {/* Driver */}
        <div className="flex items-center gap-2 text-gray-600">
          <User className="w-4 h-4 text-[#5B899E] flex-shrink-0" />
          <span>{getDriverName(trip.driverId)}</span>
        </div>

        {/* Cargo */}
        <div className="flex items-center gap-2 text-gray-600">
          <Weight className="w-4 h-4 text-[#5B899E] flex-shrink-0" />
          <span>{trip.cargoWeightKg} kg</span>
        </div>

        {/* ETA */}
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4 text-[#5B899E] flex-shrink-0" />
          <span>ETA: {formatEta(trip.eta)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      {(trip.status === 'DRAFT' || trip.status === 'DISPATCHED') && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
          {trip.status === 'DRAFT' && (
            <>
              <Button
                size="sm"
                disabled={!canDispatch}
                onClick={() => dispatchTrip(trip.id)}
                className="flex-1 bg-[#21B799] hover:bg-[#1a9a80] text-white disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Dispatch
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => cancelTrip(trip.id)}
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
                onClick={() => completeTrip(trip.id)}
                className="flex-1 bg-[#21B799] hover:bg-[#1a9a80] text-white"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => cancelTrip(trip.id)}
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
