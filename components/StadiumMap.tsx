import React from 'react';

interface StadiumMapProps {
  activeIncidentsByZone: Record<string, number>;
  selectedZone: string | null;
  onSelectZone: (zone: string | null) => void;
}

export default function StadiumMap({
  activeIncidentsByZone,
  selectedZone,
  onSelectZone,
}: StadiumMapProps) {
  
  const zones = [
    { id: 'North Stand', label: 'North Stand', type: 'stand', x: 200, y: 50, w: 200, h: 70 },
    { id: 'South Stand', label: 'South Stand', type: 'stand', x: 200, y: 280, w: 200, h: 70 },
    { id: 'West Stand', label: 'West Stand', type: 'stand', x: 70, y: 130, w: 110, h: 140 },
    { id: 'East Stand', label: 'East Stand', type: 'stand', x: 420, y: 130, w: 110, h: 140 },
    { id: 'Pitch', label: 'Pitch Area', type: 'pitch', x: 200, y: 130, w: 200, h: 140 },
    { id: 'Gate A', label: 'Gate A', type: 'gate', cx: 135, cy: 90, r: 25 },
    { id: 'Gate B', label: 'Gate B', type: 'gate', cx: 465, cy: 90, r: 25 },
    { id: 'Gate C', label: 'Gate C', type: 'gate', cx: 465, cy: 310, r: 25 },
    { id: 'Gate D', label: 'Gate D', type: 'gate', cx: 135, cy: 310, r: 25 },
  ];

  const getColorClass = (zoneId: string) => {
    const count = activeIncidentsByZone[zoneId] || 0;
    if (count === 0) {
      if (zoneId === 'Pitch') {
        return 'fill-emerald-950/20 stroke-emerald-800/40 hover:fill-emerald-900/30';
      }
      return 'fill-slate-800/30 stroke-slate-700/50 hover:fill-slate-700/40';
    }
    if (count === 1) {
      return 'fill-yellow-500/20 stroke-yellow-500 animate-pulse';
    }
    if (count === 2) {
      return 'fill-orange-500/30 stroke-orange-500 animate-pulse';
    }
    return 'fill-red-500/40 stroke-red-500 animate-pulse [animation-duration:1s]';
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full max-w-2xl bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-slate-300 tracking-wider uppercase">Interactive Stadium Map</h3>
          {selectedZone && (
            <button
              onClick={() => onSelectZone(null)}
              className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 transition border border-slate-700"
            >
              Clear Filter: {selectedZone}
            </button>
          )}
        </div>

        <svg viewBox="0 0 600 400" className="w-full h-auto select-none">
          {/* Stadium outer track line */}
          <ellipse
            cx="300"
            cy="200"
            rx="270"
            ry="180"
            className="fill-none stroke-slate-800 stroke-2"
          />

          {/* Render Stand, Pitch, and Gate Zones */}
          {zones.map((zone) => {
            const count = activeIncidentsByZone[zone.id] || 0;
            const isSelected = selectedZone === zone.id;
            const colorClass = getColorClass(zone.id);
            const borderStroke = isSelected ? 'stroke-cyan-400 stroke-[3px]' : 'stroke-[1.5px]';

            if (zone.type === 'gate') {
              return (
                <g key={zone.id} className="cursor-pointer" onClick={() => onSelectZone(isSelected ? null : zone.id)}>
                  <circle
                    cx={zone.cx}
                    cy={zone.cy}
                    r={zone.r}
                    className={`${colorClass} ${borderStroke} transition-all duration-300`}
                  />
                  <text
                    x={zone.cx}
                    y={zone.cy + 4}
                    textAnchor="middle"
                    className={`text-[9px] font-bold fill-slate-300 pointer-events-none ${
                      count > 0 ? 'fill-white' : ''
                    }`}
                  >
                    {zone.id.split(' ')[1]}
                  </text>
                  {count > 0 && (
                    <circle
                      cx={zone.cx! + 15}
                      cy={zone.cy! - 15}
                      r="9"
                      className="fill-red-500 stroke-slate-900 stroke-2"
                    />
                  )}
                  {count > 0 && (
                    <text
                      x={zone.cx! + 15}
                      y={zone.cy! - 12}
                      textAnchor="middle"
                      className="text-[9px] font-extrabold fill-white pointer-events-none"
                    >
                      {count}
                    </text>
                  )}
                </g>
              );
            }

            // Stand or Pitch (rectangles)
            return (
              <g key={zone.id} className="cursor-pointer" onClick={() => onSelectZone(isSelected ? null : zone.id)}>
                <rect
                  x={zone.x}
                  y={zone.y}
                  width={zone.w}
                  height={zone.h}
                  rx={8}
                  className={`${colorClass} ${borderStroke} transition-all duration-300`}
                />
                
                {/* Specific details for the Pitch Area */}
                {zone.type === 'pitch' && count === 0 && (
                  <>
                    <line x1="300" y1="130" x2="300" y2="270" className="stroke-emerald-800/30 stroke-1 pointer-events-none" />
                    <circle cx="300" cy="200" r="25" className="fill-none stroke-emerald-800/30 stroke-1 pointer-events-none" />
                  </>
                )}

                <text
                  x={zone.x! + zone.w! / 2}
                  y={zone.y! + zone.h! / 2 + 4}
                  textAnchor="middle"
                  className={`text-[10px] font-bold fill-slate-400 pointer-events-none ${
                    count > 0 ? 'fill-white' : ''
                  }`}
                >
                  {zone.label}
                </text>

                {count > 0 && (
                  <g transform={`translate(${zone.x! + zone.w! - 16}, ${zone.y! + 16})`}>
                    <circle r="9" className="fill-red-500 stroke-slate-900 stroke-2" />
                    <text
                      textAnchor="middle"
                      y="3"
                      className="text-[9px] font-extrabold fill-white pointer-events-none"
                    >
                      {count}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Mini Legend */}
        <div className="flex justify-center items-center gap-6 mt-4 text-[10px] text-slate-400 border-t border-slate-800/60 pt-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700"></span>
            <span>No Incidents</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-yellow-500/20 border border-yellow-500 animate-pulse"></span>
            <span>1 Active (Low/Med)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500/30 border border-orange-500 animate-pulse"></span>
            <span>2 Active (High)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500/40 border border-red-500 animate-pulse"></span>
            <span>3+ / Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
}
