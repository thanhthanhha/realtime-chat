'use server';
import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import logger from '@/lib/logger';
import { redirect } from 'next/navigation';

const defaultErrors = {
  email: '',
  password: '',
  credentials: '',
  unknown: '',
};

const MODULE_NAME = "ACTIONS_LIB"

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');
  
  // Log login attempt (without sensitive data)
  logger.info(MODULE_NAME, 'Login attempt', { email });

  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    // Log successful login
    logger.info(MODULE_NAME, 'Login successful', { email });

    return {
      message: 'success',
      errors: defaultErrors,
      redirect: '/dashboard'
    };
  } catch (error) {
    if (error instanceof AuthError) {
      // Log authentication failure
      logger.warn(MODULE_NAME, 'Authentication failed', {
        email,
        error: error.message
      });

      return {
        message: 'credentials error',
        errors: {
          ...defaultErrors,
          credentials: 'Invalid email or password',
        },
      };
    }
    // Log unexpected errors
    logger.error(MODULE_NAME, 'Login error', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      message: 'unknown error',
      errors: {
        ...defaultErrors,
        unknown: 'Something went wrong. Please try again.',
      },
    };
  }
}

export async function logout() {
  let success = false
  try {
    // Log logout attempt
    logger.info(MODULE_NAME, 'Logout attempt');
    
    await signOut({
      redirect: false
    });
    
    // Log successful logout
    logger.info(MODULE_NAME, 'Logout successful');
    // Redirect to login page
    success = true
    
  } catch (error) {
    // Log logout error
    logger.error(MODULE_NAME, 'Logout error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }

  if (success) {
    logger.info(MODULE_NAME, 'Logout successful redirect');
    redirect('/login');
  }
}


