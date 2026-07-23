import React, { useState } from "react";
import { Download, Check, Star, Settings, Shield } from "lucide-react";

const INITIAL_MARKETPLACE_AGENTS = [
  { id: "researcher", name: "Deep Researcher", description: "Performs recursive Tavily online deep searches and gathers contextual reports.", rating: 4.8, installed: true, enabled: true },
  { id: "coder", name: "GitHub Auto-Coder", description: "Reads codebase patterns, writes scripts, creates Pull Requests automatically.", rating: 4.9, installed: false, enabled: false },
  { id: "presentation", name: "SlideMaster PPT", description: "Generates elegant PowerPoint files from textual instructions.", rating: 4.6, installed: true, enabled: true },
  { id: "translator", name: "Multi-Lingual Translator", description: "Translates files and scripts into 40+ languages.", rating: 4.4, installed: false, enabled: false },
  { id: "analyst", name: "Financial Data Ingest", description: "Parses Excel spreadsheets and extracts financial trends and plots.", rating: 4.7, installed: false, enabled: false }
];

export default function Marketplace() {
  const [agents, setAgents] = useState(INITIAL_MARKETPLACE_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState(null);

  const handleInstall = (id) => {
    setAgents(agents.map(a => a.id === id ? { ...a, installed: true, enabled: true } : a));
  };

  const handleToggle = (id) => {
    setAgents(agents.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const handleRate = (id, rating) => {
    setAgents(agents.map(a => a.id === id ? { ...a, rating: parseFloat(((a.rating + rating) / 2).toFixed(1)) } : a));
  };

  return (
    <div className="flex-1 bg-[#090b0f] p-8 overflow-y-auto h-full flex flex-col gap-6">
      <div className="flex justify-between items-center border-b border-white/[0.06] pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Shield className="text-indigo-400" size={20} />
            Multi-Agent Marketplace
          </h2>
          <p className="text-xs text-slate-500 mt-1">Discover, configure, and install specialized AI agents into your workspace.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map(agent => (
          <div key={agent.id} className="bg-[#0d0f14] border border-white/[0.08] hover:border-indigo-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all duration-150">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-200 text-sm">{agent.name}</h3>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-yellow-500">
                  <Star size={12} fill="currentColor" />
                  {agent.rating}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{agent.description}</p>
            </div>

            <div className="border-t border-white/[0.04] mt-5 pt-4 flex justify-between items-center">
              {agent.installed ? (
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => handleToggle(agent.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border-none cursor-pointer transition-colors ${
                      agent.enabled ? "bg-green-500/10 hover:bg-green-500/20 text-green-400" : "bg-white/[0.04] hover:bg-white/[0.08] text-slate-400"
                    }`}
                  >
                    {agent.enabled ? "Enabled" : "Disabled"}
                  </button>
                  <button
                    onClick={() => setSelectedAgent(agent)}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border-none text-slate-300 cursor-pointer"
                  >
                    <Settings size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleInstall(agent.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 border-none text-white cursor-pointer transition-colors"
                >
                  <Download size={13} />
                  Install Agent
                </button>
              )}

              {/* Quick rate */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => handleRate(agent.id, star)}
                    className="p-0.5 bg-transparent border-none cursor-pointer text-slate-600 hover:text-yellow-500 transition-colors"
                  >
                    <Star size={11} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agent details configuration Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[420px] bg-[#0d0f14] border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-5">
            <div>
              <h3 className="font-bold text-slate-200 text-sm">Configure {selectedAgent.name}</h3>
              <p className="text-[11px] text-slate-500 mt-1">Apply specific API limits or connection protocols.</p>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Credit Limit per call</label>
                <input type="number" defaultValue="5" className="bg-black/40 border border-white/[0.06] rounded-xl p-3 text-xs text-slate-300 focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Dynamic Temperature</label>
                <input type="number" step="0.1" defaultValue="0.7" className="bg-black/40 border border-white/[0.06] rounded-xl p-3 text-xs text-slate-300 focus:outline-none" />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-2">
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setSelectedAgent(null);
                  alert("Configuration updated!");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 border-none text-white cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
