import { cva } from 'class-variance-authority'

/** A text input or textarea; layout (width, margin) comes from the caller. */
export const fieldVariants = cva(
  'border-espresso/60 bg-surface text-espresso focus-visible:border-larch focus-visible:outline-larch rounded-md border-2',
  {
    variants: {
      size: {
        sm: 'px-3 py-2',
        md: 'px-3.5 py-2.5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)
