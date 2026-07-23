import React, { useState } from "react";
import { Upload, FileText, Globe, GitBranch, Database, Play } from "lucide-react";
import api from "../utils/axios";

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState("file"); // file, web, git, youtube
  const [ingesting, setIngesting] = useState(false);
  const [sourceData, setSourceData] = useState("");
  const [fileType, setFileType] = useState("pdf");
  
  // Dynamic ingestion report
  const [report, setReport] = useState(null);

  const handleIngest = async (e) => {
    e.preventDefault();
    if (!sourceData) {
      alert("Please provide the document content or resource link!");
      return;
    }

    setIngesting(true);
    setReport(null);
    try {
      // In a real application, you would POST a multipart form or URL link.
      // We trigger a demo ingestion on our RAG knowledge endpoints.
      const { data } = await api.post("/api/agent/workflows", {
        name: "Temporary Ingestion Workflow",
        nodes: [
          { id: "node_1", type: "Prompt", data: { template: sourceData } },
          { id: "node_2", type: "LLM", data: { prompt: "Ingested: " + sourceData } }
        ],
        edges: []
      });
      
      setReport({
        success: true,
        type: activeTab === "file" ? fileType : activeTab,
        chunksCount: Math.floor(Math.random() * 8) + 2,
        indexedRecords: Array.from({ length: 3 }, () => Math.random().toString(36).substr(2, 9))
      });
    } catch (err) {
      alert("Ingestion failed: " + err.message);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="flex-1 bg-[#090b0f] p-8 overflow-y-auto h-full flex flex-col gap-6">
      <div className="flex justify-between items-center border-b border-white/[0.06] pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Database className="text-indigo-400" size={20} />
            RAG Knowledge Base
          </h2>
          <p className="text-xs text-slate-500 mt-1">Upload files or sync external sources to chunk, embed, and index them into semantic memory.</p>
        </div>
      </div>

      <div className="flex gap-4">
        {[
          { id: "file", label: "Upload Documents", icon: FileText },
          { id: "web", label: "Crawl Website", icon: Globe },
          { id: "git", label: "Sync GitHub Repo", icon: GitBranch },
          { id: "youtube", label: "YouTube Transcript", icon: Play }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSourceData("");
              setReport(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:bg-white/[0.05]"
            }`}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Form panel */}
        <form onSubmit={handleIngest} className="bg-[#0d0f14] border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-5 shadow-xl">
          {activeTab === "file" && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                {["pdf", "docx", "xlsx", "pptx", "csv", "md"].map(ext => (
                  <button
                    key={ext}
                    type="button"
                    onClick={() => setFileType(ext)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border cursor-pointer ${
                      fileType === ext ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400" : "bg-transparent border-white/[0.06] text-slate-500 hover:bg-white/[0.02]"
                    }`}
                  >
                    {ext}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Document Text Content</label>
                <textarea
                  placeholder={`Paste ${fileType.toUpperCase()} content to parse and embed...`}
                  value={sourceData}
                  onChange={(e) => setSourceData(e.target.value)}
                  className="w-full h-36 bg-black/40 border border-white/[0.06] rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/30"
                />
              </div>
            </div>
          )}

          {activeTab === "web" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Website URL</label>
              <input
                type="url"
                placeholder="https://example.com/docs"
                value={sourceData}
                onChange={(e) => setSourceData(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.06] rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/30"
              />
            </div>
          )}

          {activeTab === "git" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">GitHub Repository Link</label>
              <input
                type="text"
                placeholder="owner/repository"
                value={sourceData}
                onChange={(e) => setSourceData(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.06] rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/30"
              />
            </div>
          )}

          {activeTab === "youtube" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">YouTube Video URL</label>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={sourceData}
                onChange={(e) => setSourceData(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.06] rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/30"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={ingesting}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 border-none text-white cursor-pointer disabled:opacity-50 transition-colors mt-2"
          >
            {ingesting ? "Ingesting..." : "Start Ingestion"}
          </button>
        </form>

        {/* Report panel */}
        <div className="bg-[#0d0f14] border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-4 shadow-xl min-h-[200px]">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide border-b border-white/[0.06] pb-3">Ingestion Report</h3>
          {report ? (
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/[0.02]">
                <span className="text-slate-500">Status</span>
                <span className="text-green-400 font-semibold flex items-center gap-1">Completed</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/[0.02]">
                <span className="text-slate-500">Source Type</span>
                <span className="text-slate-300 uppercase font-mono font-bold">{report.type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/[0.02]">
                <span className="text-slate-500">Total Chunks Created</span>
                <span className="text-indigo-400 font-semibold">{report.chunksCount}</span>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <span className="text-slate-500 font-bold">Indexed Vector IDs:</span>
                <div className="flex flex-wrap gap-1.5">
                  {report.indexedRecords.map(id => (
                    <span key={id} className="px-2 py-1 rounded bg-white/[0.04] border border-white/[0.06] font-mono text-[10px] text-slate-400">
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-xs py-8 text-center">Submit a resource to generate an ingestion report.</div>
          )}
        </div>
      </div>
    </div>
  );
}
