import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  Fuel,
  Plus,
  Receipt,
  Wrench,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import PageHeader from '../components/shared/PageHeader';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const EXPENSE_TYPES = ['TOLL', 'PARKING', 'FINE', 'MAINTENANCE', 'OTHER'];

export default function FuelExpenses() {
  const {
    vehicles,
    trips,
    maintenance,
    fuelLogs,
    expenses,
    isLoading,
    addFuelLog,
    addExpense,
  } = useData();

  const [fuelDialogOpen, setFuelDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [fuelError, setFuelError] = useState('');
  const [expenseError, setExpenseError] = useState('');

  // Fuel Log Form
  const fuelForm = useForm({
    defaultValues: { vehicleId: '', loggedAt: '', liters: '', cost: '' },
  });

  // Expense Form
  const expenseForm = useForm({
    defaultValues: { tripId: '', vehicleId: '', type: '', amount: '' },
  });

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle ? vehicle.name : vehicleId;
  };

  const getTrip = (tripId) => {
    return trips.find((t) => t.id === tripId);
  };

  const getTripLabel = (tripId) => {
    const trip = getTrip(tripId);
    return trip ? `${trip.source} → ${trip.destination}` : (tripId || '—');
  };

  const costs = useMemo(() => {
    const totalFuelCost = fuelLogs.reduce((sum, fl) => sum + Number(fl.cost), 0);
    const totalMaintenanceCost = maintenance.reduce((sum, m) => sum + Number(m.cost), 0);
    const totalExpenseCost = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    return {
      totalFuelCost,
      totalMaintenanceCost,
      totalExpenseCost,
      totalOperationalCost: totalFuelCost + totalMaintenanceCost + totalExpenseCost,
    };
  }, [fuelLogs, maintenance, expenses]);

  const onFuelSubmit = async (data) => {
    setFuelError('');
    try {
      await addFuelLog({
        vehicleId: data.vehicleId,
        liters: Number(data.liters),
        cost: Number(data.cost),
        ...(data.loggedAt && { loggedAt: data.loggedAt }),
      });
      fuelForm.reset();
      setFuelDialogOpen(false);
    } catch (err) {
      setFuelError(err.response?.data?.message || 'Failed to add fuel log.');
    }
  };

  const onExpenseSubmit = async (data) => {
    setExpenseError('');
    try {
      await addExpense({
        ...(data.tripId && { tripId: data.tripId }),
        vehicleId: data.vehicleId,
        type: data.type,
        amount: Number(data.amount),
      });
      expenseForm.reset();
      setExpenseDialogOpen(false);
    } catch (err) {
      setExpenseError(err.response?.data?.message || 'Failed to add expense.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-border border-t-[#714B67] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Fuel & Expenses" subtitle="Track operational costs" />

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#714B67] to-[#5A3C52] text-white p-6 rounded-xl shadow-lg"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-card/15 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-white/70 text-sm">Total Operational Cost</p>
            <p className="text-3xl font-bold">
              ₹{Number(costs.totalOperationalCost || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Fuel className="w-4 h-4 text-white/70" />
              <p className="text-white/70 text-xs uppercase tracking-wider">Fuel Cost</p>
            </div>
            <p className="text-xl font-semibold">
              ₹{Number(costs.totalFuelCost || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="w-4 h-4 text-white/70" />
              <p className="text-white/70 text-xs uppercase tracking-wider">Maintenance Cost</p>
            </div>
            <p className="text-xl font-semibold">
              ₹{Number(costs.totalMaintenanceCost || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="w-4 h-4 text-white/70" />
              <p className="text-white/70 text-xs uppercase tracking-wider">Other Expenses</p>
            </div>
            <p className="text-xl font-semibold">
              ₹{Number(costs.totalExpenseCost || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Tabs defaultValue="fuel" className="space-y-4">
          <TabsList className="bg-muted/80">
            <TabsTrigger value="fuel" className="data-[state=active]:bg-card data-[state=active]:text-[#714B67]">
              <Fuel className="w-4 h-4 mr-2" />
              Fuel Logs
            </TabsTrigger>
            <TabsTrigger value="expenses" className="data-[state=active]:bg-card data-[state=active]:text-[#714B67]">
              <Receipt className="w-4 h-4 mr-2" />
              Expenses
            </TabsTrigger>
          </TabsList>

          {/* ─── Fuel Logs Tab ─── */}
          <TabsContent value="fuel" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={fuelDialogOpen} onOpenChange={setFuelDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#714B67] hover:bg-[#5A3C52] text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Fuel Log
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[440px]">
                  <DialogHeader>
                    <DialogTitle>Add Fuel Log</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={fuelForm.handleSubmit(onFuelSubmit)} className="space-y-4 mt-2">
                    {fuelError && (
                      <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {fuelError}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Vehicle</Label>
                      <Select
                        onValueChange={(val) => fuelForm.setValue('vehicleId', val)}
                        value={fuelForm.watch('vehicleId')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicles.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" {...fuelForm.register('loggedAt')} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Liters</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          {...fuelForm.register('liters', { required: true })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cost (₹)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          {...fuelForm.register('cost', { required: true })}
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-[#714B67] hover:bg-[#5A3C52] text-white">
                      Add Fuel Log
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
              {fuelLogs.length === 0 ? (
                <EmptyState
                  icon={Fuel}
                  title="No fuel logs"
                  description="Start tracking fuel consumption by adding your first fuel log."
                  action={
                    <Button
                      onClick={() => setFuelDialogOpen(true)}
                      className="bg-[#714B67] hover:bg-[#5A3C52] text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Fuel Log
                    </Button>
                  }
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/80">
                      <TableHead className="font-semibold text-muted-foreground">Vehicle</TableHead>
                      <TableHead className="font-semibold text-muted-foreground">Date</TableHead>
                      <TableHead className="font-semibold text-muted-foreground">Liters</TableHead>
                      <TableHead className="font-semibold text-muted-foreground">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fuelLogs.map((log, index) => (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {getVehicleName(log.vehicleId)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(log.loggedAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell>{log.liters} L</TableCell>
                        <TableCell className="font-medium">
                          ₹{Number(log.cost).toLocaleString('en-IN')}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* ─── Expenses Tab ─── */}
          <TabsContent value="expenses" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#714B67] hover:bg-[#5A3C52] text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[440px]">
                  <DialogHeader>
                    <DialogTitle>Add Expense</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={expenseForm.handleSubmit(onExpenseSubmit)} className="space-y-4 mt-2">
                    {expenseError && (
                      <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {expenseError}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Trip</Label>
                      <Select
                        onValueChange={(val) => {
                          expenseForm.setValue('tripId', val);
                          const trip = getTrip(val);
                          if (trip && trip.vehicleId) {
                            expenseForm.setValue('vehicleId', trip.vehicleId);
                          }
                        }}
                        value={expenseForm.watch('tripId')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select trip" />
                        </SelectTrigger>
                        <SelectContent>
                          {trips.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.id}: {t.source} → {t.destination}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Vehicle</Label>
                      <Select
                        onValueChange={(val) => expenseForm.setValue('vehicleId', val)}
                        value={expenseForm.watch('vehicleId')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicles.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        onValueChange={(val) => expenseForm.setValue('type', val)}
                        value={expenseForm.watch('type')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount (₹)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        {...expenseForm.register('amount', { required: true })}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-[#714B67] hover:bg-[#5A3C52] text-white">
                      Add Expense
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
              {expenses.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No expenses recorded"
                  description="Track trip-related expenses like tolls, parking, and fines."
                  action={
                    <Button
                      onClick={() => setExpenseDialogOpen(true)}
                      className="bg-[#714B67] hover:bg-[#5A3C52] text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Expense
                    </Button>
                  }
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/80">
                      <TableHead className="font-semibold text-muted-foreground">Trip</TableHead>
                      <TableHead className="font-semibold text-muted-foreground">Vehicle</TableHead>
                      <TableHead className="font-semibold text-muted-foreground">Type</TableHead>
                      <TableHead className="font-semibold text-muted-foreground">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((exp, index) => (
                      <motion.tr
                        key={exp.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {getTripLabel(exp.tripId)}
                        </TableCell>
                        <TableCell>{getVehicleName(exp.vehicleId)}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/80 text-muted-foreground">
                            {exp.type}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          ₹{Number(exp.amount).toLocaleString('en-IN')}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
