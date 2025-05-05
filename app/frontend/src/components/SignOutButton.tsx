'use client'

import { Loader2, LogOut } from 'lucide-react'
import { logout } from '@/lib/actions';
import { ButtonHTMLAttributes, FC, useState } from 'react'
import { toast } from 'react-hot-toast'
import Button from './ui/Button'
import logger, { logError } from '@/lib/logger'

interface SignOutButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

const SignOutButton: FC<SignOutButtonProps> = ({ ...props }) => {
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    
    try {
      logger.info('User initiated sign out')
      await logout()
      logger.info('User signed out successfully')
      
    } catch (error) {
      // Log the full error details
      logError(error instanceof Error ? error : new Error('Unknown error during sign out'), {
        component: 'SignOutButton',
        action: 'handleSignOut',
        timestamp: new Date().toISOString()
      })

      toast.error('There was a problem signing out. Please try again.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <Button
      {...props}
      variant='ghost'
      onClick={handleSignOut}>
      {isSigningOut ? (
        <Loader2 className='animate-spin h-4 w-4' />
      ) : (
        <LogOut className='w-4 h-4' />
      )}
    </Button>
  )
}

export default SignOutButton