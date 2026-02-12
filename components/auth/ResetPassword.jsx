'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/utils/api';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';

const resetSchema = yup.object({
  password: yup.string().min(6, 'Password must be at least 6 characters').required('New password is required'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

const ResetPassword = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const token = searchParams.get('token') || '';

  const formik = useFormik({
    initialValues: { password: '', confirmPassword: '' },
    validationSchema: resetSchema,
    onSubmit: async (values) => {
      if (!token) {
        toast.error('Invalid reset token. Please use the link from your email.');
        return;
      }
      try {
        await api.post('/auth/reset-password', { token, password: values.password });
        setIsSuccess(true);
        toast.success('Password reset successfully!');
        setTimeout(() => router.push('/login'), 2000);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to reset password. Please try again.');
      }
    },
  });

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } = formik;

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center  px-4 py-8">
        <div className="w-[500px]">
          <div className="text-center">
            <h1 className="heading-1 text-primary mb-8">Password Reset Successful</h1>
          </div>
          <div className="   text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <p className="body mb-4">Your password has been reset successfully!</p>
            <p className="caption">Redirecting to login page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[500px]"> 
      <h1 className="heading-2 text-center">Reset password</h1>
      <div className="space-y-4">
        <p className="body text-center">Enter your new password.</p>
        <div className="">
          {!token ? (
            <div className="text-center space-y-4">
              <p className="body mb-4">Invalid or missing reset token.</p>
              <p className="small text-muted-foreground mb-6">Please use the link from your email to reset your password.</p>
              <Button variant="outline" className="w-full" onClick={() => router.push('/forgot-password')}>
                Request new reset link
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">New Password <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                    className="w-full pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 flex items-center justify-center !bg-transparent !text-muted-foreground hover:!text-foreground cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                {touched.password && errors.password && (
                  <p className="text-xs font-medium text-destructive">{errors.password}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                    className="w-full pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 flex items-center justify-center !bg-transparent !text-muted-foreground hover:!text-foreground cursor-pointer"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
                {touched.confirmPassword && errors.confirmPassword && (
                  <p className="text-xs font-medium text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full py-6">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset password'
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
