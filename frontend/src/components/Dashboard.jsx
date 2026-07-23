import React from "react";
import { Activity, Cpu, Clock, AlertCircle, BarChart3, ListFilter } from "lucide-react";

export default function Dashboard() {
  const METRICS = [
    { title: "Active Running Agents", value: "3", sub: "Currently executing tasks", icon: Activity, color: "text-emerald-400", borderHover: "hover:border-emerald-500/30 hover:shadow-emerald-500/5" },
    { title: "Accumulated LLM Cost", value: "₹42.80", sub: "Based on token counts", icon: Cpu, color: "text-indigo-400", borderHover: "hover:border-indigo-500/30 hover:shadow-indigo-500/5" },
    { title: "Average Latency", value: "1.24s", sub: "Response duration", icon: Clock, color: "text-amber-400", borderHover: "hover:border-amber-500/30 hover:shadow-amber-500/5" },
    { title: "Error Rate", value: "0.2%", sub: "Failed runs ratio", icon: AlertCircle, color: "text-rose-400", borderHover: "hover:border-rose-500/30 hover:shadow-rose-500/5" }
  ];

  const LOGS = [
    { timestamp: "5:08:12 PM", service: "agent", event: "Visual workflow 'Data Extractor' initiated by guest.", type: "INFO" },
    { timestamp: "5:08:14 PM", service: "auth", event: "Session cookie validated for guest user.", type: "INFO" },
    { timestamp: "5:08:15 PM", service: "agent", event: "Routed Prompt to Groq Llama 3.3 successfully.", type: "INFO" },
    { timestamp: "5:08:17 PM", service: "billing", event: "Deducted 5 credits from guest account.", type: "INFO" },
    { timestamp: "5:08:19 PM", service: "agent", event: "Parallel node branch 'Fetch API' finished in 1.4s.", type: "INFO" }
  ];

  // 3D Mouse Tilt Handlers
  const handleTiltMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const angleX = (yc - y) / 8; // tilt sensitivity
    const angleY = (x - xc) / 8;
    
    card.style.transform = `perspective(800px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.02, 1.02, 1.02)`;

    // Calculate glare gradient position
    const glare = card.querySelector(".card-glare");
    if (glare) {
      glare.style.opacity = "0.15";
      glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.8) 0%, transparent 60%)`;
    }
  };

  const handleTiltLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = `perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    card.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
    const glare = card.querySelector(".card-glare");
    if (glare) {
      glare.style.opacity = "0";
    }
  };

  const handleTiltEnter = (e) => {
    const card = e.currentTarget;
    card.style.transition = "none";
  };

  return (
    <div className="flex-1 bg-[#090b0f] p-8 overflow-y-auto h-full flex flex-col gap-6 relative">
      {/* 3D Grid floor backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04]">
        <div 
          className="absolute -inset-[100%] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:48px_48px]"
          style={{
            transform: "perspective(600px) rotateX(60deg) translateY(-20%)",
            maskImage: "linear-gradient(to bottom, transparent, black 80%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 80%)"
          }}
        />
      </div>

      <div className="relative z-10 flex justify-between items-center border-b border-white/[0.06] pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="text-indigo-400" size={20} />
            Realtime Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1">Live metrics, model routing latency, execution logs, and system observability.</p>
        </div>
      </div>

      {/* Grid of 3D Stats Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {METRICS.map(stat => (
          <div 
            key={stat.title} 
            onMouseMove={handleTiltMove}
            onMouseLeave={handleTiltLeave}
            onMouseEnter={handleTiltEnter}
            style={{ transformStyle: "preserve-3d" }}
            className={`bg-[#0d0f14]/80 border border-white/[0.07] rounded-2xl p-5 flex items-center justify-between shadow-xl transition-all duration-300 ease-out transform-gpu select-none relative overflow-hidden backdrop-blur-md cursor-pointer ${stat.borderHover}`}
          >
            <div className="card-glare absolute inset-0 pointer-events-none rounded-2xl opacity-0 transition-opacity duration-300 z-20" />
            
            <div className="flex flex-col gap-1" style={{ transform: "translateZ(20px)" }}>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.title}</span>
              <span className="text-2xl font-bold text-slate-100 mt-0.5 tracking-tight">{stat.value}</span>
              <span className="text-[10px] text-slate-600 mt-0.5">{stat.sub}</span>
            </div>
            
            <div style={{ transform: "translateZ(30px)" }}>
              <stat.icon size={24} className={stat.color} />
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Observability list */}
        <div 
          onMouseMove={handleTiltMove}
          onMouseLeave={handleTiltLeave}
          onMouseEnter={handleTiltEnter}
          style={{ transformStyle: "preserve-3d" }}
          className="bg-[#0d0f14]/80 border border-white/[0.07] rounded-2xl p-6 flex flex-col gap-4 shadow-xl lg:col-span-2 relative overflow-hidden backdrop-blur-md transition-all duration-300 ease-out transform-gpu cursor-pointer hover:border-indigo-500/20"
        >
          <div className="card-glare absolute inset-0 pointer-events-none rounded-2xl opacity-0 transition-opacity duration-300 z-20" />

          <div className="flex justify-between items-center border-b border-white/[0.06] pb-3" style={{ transform: "translateZ(15px)" }}>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
              <ListFilter size={14} className="text-indigo-400" />
              Observability & Structured Logs
            </h3>
            <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold px-2 py-0.5 rounded-full animate-pulse">Live</span>
          </div>

          <div className="flex flex-col gap-3" style={{ transform: "translateZ(25px)" }}>
            {LOGS.map((log, index) => (
              <div key={index} className="flex gap-4 items-start text-xs border-b border-white/[0.02] pb-2 last:border-none">
                <span className="text-slate-600 font-mono shrink-0">{log.timestamp}</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold text-[9px] uppercase tracking-wide shrink-0">{log.service}</span>
                <p className="text-slate-300 flex-1 leading-relaxed">{log.event}</p>
                <span className="text-emerald-500 font-bold font-mono text-[10px]">{log.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics bar charts mock */}
        <div 
          onMouseMove={handleTiltMove}
          onMouseLeave={handleTiltLeave}
          onMouseEnter={handleTiltEnter}
          style={{ transformStyle: "preserve-3d" }}
          className="bg-[#0d0f14]/80 border border-white/[0.07] rounded-2xl p-6 flex flex-col gap-4 shadow-xl relative overflow-hidden backdrop-blur-md transition-all duration-300 ease-out transform-gpu cursor-pointer hover:border-violet-500/20"
        >
          <div className="card-glare absolute inset-0 pointer-events-none rounded-2xl opacity-0 transition-opacity duration-300 z-20" />

          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide border-b border-white/[0.06] pb-3" style={{ transform: "translateZ(15px)" }}>
            LLM Provider Usage
          </h3>
          
          <div className="flex-1 flex flex-col justify-around min-h-[200px]" style={{ transform: "translateZ(25px)" }}>
            {[
              { provider: "Groq (Llama)", percentage: 70, color: "bg-emerald-500" },
              { provider: "Gemini", percentage: 20, color: "bg-indigo-500" },
              { provider: "OpenRouter", percentage: 10, color: "bg-violet-500" }
            ].map(item => (
              <div key={item.provider} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-400">{item.provider}</span>
                  <span className="text-slate-200 font-semibold">{item.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
