import { useState, useEffect, useRef } from "react";
import { PersonaId, Message, SmartDevice } from "./types";
import HolographicBrain from "./components/HolographicBrain";
import ChatPanel from "./components/ChatPanel";
import DevicesPanel from "./components/DevicesPanel";
import CameraPanel from "./components/CameraPanel";
import MemoryPanel from "./components/MemoryPanel";
import {
  Cpu,
  Activity,
  User,
  MessageSquare,
  LayoutGrid,
  Camera,
  BrainCircuit,
  Settings2,
  RefreshCw,
  Power,
  Volume2
} from "lucide-react";

const INITIAL_DEVICES: SmartDevice[] = [
  { id: "S1", name: "Luz da Sala", type: "light", room: "Sala de Estar", status: false },
  { id: "Q1", name: "Luz do Quarto", type: "light", room: "Quarto Principal", status: false },
  { id: "A1", name: "Ar-Condicionado", type: "ac", room: "Escritório", status: true },
  { id: "P1", name: "Portão Eletrônico", type: "gate", room: "Garagem", status: false },
  { id: "T1", name: "TV OLED", type: "tv", room: "Cinema", status: false },
  { id: "C1", name: "Câmera de Segurança", type: "camera", room: "Fachada", status: true },
];

const TOPIC_KEYWORDS: { [key: string]: string[] } = {
  "Religião & Fé": ["deus", "jesus", "bíblia", "fé", "oração", "igreja", "espirito", "salvação", "crença", "teologia", "sagrado", "pecado", "culto", "cristão", "religião"],
  "Saúde & Medicina": ["saúde", "doença", "médico", "hospital", "remédio", "cura", "sintoma", "vitamina", "exercício", "dieta", "pressão", "coração", "mente", "ansiedade", "depressão"],
  "Mundo & Política": ["mundo", "país", "presidente", "governo", "política", "guerra", "economia", "crise", "eleição", "lei", "direito", "nação", "conflito", "paz"],
  "Tecnologia & IA": ["tecnologia", "inteligência", "artificial", "computador", "app", "sistema", "digital", "robô", "software", "dados", "internet", "hardware", "código"],
  "Ciência & Espaço": ["ciência", "universo", "planeta", "espaço", "natureza", "energia", "física", "química", "evolução", "descoberta", "astronomia"],
  "Família & Vida": ["família", "filho", "esposa", "marido", "casa", "lar", "amigo", "trabalho", "vida", "futuro", "sonho", "amor", "sentimento"],
  "Cultura & Arte": ["música", "filme", "arte", "livro", "história", "cultura", "esporte", "futebol", "jogo", "entretenimento", "série", "lazer"],
};

export default function App() {
  const [persona, setPersona] = useState<PersonaId>("jarvis");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "dev" | "cam" | "mem">("chat");
  const [devices, setDevices] = useState<SmartDevice[]>(INITIAL_DEVICES);
  const [topics, setTopics] = useState<{ [key: string]: number }>({});
  const [sessionSummary, setSessionSummary] = useState<string>("Nenhuma conversa registrada nesta sessão.");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [systemLogs, setSystemLogs] = useState<string[]>(["Núcleo de IA Stark iniciado com sucesso."]);

  // Telemetry indicators
  const [cpuLoad, setCpuLoad] = useState<number>(14);
  const [systemUptime, setSystemUptime] = useState<string>("00:00:00");

  const voicesRef = useRef<{ male: SpeechSynthesisVoice | null; female: SpeechSynthesisVoice | null }>({
    male: null,
    female: null,
  });

  // Dynamic system metric simulations
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      // Simulate slight CPU fluctuation
      setCpuLoad(Math.floor(Math.random() * 12) + 8 + (isSpeaking ? 15 : 0));

      // Calculate elegant uptime string
      const delta = Date.now() - startTime;
      const hrs = String(Math.floor(delta / 3600000)).padStart(2, "0");
      const mins = String(Math.floor((delta % 3600000) / 60000)).padStart(2, "0");
      const secs = String(Math.floor((delta % 60000) / 1000)).padStart(2, "0");
      setSystemUptime(`${hrs}:${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Load voices for Speech Synthesis
  useEffect(() => {
    const loadVoices = () => {
      if (!window.speechSynthesis) return;
      const voices = window.speechSynthesis.getVoices();
      const ptVoices = voices.filter((v) => v.lang.startsWith("pt"));

      // Identify suitable female voice
      const female =
        ptVoices.find((v) => /luciana|fernanda|vitoria|gabriela|catarina|raquel|ana/i.test(v.name)) ||
        voices.find((v) => /female|fem|woman/i.test(v.name) && v.lang.startsWith("pt")) ||
        ptVoices[0] ||
        voices.find((v) => /female|fem/i.test(v.name)) ||
        voices[0];

      // Identify suitable male voice
      const male =
        ptVoices.find((v) => /daniel|ricardo|carlos|antonio|pedro/i.test(v.name)) ||
        voices.find((v) => /male|man/i.test(v.name) && v.lang.startsWith("pt") && !/female/i.test(v.name)) ||
        ptVoices[1] ||
        ptVoices[0] ||
        voices.find((v) => /male/i.test(v.name) && !/female/i.test(v.name)) ||
        voices[0];

      voicesRef.current = { male, female };
    };

    if (window.speechSynthesis) {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      loadVoices();
    }
  }, []);

  // Sync theme-specific CSS variables
  useEffect(() => {
    document.body.className = persona === "friday" ? "friday-theme" : "";
  }, [persona]);

  const addLogMessage = (who: "you" | "ai" | "sys", text: string) => {
    if (who === "sys") {
      setSystemLogs((prev) => [...prev.slice(-4), text]);
    } else {
      setMessages((prev) => [...prev, { role: who === "you" ? "user" : "assistant", content: text }]);
    }
  };

  // Run initial assistant greeting
  useEffect(() => {
    const greet =
      persona === "jarvis"
        ? "Sistemas online. Estou aqui, senhor. Pode falar à vontade."
        : "Oi! Tô online, chefe. Pode falar, tô aqui com você.";

    addLogMessage("ai", greet);
    speak(greet);
  }, [persona]);

  // Audio text-to-speech implementation
  const speak = (txt: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(txt);
    u.lang = "pt-BR";

    const isFriday = persona === "friday";
    const selectedVoice = isFriday ? voicesRef.current.female : voicesRef.current.male;

    if (selectedVoice) {
      u.voice = selectedVoice;
    }
    u.rate = isFriday ? 0.98 : 0.9;
    u.pitch = isFriday ? 1.15 : 0.85;

    u.onstart = () => {
      setIsSpeaking(true);
    };

    u.onend = () => {
      setIsSpeaking(false);
    };

    u.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(u);
  };

  // Analyze terms in user messages to index cognitive topics
  const detectTopics = (text: string) => {
    const lower = text.toLowerCase();
    const nextTopics = { ...topics };
    let changed = false;

    Object.entries(TOPIC_KEYWORDS).forEach(([theme, keywords]) => {
      if (keywords.some((keyword) => lower.includes(keyword))) {
        nextTopics[theme] = (nextTopics[theme] || 0) + 1;
        changed = true;
      }
    });

    if (changed) {
      setTopics(nextTopics);
    }
  };

  // AI response engine fetching server logic
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message to state
    addLogMessage("you", text);
    detectTopics(text);

    const updatedHistory = [...messages, { role: "user" as const, content: text }];

    try {
      addLogMessage("sys", "Consultando núcleos neurais...");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: updatedHistory,
          persona,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro na comunicação de IA.");
      }

      const data = await response.json();
      const reply = data.text || "Desculpe, ocorreu uma anomalia em meus sistemas.";

      // Render assistant response
      addLogMessage("ai", reply);
      detectTopics(reply);
      speak(reply);

      // Trigger automatic background summary update every 4 turns
      if (updatedHistory.length % 4 === 0) {
        generateSessionSummary(updatedHistory);
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = "Sistemas centrais indisponíveis. Verifique as credenciais no menu Secrets.";
      addLogMessage("ai", errorMsg);
      speak(errorMsg);
    }
  };

  // Update session summary using Gemini backend
  const generateSessionSummary = async (currentHistory = messages) => {
    if (currentHistory.length === 0) return;
    setIsGeneratingSummary(true);

    try {
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: currentHistory }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionSummary(data.text);
        addLogMessage("sys", "Resumo cognitivo atualizado com sucesso.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleToggleDevice = (id: string) => {
    setDevices((prev) =>
      prev.map((dev) => {
        if (dev.id === id) {
          const nextStatus = !dev.status;
          const statusText = nextStatus ? "ligado" : "desligado";
          const feedbackText = `${dev.name} foi ${statusText}, ${persona === "jarvis" ? "senhor" : "chefe"}.`;

          addLogMessage("sys", `${dev.name} alterado para ${statusText.toUpperCase()}`);
          speak(feedbackText);
          return { ...dev, status: nextStatus };
        }
        return dev;
      })
    );
  };

  const handleClearHistory = () => {
    setMessages([]);
    setTopics({});
    setSessionSummary("Nenhuma conversa registrada nesta sessão.");
    setSystemLogs(["Sessão restaurada para parâmetros iniciais."]);
    speak(
      persona === "jarvis"
        ? "Registros eliminados. Como posso ajudá-lo agora, senhor?"
        : "Limpei tudo, chefe! Pronto para começar do zero."
    );
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-[#0f172a] theme-transition font-sans w-full bg-[#f8fafc]">
      
      {/* Sidebar Navigation Pane - Styled in Premium Deep Blue Slate */}
      <aside className="w-full md:w-[280px] bg-[#0f172a] text-white flex flex-col shrink-0 border-r border-slate-900 shadow-2xl">
        <div className="sidebar-header p-6 border-b border-slate-800 flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-display font-extrabold text-lg tracking-wider text-slate-100 uppercase">
              STARK AI CONSOLE
            </span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
            Sistemas Cognitivos Ativos
          </span>
        </div>

        {/* Persona Toggle Segment Control */}
        <div className="px-6 py-4 border-b border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-2">
            Selecionar Assistente
          </span>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800">
            <button
              onClick={() => setPersona("jarvis")}
              className={`py-1.5 rounded text-xs font-display font-semibold transition-all cursor-pointer ${
                persona === "jarvis"
                  ? "bg-slate-800 text-[#00d4ff] shadow-[0_0_8px_rgba(0,212,255,0.25)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ⚡ JARVIS
            </button>
            <button
              onClick={() => setPersona("friday")}
              className={`py-1.5 rounded text-xs font-display font-semibold transition-all cursor-pointer ${
                persona === "friday"
                  ? "bg-slate-800 text-[#ff2d55] shadow-[0_0_8px_rgba(255,45,85,0.25)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ● SEXTA-FEIRA
            </button>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 p-4 space-y-1.5">
          <button
            onClick={() => setActiveTab("chat")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === "chat"
                ? "bg-slate-800/80 text-white font-semibold border-l-4 border-[var(--ac)]"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <MessageSquare size={16} />
            <span>Projetos & Chat</span>
          </button>

          <button
            onClick={() => setActiveTab("dev")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === "dev"
                ? "bg-slate-800/80 text-white font-semibold border-l-4 border-[var(--ac)]"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <LayoutGrid size={16} />
            <span>Dispositivos</span>
          </button>

          <button
            onClick={() => setActiveTab("cam")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === "cam"
                ? "bg-slate-800/80 text-white font-semibold border-l-4 border-[var(--ac)]"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Camera size={16} />
            <span>Monitoramento Câmera</span>
          </button>

          <button
            onClick={() => setActiveTab("mem")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === "mem"
                ? "bg-slate-800/80 text-white font-semibold border-l-4 border-[var(--ac)]"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <BrainCircuit size={16} />
            <span>Memória Cognitiva</span>
          </button>
        </nav>

        {/* Sidebar System Metrics Telemetry */}
        <div className="p-6 border-t border-slate-800 space-y-3 bg-slate-950/40">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1"><Cpu size={12} /> CPU IA</span>
            <span className="text-[var(--ac)] font-bold">{cpuLoad}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1">
            <div
              className="bg-[var(--ac)] h-1 rounded-full transition-all duration-500"
              style={{ width: `${cpuLoad}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1"><Activity size={12} /> UPTIME</span>
            <span className="text-slate-200">{systemUptime}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        
        {/* Top Header - White polished styling */}
        <header className="h-16 border-b border-slate-200 bg-white shrink-0 flex items-center justify-between px-6 md:px-8">
          <div>
            <span className="text-slate-400 text-xs font-mono font-medium tracking-wide uppercase">
              Sistemas / Core-V3
            </span>
            <h1 className="text-sm font-bold text-slate-800 font-display flex items-center gap-2">
              <span>Módulo Ativo:</span>
              <span className="text-[var(--ac)] uppercase font-semibold">
                {persona === "jarvis" ? "J.A.R.V.I.S." : "SEXTA-FEIRA"}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 select-none">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>MODO CONVERSAÇÃO CONTINUA ONLINE</span>
          </div>
        </header>

        {/* Bento Grid layout */}
        <div className="p-6 md:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Holographic Brain Diagnostic Card (Span 5) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center">
              <div className="w-full border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-mono">
                  🧬 Holograma Cerebral 3D
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded border border-slate-200 uppercase">
                  Cognição {isSpeaking ? "Ativa" : "Standby"}
                </span>
              </div>

              {/* Graphic Chamber Container with sleek futuristic grid lines */}
              <div className="w-full bg-[#030712] rounded-xl py-4 border border-slate-800 shadow-inner flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
                <HolographicBrain
                  persona={persona}
                  isSpeaking={isSpeaking}
                  isListening={isListening}
                  topics={topics}
                />
              </div>

              {/* Micro diagnostic widgets beneath brain */}
              <div className="grid grid-cols-3 gap-2 w-full mt-4 text-center">
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                  <span className="text-[9px] text-slate-400 font-mono uppercase block">Sintonia</span>
                  <span className="text-[11px] font-bold text-slate-700 font-mono">{persona === "jarvis" ? "98.2 MHz" : "104.5 MHz"}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                  <span className="text-[9px] text-slate-400 font-mono uppercase block">Modulação</span>
                  <span className="text-[11px] font-bold text-slate-700 font-mono">FM / SSB</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                  <span className="text-[9px] text-slate-400 font-mono uppercase block">Biometria</span>
                  <span className="text-[11px] font-bold text-emerald-600 font-mono">OK</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Console Card (Span 7) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 min-h-[460px] flex flex-col justify-between">
              
              {/* Card Header with breadcrumbs and dynamic titles */}
              <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-center">
                <h2 className="font-display font-bold text-slate-800 text-base flex items-center gap-2">
                  {activeTab === "chat" && <MessageSquare size={18} className="text-[var(--ac)]" />}
                  {activeTab === "dev" && <LayoutGrid size={18} className="text-[var(--ac)]" />}
                  {activeTab === "cam" && <Camera size={18} className="text-[var(--ac)]" />}
                  {activeTab === "mem" && <BrainCircuit size={18} className="text-[var(--ac)]" />}
                  <span>
                    {activeTab === "chat" && "Painel de Conversação"}
                    {activeTab === "dev" && "Controle de Dispositivos"}
                    {activeTab === "cam" && "Visão Computacional"}
                    {activeTab === "mem" && "Banco de Memória Cognitiva"}
                  </span>
                </h2>
                <div className="flex gap-1">
                  {["chat", "dev", "cam", "mem"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`px-2.5 py-1 text-[10px] font-semibold rounded cursor-pointer uppercase tracking-wider transition-all border ${
                        activeTab === tab
                          ? "bg-[var(--ac)] border-[var(--ac)] text-white"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Content Panel view */}
              <div className="flex-1">
                {activeTab === "chat" && (
                  <ChatPanel
                    messages={messages}
                    persona={persona}
                    onSendMessage={handleSendMessage}
                    onClearHistory={handleClearHistory}
                    isSpeaking={isSpeaking}
                    systemLogs={systemLogs}
                  />
                )}

                {activeTab === "dev" && (
                  <DevicesPanel
                    devices={devices}
                    onToggleDevice={handleToggleDevice}
                  />
                )}

                {activeTab === "cam" && (
                  <CameraPanel
                    persona={persona}
                    onAssistantResponse={(txt) => {
                      addLogMessage("ai", txt);
                      speak(txt);
                    }}
                    addLogMessage={addLogMessage}
                    isTabActive={activeTab === "cam"}
                  />
                )}

                {activeTab === "mem" && (
                  <MemoryPanel
                    topics={topics}
                    sessionSummary={sessionSummary}
                    isGeneratingSummary={isGeneratingSummary}
                    onRefreshSummary={() => generateSessionSummary()}
                  />
                )}
              </div>

            </div>

          </div>

          {/* Activity Timeline Status Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-3 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dot-live-anim"></span>
              <span className="font-semibold text-slate-700">STATUS DA CENTRAL STARK:</span>
              <span className="text-slate-400">Totalmente carregada e operacional.</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Sinal de Rede: <strong className="text-slate-700">Excelente</strong></span>
              <span>Encriptação: <strong className="text-slate-700">Padrão Stark-AES-256</strong></span>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
