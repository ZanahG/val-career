import type {CareerPlayer} from "../../types/career";
import "../../styles/PlayerRadarChart.css";

interface PlayerRadarChartProps {
  player: CareerPlayer;
  size?: number;
}

type RadarPoint = {
  key: keyof CareerPlayer["stats"];
  label: string;
  value: number;
};

const MAX_STAT = 100;

export function PlayerRadarChart({player, size = 320}: PlayerRadarChartProps) {
  const stats: RadarPoint[] = [
    {key: "aim", label: "Aim", value: player.stats.aim},
    {key: "gameSense", label: "Game Sense", value: player.stats.gameSense},
    {key: "communication", label: "Communication", value: player.stats.communication},
    {key: "clutch", label: "Clutch", value: player.stats.clutch},
    {key: "consistency", label: "Consistency", value: player.stats.consistency},
    {key: "mental", label: "Mental", value: player.stats.mental},
  ];

  const levels = 5;
  const center = size / 2;
  const radius = size * 0.34;
  const angleStep = (Math.PI * 2) / stats.length;
  const startAngle = -Math.PI / 2;

  const polarToCartesian = (angle: number, distance: number) => ({
    x: center + Math.cos(angle) * distance,
    y: center + Math.sin(angle) * distance,
  });

  const gridPolygons = Array.from({length: levels}, (_, i) => {
    const levelRadius = radius * ((i + 1) / levels);

    return stats.map((_, index) => {
      const angle = startAngle + index * angleStep;
      const point = polarToCartesian(angle, levelRadius);
      return `${point.x},${point.y}`;
    }).join(" ");
  });

  const axisLines = stats.map((_, index) => {
    const angle = startAngle + index * angleStep;
    const point = polarToCartesian(angle, radius);
    return {x1: center, y1: center, x2: point.x, y2: point.y};
  });

  const dataPolygon = stats.map((stat, index) => {
    const angle = startAngle + index * angleStep;
    const point = polarToCartesian(angle, radius * (stat.value / MAX_STAT));
    return `${point.x},${point.y}`;
  }).join(" ");

  const dataPoints = stats.map((stat, index) => {
    const angle = startAngle + index * angleStep;
    const point = polarToCartesian(angle, radius * (stat.value / MAX_STAT));
    return {...point, value: stat.value, label: stat.label};
  });

  const labels = stats.map((stat, index) => {
    const angle = startAngle + index * angleStep;
    const point = polarToCartesian(angle, radius + 30);

    return {
      ...point,
      label: stat.label,
      value: stat.value,
    };
  });

  return (
    <div className="player-radar-card">
      <div className="player-radar-card__header">
        <span className="eyebrow">SKILL PROFILE</span>
        <h3>Radar de estadísticas</h3>
      </div>

      <div className="player-radar-chart">
        <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Radar chart de estadísticas del jugador">
          {gridPolygons.map((polygon, index) => (
            <polygon key={index} points={polygon} className="player-radar-chart__grid" />
          ))}

          {axisLines.map((line, index) => (
            <line key={index} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} className="player-radar-chart__axis" />
          ))}

          <polygon points={dataPolygon} className="player-radar-chart__shape" />

          {dataPoints.map((point, index) => (
            <circle key={index} cx={point.x} cy={point.y} r="4" className="player-radar-chart__dot" />
          ))}

          {labels.map((label, index) => (
            <g key={index}>
              <text x={label.x} y={label.y} textAnchor="middle" className="player-radar-chart__label">
                {label.label}
              </text>

              <text x={label.x} y={label.y + 14} textAnchor="middle" className="player-radar-chart__value">
                {label.value}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}