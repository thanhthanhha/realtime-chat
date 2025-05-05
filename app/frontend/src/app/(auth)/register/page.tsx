'use client';

import { useFormState } from 'react-dom';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { register, RegisterState } from '@/lib/formactions';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import logger from '@/lib/logger';
import { GiRainbowStar } from "react-icons/gi";
import Link from 'next/link';

const registerInitialState: RegisterState = {
  success: false,
  errors: {},
  message: '',
  redirect: undefined
};

const RegisterForm = () => {
  const [formState, formAction] = useFormState(register, registerInitialState);
  const router = useRouter();

  // Show toast messages based on form state
  useEffect(() => {
    if (formState.success) {
      toast.success(formState.message || 'Registration successful!');
    } else if (formState.errors?.server) {
      toast.error(formState.errors.server);
    }

    if (formState?.redirect) {
      router.push(formState.redirect);
    }
  }, [formState, router]);

  return (
    <div className='flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='w-full flex flex-col items-center max-w-md space-y-8'>
        <div className='flex flex-col items-center gap-8'>
          <GiRainbowStar size={100} color="blue" />
          <h2 className='mt-6 text-center text-3xl font-bold tracking-tight text-gray-900'>
            Create an account
          </h2>
        </div>
        <form action={formAction} className='w-full space-y-6'>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
            {formState.errors?.name && (
              <p className="text-red-500 text-sm mt-1">{formState.errors.name}</p>
            )}
          </div>
          
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
            {formState.errors?.email && (
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
            {formState.errors?.password && (
              <p className="text-red-500 text-sm mt-1">{formState.errors.password}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
            {formState.errors?.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{formState.errors.confirmPassword}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              Profile Image URL (optional)
            </label>
            <input
              type="text"
              id="image"
              name="image"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          {formState.errors?.server && (
            <p className="text-red-500 text-sm">{formState.errors.server}</p>
          )}
          
          <Button
            type='submit'
            className='max-w-sm mx-auto w-full'>
            Sign Up
          </Button>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-800">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;