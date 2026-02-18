'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '@/store/useAuthStore';
import { uploadToCloudinary } from '@/utils/cloudinary';

const MAX_DESC = 600;
const validationSchema = Yup.object({
  title: Yup.string().trim().required('Title is required').max(200, 'Title too long'),
  description: Yup.string()
    .trim()
    .required('Describe your issue')
    .max(MAX_DESC, `Description must be ${MAX_DESC} characters or less`),
  fullName: Yup.string().trim().required('Full name is required').max(120, 'Name too long'),
  email: Yup.string()
    .trim()
    .required('Email is required')
    .email('Please enter a valid email'),
});

const initialValues = {
  title: '',
  description: '',
  fullName: '',
  email: '',
};

export function ContactSupportDialog({ open, onOpenChange }) {
  const router = useRouter();
  const { user, isLoggedIn } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]); // { file, url?, fileName } - urls set after upload on submit

  const formik = useFormik({
    initialValues: {
      ...initialValues,
      fullName: user?.name || initialValues.fullName,
      email: user?.email || initialValues.email,
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setUploading(true);
      const attachments = [];
      try {
        for (const item of fileList) {
          if (item.url) {
            attachments.push({ url: item.url, fileName: item.fileName || item.file?.name });
          } else if (item.file) {
            const resourceType = item.file.type.startsWith('image/')
              ? 'image'
              : item.file.type.startsWith('video/')
                ? 'video'
                : 'raw';
            const url = await uploadToCloudinary(item.file, resourceType);
            attachments.push({ url, fileName: item.file.name });
          }
        }
      } catch (e) {
        toast.error('Failed to upload one or more files.');
        setUploading(false);
        return;
      }

      try {
        const res = await fetch('/api/support/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: values.title.trim(),
            description: values.description.trim(),
            fullName: values.fullName.trim(),
            email: values.email.trim().toLowerCase(),
            attachments,
            createdById: user?.id || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          formik.setStatus(data.error || 'Failed to submit.');
          setUploading(false);
          return;
        }
        toast.success('Support request submitted. Opening your ticket.');
        formik.resetForm();
        setFileList([]);
        onOpenChange(false);
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('support-ticket-created', { detail: data.ticket }));
        }
        if (data.ticket?.id) {
          router.push(`/support/${data.ticket.id}`);
        }
      } catch (err) {
        formik.setStatus('Something went wrong. Please try again.');
        toast.error('Failed to submit request.');
      } finally {
        setUploading(false);
      }
    },
  });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024;
    const valid = files.filter((f) => f.size <= maxSize);
    if (valid.length < files.length) toast.error('Some files exceed 10MB and were skipped.');
    if (valid.length + fileList.length > 5) {
      toast.error('Maximum 5 attachments allowed.');
      return;
    }
    setFileList((prev) => [...prev, ...valid.map((file) => ({ file, fileName: file.name }))]);
    e.target.value = '';
  };

  const removeFile = (index) => {
    setFileList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenChange = (next) => {
    if (!next) {
      formik.resetForm();
      setFileList([]);
      formik.setStatus(null);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 pb-4 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border">
          
          <DialogTitle className="text-xl font-semibold"><h3 className="heading-3">Contact Support</h3></DialogTitle>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="support-title">Title<span className="text-destructive">*</span></Label>
            <Input
              id="support-title"
              type="text"
              placeholder="Subject of your request"
              {...formik.getFieldProps('title')}
              disabled={formik.isSubmitting || uploading}
              className="w-full"
            />
            {formik.touched.title && formik.errors.title && (
              <p className="text-sm text-destructive">{formik.errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-description">Description<span className="text-destructive">*</span></Label>
            <Textarea
              id="support-description"
              placeholder="Describe your issue in details"
              rows={4}
              maxLength={MAX_DESC + 1}
              {...formik.getFieldProps('description')}
              disabled={formik.isSubmitting || uploading}
              className="w-full resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {formik.values.description.length}/{MAX_DESC}
            </p>
            {formik.touched.description && formik.errors.description && (
              <p className="text-sm text-destructive">{formik.errors.description}</p>
            )}
          </div>

         
<div className="grid grid-cols-2 gap-4"> <div className="space-y-2">
            <Label htmlFor="support-fullName">Full Name<span className="text-destructive">*</span></Label>
            <Input
              id="support-fullName"
              type="text"
              placeholder="Your full name"
              {...formik.getFieldProps('fullName')}
              disabled={formik.isSubmitting || uploading}
              className="w-full"
            />
            {formik.touched.fullName && formik.errors.fullName && (
              <p className="text-sm text-destructive">{formik.errors.fullName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-email">Email<span className="text-destructive">*</span></Label>
            <Input
              id="support-email"
              type="email"
              placeholder="your@email.com"
              {...formik.getFieldProps('email')}
              disabled={formik.isSubmitting || uploading}
              className="w-full"
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-sm text-destructive">{formik.errors.email}</p>
            )}
          </div></div>
          <div className="space-y-4">
            <Label>Attachments</Label>
            <div className="flex items-center gap-2 flex-wrap">
              <label className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground">
                <Paperclip className="h-4 w-4" />
                Add file
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  disabled={formik.isSubmitting || uploading}
                />
              </label>
              {fileList.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs"
                >
                  {item.fileName || item.file?.name}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground"
                    aria-label="Remove file"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {formik.status && (
            <p className="text-sm text-destructive">{formik.status}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={formik.isSubmitting || uploading}
          >
            {formik.isSubmitting || uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
