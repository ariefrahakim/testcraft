/**
 * Menerjemahkan tenggat menjadi tingkat urgensi + label.
 * Dipakai antrian penilaian mentor dan daftar tugas siswa agar deadline
 * terbaca sekilas lewat warna, bukan cuma teks tanggal.
 */
export type Urgency = 'overdue' | 'today' | 'soon' | 'later' | 'none';

export interface DeadlineInfo {
  urgency: Urgency;
  /** Kunci kamus + variabelnya; pemanggil yang menerjemahkan. */
  labelKey: 'due.none' | 'due.overdue' | 'due.today' | 'due.left';
  labelVars: Record<string, string | number>;
  /** Kelas Tailwind untuk chip. */
  className: string;
  daysLeft: number | null;
}

export function deadlineInfo(
  dueAt: string | Date | null | undefined,
  locale: 'id' | 'en' = 'id',
): DeadlineInfo {
  if (!dueAt) {
    return {
      urgency: 'none',
      labelKey: 'due.none',
      labelVars: {},
      className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      daysLeft: null,
    };
  }

  const due = new Date(dueAt);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDue = new Date(due);
  startOfDue.setHours(0, 0, 0, 0);

  const daysLeft = Math.round(
    (startOfDue.getTime() - startOfToday.getTime()) / 86_400_000,
  );

  const dateLabel = due.toLocaleDateString(locale === 'en' ? 'en-GB' : 'id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (daysLeft < 0) {
    return {
      urgency: 'overdue',
      labelKey: 'due.overdue',
      labelVars: { days: Math.abs(daysLeft), date: dateLabel },
      className: 'bg-danger-light text-red-700',
      daysLeft,
    };
  }
  if (daysLeft === 0) {
    return {
      urgency: 'today',
      labelKey: 'due.today',
      labelVars: { date: dateLabel },
      className: 'bg-danger-light text-red-700',
      daysLeft,
    };
  }
  return {
    urgency: daysLeft <= 3 ? 'soon' : 'later',
    labelKey: 'due.left',
    labelVars: { days: daysLeft, date: dateLabel },
    className:
      daysLeft <= 3
        ? 'bg-warning-light text-amber-700'
        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    daysLeft,
  };
}
