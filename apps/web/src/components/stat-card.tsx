/** Angka pencapaian di landing page (blok STATS dari CMS). */
export function MarketingStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-card dark:border-slate-800 dark:bg-slate-900">
      <p className="font-display text-2xl font-extrabold text-primary sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-sm">
        {label}
      </p>
    </div>
  );
}
