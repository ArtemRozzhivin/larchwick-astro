import * as React from 'react'

import { cn } from '@lib/utils/tailwind-merge'

interface InputProps extends React.ComponentProps<'input'> {
  label?: string
  error?: string
}

function Input({ className, type, label, error, id, ...props }: InputProps) {
  const inputId = id || React.useId()

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={cn('mb-1 block text-sm font-medium text-gray-700', error && 'text-red-500')}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={cn(
          'h-[53px] w-full rounded-[16px] border border-black bg-white px-[30px] py-[13.5px] transition-all placeholder:text-black/50 placeholder:text-gray-500',
          error && 'border-red-500',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
}

export { Input }
