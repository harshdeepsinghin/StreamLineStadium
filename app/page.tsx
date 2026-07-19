'use client';

import React, { useState, useEffect } from 'react';
import { supabase, Incident } from '@/lib/supabaseClient';
import StadiumMap from '@/components/StadiumMap';
import IncidentFeed from '@/components/IncidentFeed';
import DecisionCard from '@/components/DecisionCard';
import { 
  PlusCircle, 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  Activity, 
  Clock, 
  Sparkles, 
  Loader2,
  CheckCircle
} from 'lucide-react';

export default function Home() {
  const [role, setRole] = useState<'reporter' | 'dashboard'>('reporter');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  
  // Filtering
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showResolvedHistory, setShowResolvedHistory] = useState(false);

  // Reporter form states
  const [reportText, setReportText] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [lastSubmittedIncident, setLastSubmittedIncident] = useState<Incident | null>(null);

  // Resolving states
  const [isResolving, setIsResolving] = useState(false);

  // 1. Hook up Supabase Real-time Listener
  useEffect(() => {
    const fetchIncidents = async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);
      if (error) {
        console.error("Error fetching initial incidents:", error);
      } else if (data) {
        const list = data as Incident[];
        setIncidents(list);
        
        // Update selected incident reference if it changed
        setSelectedIncident((prev) => {
          if (!prev) return null;
          const updated = list.find(inc => inc.id === prev.id);
          if (updated && JSON.stringify(updated) !== JSON.stringify(prev)) {
            return updated;
          }
          return updated ? prev : null;
        });
      }
    };

    fetchIncidents();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incidents',
        },
        () => {
          fetchIncidents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. Statistics derivation
  const activeIncidents = incidents.filter(inc => inc.active);
  const resolvedIncidents = incidents.filter(inc => !inc.active);
  
  // Group active incident counts by zone for the map
  const activeIncidentsByZone = activeIncidents.reduce((acc, inc) => {
    acc[inc.location] = (acc[inc.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const highSeverityCount = activeIncidents.filter(
    inc => inc.severity === 'High' || inc.severity === 'Critical'
  ).length;

  // Filtered incidents for dashboard display
  const displayedIncidents = incidents.filter(inc => {
    const matchesActive = showResolvedHistory ? !inc.active : inc.active;
    const matchesZone = selectedZone ? inc.location === selectedZone : true;
    return matchesActive && matchesZone;
  });

  // 3. Quick Tag Selection helper
  const handleQuickTag = (text: string) => {
    setReportText(text);
    setLastSubmittedIncident(null);
  };

  // 4. API calling: Intake /api/report
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) return;

    setIsSubmittingReport(true);
    setLastSubmittedIncident(null);

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reportText }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      const data = await response.json();
      setLastSubmittedIncident(data);
      setReportText('');
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Error submitting report. Please try again.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // 5. API calling: Resolve /api/incidents/[id]/resolve
  const handleIncidentResolve = async (
    incidentId: string,
    resolutionStatus: 'resolved' | 'dismissed',
    notes: string
  ) => {
    setIsResolving(true);
    try {
      const response = await fetch(`/api/incidents/${incidentId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutionStatus, notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to update incident status');
      }

      // Close the inspector if we dismissed/resolved
      setSelectedIncident(null);
    } catch (err) {
      console.error('Error resolving incident:', err);
      alert('Error updating status. Please try again.');
    } finally {
      setIsResolving(false);
    }
  };

  const quickTemplates = [
    { title: 'Crowd Bottleneck', text: 'Crowd bottleneck forming at Gate A, scanning speed is very slow.' },
    { title: 'Medical Issue', text: 'A fan fainted in South Stand, Section 104, row 15. Requires urgent medical assistance.' },
    { title: 'Fan Altercation', text: 'Verbal altercation between opposing fans at Gate C, tension is escalating.' },
    { title: 'Water Leak', text: 'Water overflow from North Stand toilets is leaking onto the corridor floor.' },
    { title: 'Lost Child', text: 'A 7-year-old child wearing a red cap is lost near Gate B.' },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Operations Navbar Banner */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-md shadow-cyan-900/30">
            <Sparkles className="w-5 h-5 text-slate-950 font-black animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              SLS — StreamLineStadium
              <span className="text-[10px] tracking-widest font-mono bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full uppercase">
                AI Copilot v1.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">Stadium Decision-Engine and Operational Intelligence Hub</p>
          </div>
        </div>

        {/* Live Status Bar */}
        <div className="hidden lg:flex items-center gap-6 text-xs border-l border-r border-slate-800 px-8 py-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-slate-300 font-semibold uppercase">Live Operations Active</span>
          </div>
          <div className="text-slate-400">
            Match Status: <strong className="text-slate-200">Second Half - Min 72</strong>
          </div>
          <div className="text-slate-400">
            Attendance: <strong className="text-slate-200">64,280</strong>
          </div>
        </div>

        {/* Interactive Role Switcher */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800" role="tablist" aria-label="View Switcher">
          <button
            onClick={() => setRole('reporter')}
            role="tab"
            aria-selected={role === 'reporter'}
            aria-controls="panel-reporter"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              role === 'reporter'
                ? 'bg-slate-800 text-cyan-400 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="btn-role-reporter"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Reporter Intake</span>
          </button>
          <button
            onClick={() => setRole('dashboard')}
            role="tab"
            aria-selected={role === 'dashboard'}
            aria-controls="panel-dashboard"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              role === 'dashboard'
                ? 'bg-slate-800 text-cyan-400 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="btn-role-dashboard"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Ops Dashboard</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* REPORTER ROLE VIEW */}
        {role === 'reporter' && (
          <section id="panel-reporter" role="tabpanel" aria-labelledby="btn-role-reporter" className="max-w-2xl mx-auto space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6">
              <div className="border-b border-slate-800/80 pb-4">
                <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-cyan-400" />
                  Ground Incident Reporting
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Type a plain-language report describing what is happening on the stadium floor. AI will structure it and triage.
                </p>
              </div>

              {/* Input Form */}
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label htmlFor="report-input" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Describe Incident
                  </label>
                  <textarea
                    id="report-input"
                    rows={4}
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    required
                    placeholder="e.g. Queue at Gate A is starting to back up outside the barriers. Stewards need help directing people..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReport || !reportText.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-sm py-3.5 px-6 rounded-xl transition shadow-lg shadow-cyan-950/20 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                  id="btn-submit-report"
                >
                  {isSubmittingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>AI Triage Processing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                      <span>Submit Smart Incident Report</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick templates */}
              <div className="space-y-3">
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Incident Scenarios (Click to test)
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickTemplates.map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickTag(tpl.text)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition active:bg-slate-900"
                    >
                      {tpl.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Last Submitted Status Tracker */}
            {lastSubmittedIncident && (
              <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2.5 text-emerald-400">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <h3 className="font-bold text-slate-200">Incident Dispatched Successfully</h3>
                </div>

                <div className="space-y-3 text-sm bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">CATEGORY</span>
                    <span className="font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {lastSubmittedIncident.category}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">LOCATION</span>
                    <span className="font-bold text-cyan-400">{lastSubmittedIncident.location}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">SEVERITY ASSIGNED</span>
                    <span className="font-bold text-red-400">{lastSubmittedIncident.severity}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">AI ESTIMATED RESPONSE</span>
                    <span className="font-mono font-bold text-yellow-400">
                      {lastSubmittedIncident.severity === 'Critical' ? 'Immediate' : '4 minutes'}
                    </span>
                  </div>
                  <div className="border-t border-slate-900 pt-2 text-xs text-slate-400">
                    <strong className="text-slate-300">AI Extracted Summary:</strong> {lastSubmittedIncident.description}
                  </div>
                </div>

                <p className="text-xs text-slate-500 text-center">
                  Live Operations Manager has been notified and will verify recommendations shortly.
                </p>
              </div>
            )}
          </section>
        )}

        {/* OPS MANAGER DASHBOARD VIEW */}
        {role === 'dashboard' && (
          <section id="panel-dashboard" role="tabpanel" aria-labelledby="btn-role-dashboard" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left 4 Cols: Stadium Map & Quick Stats */}
            <div className="lg:col-span-4 space-y-6">
              {/* Stadium Map */}
              <StadiumMap
                activeIncidentsByZone={activeIncidentsByZone}
                selectedZone={selectedZone}
                onSelectZone={setSelectedZone}
              />

              {/* Live Statistics Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl shadow-xl flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Active</span>
                    <span className="text-lg font-black text-slate-200">{activeIncidents.length}</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl shadow-xl flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-rose-950 text-rose-400 border border-rose-800/40">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Severity Warning</span>
                    <span className="text-lg font-black text-slate-200">{highSeverityCount}</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl shadow-xl flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Resolved Today</span>
                    <span className="text-lg font-black text-slate-200">{resolvedIncidents.length}</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl shadow-xl flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-950 text-amber-400 border border-amber-800/40">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Avg Response</span>
                    <span className="text-lg font-black text-slate-200">4.2m</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center 4 Cols: Live Incident Feed */}
            <div className="lg:col-span-4 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl h-full flex flex-col min-h-[500px]">
              {/* Active vs Resolved History Toggles */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 mb-5 shrink-0">
                <button
                  onClick={() => {
                    setShowResolvedHistory(false);
                    setSelectedIncident(null);
                  }}
                  className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold transition ${
                    !showResolvedHistory
                      ? 'bg-slate-850 text-cyan-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Active Incidents
                </button>
                <button
                  onClick={() => {
                    setShowResolvedHistory(true);
                    setSelectedIncident(null);
                  }}
                  className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold transition ${
                    showResolvedHistory
                      ? 'bg-slate-850 text-cyan-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Resolution Log
                </button>
              </div>

              <div className="flex-1">
                <IncidentFeed
                  incidents={displayedIncidents}
                  selectedIncidentId={selectedIncident?.id || null}
                  onSelectIncident={setSelectedIncident}
                  title={selectedZone ? `${selectedZone} Reports` : showResolvedHistory ? 'Resolved Log' : 'Incident Feed'}
                />
              </div>
            </div>

            {/* Right 4 Cols: Decision Copilot Card */}
            <div className="lg:col-span-4 h-full">
              <DecisionCard
                incident={selectedIncident}
                onResolve={handleIncidentResolve}
                isResolving={isResolving}
              />
            </div>

          </section>
        )}

      </main>
      
      {/* Footer Info */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 px-6 text-center text-xs text-slate-600">
        <p>© 2026 SLS - StreamLineStadium. FIFA World Cup Operations Triage Module. Built with Google Antigravity & GCP.</p>
      </footer>
    </div>
  );
}
