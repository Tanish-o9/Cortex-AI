import React, { useState, useEffect, useRef } from "react";
import api from "../utils/axios";
import { 
  Play, 
  Pause, 
  XCircle, 
  CheckCircle2, 
  Loader2, 
  Terminal, 
  Clock, 
  ChevronRight, 
  Cpu, 
  HelpCircle, 
  Calendar,
  AlertCircle
} from "lucide-react";

export default function AIOSMode() {
  const [goals, setGoals] = useState([]);
  const [activeGoal, setActiveGoal] = useState(null);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDesc, setNewGoalDesc] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  
  const logEndRef = useRef(null);

  // Fetch all goals on load
  const fetchGoals = async () => {
    try {
      const response = await api.get("/api/agent/goals");
      if (response.data.success) {
        setGoals(response.data.goals);
        if (response.data.goals.length > 0 && !activeGoal) {
          setActiveGoal(response.data.goals[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching goals:", err);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  // Poll details of the active goal if it is RUNNING
  useEffect(() => {
    if (!activeGoal) return;
    
    let timer;
    if (activeGoal.status === "RUNNING") {
      timer = setInterval(async () => {
        try {
          const response = await api.get(`/api/agent/goals/${activeGoal._id}`);
          if (response.data.success) {
            setActiveGoal(response.data.goal);
            // Refresh goals list silently
            const listRes = await api.get("/api/agent/goals");
            if (listRes.data.success) {
              setGoals(listRes.data.goals);
            }
          }
        } catch (err) {
          console.error("Error polling goal:", err);
        }
      }, 2500);
    }

    return () => clearInterval(timer);
  }, [activeGoal?._id, activeGoal?.status]);

  // Scroll active logs to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeGoal?.tasks]);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    setIsLoading(true);
    try {
      const response = await api.post("/api/agent/goals", {
        title: newGoalTitle,
        description: newGoalDesc
      });
      if (response.data.success) {
        setGoals(prev => [response.data.goal, ...prev]);
        setActiveGoal(response.data.goal);
        setNewGoalTitle("");
        setNewGoalDesc("");
      }
    } catch (err) {
      console.error("Error creating goal:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (action) => {
    if (!activeGoal) return;
    try {
      const response = await api.post(`/api/agent/goals/${activeGoal._id}/status`, { action });
      if (response.data.success) {
        setActiveGoal(response.data.goal);
        fetchGoals();
      }
    } catch (err) {
      console.error("Error updating goal status:", err);
    }
  };

  // Find currently running or active task logs
  const activeTask = activeGoal?.tasks.find(t => t.id === (selectedTaskId || activeGoal.currentTaskId)) 
    || activeGoal?.tasks.find(t => t.status === "RUNNING")
    || activeGoal?.tasks[0];

  const getStatusIcon = (status) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 size={16} className="text-emerald-400" />;
      case "RUNNING":
        return <Loader2 size={16} className="text-indigo-400 animate-spin" />;
      case "FAILED":
        return <AlertCircle size={16} className="text-rose-500" />;
      default:
        return <Clock size={16} className="text-slate-600" />;
    }
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#090b0f] text-slate-100 font-medium">
      
      {/* Sidebar: Goals List & Creator */}
      <div className="w-[300px] border-r border-white/[0.04] bg-[#0d0f14]/40 flex flex-col shrink-0">
        
        {/* Creator Panel */}
        <div className="p-4 border-b border-white/[0.04]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
            <Cpu size={14} className="text-indigo-400" />
            AI Operating System Mode
          </h2>
          <form onSubmit={handleCreateGoal} className="flex flex-col gap-2.5">
            <input
              type="text"
              placeholder="Assign Goal (e.g. Build a SaaS)"
              value={newGoalTitle}
              onChange={e => setNewGoalTitle(e.target.value)}
              disabled={isLoading}
              className="w-full bg-[#11131a] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
            />
            <textarea
              placeholder="Description (optional)"
              value={newGoalDesc}
              onChange={e => setNewGoalDesc(e.target.value)}
              disabled={isLoading}
              rows={2}
              className="w-full bg-[#11131a] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none [scrollbar-width:none]"
            />
            <button
              type="submit"
              disabled={isLoading || !newGoalTitle.trim()}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-90 disabled:opacity-50 border-none cursor-pointer shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Decomposing...
                </>
              ) : (
                "Launch Autonomous Goal"
              )}
            </button>
          </form>
        </div>

        {/* Goals List */}
        <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <p className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Active Deployments
          </p>
          
          {goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center gap-2 opacity-50">
              <Clock size={20} className="text-slate-600" />
              <p className="text-[11px] text-slate-400">No active goals yet.</p>
            </div>
          ) : (
            goals.map((g) => {
              const isSelected = activeGoal?._id === g._id;
              const completedCount = g.tasks.filter(t => t.status === "COMPLETED").length;
              const percent = Math.round((completedCount / g.tasks.length) * 100) || 0;
              return (
                <button
                  key={g._id}
                  onClick={() => {
                    setActiveGoal(g);
                    setSelectedTaskId(null);
                  }}
                  className={`w-full text-left p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? "bg-indigo-500/10 border-indigo-500/30 text-white" 
                      : "bg-transparent border-transparent hover:bg-white/[0.03] text-slate-400"
                  }`}
                >
                  <p className="text-xs font-bold truncate">{g.title}</p>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold shrink-0">{percent}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      g.status === "COMPLETED" ? "bg-emerald-400" :
                      g.status === "RUNNING" ? "bg-indigo-400 animate-pulse" :
                      g.status === "FAILED" ? "bg-rose-500" : "bg-slate-600"
                    }`} />
                    <span className="text-[9px] uppercase font-bold tracking-wider">{g.status}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Workspace Area */}
      {activeGoal ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Header Panel */}
          <div className="px-6 py-4 border-b border-white/[0.04] bg-[#0d0f14]/20 flex items-center justify-between shrink-0">
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-2">
                {activeGoal.title}
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  activeGoal.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                  activeGoal.status === "RUNNING" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                  activeGoal.status === "FAILED" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                  "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                }`}>
                  {activeGoal.status}
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-[600px] truncate">{activeGoal.description || "No description provided."}</p>
            </div>

            {/* Controllers */}
            <div className="flex items-center gap-2">
              {activeGoal.status === "RUNNING" && (
                <button
                  onClick={() => handleUpdateStatus("PAUSE")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] cursor-pointer transition-all"
                >
                  <Pause size={13} />
                  Pause
                </button>
              )}
              {activeGoal.status === "PAUSED" && (
                <button
                  onClick={() => handleUpdateStatus("RESUME")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white border-none cursor-pointer transition-all"
                >
                  <Play size={13} />
                  Resume
                </button>
              )}
              {activeGoal.status === "FAILED" && (
                <button
                  onClick={() => handleUpdateStatus("RESUME")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white border-none cursor-pointer transition-all"
                >
                  <Play size={13} />
                  Retry Execution
                </button>
              )}
              {["RUNNING", "PAUSED"].includes(activeGoal.status) && (
                <button
                  onClick={() => handleUpdateStatus("CANCEL")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer transition-all"
                >
                  <XCircle size={13} />
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Grid Layout: Checklist vs Terminal Logs */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden p-6 gap-6">
            
            {/* Left: Subtask Checklist */}
            <div className="lg:col-span-5 flex flex-col bg-[#0d0f14]/30 border border-white/[0.04] rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/[0.04] bg-[#0d0f14]/50 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Task Decomposition</span>
                <span className="text-[10px] font-bold text-slate-600">Click to view details</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {activeGoal.tasks.map((task) => {
                  const isTaskActive = activeTask?.id === task.id;
                  return (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`w-full text-left p-3.5 rounded-xl border flex gap-3 transition-all duration-200 cursor-pointer ${
                        isTaskActive 
                          ? "bg-white/[0.04] border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.05)]" 
                          : "bg-[#0d0f14]/20 border-white/[0.04] hover:border-white/[0.08]"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">{getStatusIcon(task.status)}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold ${isTaskActive ? "text-white" : "text-slate-300"}`}>{task.title}</p>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                        {task.dependsOn.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-2">
                            <span className="text-[9px] uppercase text-slate-600 font-bold">Needs:</span>
                            {task.dependsOn.map(depId => (
                              <span key={depId} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.04] text-slate-400 font-bold">
                                {depId}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronRight size={14} className="text-slate-600 shrink-0 self-center" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Holographic Terminal Logs & Reports */}
            <div className="lg:col-span-7 flex flex-col bg-[#0b0c10] border border-white/[0.04] rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/[0.04] bg-[#0c0d12] flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <Terminal size={14} />
                  Terminal Observability Logs
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                  {activeTask?.id || "LOGS"}
                </span>
              </div>
              
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Scrollable logs list */}
                <div className="flex-1 overflow-y-auto p-5 font-mono text-[11px] leading-relaxed text-slate-300 bg-slate-950/20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <p className="text-indigo-400 mb-2">// Active node execution context</p>
                  {activeTask?.logs && activeTask.logs.map((log, index) => (
                    <div key={index} className="flex gap-2.5 mb-1.5">
                      <span className="text-indigo-500 shrink-0 select-none">&gt;</span>
                      <span className="whitespace-pre-wrap">{log}</span>
                    </div>
                  ))}
                  
                  {activeTask?.status === "RUNNING" && (
                    <div className="flex gap-2.5 mt-2 text-indigo-400/80 animate-pulse">
                      <span className="shrink-0 select-none">&gt;</span>
                      <span>Processing instructions on LLM execution engine...</span>
                    </div>
                  )}

                  {activeTask?.error && (
                    <div className="flex gap-2.5 mt-3 text-rose-500">
                      <span className="shrink-0 select-none">!!</span>
                      <span className="font-bold">Error: {activeTask.error}</span>
                    </div>
                  )}

                  {activeTask?.output && (
                    <div className="mt-5 p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] text-slate-200">
                      <p className="text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle2 size={13} />
                        Execution Report
                      </p>
                      <p className="whitespace-pre-wrap leading-relaxed text-[12px]">{activeTask.output}</p>
                    </div>
                  )}
                  <div ref={logEndRef} />
                </div>
              </div>
            </div>
          </div>

          {/* Daily summaries Carousel timeline */}
          {activeGoal.dailySummaries && activeGoal.dailySummaries.length > 0 && (
            <div className="px-6 pb-6 shrink-0 flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar size={13} className="text-indigo-400" />
                Virtual Day Achievements Timeline
              </span>
              <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {activeGoal.dailySummaries.map((summary) => (
                  <div 
                    key={summary.day} 
                    className="flex-shrink-0 w-[300px] p-4 rounded-xl border border-white/[0.04] bg-[#0d0f14]/30 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">Day {summary.day} Summary</span>
                      <span className="text-[10px] text-slate-600 font-bold">
                        {new Date(summary.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11.5px] leading-relaxed text-slate-400 whitespace-pre-wrap">{summary.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4 select-none opacity-80">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Cpu size={24} className="text-indigo-400 animate-pulse" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold text-white">Autonomous AI Operating System</h2>
            <p className="text-xs text-slate-500 max-w-[340px] leading-relaxed">
              Launch a goal in the left panel. Cortex AI will decompose the goal and execute tasks in the background automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
