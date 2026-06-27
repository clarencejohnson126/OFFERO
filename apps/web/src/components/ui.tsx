import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
} from 'react';

import { cn } from '@/lib/cn';

// Katalog-Look (McMaster-Ethos): eckig, orange Buttons, weiße Inputs, dünne graue Borders,
// keine Schatten/Animationen. Source of Truth: offero-product/catalog.html.

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variantCls: Record<Variant, string> = {
  primary: 'text-brand-fg bg-brand border border-brand-line font-bold hover:bg-[#c5811f]',
  secondary: 'text-fg bg-bg-soft border border-line-strong hover:bg-surface-2',
  ghost: 'text-link hover:underline',
  danger: 'text-danger border border-line bg-bg hover:bg-[#fbecea]',
};
const sizeCls: Record<Size, string> = {
  sm: 'h-7 px-3 text-[12.5px] gap-1.5 rounded-sm',
  md: 'h-8.5 px-4 text-[13px] gap-1.5 rounded-sm',
  lg: 'h-10 px-5 text-[13.5px] gap-2 rounded-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center justify-center transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
        'disabled:pointer-events-none disabled:opacity-50',
        variantCls[variant],
        sizeCls[size],
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-md border border-line bg-bg', className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-8.5 w-full rounded-sm border border-faint bg-bg px-2.5 text-[13px] text-fg',
        'placeholder:text-faint transition-colors',
        'focus-visible:border-brand-line focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/30',
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('mb-1 block text-[12.5px] font-medium text-fg-soft', className)} {...props} />
  );
}

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border border-line bg-bg-soft px-2 py-0.5 text-[11.5px] font-medium text-fg-soft',
        className,
      )}
      {...props}
    />
  );
}

export function Pill({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border border-line bg-bg-soft px-2 py-0.5 text-[12px] font-medium text-fg-soft',
        className,
      )}
      {...props}
    />
  );
}
