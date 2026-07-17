import React from 'react';
import { Incident } from '@/lib/firestore';
import { ShieldAlert, AlertTriangle, Activity, Wrench, Search, MapPin, Clock } from 'lucide-react';

interface IncidentFeedProps {
  incidents: Incident[];
  selectedIncidentId: string | null;
  onSelectIncident: (incident: Incident) => void;
  title: string;
}

export default function IncidentFeed({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  title,
}: IncidentFeedProps) {
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Security':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'Medical':
        return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'Crowd':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'Facility':
        return <Wrench className="w-4 h-4 text-cyan-400" />;
      case 'Lost Person':
        return <Search className="w-4 h-4 text-indigo-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse';
      case 'High':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'Medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-700/50';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'dismissed':
        return 'bg-slate-800 text-slate-500 border-slate-700';
      case 'resolving':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'investigating':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    
    let date: Date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp);
    }

    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-slate-300 tracking-wider uppercase">{title}</h3>
        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700 font-mono">
          {incidents.length}
        </span>
      </div>

      <div 
        className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[500px] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
        aria-live="polite"
      >
        {incidents.length === 0 ? (
          <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
            No incidents logged
          </div>
        ) : (
          incidents.map((incident) => {
            const isSelected = selectedIncidentId === incident.id;
            return (
              <div
                key={incident.id}
                onClick={() => onSelectIncident(incident)}
                className={`relative group cursor-pointer border rounded-xl p-4 transition-all duration-300 ${
                  isSelected
                    ? 'bg-slate-800/80 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                {/* Glowing Left Border for Selected or Critical */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all ${
                    isSelected
                      ? 'bg-cyan-400'
                      : incident.severity === 'Critical'
                      ? 'bg-red-500 animate-pulse'
                      : 'bg-transparent group-hover:bg-slate-700'
                  }`}
                />

                <div className="flex justify-between items-start gap-2 mb-2 pl-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Category Icon & Tag */}
                    <div className="flex items-center gap-1 bg-slate-950/60 border border-slate-800 px-2.5 py-0.5 rounded-full text-xs font-medium text-slate-300">
                      {getCategoryIcon(incident.category)}
                      <span>{incident.category}</span>
                    </div>

                    {/* Location Badge */}
                    <div className="flex items-center gap-0.5 text-xs text-slate-400 bg-slate-950/20 border border-slate-800/40 px-2 py-0.5 rounded-full">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{incident.location}</span>
                    </div>
                  </div>

                  {/* Severity Badge */}
                  <span className={`text-[10px] px-2 py-0.5 font-bold uppercase rounded border ${getSeverityStyle(incident.severity)}`}>
                    {incident.severity}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-300 line-clamp-2 mb-3 pl-1.5">
                  {incident.text}
                </p>

                {/* Footer status and time */}
                <div className="flex justify-between items-center text-xs border-t border-slate-800/60 pt-2.5 pl-1.5">
                  <span className={`text-[10px] px-2 py-0.5 font-semibold rounded-full border ${getStatusStyle(incident.status)}`}>
                    {incident.status}
                  </span>

                  <span className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(incident.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
