import { cn } from '@/lib/format';

/**
 * Lambang TestCraft: perisai (quality assurance) dengan tanda centang.
 * Dipakai di navbar, footer, favicon (app/icon.svg), dan open-graph.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="Logo TestCraft Indonesia"
      className={cn('h-8 w-8', className)}
    >
      <defs>
        <linearGradient id="tc-logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0E9C9C" />
          <stop offset="100%" stopColor="#2FBF9F" />
        </linearGradient>
      </defs>
      <path
        d="M16 2.5 4.5 6.8v8.4c0 6.9 4.7 13.3 11.5 15.3 6.8-2 11.5-8.4 11.5-15.3V6.8L16 2.5Z"
        fill="url(#tc-logo-gradient)"
      />
      <path
        d="m10.6 16.2 3.7 3.8 7.1-7.6"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-extrabold tracking-tight text-navy dark:text-white">
          Test<span className="text-primary">Craft</span>
        </span>
        {showTagline && (
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-slate-500">
            Learn. Build. Automate.
          </span>
        )}
      </span>
    </span>
  );
}
