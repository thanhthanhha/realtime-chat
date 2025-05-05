'use client'

import { FC, ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'
import { SessionProvider } from 'next-auth/react';
import { WebSocketProvider } from '@/components/WebSocketProvider';

interface ProvidersProps {
  children: ReactNode
}

const Providers: FC<ProvidersProps> = ({ children }) => {
  return (
    <>
      <SessionProvider>
      <WebSocketProvider>
      <Toaster position='top-center' reverseOrder={false} />
      {children}
      </WebSocketProvider>
    </SessionProvider>
    </>
  )
}

export default Providers
