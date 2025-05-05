// src/components/LoginForm.tsx
'use client';

import { useFormState } from 'react-dom';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/actions';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import logger from '@/lib/logger';
import { GiRainbowStar } from "react-icons/gi";
import Link from 'next/link';

const loginInitialState = {
  message: '',
  errors: {
    email: '',
    password: '',
    credentials: '',
    unknown: '',
  },
  redirect: '',
};

const LoginForm = () => {
  const [formState, formAction] = useFormState(login, loginInitialState);
  const router = useRouter();

  // Show toast messages based on form state
  useEffect(() => {
    if (formState.message === 'success') {
      toast.success('Logged in successfully!');
    } else if (formState.message === 'credentials error') {
      toast.error('Invalid credentials');
    } else if (formState.message === 'unknown error') {
      toast.error('Something went wrong with your login.');
    }
    if (formState?.redirect) {
      router.push(formState.redirect);
    }
  }, [formState.message, formState.redirect, router]);


  return (
    <div className='flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='w-full flex flex-col items-center max-w-md space-y-8'>
        <div className='flex flex-col items-center gap-8'>
          <GiRainbowStar size={100} color="blue" />
          <h2 className='mt-6 text-center text-3xl font-bold tracking-tight text-gray-900'>
            Sign in to your account
          </h2>
        </div>

        <form action={formAction} className='w-full space-y-6'>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
            {formState.errors.email && (
              <p className="text-red-500 text-sm mt-1">{formState.errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
            {formState.errors.password && (
              <p className="text-red-500 text-sm mt-1">{formState.errors.password}</p>
            )}
          </div>

          {formState.errors.credentials && (
            <p className="text-red-500 text-sm">{formState.errors.credentials}</p>
          )}

          <Button
            type='submit'
            className='max-w-sm mx-auto w-full'>
            Sign In
          </Button>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-800">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;