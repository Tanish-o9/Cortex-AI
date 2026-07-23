import { useEffect, useState } from "react";
import { Plus, MessageSquare, Settings, LogOut, User, PenSquare, Menu, X, Coins, ConeIcon, CoinsIcon, BarChart2, Terminal, Database, Activity, Cpu, ShieldAlert } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import api from "../utils/axios";
import { setUserData, setCurrentView } from "../redux/user.slice";
import { createConversation, getConversations } from "../features/conversation.api";
import { addConversation, setConversations, setSelectedConversation } from "../redux/conversation.slice";
import { getMessages } from "../features/message.api";
import { setArtifacts, setMessages } from "../redux/message.slice";
  import BillingDrawer from "./BillingDrawer";

export default function Sidebar() {
  const [hovered, setHovered]     = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
 const [imageError,setImageError]=useState(false)
  const { userData } = useSelector(state => state.user);
  const { conversations, selectedConversation } = useSelector(state => state.conversation);
  const dispatch = useDispatch();
const [showBilling, setShowBilling] =useState(false);
  const logout = async () => {
    try {
      await api.get("/api/auth/logout");
      dispatch(setUserData(null));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations();
        dispatch(setConversations(data));
      } catch (error) {
        console.log(error);
      }
    };
    fetchConversations();
  }, [userData?._id]);

  const handleCreateConversation = () => {
    dispatch(setSelectedConversation(null));
    dispatch(setMessages([]));
    dispatch(setArtifacts([]));
    setMobileOpen(false);
  };

  const handleSelectConversation = async (conversation) => {
    setMobileOpen(false);
    dispatch(setSelectedConversation(conversation));
    const messages = await getMessages(conversation._id);
    dispatch(setMessages(messages));
     dispatch(setArtifacts(messages.artifacts));
  };

  const PanelIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
    </svg>
  );

  /* ── Collapsed rail — desktop only ── */
  const CollapsedRail = () => (
    <div className="hidden lg:flex flex-col items-center w-[56px] h-screen bg-[#0d0f14] border-r border-white/[0.06] py-4 gap-1 shrink-0">
      <button
        onClick={() => setCollapsed(false)}
        className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent border-none cursor-pointer mb-1"
      >
        <PanelIcon />
      </button>

      <button
        onClick={handleCreateConversation}
        className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent border-none cursor-pointer"
      >
        <Plus size={17} />
      </button>

      <div className="flex-1 flex flex-col items-center gap-1 overflow-y-auto w-full px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mt-1">
        {conversations.map((chat) => {
          const isActive = selectedConversation?._id === chat._id;
          return (
            <button
              key={chat._id}
              onClick={() => handleSelectConversation(chat)}
              title={chat.title}
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors duration-150 border-none cursor-pointer
                ${isActive ? "bg-indigo-500/15 text-indigo-400" : "bg-transparent text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"}`}
            >
              <MessageSquare size={15} />
            </button>
          );
        })}
      </div>

      <div className="mt-auto">
        {userData && (
          <div className="relative">
            {userData.avatar
              ? <img src={userData.avatar} alt={userData.name} className="w-8 h-8 rounded-[8px] object-cover border-2 border-indigo-500/25" />
              : <div className="w-8 h-8 rounded-[8px] bg-white/[0.06] flex items-center justify-center"><User size={14} className="text-slate-400" /></div>
            }
            <span className="absolute -bottom-px -right-px w-2 h-2 bg-green-500 rounded-full border-[1.5px] border-[#0d0f14] block" />
          </div>
        )}
      </div>
    </div>
  );

  /* ── Full sidebar content ── */
  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.06]">
        {/* Desktop collapse */}
        <button
          onClick={() => setCollapsed(true)}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent border-none cursor-pointer"
        >
          <PanelIcon />
        </button>

        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent border-none cursor-pointer"
        >
          <X size={15} />
        </button>

        <span className="text-[16px] font-semibold text-slate-100 tracking-tight flex-1">CortexAI</span>

        <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full tracking-wide">
         {userData?.plan ?? "pro"}
        </span>

        <button
          onClick={handleCreateConversation}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent border-none cursor-pointer"
        >
          <PenSquare size={14} />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="px-3.5 pt-3 pb-3 flex flex-col gap-1 border-b border-white/[0.04]">
        {[
          { id: "chat", label: "AI Agent Chat", icon: MessageSquare },
          { id: "workflows", label: "Visual Workflows", icon: Plus },
          { id: "aios", label: "AI OS Mode", icon: Cpu },
          { id: "enterprise", label: "Enterprise Hub", icon: ShieldAlert },
          { id: "marketplace", label: "Marketplace", icon: Settings },
          { id: "knowledge", label: "Knowledge Base", icon: Database },
          { id: "dashboard", label: "Realtime Stats", icon: Activity },
          { id: "playground", label: "API Playground", icon: Terminal }
        ].map(item => {
          const { currentView } = useSelector(state => state.user);
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => dispatch(setCurrentView(item.id))}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold border-none cursor-pointer transition-all duration-150 ${
                isActive ? "bg-indigo-500/10 text-indigo-400" : "bg-transparent text-slate-300 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
            >
              <item.icon size={14} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* New Chat */}
      <div className="px-4 pt-4 pb-1">
        <button
          onClick={handleCreateConversation}
          className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white bg-gradient-to-br from-indigo-500 to-violet-700 rounded-xl py-[10px] border-none cursor-pointer hover:opacity-90 transition-opacity duration-150"
        >
          <Plus size={15} />
          New Chat
        </button>
      </div>

      {
        conversations.length==0? (
            <div className="px-5 pt-4 pb-1.5 text-[10.5px] font-bold uppercase tracking-widest text-slate-500">
                 No recent conversations
            </div>
          )
        :
        (
          <p className="px-5 pt-4 pb-1.5 text-[10.5px] font-bold uppercase tracking-widest text-slate-500">
            Recents
          </p>
        )
      }

      {/* Section label */}
     
      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {conversations.map((chat) => {
          const isActive = selectedConversation?._id === chat._id;
          const isHov    = hovered === chat._id;
          return (
            <div
              key={chat._id}
              onClick={() => handleSelectConversation(chat)}
              onMouseEnter={() => setHovered(chat._id)}
              onMouseLeave={() => setHovered(null)}
              className={`flex items-center gap-2.5 cursor-pointer mb-0.5 px-3 py-2.5 rounded-[10px] border transition-colors duration-150
                ${isActive ? "bg-indigo-500/10 border-indigo-500/[0.18]"
                : isHov   ? "bg-white/[0.05] border-transparent"
                :            "bg-transparent border-transparent"}`}
            >
              <div className={`flex items-center justify-center shrink-0 w-[28px] h-[28px] rounded-lg transition-colors duration-150
                ${isActive ? "bg-indigo-500/15 text-indigo-400" : "bg-white/[0.05] text-slate-500"}`}>
                <MessageSquare size={13} />
              </div>
              <p className={`text-[13px] font-bold truncate ${isActive ? "text-slate-100" : "text-slate-300"}`}>
                {chat.title}
              </p>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="mx-2.5 h-px bg-white/[0.06]" />

      {/* Footer */}
      <div className="px-3.5 py-3.5">
        {userData ? (
          <div className="flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2.5 hover:bg-white/[0.05] transition-colors duration-150">
            <div className="relative shrink-0">
              {
  !userData?.avatar || imageError ? (
    <div className="w-9 h-9 rounded-[10px] bg-white/[0.06] flex items-center justify-center">
      <User size={15} className="text-slate-400" />
    </div>
  ) : (
    <img
      src={userData.avatar}
      alt={userData.name}
      className="w-9 h-9 rounded-[10px] object-cover border-2 border-indigo-500/25"
      onError={() => setImageError(true)}
    />
  )
}
              <span className="absolute -bottom-px -right-px w-[9px] h-[9px] bg-green-500 rounded-full border-2 border-[#0d0f14] block" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-bold text-slate-100 truncate">{userData.name}</p>
              <p className="text-[11px] text-slate-600 mt-px">{userData.plan || "Free Plan"}</p>
            </div>
            <div className="flex gap-1">
              <button
    onClick={() => setShowBilling(true)}
    className="flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-yellow-600 cursor-pointer hover:bg-white/[0.08] hover:text-slate-400 transition-all duration-150"
>
    <CoinsIcon size={16}/>
</button>
              <button onClick={logout} className="flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-slate-600 cursor-pointer hover:bg-white/[0.08] hover:text-slate-400 transition-all duration-150">
                <LogOut size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="px-1">
            <button className="w-full flex items-center justify-center gap-2 text-sm font-medium text-slate-200 bg-white/[0.05] border border-white/[0.08] rounded-xl py-[11px] cursor-pointer hover:bg-white/[0.08] transition-colors duration-150">
              Login
            </button>
          </div>
        )}
      </div>

    </div>
  );

  if (collapsed) return <CollapsedRail />;

  return (
    <>
      {/* ── Mobile hamburger ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3.5 left-4 z-50 flex items-center justify-center w-8 h-8 rounded-lg bg-[#0d0f14] border border-white/[0.06] text-slate-400 hover:text-slate-200 transition-colors duration-150 cursor-pointer"
      >
        <Menu size={16} />
      </button>

      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        />
      )}

      {/* ── Sidebar panel ── */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[270px] h-full shrink-0
        bg-[#0d0f14]
        transition-transform duration-250
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <SidebarContent />
      </div>

<BillingDrawer

    open={showBilling}

    onClose={()=>
        setShowBilling(false)
    }

/>
    </>
  );
}