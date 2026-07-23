import { useDispatch, useSelector } from "react-redux";
import { FaGoogle } from "react-icons/fa";
import ArtifactPanel from "../components/ArtifactPanel";
import ChatArea from "../components/ChatArea";
import Sidebar from "../components/Sidebar";
import api from "../utils/axios";
import { setUserData } from "../redux/user.slice";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase";

import WorkflowBuilder from "../components/WorkflowBuilder";
import Marketplace from "../components/Marketplace";
import KnowledgeBase from "../components/KnowledgeBase";
import Dashboard from "../components/Dashboard";
import Playground from "../components/Playground";
import Background3D from "../components/Background3D";
import AIOSMode from "../components/AIOSMode";
import EnterpriseConsole from "../components/EnterpriseConsole";

function Home() {
  const { userData, currentView } = useSelector(state => state.user);
  const dispatch=useDispatch()

  const handleTiltMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const angleX = (yc - y) / 10;
    const angleY = (x - xc) / 10;
    card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg)`;
  };

  const handleTiltLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
    card.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
  };

  const handleTiltEnter = (e) => {
    const card = e.currentTarget;
    card.style.transition = "none";
  };

const login=async (token)=>{
  try {
    const {data}=await api.post(`/api/auth/login`,{token})
    dispatch(setUserData(data.user))
  } catch (error) {
    console.log(error)
  }
}
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      await login(token);
    } catch (err) {
      console.warn("⚠️ Firebase Sign-In failed, falling back to mock Google token:", err.message);
      await login("mock-google-token");
    }
  };

  const handleBypassLogin = async () => {
    await login("bypass-token");
  };

  return (
<div className="h-screen flex bg-[#0d0f14] text-white overflow-hidden relative items-center justify-center">
      <Background3D />
      
      {userData ? (
        <div className="relative z-10 w-full max-w-[1440px] px-6 py-4 flex h-[96vh] gap-6 items-center justify-center overflow-hidden" style={{ perspective: "2000px" }}>
          
          {/* 3D Sidebar Container */}
          <div 
            className="h-full rounded-2xl overflow-hidden bg-[#0d0f14]/85 border border-white/[0.08] shadow-2xl flex flex-col shrink-0 relative"
            style={{
              transform: "translate3d(0, 0, 0)",
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease, border-color 0.5s ease",
              boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.5)"
            }}
            onMouseMove={(e) => {
              const card = e.currentTarget;
              const rect = card.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const xc = rect.width / 2;
              const yc = rect.height / 2;
              const angleX = (yc - y) / 25;
              const angleY = (x - xc) / 25;
              card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) translate3d(0, 0, 15px)`;
              card.style.boxShadow = "0 30px 60px -12px rgba(99, 102, 241, 0.2)";
              card.style.borderColor = "rgba(99, 102, 241, 0.25)";
            }}
            onMouseLeave={(e) => {
              const card = e.currentTarget;
              card.style.transform = "translate3d(0, 0, 0)";
              card.style.boxShadow = "0 20px 40px -12px rgba(0, 0, 0, 0.5)";
              card.style.borderColor = "rgba(255, 255, 255, 0.08)";
              card.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease, border-color 0.5s ease";
            }}
          >
            <Sidebar />
          </div>

          {/* 3D Main Workspace Container */}
          <div 
            className="flex-1 h-full rounded-2xl overflow-hidden bg-[#090b0f]/90 border border-white/[0.08] shadow-2xl flex flex-col relative"
            style={{
              transform: "translate3d(0, 0, 0)",
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease, border-color 0.5s ease",
              boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.5)"
            }}
            onMouseMove={(e) => {
              const card = e.currentTarget;
              const rect = card.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const xc = rect.width / 2;
              const yc = rect.height / 2;
              const angleX = (yc - y) / 45;
              const angleY = (x - xc) / 45;
              card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) translate3d(0, 0, 15px)`;
              card.style.boxShadow = "0 30px 60px -12px rgba(139, 92, 246, 0.2)";
              card.style.borderColor = "rgba(139, 92, 246, 0.25)";
            }}
            onMouseLeave={(e) => {
              const card = e.currentTarget;
              card.style.transform = "translate3d(0, 0, 0)";
              card.style.boxShadow = "0 20px 40px -12px rgba(0, 0, 0, 0.5)";
              card.style.borderColor = "rgba(255, 255, 255, 0.08)";
              card.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease, border-color 0.5s ease";
            }}
          >
            {currentView === "chat" && (
              <div className="flex-1 flex h-full overflow-hidden">
                <ChatArea />
                <ArtifactPanel />
              </div>
            )}
            {currentView === "workflows" && <WorkflowBuilder />}
            {currentView === "aios" && <AIOSMode />}
            {currentView === "enterprise" && <EnterpriseConsole />}
            {currentView === "marketplace" && <Marketplace />}
            {currentView === "knowledge" && <KnowledgeBase />}
            {currentView === "dashboard" && <Dashboard />}
            {currentView === "playground" && <Playground />}
          </div>

        </div>
      ) : (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md" style={{ perspective: "1000px" }}>
          <div 
            onMouseMove={handleTiltMove}
            onMouseLeave={handleTiltLeave}
            onMouseEnter={handleTiltEnter}
            style={{ transformStyle: "preserve-3d" }}
            className="w-[340px] bg-[#13151c]/90 border border-white/[0.08] rounded-2xl p-7 flex flex-col gap-5 shadow-2xl transition-all duration-300 ease-out backdrop-blur-xl"
          >

            <div className="flex flex-col gap-1" style={{ transform: "translateZ(30px)" }}>
              <h2 className="text-[17px] font-semibold text-slate-100 tracking-tight">Welcome to CortexAI</h2>
              <p className="text-[13px] text-slate-500">Please login to continue using the app.</p>
            </div>

            <button
              onClick={handleGoogleLogin}
              style={{ transform: "translateZ(40px)" }}
              className="w-full flex items-center justify-center gap-3 py-[11px] rounded-xl text-sm font-medium text-white bg-gradient-to-br from-indigo-500 to-violet-700 hover:from-indigo-400 hover:to-violet-600 active:from-indigo-600 active:to-violet-800 border border-indigo-500/30 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-150 cursor-pointer"
            >
              <FaGoogle size={15} className="text-white" />
              Continue with Google
            </button>

            <button
              onClick={handleBypassLogin}
              style={{ transform: "translateZ(30px)" }}
              className="w-full flex items-center justify-center gap-3 py-[11px] rounded-xl text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 shadow-md transition-all duration-150 cursor-pointer"
            >
              Bypass Login (Guest Mode)
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

export default Home;