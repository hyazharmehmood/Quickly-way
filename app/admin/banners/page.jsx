'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Image as ImageIcon,
  Trash2,
  Loader2,
  Smartphone,
  Monitor,
  Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import api from '@/utils/api';
import { uploadToCloudinary } from '@/utils/cloudinary';

// Recommended dimensions for homepage banners
const DESKTOP_DIMENSIONS = { width: 1200, height: 200 };
const MOBILE_DIMENSIONS = { width: 768, height: 140 };

function ImageUploadSlot({ label, icon: Icon, dimensions, value, onUpload, loading }) {
  const inputRef = useRef(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {label}
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground flex items-center gap-1 cursor-help">
                <Info className="h-3.5 w-3" />
                {dimensions.width}×{dimensions.height}px
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">Recommended dimensions for best display on homepage.</p>
              <p className="text-xs font-medium mt-1">{dimensions.width}×{dimensions.height}px</p>
              <p className="text-xs text-muted-foreground">GIF, PNG, JPG supported</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target?.files?.[0];
          if (file) onUpload(file);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click?.()}
        disabled={loading}
        className="w-full min-h-[100px] rounded-lg border-2 border-dashed border-muted-foreground/40 bg-muted/30 hover:bg-muted/50 hover:border-muted-foreground/60 transition-colors flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : value ? (
          <img
            src={value}
            alt={label}
            className="w-full h-full min-h-[100px] max-h-[140px] object-contain object-center"
          />
        ) : (
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Click to select image
          </span>
        )}
      </button>
    </div>
  );
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    mobileImageUrl: '',
    desktopImageUrl: '',
    isActive: false,
    sortOrder: 0,
  });
  const [editId, setEditId] = useState(null);

  const fetchBanners = async () => {
    try {
      const res = await api.get('/admin/banners');
      if (res.data?.success) setBanners(res.data.banners || []);
    } catch (e) {
      toast.error('Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleUpload = async (file, slot) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only images (GIF, PNG, JPG) are supported');
      return;
    }
    setUploadingSlot(slot);
    try {
      const url = await uploadToCloudinary(file, 'image');
      setForm((f) => ({ ...f, [slot]: url }));
      toast.success(`${slot === 'mobileImageUrl' ? 'Mobile' : 'Desktop'} image uploaded`);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleCreate = async () => {
    if (!form.mobileImageUrl?.trim() && !form.desktopImageUrl?.trim()) {
      toast.error('Upload at least one image (mobile or desktop)');
      return;
    }
    setFormLoading(true);
    try {
      const res = await api.post('/admin/banners', form);
      if (res.data?.success) {
        toast.success('Banner added');
        setShowForm(false);
        resetForm();
        fetchBanners();
      } else toast.error(res.data?.error || 'Failed to create');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to create banner');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editId) return;
    if (!form.mobileImageUrl?.trim() && !form.desktopImageUrl?.trim()) {
      toast.error('At least one image (mobile or desktop) is required');
      return;
    }
    setFormLoading(true);
    try {
      const res = await api.patch(`/admin/banners/${editId}`, form);
      if (res.data?.success) {
        toast.success('Banner updated');
        setShowForm(false);
        setEditId(null);
        resetForm();
        fetchBanners();
      } else toast.error(res.data?.error || 'Failed to update');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update banner');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      const res = await api.patch(`/admin/banners/${banner.id}`, {
        isActive: !banner.isActive,
      });
      if (res.data?.success) {
        await fetchBanners(); // Refetch so only one active shows (server enforces single active)
        toast.success(banner.isActive ? 'Banner deactivated' : 'Banner activated');
      }
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const res = await api.delete(`/admin/banners/${deleteId}`);
      if (res.data?.success) {
        toast.success('Banner deleted');
        setDeleteId(null);
        fetchBanners();
      } else toast.error(res.data?.error || 'Failed to delete');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      mobileImageUrl: '',
      desktopImageUrl: '',
      isActive: false,
      sortOrder: 0,
    });
  };

  const openEdit = (banner) => {
    setEditId(banner.id);
    setForm({
      title: banner.title || '',
      mobileImageUrl: banner.mobileImageUrl || '',
      desktopImageUrl: banner.desktopImageUrl || '',
      isActive: banner.isActive ?? false,
      sortOrder: banner.sortOrder ?? 0,
    });
    setShowForm(true);
  };

  const openCreate = () => {
    setEditId(null);
    resetForm();
    setShowForm(true);
  };

  const getDeviceBadges = (banner) => {
    const badges = [];
    if (banner.mobileImageUrl) badges.push({ label: 'Mobile', icon: Smartphone });
    if (banner.desktopImageUrl) badges.push({ label: 'Desktop', icon: Monitor });
    return badges;
  };

  const canSubmit = form.mobileImageUrl?.trim() || form.desktopImageUrl?.trim();

  return (
    <div className="animate-in fade-in duration-500 space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="heading-3">Banners</h3>
          <p className="text-sm text-muted-foreground">
          Upload mobile and/or desktop images. At least one image is required. Active banners will be displayed publicly. Recommended dimensions: Desktop 1200×200 px, Mobile 768×140 px. </p>
        </div>
        <Button onClick={openCreate} className="rounded-xl">
          <Plus className="h-4 w-4 " />
          Add banner
        </Button>
      </div>

      {loading ? (
        <Card className="border shadow-none">
          <CardContent className="p-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-8 w-48 mt-4" />
          </CardContent>
        </Card>
      ) : banners.length === 0 ? (
        <Card className="border shadow-none">
          <CardContent className="p-12 text-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No banners yet. Add your first banner above.</p>
            <p className="text-xs mt-2">Upload mobile (768×140px) and/or desktop (1200×200px) images.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {banners.map((banner) => (
            <Card key={banner.id} className="border shadow-none overflow-hidden">
              <div className="flex gap-1 bg-muted/50 p-2">
                {banner.desktopImageUrl && (
                  <div className="flex-1 aspect-[6/1] overflow-hidden rounded">
                    <img
                      src={banner.desktopImageUrl}
                      alt="Desktop"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {banner.mobileImageUrl && (
                  <div className="flex-1 max-w-[120px] aspect-[768/140] overflow-hidden rounded">
                    <img
                      src={banner.mobileImageUrl}
                      alt="Mobile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant={banner.isActive ? 'default' : 'secondary'}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {getDeviceBadges(banner).map((b) => (
                    <Badge key={b.label} variant="outline" className="gap-1">
                      <b.icon className="h-3 w-3" />
                      {b.label}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(banner)}
                    >
                      {banner.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(banner)}>
                      Edit
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(banner.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit banner' : 'Add banner'}</DialogTitle>
            <DialogDescription>
              Upload mobile and/or desktop images. Upload both to show on all devices, or one for device-specific display. Recommended dimensions shown below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <ImageUploadSlot
              label="Desktop image"
              icon={Monitor}
              dimensions={DESKTOP_DIMENSIONS}
              value={form.desktopImageUrl}
              onUpload={(file) => handleUpload(file, 'desktopImageUrl')}
              loading={uploadingSlot === 'desktopImageUrl'}
            />
            <ImageUploadSlot
              label="Mobile image"
              icon={Smartphone}
              dimensions={MOBILE_DIMENSIONS}
              value={form.mobileImageUrl}
              onUpload={(file) => handleUpload(file, 'mobileImageUrl')}
              loading={uploadingSlot === 'mobileImageUrl'}
            />
            <p className="text-xs text-muted-foreground">
              Desktop: {DESKTOP_DIMENSIONS.width}×{DESKTOP_DIMENSIONS.height}px • Mobile: {MOBILE_DIMENSIONS.width}×{MOBILE_DIMENSIONS.height}px (recommended for homepage)
            </p>
            <div>
              <Label>Title (optional, for admin)</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Black Friday"
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active (show publicly)</Label>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={editId ? handleUpdate : handleCreate}
              disabled={!canSubmit || formLoading}
            >
              {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editId ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => !deleteLoading && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete banner</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the banner. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
