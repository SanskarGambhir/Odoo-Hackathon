import { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, ShieldCheck, ShieldOff, Filter, AlertCircle, ScanLine, CheckCircle2 } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useData } from '../contexts/DataContext';
import * as driversApi from '../api/drivers.js';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import ConfirmDialog from '../components/shared/ConfirmDialog';

const LICENSE_CATEGORIES = ['HMV', 'LMV', 'Transport'];
const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ON_TRIP', label: 'On Trip' },
  { value: 'OFF_DUTY', label: 'Off Duty' },
  { value: 'SUSPENDED', label: 'Suspended' },
];
const LICENSE_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'HMV', label: 'HMV' },
  { value: 'LMV', label: 'LMV' },
  { value: 'Transport', label: 'Transport' },
];

function useObjectUrl(file) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}

function isLicenseExpired(expiryDate) {
  return new Date(expiryDate) < new Date();
}

function getScoreColor(score) {
  if (score >= 80) return 'text-[#21B799]';
  if (score >= 60) return 'text-[#E4A900]';
  return 'text-[#E46E78]';
}

const defaultFormValues = {
  name: '',
  email: '',
  licenseNumber: '',
  licenseCategory: 'LMV',
  licenseExpiry: '',
  contactNumber: '',
  safetyScore: 100,
};

export default function Drivers() {
  const { drivers, isLoading, addDriver, updateDriver, suspendDriver } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [licenseFilter, setLicenseFilter] = useState('ALL');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendingDriver, setSuspendingDriver] = useState(null);
  const [frontImageFile, setFrontImageFile] = useState(null);
  const [backImageFile, setBackImageFile] = useState(null);
  const [isExtracted, setIsExtracted] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');

  const form = useForm({ defaultValues: defaultFormValues });

  const frontImagePreview = useObjectUrl(frontImageFile);
  const backImagePreview = useObjectUrl(backImageFile);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const matchesSearch =
        !searchQuery ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
      const matchesLicense =
        licenseFilter === 'ALL' || d.licenseCategory === licenseFilter;
      return matchesSearch && matchesStatus && matchesLicense;
    });
  }, [drivers, searchQuery, statusFilter, licenseFilter]);

  function openAddDialog() {
    setEditingDriver(null);
    setFormError('');
    setExtractError('');
    setFrontImageFile(null);
    setBackImageFile(null);
    setIsExtracted(false);
    form.reset(defaultFormValues);
    setDialogOpen(true);
  }

  function openEditDialog(driver) {
    setEditingDriver(driver);
    setFormError('');
    setExtractError('');
    setFrontImageFile(null);
    setBackImageFile(null);
    setIsExtracted(false);
    form.reset({
      name: driver.name,
      email: driver.email,
      licenseNumber: driver.licenseNumber,
      licenseCategory: driver.licenseCategory,
      licenseExpiry: driver.licenseExpiry
        ? driver.licenseExpiry.substring(0, 10)
        : '',
      contactNumber: driver.contactNumber,
      safetyScore: driver.safetyScore ?? 100,
    });
    setDialogOpen(true);
  }

  function openSuspendDialog(driver) {
    setSuspendingDriver(driver);
    setSuspendDialogOpen(true);
  }

  async function handleConfirmSuspend() {
    if (suspendingDriver) {
      try {
        await suspendDriver(suspendingDriver.id);
      } catch (err) {
        console.error(err);
      }
    }
    setSuspendDialogOpen(false);
    setSuspendingDriver(null);
  }

  async function handleExtractLicense() {
    if (!frontImageFile || !backImageFile) return;
    setExtractError('');
    setIsExtracting(true);
    try {
      const { data } = await driversApi.extractLicense(frontImageFile, backImageFile);
      const extracted = data.data;
      setIsExtracted(true);
      if (extracted.name) form.setValue('name', extracted.name);
      if (extracted.licenseNumber) form.setValue('licenseNumber', extracted.licenseNumber);
      if (extracted.licenseCategory) form.setValue('licenseCategory', extracted.licenseCategory);
      if (extracted.licenseExpiry) form.setValue('licenseExpiry', extracted.licenseExpiry);
    } catch (err) {
      setExtractError(err.response?.data?.message || 'Could not extract license details. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  }

  async function onSubmit(data) {
    setFormError('');
    setIsSubmitting(true);
    const payload = {
      ...data,
      safetyScore: Number(data.safetyScore),
    };
    try {
      if (editingDriver) {
        await updateDriver(editingDriver.id, payload);
      } else {
        await addDriver(payload);
      }
      setDialogOpen(false);
      form.reset(defaultFormValues);
      setEditingDriver(null);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#714B67] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Driver Management" subtitle="Track driver safety and assignments">
        <Button
          onClick={openAddDialog}
          className="bg-[#714B67] hover:bg-[#5A3C52] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Driver
        </Button>
      </PageHeader>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name or license..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2 text-gray-400" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={licenseFilter} onValueChange={setLicenseFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2 text-gray-400" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {LICENSE_FILTER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Drivers Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white rounded-xl border shadow-sm overflow-hidden"
      >
        {filteredDrivers.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No drivers found"
            description="No drivers match your current search or filter criteria."
            action={
              <Button
                onClick={openAddDialog}
                variant="outline"
                className="border-[#714B67] text-[#714B67] hover:bg-[#714B67]/5"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Driver
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="font-semibold text-gray-700">Name</TableHead>
                  <TableHead className="font-semibold text-gray-700">Email</TableHead>
                  <TableHead className="font-semibold text-gray-700">License No.</TableHead>
                  <TableHead className="font-semibold text-gray-700">Category</TableHead>
                  <TableHead className="font-semibold text-gray-700">License Expiry</TableHead>
                  <TableHead className="font-semibold text-gray-700">Contact</TableHead>
                  <TableHead className="font-semibold text-gray-700">Safety Score</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredDrivers.map((driver, idx) => {
                    const expired = isLicenseExpired(driver.licenseExpiry);
                    const isSuspended = driver.status === 'SUSPENDED';
                    return (
                      <motion.tr
                        key={driver.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                        className={`border-b last:border-b-0 transition-colors hover:bg-gray-50/50 ${
                          isSuspended ? 'bg-red-50/60' : ''
                        }`}
                      >
                        <TableCell className="font-medium text-gray-900">
                          {driver.name}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {driver.email}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-gray-600">
                          {driver.licenseNumber}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#714B67]/10 text-[#714B67]">
                            {driver.licenseCategory}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={expired ? 'text-[#E46E78] font-semibold' : 'text-gray-600'}>
                              {new Date(driver.licenseExpiry).toLocaleDateString()}
                            </span>
                            {expired && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E46E78]/15 text-[#E46E78] uppercase tracking-wide">
                                Expired
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {driver.contactNumber}
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold text-sm ${getScoreColor(driver.safetyScore)}`}>
                            {driver.safetyScore}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={driver.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-[#714B67] hover:bg-[#714B67]/10"
                              onClick={() => openEditDialog(driver)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isSuspended}
                              className="h-8 w-8 text-gray-400 hover:text-[#E46E78] hover:bg-[#E46E78]/10 disabled:opacity-30"
                              onClick={() => openSuspendDialog(driver)}
                              title="Suspend driver"
                            >
                              <ShieldOff className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      {/* Add/Edit Driver Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {editingDriver ? 'Edit Driver' : 'Add New Driver'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {formError && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}
            {!editingDriver && (
              <div className="space-y-3 rounded-lg border border-dashed border-gray-300 p-3">
                <p className="text-sm font-medium text-gray-700">
                  License Images <span className="text-gray-400 font-normal">(optional)</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="licenseFrontImage">Front Side</Label>
                    <Input
                      id="licenseFrontImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        setFrontImageFile(e.target.files?.[0] || null);
                        setIsExtracted(false);
                      }}
                    />
                    {frontImagePreview && (
                      <img
                        src={frontImagePreview}
                        alt="License front preview"
                        className="mt-1 h-28 w-full rounded-md border border-gray-200 object-cover"
                      />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="licenseBackImage">Back Side</Label>
                    <Input
                      id="licenseBackImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        setBackImageFile(e.target.files?.[0] || null);
                        setIsExtracted(false);
                      }}
                    />
                    {backImagePreview && (
                      <img
                        src={backImagePreview}
                        alt="License back preview"
                        className="mt-1 h-28 w-full rounded-md border border-gray-200 object-cover"
                      />
                    )}
                  </div>
                </div>

                {extractError && (
                  <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {extractError}
                  </div>
                )}

                {isExtracted ? (
                  <div className="flex items-center gap-2 text-sm text-[#21B799]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Details extracted — review the fields below before saving.
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!frontImageFile || !backImageFile || isExtracting}
                    onClick={handleExtractLicense}
                    className="border-[#714B67] text-[#714B67] hover:bg-[#714B67]/5"
                  >
                    <ScanLine className="w-4 h-4 mr-2" />
                    {isExtracting ? 'Extracting...' : 'Extract Details from License'}
                  </Button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="name">
                  Full Name <span className="text-[#E46E78]">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Enter driver's full name"
                  {...form.register('name', { required: 'Name is required' })}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-[#E46E78]">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="email">
                  Email <span className="text-[#E46E78]">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="driver@example.com"
                  {...form.register('email', { required: 'Email is required' })}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-[#E46E78]">{form.formState.errors.email.message}</p>
                )}
              </div>

              {/* License Number */}
              <div className="space-y-1.5">
                <Label htmlFor="licenseNumber">
                  License Number <span className="text-[#E46E78]">*</span>
                </Label>
                <Input
                  id="licenseNumber"
                  placeholder="e.g. DL-1234567890"
                  {...form.register('licenseNumber', { required: 'License number is required' })}
                />
                {form.formState.errors.licenseNumber && (
                  <p className="text-xs text-[#E46E78]">{form.formState.errors.licenseNumber.message}</p>
                )}
              </div>

              {/* License Category */}
              <div className="space-y-1.5">
                <Label>License Category</Label>
                <Controller
                  control={form.control}
                  name="licenseCategory"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {LICENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* License Expiry */}
              <div className="space-y-1.5">
                <Label htmlFor="licenseExpiry">
                  License Expiry <span className="text-[#E46E78]">*</span>
                </Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  {...form.register('licenseExpiry', { required: 'Expiry date is required' })}
                />
                {form.formState.errors.licenseExpiry && (
                  <p className="text-xs text-[#E46E78]">{form.formState.errors.licenseExpiry.message}</p>
                )}
              </div>

              {/* Contact Number */}
              <div className="space-y-1.5">
                <Label htmlFor="contactNumber">
                  Contact Number <span className="text-[#E46E78]">*</span>
                </Label>
                <Input
                  id="contactNumber"
                  placeholder="+91 XXXXX XXXXX"
                  {...form.register('contactNumber', { required: 'Contact number is required' })}
                />
                {form.formState.errors.contactNumber && (
                  <p className="text-xs text-[#E46E78]">{form.formState.errors.contactNumber.message}</p>
                )}
              </div>

              {/* Safety Score */}
              <div className="space-y-1.5">
                <Label htmlFor="safetyScore">Safety Score</Label>
                <Input
                  id="safetyScore"
                  type="number"
                  min={0}
                  max={100}
                  {...form.register('safetyScore', {
                    min: { value: 0, message: 'Min 0' },
                    max: { value: 100, message: 'Max 100' },
                  })}
                />
                {form.formState.errors.safetyScore && (
                  <p className="text-xs text-[#E46E78]">{form.formState.errors.safetyScore.message}</p>
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
                disabled={isSubmitting}
                className="bg-[#714B67] hover:bg-[#5A3C52] text-white"
              >
                {isSubmitting ? 'Saving...' : editingDriver ? 'Update Driver' : 'Add Driver'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Suspend Confirmation */}
      <ConfirmDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        title="Suspend Driver"
        description={`Are you sure you want to suspend "${suspendingDriver?.name || ''}"? They will not be assignable to new trips.`}
        onConfirm={handleConfirmSuspend}
        variant="destructive"
      />
    </div>
  );
}
