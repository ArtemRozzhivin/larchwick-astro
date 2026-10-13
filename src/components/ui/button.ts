import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm border text-center font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-3 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'border-brand-dark bg-brand-dark hover:border-heading hover:bg-heading outline-brand-dark text-white',
        secondary:
          'border-brand-dark text-brand-dark hover:bg-subtle outline-brand-dark bg-transparent',
        inverse:
          'border-surface bg-surface text-heading hover:border-subtle hover:bg-subtle outline-surface',
        'inverse-outline':
          'border-surface/60 text-surface hover:border-surface hover:bg-surface/10 outline-surface bg-transparent',
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
