import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 text-center font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-3 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'border-larch bg-larch text-surface hover:border-larch-deep hover:bg-larch-deep outline-larch',
        secondary:
          'border-espresso text-espresso hover:bg-espresso hover:text-surface outline-espresso bg-transparent',
        accent:
          'border-needle bg-needle text-espresso hover:border-espresso hover:bg-espresso hover:text-surface outline-surface',
        'inverse-outline':
          'border-surface text-surface hover:bg-surface hover:text-larch outline-surface bg-transparent',
      },
      size: {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-7 py-3.5 text-base md:text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)
