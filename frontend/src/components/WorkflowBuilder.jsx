import React, { useState, useEffect } from "react";
import { Play, Save, Plus, ArrowRight, ShieldAlert, Check, RefreshCw } from "lucide-react";
import api from "../utils/axios";

const NODE_TYPES = ["LLM", "Prompt", "Tool", "API", "Memory", "Condition", "Loop", "Agent", "Output"];

export default function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [name, setName] = useState("New Workflow");
  const [description, setDescription] = useState("Visual automation flow");
  
  // Pending approvals list
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [outputs, setOutputs] = useState(null);

  useEffect(() => {
    fetchWorkflows();
    fetchApprovals();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const { data } = await api.get("/api/agent/workflows");
      setWorkflows(data.workflows);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchApprovals = async () => {
    try {
      const { data } = await api.get("/api/agent/workflows/approvals/pending");
      setApprovals(data.approvals);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateNew = () => {
    setSelectedWorkflow(null);
    setNodes([
      { id: "node_1", type: "Prompt", data: { template: "Hello, my query is: {{user_input}}" } },
      { id: "node_2", type: "LLM", data: { prompt: "{{node_1.text}}", temperature: 0.7, taskType: "chat" } },
      { id: "node_3", type: "Output", data: { outputFormat: "Final Response: {{node_2.response}}" } }
    ]);
    setEdges([
      { id: "edge_1", source: "node_1", target: "node_2" },
      { id: "edge_2", source: "node_2", target: "node_3" }
    ]);
    setName("New Visual Workflow");
    setDescription("Custom DAG workflow");
    setOutputs(null);
  };

  const handleLoadWorkflow = (wf) => {
    setSelectedWorkflow(wf);
    setNodes(wf.nodes);
    setEdges(wf.edges);
    setName(wf.name);
    setDescription(wf.description);
    setOutputs(null);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (selectedWorkflow) {
        // Update
        await api.post("/api/agent/workflows", {
          id: selectedWorkflow._id,
          name,
          description,
          nodes,
          edges
        });
      } else {
        // Create
        const { data } = await api.post("/api/agent/workflows", {
          name,
          description,
          nodes,
          edges
        });
        setSelectedWorkflow(data.workflow);
      }
      await fetchWorkflows();
      alert("Workflow saved successfully!");
    } catch (e) {
      alert("Failed to save: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!selectedWorkflow) {
      alert("Please save the workflow first!");
      return;
    }
    setLoading(true);
    setOutputs(null);
    try {
      const { data } = await api.post(`/api/agent/workflows/${selectedWorkflow._id}/execute`);
      if (data.message && data.message.includes("suspended")) {
        alert("Workflow executed successfully and suspended on an Approval Node. Check Approvals Feed!");
        await fetchApprovals();
      } else {
        setOutputs(data.outputs);
      }
    } catch (e) {
      alert("Execution error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (execId, approve) => {
    try {
      const { data } = await api.post("/api/agent/workflows/resume", {
        executionId: execId,
        approve
      });
      alert(data.message);
      await fetchApprovals();
      if (data.outputs) {
        setOutputs(data.outputs);
      }
    } catch (e) {
      alert("Approval handling failed: " + e.message);
    }
  };

  const addNode = (type) => {
    const id = `node_${nodes.length + 1}`;
    const newNode = {
      id,
      type,
      data: {
        template: type === "Prompt" ? "Template input" : "",
        prompt: type === "LLM" ? "Prompt text" : "",
        toolName: type === "Tool" ? "search" : "",
        url: type === "API" ? "https://api.example.com" : "",
        requireApproval: false
      }
    };
    setNodes([...nodes, newNode]);
  };

  const updateNodeData = (id, field, value) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, data: { ...n.data, [field]: value } } : n));
  };

  return (
    <div className="flex-1 flex bg-[#090b0f] overflow-hidden h-full">
      {/* Sidebar: Workflows list & Add node */}
      <div className="w-[300px] border-r border-white/[0.06] flex flex-col p-5 gap-5 shrink-0 bg-[#0d0f14]">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-200">Workflows</h3>
          <button onClick={handleCreateNew} className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-none cursor-pointer">
            <Plus size={15} />
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          {workflows.map(wf => (
            <button
              key={wf._id}
              onClick={() => handleLoadWorkflow(wf)}
              className={`w-full text-left p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                selectedWorkflow?._id === wf._id ? "bg-indigo-500/10 border-indigo-500/30 text-slate-100" : "bg-transparent border-white/[0.04] text-slate-400 hover:bg-white/[0.03]"
              }`}
            >
              <div className="font-semibold text-slate-200 truncate">{wf.name}</div>
              <div className="text-[10px] text-slate-500 truncate mt-1">{wf.description}</div>
            </button>
          ))}
        </div>

        <div className="border-t border-white/[0.06] pt-4">
          <h4 className="text-xs font-semibold text-slate-400 mb-3">Add Node to Canvas</h4>
          <div className="grid grid-cols-2 gap-2">
            {NODE_TYPES.map(type => (
              <button
                key={type}
                onClick={() => addNode(type)}
                className="py-2 text-center rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-xs font-medium text-slate-200 cursor-pointer transition-colors"
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Canvas & Details */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Controls header */}
        <div className="h-[60px] border-b border-white/[0.06] flex items-center justify-between px-6 bg-[#0d0f14]">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-transparent border-none text-slate-200 font-semibold focus:outline-none text-sm"
            />
            <span className="text-slate-600 text-xs">|</span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-transparent border-none text-slate-500 text-xs focus:outline-none w-[300px]"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 cursor-pointer disabled:opacity-50"
            >
              <Save size={13} />
              Save
            </button>
            <button
              onClick={handleExecute}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 border-none text-white cursor-pointer disabled:opacity-50"
            >
              <Play size={13} />
              Run Workflow
            </button>
          </div>
        </div>

        {/* Visual builder DAG display */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-8 flex flex-col gap-6 items-center justify-center bg-[radial-gradient(ellipse_at_center,#12141c_0%,#090b0f_100%)]">
            {nodes.length === 0 ? (
              <div className="text-slate-500 text-sm">Create a new canvas or load a workflow.</div>
            ) : (
              <div className="flex flex-col gap-6 items-center">
                {nodes.map((node, index) => (
                  <div key={node.id} className="flex flex-col items-center">
                    {/* Node block */}
                    <div className="w-[380px] bg-[#12141c] border border-white/[0.08] hover:border-indigo-500/40 rounded-xl p-4 flex flex-col gap-3 shadow-xl transition-all duration-150">
                      <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                        <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">{node.id} - {node.type}</span>
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-slate-500 flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={node.data?.requireApproval || false}
                              onChange={(e) => updateNodeData(node.id, "requireApproval", e.target.checked)}
                              className="rounded border-white/20 bg-slate-800 text-indigo-500"
                            />
                            Require Approval
                          </label>
                        </div>
                      </div>

                      {/* Inputs depending on node type */}
                      {node.type === "Prompt" && (
                        <textarea
                          placeholder="Template string: e.g.Translate {{node_1.text}}"
                          value={node.data.template || ""}
                          onChange={(e) => updateNodeData(node.id, "template", e.target.value)}
                          className="w-full h-16 bg-black/40 border border-white/[0.06] rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
                        />
                      )}
                      {node.type === "LLM" && (
                        <div className="flex flex-col gap-2">
                          <textarea
                            placeholder="Prompt payload"
                            value={node.data.prompt || ""}
                            onChange={(e) => updateNodeData(node.id, "prompt", e.target.value)}
                            className="w-full h-16 bg-black/40 border border-white/[0.06] rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <input
                              type="number"
                              step="0.1"
                              placeholder="Temp"
                              value={node.data.temperature || 0.7}
                              onChange={(e) => updateNodeData(node.id, "temperature", e.target.value)}
                              className="w-20 bg-black/40 border border-white/[0.06] rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
                            />
                            <select
                              value={node.data.taskType || "chat"}
                              onChange={(e) => updateNodeData(node.id, "taskType", e.target.value)}
                              className="flex-1 bg-black/40 border border-white/[0.06] rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
                            >
                              <option value="chat">Chat (Groq Llama)</option>
                              <option value="coding">Coding (DeepSeek)</option>
                              <option value="vision">Vision (Gemini)</option>
                            </select>
                          </div>
                        </div>
                      )}
                      {node.type === "Tool" && (
                        <select
                          value={node.data.toolName || "search"}
                          onChange={(e) => updateNodeData(node.id, "toolName", e.target.value)}
                          className="w-full bg-black/40 border border-white/[0.06] rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
                        >
                          <option value="search">Tavily Web Search</option>
                          <option value="calculator">Calculator</option>
                        </select>
                      )}
                      {node.type === "API" && (
                        <div className="flex flex-col gap-2">
                          <select
                            value={node.data.method || "GET"}
                            onChange={(e) => updateNodeData(node.id, "method", e.target.value)}
                            className="w-full bg-black/40 border border-white/[0.06] rounded-lg p-2 text-xs text-slate-300"
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                          </select>
                          <input
                            type="text"
                            placeholder="URL"
                            value={node.data.url || ""}
                            onChange={(e) => updateNodeData(node.id, "url", e.target.value)}
                            className="w-full bg-black/40 border border-white/[0.06] rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
                          />
                        </div>
                      )}
                      {node.type === "Output" && (
                        <input
                          type="text"
                          placeholder="Output structure: {{node_2.response}}"
                          value={node.data.outputFormat || ""}
                          onChange={(e) => updateNodeData(node.id, "outputFormat", e.target.value)}
                          className="w-full bg-black/40 border border-white/[0.06] rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
                        />
                      )}
                    </div>
                    {/* Connecting line */}
                    {index < nodes.length - 1 && (
                      <div className="flex flex-col items-center my-2">
                        <div className="w-[1.5px] h-8 bg-indigo-500/40" />
                        <ArrowRight className="rotate-90 text-indigo-500/40 w-4 h-4 -mt-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side panel: execution output & Approvals feed */}
          <div className="w-[380px] border-l border-white/[0.06] flex flex-col bg-[#0d0f14] divide-y divide-white/[0.06]">
            {/* Approvals feed */}
            <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1">
              <h4 className="text-xs font-bold text-slate-200 tracking-wider uppercase flex items-center gap-2">
                <ShieldAlert size={14} className="text-yellow-500" />
                Pending Approvals Feed
              </h4>
              {approvals.length === 0 ? (
                <div className="text-slate-500 text-xs mt-2">No pending approvals found.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {approvals.map(app => (
                    <div key={app._id} className="p-3.5 rounded-xl bg-yellow-500/5 border border-yellow-500/10 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-slate-200 text-xs">{app.workflowId?.name || "Workflow run"}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Suspended node: {app.currentNodeId}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleApprove(app._id, false)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold border-none cursor-pointer transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(app._id, true)}
                          className="px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-[10px] font-bold border-none cursor-pointer transition-colors"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Run logs/outputs */}
            <div className="p-5 flex flex-col gap-3 h-[250px] overflow-y-auto bg-black/10">
              <h4 className="text-xs font-bold text-slate-200 tracking-wider uppercase">Execution Outputs</h4>
              {outputs ? (
                <pre className="text-[11px] text-slate-300 font-mono bg-black/40 rounded-lg p-3 border border-white/[0.04] overflow-auto max-h-[160px]">
                  {JSON.stringify(outputs, null, 2)}
                </pre>
              ) : (
                <div className="text-slate-500 text-xs">Run a workflow to capture output logs.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
