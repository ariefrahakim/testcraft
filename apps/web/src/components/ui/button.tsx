import { cva, type VariantProps } from 'class-variance-authority';
import Link from 'next/link';
import { forwardRef } from 'react';
import { cn } from '@/lib/format';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all ' +
    'disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-white shadow-sm hover:bg-primary-dark hover:-translate-y-px hover:shadow-lift',
        secondary:
          'bg-navy text-white hover:bg-navy-800 dark:bg-slate-100 dark:text-navy dark:hover:bg-white',
        success: 'bg-success text-white hover:brightness-105',
        danger: 'bg-danger text-white hover:brightness-110',
        outline:
          'border-[1.5px] border-slate-200 bg-white text-navy hover:border-primary hover:text-primary ' +
          'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
        ghost:
          'text-slate-600 hover:bg-primary-light hover:text-primary dark:text-slate-300 dark:hover:bg-slate-800',
        whatsapp: 'bg-[#25D366] text-white hover:brightness-105',
      },
      size: {
        sm: 'px-3.5 py-2 text-sm',
        md: 'px-5 py-2.5 text-[15px]',
        lg: 'px-7 py-3.5 text-base',
        icon: 'h-10 w-10 p-0',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

export function ButtonLink({
  className,
  variant,
  size,
  block,
  ...props
}: React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
