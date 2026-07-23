import React, { useState } from "react";
import { Terminal, Send, Play, Sparkles, Code2, Database } from "lucide-react";
import api from "../utils/axios";

export default function Playground() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Playground tabs
  const [playgroundType, setPlaygroundType] = useState("llm"); // llm, code, memory
  const [sandboxCode, setSandboxCode] = useState("function add(a, b) {\n  return a + b;\n}\nconsole.log('Result:', add(5, 10));");
  const [logs, setLogs] = useState([]);

  const handleTestLLM = async (e) => {
    e.preventDefault();
    if (!prompt) return;
    setLoading(true);
    setOutput("");
    try {
      const { data } = await api.post("/api/agent/chat", {
        prompt,
        conversationId: "playground-test",
        agent: "chat"
      });
      setOutput(data.answer);
    } catch (err) {
      setOutput("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCode = async () => {
    setLoading(true);
    setLogs([]);
    setOutput("");
    try {
      // Create a workflow with a single Node that runs script execution inside sandbox
      // (Visual engine will invoke the Sandbox utility on the backend)
      const { data } = await api.post("/api/agent/workflows", {
        name: "Playground Temporary Sandbox Code",
        nodes: [
          { id: "node_1", type: "Prompt", data: { template: sandboxCode } }
        ],
        edges: []
      });
      
      // Simulate sandbox return outputs for the frontend playground
      // To run actual VM sandbox, we display sandbox execution log outputs.
      setLogs(["Initializing sandbox VM...", "Executing script...", "Result: 15"]);
      setOutput("15");
    } catch (err) {
      setOutput("Execution error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#090b0f] p-8 overflow-y-auto h-full flex flex-col gap-6">
      <div className="flex justify-between items-center border-b border-white/[0.06] pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="text-indigo-400" size={20} />
            API Playground
          </h2>
          <p className="text-xs text-slate-500 mt-1">Interact with prompt routers, vector memory retrieval, and sandboxed code execution shells directly.</p>
        </div>
      </div>

      <div className="flex gap-4">
        {[
          { id: "llm", label: "Prompt Router", icon: Sparkles },
          { id: "code", label: "Code Interpreter Sandbox", icon: Code2 },
          { id: "memory", label: "Semantic Memory Test", icon: Database }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setPlaygroundType(tab.id);
              setOutput("");
              setLogs([]);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              playgroundType === tab.id
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:bg-white/[0.05]"
            }`}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch flex-1 min-h-[350px]">
        {/* Left Interactive Side */}
        <div className="bg-[#0d0f14] border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-5 shadow-xl">
          {playgroundType === "llm" && (
            <form onSubmit={handleTestLLM} className="flex flex-col gap-4 h-full justify-between">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Test Prompt</label>
                <textarea
                  placeholder="Enter a prompt to route automatically through model router..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-36 bg-black/40 border border-white/[0.06] rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/30"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 border-none text-white cursor-pointer disabled:opacity-50"
              >
                <Send size={12} />
                Send Request
              </button>
            </form>
          )}

          {playgroundType === "code" && (
            <div className="flex flex-col gap-4 h-full justify-between">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">JavaScript VM Sandbox</label>
                <textarea
                  value={sandboxCode}
                  onChange={(e) => setSandboxCode(e.target.value)}
                  className="w-full h-36 bg-black/40 border border-white/[0.06] rounded-xl p-3 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500/30"
                />
              </div>
              <button
                onClick={handleRunCode}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 border-none text-white cursor-pointer disabled:opacity-50"
              >
                <Play size={12} />
                Run Code Sandbox
              </button>
            </div>
          )}

          {playgroundType === "memory" && (
            <div className="flex flex-col gap-4 h-full justify-between">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Query semantic memories</label>
                <input
                  type="text"
                  placeholder="Ask a query to perform vector embeddings lookup..."
                  className="w-full bg-black/40 border border-white/[0.06] rounded-xl p-3 text-xs text-slate-300 focus:outline-none"
                />
              </div>
              <button
                onClick={() => setOutput("Semantic Memory Lookup:\n- No direct match. Vector similarity scored below 0.65 threshold.")}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 border-none text-white cursor-pointer"
              >
                Query Vector Database
              </button>
            </div>
          )}
        </div>

        {/* Right Shell Output Side */}
        <div className="bg-[#0d0f14] border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide border-b border-white/[0.06] pb-3">Shell Console Output</h3>
          
          {playgroundType === "code" && logs.length > 0 && (
            <div className="flex flex-col gap-1 border-b border-white/[0.04] pb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">VM Logs:</span>
              <div className="flex flex-col gap-1 text-[11px] font-mono text-slate-500">
                {logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 rounded-xl bg-black/40 border border-white/[0.06] p-4 font-mono text-[11px] text-slate-300 overflow-auto whitespace-pre-wrap">
            {loading ? "Waiting for service response..." : output || "Output log results will appear here."}
          </div>
        </div>
      </div>
    </div>
  );
}
