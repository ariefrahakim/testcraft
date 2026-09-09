'use client';

import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/format';
import { useT } from '@/lib/i18n';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
}

export function Field({ label, hint, error, required, children, htmlFor }: FieldProps) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn('input', className)} {...props} />
));
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn('input min-h-24', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn('input pr-8', className)} {...props} />
));
Select.displayName = 'Select';

/** Input password dengan tombol tampilkan/sembunyikan. */
export function PasswordInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const t = useT();

  return (
    <div className="relative">
      <input
        id={props.id ?? id}
        type={visible ? 'text' : 'password'}
        className={cn('input pr-11', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:text-slate-600"
        aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function Checkbox({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  const id = useId();
  return (
    <label
      htmlFor={props.id ?? id}
      className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300"
    >
      <input
        id={props.id ?? id}
        type="checkbox"
        className={cn(
          'h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30',
          className,
        )}
        {...props}
      />
      {label}
    </label>
  );
}

/** Pesan error/sukses ringkas di atas form. */
export function Alert({
  tone = 'danger',
  children,
  ...props
}: {
  tone?: 'danger' | 'success' | 'info' | 'warning';
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const tones = {
    danger: 'bg-danger-light text-red-800 border-red-200',
    success: 'bg-success-light text-emerald-800 border-emerald-200',
    info: 'bg-primary-light text-primary-dark border-blue-200',
    warning: 'bg-warning-light text-amber-800 border-amber-200',
  };
  return (
    <div
      role="alert"
      className={cn('rounded-xl border px-4 py-3 text-sm font-medium', tones[tone])}
      {...props}
    >
      {children}
    </div>
  );
}
