import React, { useState } from 'react';
import { Incident } from '@/lib/firestore';
import { ShieldCheck, XCircle, ArrowRight, Loader2, Sparkles, MessageSquareDot } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DecisionCardProps {
  incident: Incident | null;
  onResolve: (incidentId: string, resolutionStatus: 'resolved' | 'dismissed', notes: string) => Promise<void>;
  isResolving: boolean;
}

export default function DecisionCard({
  incident,
  onResolve,
  isResolving,
}: DecisionCardProps) {
  const [notes, setNotes] = useState('');
  const [showNotesForm, setShowNotesForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'resolved' | 'dismissed' | null>(null);

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] border border-dashed border-slate-800 rounded-2xl bg-slate-900/10 p-6 text-center text-slate-500">
        <Sparkles className="w-8 h-8 text-slate-700 mb-3 animate-pulse" />
        <p className="text-sm font-medium">Select an incident from the feed</p>
        <p className="text-xs text-slate-600 mt-1">AI Copilot will display decision recommendations and actions here.</p>
      </div>
    );
  }

  const handleAction = async (status: 'resolved' | 'dismissed') => {
    setSelectedStatus(status);
    setShowNotesForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) return;

    await onResolve(incident.id, selectedStatus, notes);
    
    if (selectedStatus === 'resolved') {
      // Trigger a beautiful resolution confetti explosion!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#10b981', '#3b82f6'],
      });
    }

    // Reset state
    setNotes('');
    setShowNotesForm(false);
    setSelectedStatus(null);
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 px-2 py-0.5 rounded">
              ID: {incident.id.substring(0, 8)}
            </span>
            <span className="text-xs text-slate-400">
              Reported in {incident.location}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-200 mt-1">Incident Inspector</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] px-2 py-0.5 font-bold uppercase rounded border border-red-500/30 bg-red-500/10 text-red-400">
            Severity: {incident.severity}
          </span>
        </div>
      </div>

      {/* Details Box */}
      <div className="space-y-3 bg-slate-950/40 border border-slate-850 p-4 rounded-xl">
        <div>
          <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">Raw Ground Report</span>
          <p className="text-sm text-slate-300 mt-1 leading-relaxed italic">
            "{incident.text}"
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2.5 border-t border-slate-900">
          <div>
            <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">AI Extracted Tag</span>
            <p className="text-sm text-slate-300 mt-0.5 font-semibold">{incident.category}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">Suggested Team</span>
            <p className="text-sm text-slate-300 mt-0.5 font-semibold text-cyan-400">
              {incident.suggested_teams?.join(', ') || 'General Operations'}
            </p>
          </div>
        </div>
      </div>

      {/* AI Decision Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-cyan-400">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-bold tracking-wider uppercase">AI Decision Copilot Recommendations</span>
        </div>

        <div className="space-y-3">
          {incident.recommendations && incident.recommendations.length > 0 ? (
            incident.recommendations.map((rec, index) => (
              <div
                key={rec.id || index}
                className={`flex gap-3.5 p-4 rounded-xl border transition-all duration-200 ${
                  index === 0
                    ? 'bg-cyan-950/10 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.03)]'
                    : 'bg-slate-950/20 border-slate-800/80'
                }`}
              >
                {/* Number Badge */}
                <div className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black shrink-0 ${
                  index === 0
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  #{index + 1}
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-200">
                    {rec.action}
                  </h4>
                  <div className="flex items-start gap-1 text-slate-400 text-xs leading-relaxed">
                    <MessageSquareDot className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-300 font-medium">Reasoning:</strong> {rec.reasoning}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500">No recommended actions available.</div>
          )}
        </div>
      </div>

      {/* Action / Form Area */}
      {!showNotesForm ? (
        <div className="flex gap-3 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => handleAction('resolved')}
            disabled={isResolving}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm py-3 px-4 rounded-xl transition shadow-lg shadow-emerald-950/20 active:scale-[0.98] disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Approve & Resolve</span>
          </button>
          <button
            onClick={() => handleAction('dismissed')}
            disabled={isResolving}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-sm py-3 px-4 rounded-xl transition active:scale-[0.98] disabled:opacity-50"
          >
            <XCircle className="w-4 h-4 text-slate-400" />
            <span>Dismiss Report</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-850">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Resolution Notes / Log Details
            </label>
            <textarea
              required
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                selectedStatus === 'resolved'
                  ? 'Describe resolution actions (e.g. Deploying extra stewards from gate C to gate A)'
                  : 'Reason for dismissing this report (e.g. Duplicate report, false alarm)'
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isResolving}
              className="flex-1 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm py-2.5 px-4 rounded-xl transition active:scale-[0.98] disabled:opacity-50"
            >
              {isResolving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>Complete Action</span>
            </button>
            <button
              type="button"
              disabled={isResolving}
              onClick={() => {
                setShowNotesForm(false);
                setSelectedStatus(null);
                setNotes('');
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-850 text-slate-400 text-sm font-semibold transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
