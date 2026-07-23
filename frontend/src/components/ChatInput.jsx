import { useState } from "react";
import { Send, Paperclip,  Square, Zap, MessageSquare, Code2, Presentation, Image as ImageIcon, Globe, FileText,X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addMessage, appendMessageChunk, setArtifacts, setIsLoading } from "../redux/message.slice";
import { sendPrompt } from "../features/agent.api";
import { Mic, MicOff } from "lucide-react";
import { useEffect } from "react";
import { createConversation, updateConversations } from "../features/conversation.api";
import { addConversation, setConvTitle, setSelectedConversation } from "../redux/conversation.slice";
import { useRef } from "react";

export default function ChatInput({
  setBanner
}) {
  const [selectedAgent, setSelectedAgent] =useState("auto");
  const [value, setValue] = useState("");
const [isListening, setIsListening] = useState(false);

const recognitionRef = useRef(null);
  const dispatch = useDispatch();
  const { selectedConversation } = useSelector(state => state.conversation);
   const { isLoading } = useSelector(state => state.message);
const fileRef = useRef(null);

const [

selectedFile,

setSelectedFile

]=useState(null);

   const placeholders={

auto:"Ask CortexAI...",

chat:"Chat with CortexAI...",

coding:"Describe the software you want...",

pdf:"Generate a PDF about...",

ppt:"Create a presentation about...",

image:"Describe the image...",

search:"Search the web..."

};

   const agents = [

  {
    id:"auto",
    icon:Zap,
    label:"Auto"
  },

  {
    id:"chat",
    icon:MessageSquare,
    label:"Chat"
  },

  {
    id:"coding",
    icon:Code2,
    label:"Coding"
  },

  {
    id:"pdf",
    icon:FileText,
    label:"PDF"
  },

  {
    id:"ppt",
    icon:Presentation,
    label:"PPT"
  },

  {
    id:"image",
    icon:ImageIcon,
    label:"Image"
  },

  {
    id:"search",
    icon:Globe,
    label:"Search"
  }

];

useEffect(() => {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) return;

  const recognition = new SpeechRecognition();

  recognition.lang = "en-IN";

  recognition.interimResults = true;

  recognition.continuous = true;

  recognition.onresult = (event) => {

    let transcript = "";

    for (

      let i = event.resultIndex;

      i < event.results.length;

      i++

    ) {

      transcript += event.results[i][0].transcript;

    }

    setValue(transcript);

  };

  recognition.onend = () => {

    setIsListening(false);

  };

  recognitionRef.current = recognition;

}, []);

const toggleMic = () => {

  if (!recognitionRef.current) {

    alert("Speech Recognition not supported");

    return;

  }

  if (isListening) {

    recognitionRef.current.stop();

    setIsListening(false);

  } else {

    recognitionRef.current.start();

    setIsListening(true);

  }

};


  const handleSend = async () => {
    const prompt = value.trim();
    if (!prompt) return;

    dispatch(setIsLoading(true));

    try {


      let conversation = selectedConversation;

      if (!conversation) {
        const newConversation = await createConversation();
        dispatch(addConversation(newConversation));
        dispatch(setSelectedConversation(newConversation));
        conversation = newConversation;
      }

      if (conversation.title === "New Chat") {
        await updateConversations(conversation._id, prompt.slice(0, 40));
        dispatch(setConvTitle({ conversationId: conversation._id, title: prompt.slice(0, 40) }));
      }

      setValue("");

      if (selectedFile) {
        dispatch(addMessage({ role: "user", content: prompt }));
        const formData = new FormData();
        formData.append("conversationId", conversation._id);
        formData.append("prompt", prompt);
        formData.append("agent", selectedAgent);
        formData.append("file", selectedFile);
        setSelectedFile(null);

        const data = await sendPrompt(formData);
        dispatch(
          addMessage({
            role: "assistant",
            content: data.answer,
            images: data.images
          })
        );
        if (data.artifacts) {
          dispatch(setArtifacts(data.artifacts));
        }
      } else {
        dispatch(addMessage({ role: "user", content: prompt }));
        dispatch(addMessage({ role: "assistant", content: "" }));

        const serverUrl = import.meta.env.VITE_SERVER_URL || "";
        const response = await fetch(`${serverUrl}/api/agent/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            prompt,
            conversationId: conversation._id,
            agent: selectedAgent,
            stream: true
          }),
          credentials: "include"
        });

        if (!response.ok) {
          throw new Error(`Streaming failed: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop(); // keep partial line in buffer

          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine.startsWith("data: ")) continue;

            const dataStr = cleanLine.substring(6);
            if (dataStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.chunk) {
                dispatch(appendMessageChunk(parsed.chunk));
              }
            } catch (err) {
              console.error("Error parsing chunk:", err);
            }
          }
        }
      }
    }
catch(error){

  setBanner({

    open:true,

    title:
      error.response?.data?.title ||
      "Something went wrong",

    message:
      error.response?.data?.message ||
      "Please try again."

  });

}
  finally {
       dispatch(setIsLoading(false));
    }
  };

  return (
    <div className="w-full overflow-hidden px-4 md:px-6 py-3 border-t border-white/[0.04] bg-[#090b0f] relative z-20">
      <div 
        className={`flex flex-col gap-2 bg-[#11131a]/85 border rounded-2xl px-4 pt-3 pb-2.5 shadow-xl transition-all duration-300 
          ${
            isListening 
              ? "border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.15)] bg-[#141115]" 
              : "border-white/[0.06] focus-within:border-indigo-500/40 focus-within:shadow-[0_0_25px_rgba(99,102,241,0.1)] focus-within:bg-[#12141d]"
          }`}
      >
        {/* Agent Capsules */}
        <div className="flex w-full gap-1.5 pr-2 flex-wrap items-center">
          {agents.map((agent) => {
            const Icon = agent.icon;
            const isActive = selectedAgent === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`
                  flex-shrink-0
                  inline-flex
                  items-center
                  gap-1.5
                  px-3
                  py-1
                  rounded-full
                  text-[10.5px]
                  font-bold
                  border
                  transition-all
                  duration-250
                  hover:scale-[1.04]
                  active:scale-[0.97]
                  cursor-pointer
                  tracking-wide
                  ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 text-white border-transparent shadow-[0_2px_12px_rgba(99,102,241,0.35)]"
                      : "bg-white/[0.02] text-slate-400 border-white/[0.05] hover:bg-white/[0.06] hover:text-slate-200"
                  }
                `}
              >
                <Icon
                  size={11}
                  className={isActive ? "text-white" : "text-slate-500"}
                />
                {agent.label}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399] ml-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected file preview */}
        {selectedFile && (
          <div className="my-0.5">
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5">
              {selectedFile.type === "application/pdf" ? (
                <FileText size={14} className="text-red-400" />
              ) : selectedFile?.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  className="h-8 w-8 rounded-lg object-cover"
                />
              ) : null}
              <div>
                <p className="text-[11px] text-white">{selectedFile.name}</p>
                <p className="text-[9px] text-slate-500">{Math.ceil(selectedFile.size / 1024)} KB</p>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  fileRef.current.value = "";
                }}
                className="ml-1.5 cursor-pointer"
              >
                <X size={12} className="text-slate-500 hover:text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Textarea */}
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={placeholders[selectedAgent]}
          rows={2}
          disabled={isLoading}
          className="w-full bg-transparent outline-none resize-none text-[13px] text-slate-100 placeholder:text-slate-500 leading-relaxed [scrollbar-width:none] [&::-webkit-scrollbar]:hidden disabled:opacity-50 py-0.5 mt-0.5"
        />

        {/* Bottom row */}
        <div className="flex items-center justify-between border-t border-white/[0.04] pt-2">
          {/* Left — attach + mic */}
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              hidden
              accept=".pdf,image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setSelectedFile(file);
                }
              }}
            />
            
            <button 
              className="flex items-center justify-center w-8 h-8 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-150 bg-transparent cursor-pointer shadow-sm"
              onClick={() => fileRef.current.click()}
            >
              <Paperclip size={13} />
            </button>
            
            <button
              onClick={toggleMic}
              className={`
                flex
                items-center
                justify-center
                w-8
                h-8
                rounded-xl
                border
                transition-all
                duration-150
                cursor-pointer
                shadow-sm
                ${
                  isListening
                    ? "bg-rose-500 text-white border-transparent animate-pulse"
                    : "text-slate-400 border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-slate-200"
                }
              `}
            >
              {isListening ? <MicOff size={13} /> : <Mic size={13} />}
            </button>
          </div>

          {/* Right — send / stop */}
          <button
            onClick={handleSend}
            disabled={!isLoading && !value.trim()}
            className={`flex items-center justify-center w-9 h-9 rounded-xl border-none cursor-pointer transition-all duration-200 hover:scale-[1.05] active:scale-[0.95] shadow-lg
              ${isLoading
                ? "bg-white text-[#0d0f14] hover:bg-slate-100"
                : value.trim()
                ? "bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white shadow-[0_2px_12px_rgba(99,102,241,0.35)]"
                : "bg-white/[0.03] text-slate-600 border border-white/[0.04] cursor-not-allowed shadow-none"
              }`}
          >
            {isLoading ? <Square size={11} fill="currentColor" /> : <Send size={13} />}
          </button>
        </div>
      </div>

      <p className="text-center text-[10.5px] text-slate-700 mt-2.5">
        CortexAI can make mistakes. Verify important info.
      </p>
    </div>
  );
}