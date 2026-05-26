import React from 'react';

interface ATSPieChartProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  colors?: { primary: string; background: string };
}

export function ATSPieChart({ percent, size = 176, strokeWidth = 24, colors }: ATSPieChartProps) {
  const clamped = Math.max(0, Math.min(100, Number(percent || 0)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (circumference * clamped) / 100;
  const primary = colors?.primary || '#16a085';
  const background = colors?.background || 'rgba(255,255,255,0.08)';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="atsGradient" x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stopColor={primary} stopOpacity="1" />
          <stop offset="100%" stopColor="#7bd389" stopOpacity="1" />
        </linearGradient>
      </defs>
      <g transform={`translate(${size / 2}, ${size / 2})`}>
        <circle r={radius} fill="none" stroke={background} strokeWidth={strokeWidth} />
        <circle
          r={radius}
          fill="none"
          stroke="url(#atsGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${Math.max(0, circumference - dash)}`}
          transform={`rotate(-90)`}
        />
        <foreignObject x={-(size / 4)} y={-(size / 4)} width={size / 2} height={size / 2}>
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: primary }}>{clamped}%</div>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>ATS</div>
            </div>
          </div>
        </foreignObject>
      </g>
    </svg>
  );
}

export default ATSPieChart;
