'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import useAuthStore from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const loginSchema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
  remember: yup.boolean().optional().default(false),
});

const Login = ({ onClose, onCreateAccountClick, onForgotPasswordClick }) => {
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuthStore();
  const router = useRouter();

  const formik = useFormik({
    initialValues: { email: '', password: '', remember: false },
    validationSchema: loginSchema,
    validateOnBlur: true,   // default is true
    validateOnChange: true, // default is true
    onSubmit: async (values) => {
      try {
        const data = await login({ email: values.email, password: values.password });
        toast.success('Welcome back!');
        if (data?.user?.role?.toUpperCase() === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Invalid email or password.');
      }
    },
  });

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } = formik;

  return (
 <>
      <h1 className="heading-2 mb-8 text-center">Sign in to Your Account</h1>
      <div className="space-y-4">
        <div className="space-y-4 ">
          <Button type="button" variant="outline" className="w-full  ">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </Button>
          <Button type="button" variant="ghost"  className="w-full  bg-foreground text-background hover:bg-foreground/90 hover:text-background ">
            <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.64 3.4 1.63-3.12 1.88-2.4 5.77.1 6.85-.24.58-.6 1.44-1.15 2.53zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.16 2.29-1.93 4.34-3.74 4.25z" />
            </svg>
            Sign in with Apple
          </Button>
        </div>

        <div className="flex items-center gap-4 ">
          <div className="h-px flex-1 bg-border" />
          <span className="small font-medium text-muted-foreground">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              placeholder="Email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
            
              className="w-full"
         
            />
            {touched.email && errors.email && (
              <p className="text-xs font-medium text-destructive">{errors.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <div className="relative">
              <Input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full pr-10"
           
              />
              <Button
                type="button"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 flex items-center justify-center !bg-transparent !text-muted-foreground hover:!text-foreground cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
            </div>
            {touched.password && errors.password && (
              <p className="text-xs font-medium text-destructive">{errors.password}</p>
            )}
          </div>
          <div className="flex items-center justify-end">
           
            <Button type="button" variant="link" className="text-sm font-medium px-0" onClick={onForgotPasswordClick}>
              Forgot password?
            </Button>
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full  ">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
          </Button>
        </form>

        <div className=" text-sm text-center">
          <p className="body">
            Do not have an account?{' '}
            <Button type="button" variant="link" className="p-0 font-semibold" onClick={onCreateAccountClick}>
              Create your account
            </Button>
          </p>
        </div>
      </div>
 </>
  );
};

export default Login;
