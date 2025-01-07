'use client'

import Button from '@/components/ui/Button'
import { FC, useState } from 'react'
import { signIn } from 'next-auth/react'
import { toast } from 'react-hot-toast'

const Page: FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  async function loginWithCredentials(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid credentials')
      }
    } catch (error) {
      toast.error('Something went wrong with your login.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='w-full flex flex-col items-center max-w-md space-y-8'>
        <div className='flex flex-col items-center gap-8'>
          logo
          <h2 className='mt-6 text-center text-3xl font-bold tracking-tight text-gray-900'>
            Sign in to your account
          </h2>
        </div>

        <form onSubmit={loginWithCredentials} className='w-full space-y-6'>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <Button
            isLoading={isLoading}
            type='submit'
            className='max-w-sm mx-auto w-full'>
            Sign In
          </Button>
        </form>
      </div>
    </div>
  )
}

export default Page