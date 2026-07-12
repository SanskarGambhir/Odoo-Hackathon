import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users as UsersIcon, Trash2, AlertCircle } from 'lucide-react';
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
import * as usersApi from '../api/users.js';
import { ASSIGNABLE_ROLES, ROLE_LABELS } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';
import ConfirmDialog from '../components/shared/ConfirmDialog';

const defaultFormValues = {
  username: '',
  email: '',
  password: '',
  role: 'FLEET_MANAGER',
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);

  const form = useForm({ defaultValues: defaultFormValues });

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await usersApi.getUsers();
      setUsers(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function openAddDialog() {
    setFormError('');
    form.reset(defaultFormValues);
    setDialogOpen(true);
  }

  function openDeleteDialog(user) {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    if (deletingUser) {
      try {
        await usersApi.deleteUser(deletingUser.id);
        setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      } catch (err) {
        console.error(err);
      }
    }
    setDeleteDialogOpen(false);
    setDeletingUser(null);
  }

  async function onSubmit(data) {
    setFormError('');
    setIsSubmitting(true);
    try {
      const { data: created } = await usersApi.createUser(data);
      setUsers((prev) => [created.data, ...prev]);
      setDialogOpen(false);
      form.reset(defaultFormValues);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-border border-t-[#714B67] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" subtitle="Create and manage user accounts and roles">
        <Button
          onClick={openAddDialog}
          className="bg-[#714B67] hover:bg-[#5A3C52] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </PageHeader>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-card rounded-xl border shadow-sm overflow-hidden"
      >
        {users.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No users found"
            description="Get started by adding your first user account."
            action={
              <Button
                onClick={openAddDialog}
                variant="outline"
                className="border-[#714B67] text-[#714B67] hover:bg-[#714B67]/5"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/80">
                  <TableHead className="font-semibold text-muted-foreground">Username</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Email</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Role</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Created</TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {users.map((u, idx) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                      className="border-b last:border-b-0 transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-medium text-foreground">{u.username}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#714B67]/10 text-[#714B67]">
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={u.id === currentUser?.id}
                          className="h-8 w-8 text-muted-foreground/60 hover:text-[#E46E78] hover:bg-[#E46E78]/10 disabled:opacity-30"
                          onClick={() => openDeleteDialog(u)}
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      {/* Add User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {formError && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="username">
                Username <span className="text-[#E46E78]">*</span>
              </Label>
              <Input
                id="username"
                placeholder="e.g. jdoe"
                {...form.register('username', { required: 'Username is required' })}
              />
              {form.formState.errors.username && (
                <p className="text-xs text-[#E46E78]">{form.formState.errors.username.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">
                Email <span className="text-[#E46E78]">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. jdoe@transitops.com"
                {...form.register('email', { required: 'Email is required' })}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-[#E46E78]">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">
                Password <span className="text-[#E46E78]">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                {...form.register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                })}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-[#E46E78]">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Role</Label>
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSIGNABLE_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#714B67] hover:bg-[#5A3C52] text-white"
              >
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        description={`Are you sure you want to delete "${deletingUser?.username || ''}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </div>
  );
}
