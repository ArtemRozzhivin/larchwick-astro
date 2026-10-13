import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  "inline-flex w-fit items-center cursor-pointer justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: 'border border-black bg-white text-black hover:-translate-y-1 hover:shadow-lg',
        primary:
          'border border-black bg-black text-white hover:bg-gray-800 hover:-translate-y-1 hover:shadow-lg',
        outline:
          'border border-black bg-transparent text-black hover:bg-gray-50 hover:-translate-y-1 hover:shadow-lg',
        ghost: 'border border-transparent text-black hover:bg-gray-50 hover:border-gray-200',
        link: 'border-0 bg-transparent text-black underline-offset-4 hover:underline hover:text-primary-400',
        destructive:
          'border border-red-600 bg-red-600 text-white hover:bg-red-700 hover:-translate-y-1 hover:shadow-lg',
        secondary:
          'border border-gray-300 bg-gray-100 text-gray-900 hover:bg-gray-200 hover:-translate-y-1 hover:shadow-lg',
        blur: 'backdrop-blur-sm bg-white/55 border border-black hover:bg-white/70 hover:text-primary-400',
      },
      size: {
        default: 'px-[30px] py-[14px] text-lg leading-6',
        sm: 'px-4 py-2 text-base leading-6',
        lg: 'px-8 py-4 text-xl leading-7',
        xl: 'px-10 py-5 text-2xl leading-8',
        xs: 'px-3 py-1.5 text-sm leading-5',
        icon: 'size-10',
        'icon-xs': "size-6 [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-12',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-[8px]',
        md: 'rounded-[12px]',
        lg: 'rounded-[16px]',
        xl: 'rounded-[20px]',
        '2xl': 'rounded-[24px]',
        '3xl': 'rounded-[30px]',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      rounded: 'lg',
    },
  },
)
