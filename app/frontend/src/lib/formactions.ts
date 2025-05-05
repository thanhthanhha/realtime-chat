'use server'
import { z } from 'zod'
import { serverApi } from '@/lib/axios/server'
import { redirect } from 'next/navigation';
import logger from '@/lib/logger'

const MODULE_NAME = 'FormAction'

const addFriendValidator = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email('Invalid email address')
    .trim(),
})

// Define validation schema
const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

// Define error state type
export type RegisterErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  server?: string;
};

// Define return type for register function
export type RegisterState = {
  success: boolean;
  errors: RegisterErrors;
  message?: string;
  redirect?: string;
};

// Default error state
const defaultErrors: RegisterErrors = {};

export async function addFriend(
  prevState: any,
  formData: FormData
) {
  const MODULE_NAME = 'AddFriendAction'
  logger.info(MODULE_NAME, 'Starting add friend process', {
    email: formData.get('email'),
    senderId: formData.get('senderId')
  })

  try {
    const email = formData.get('email')
    const senderId = formData.get('senderId')

    logger.debug(MODULE_NAME, 'Validating input fields', { email, senderId })
    
    const validatedFields = addFriendValidator.safeParse({
      email
    })

    if (!validatedFields.success) {
      const errorMessage = validatedFields.error.flatten().fieldErrors.email?.[0] || 'Invalid input'
      logger.warn(MODULE_NAME, 'Validation failed', { 
        error: errorMessage,
        validationErrors: validatedFields.error.flatten()
      })
      return { error: errorMessage }
    }

    logger.info(MODULE_NAME, 'Looking up user by email', { email })
    
    // Get user by email
    const userResponse = await serverApi.get(`/api/users/email/${email}`)
    const receiverId = userResponse.data.id

    if (!receiverId) {
      logger.warn(MODULE_NAME, 'User not found', { email })
      return { error: 'User not found' }
    }

    logger.info(MODULE_NAME, 'Sending friend request', { 
      senderId,
      receiverId
    })

    // Send friend request
    const response = await serverApi.post('/api/friendRequest', {
      receiver_id: receiverId,
      sender_id: senderId
    })

    console.log(response)

    if (response.status === 200 || response.status === 201) {
      logger.info(MODULE_NAME, 'Friend request sent successfully', {
        senderId,
        receiverId,
        status: response.status
      })
      return { success: true, receiverId: receiverId, data: response.data }
    }

    logger.warn(MODULE_NAME, 'Failed to send friend request', {
      status: response.status,
      response: response.data
    })
    return { error: 'Failed to send friend request' }

  } catch (error) {
    logger.error(MODULE_NAME, 'Error in add friend process', { 
      error: {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status
      }
    })

    return { 
      error: error.message || 'Something went wrong'
    }
  }
}


export async function register(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  logger.info(MODULE_NAME, 'Starting registration process');
  
  // Extract form data
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const image = formData.get('image') as string || null;

  // Validate form data
  const validationResult = RegisterSchema.safeParse({
    name,
    email,
    password,
    confirmPassword
  });

  if (!validationResult.success) {
    // Transform Zod errors into our error format
    const errors: RegisterErrors = {};
    validationResult.error.errors.forEach(error => {
      const path = error.path[0] as keyof RegisterErrors;
      errors[path] = error.message;
    });

    logger.warn(MODULE_NAME, 'Validation failed during registration', {
      errors
    });

    return {
      success: false,
      errors
    };
  }

  try {
    // Prepare request payload
    const payload = {
      name,
      email,
      password,
      image: image || '',
      friendlist_id: []
    };

    logger.info(MODULE_NAME, 'Sending registration request', {
      email,
      name
    });

    // Make API request to register the user
    const response = await serverApi.post('/api/users', payload);

    if (response.status === 200 || response.status === 201) {
      logger.info(MODULE_NAME, 'Registration successful', {
        email,
        userId: response.data.id
      });

      // Return success
      return {
        success: true,
        errors: defaultErrors,
        message: 'Registration successful! You can now log in.',
        redirect: '/login'
      };
    }

    // Handle unexpected response status
    logger.warn(MODULE_NAME, 'Unexpected response from registration API', {
      status: response.status,
      response: response.data
    });

    return {
      success: false,
      errors: {
        server: 'Registration failed. Please try again.'
      }
    };

  } catch (error) {
    // Handle API errors
    logger.error(MODULE_NAME, 'Error in registration process', { 
      error: {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status
      }
    });

    // Check if this is a 409 conflict error (email already exists)
    if (error.response?.status === 409) {
      return {
        success: false,
        errors: {
          email: 'This email address is already registered'
        }
      };
    }

    // Handle other API errors
    return {
      success: false,
      errors: {
        server: error.message || 'Something went wrong during registration. Please try again.'
      }
    };
  }
}