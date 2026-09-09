export function StatsBar() {
  const stats = [
    { num: '28,400+', label: 'Alumni & Students' },
    { num: '48', label: 'Program Training' },
    { num: '50+', label: 'Corporate Clients' },
    { num: '12,400+', label: 'Sertifikat Diterbitkan' },
  ]

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: '-52px auto 0',
        position: 'relative',
        zIndex: 5,
        padding: '0 24px',
      }}
    >
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          padding: 28,
          gap: 16,
          textAlign: 'center',
        }}
        className="stats-grid"
      >
        {stats.map((s) => (
          <div key={s.label}>
            <div className="stat-num">{s.num}</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}
