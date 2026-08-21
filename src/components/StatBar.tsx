interface StatBarProps {
  label: string;
  value: number;
}

export function StatBar({ label, value }: StatBarProps) {
  const normalized = Math.max(0, Math.min(100, value));

  return (
    <div className="stat-row">
      <div className="stat-row__top">
        <span>{label}</span>
        <strong>{normalized}</strong>
      </div>
      <div className="stat-bar">
        <div className="stat-bar__fill" style={{ width: `${normalized}%` }} />
      </div>
    </div>
  );
}
