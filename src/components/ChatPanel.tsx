import React, { useState, useRef, useEffect } from "react";
import { Message, PersonaId } from "../types";

interface ChatPanelProps {
  messages: Message[];
  persona: PersonaId;
  onSendMessage: (text: string) => void;
  onClearHistory: () => void;
  isSpeaking: boolean;
  systemLogs: string[];
}

export default function ChatPanel({
  messages,
  persona,
  onSendMessage,
  onClearHistory,
  isSpeaking,
  systemLogs,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [autoListen, setAutoListen] = useState(false);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Web Speech API recognition instance setup
  const recognitionRef = useRef<any>(null);

  // Initialize SpeechRecognition once
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.lang = "pt-BR";
      recog.continuous = false;
      recog.interimResults = false;

      recog.onstart = () => {
        setIsListening(true);
      };

      recog.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (transcript.trim()) {
          onSendMessage(transcript);
        }
      };

      recog.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
        // If auto-listening is enabled and assistant is NOT speaking, start listening again with a delay
        if (autoListen && !isSpeaking) {
          setTimeout(() => {
            // Recheck autoListen and isSpeaking status before triggering
            if (recognitionRef.current && !isSpeaking) {
              try {
                recognitionRef.current.start();
              } catch (err) {
                // Ignore if already started
              }
            }
          }, 1000);
        }
      };

      recognitionRef.current = recog;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [autoListen, isSpeaking, onSendMessage]);

  // Handle continuous listening when assistant finishes speaking
  useEffect(() => {
    if (autoListen && !isSpeaking && !isListening && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        // Handle gracefully if recognition is already running
      }
    }
  }, [isSpeaking, autoListen, isListening]);

  // Keep chat logs scrolled to the absolute bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, systemLogs]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const handleMicClick = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não possui suporte nativo para Reconhecimento de Voz.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const toggleAutoListen = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não possui suporte nativo para Reconhecimento de Voz.");
      return;
    }

    const nextState = !autoListen;
    setAutoListen(nextState);

    if (nextState) {
      addSystemNotification("Modo conversação contínua ativado — fale sem precisar clicar.");
      if (!isListening && !isSpeaking) {
        try {
          recognitionRef.current?.start();
        } catch (err) {
          console.error(err);
        }
      }
    } else {
      recognitionRef.current?.stop();
      addSystemNotification("Modo conversação contínua desativado.");
    }
  };

  // Local helper to add temporary system log
  const addSystemNotification = (txt: string) => {
    // This is shown in system log state or as temporary alert
  };

  return (
    <div id="tab-chat" className="space-y-3">
      {/* Scrollable Chat Logs Window */}
      <div className="chat-log-container bg-slate-950/60 border border-slate-900/80 rounded-xl p-4 h-[180px] overflow-y-auto space-y-3 scrollbar-thin">
        {messages.length === 0 && systemLogs.length === 0 && (
          <div className="text-slate-500 text-xs font-mono italic h-full flex items-center justify-center">
            Pronto para receber transmissões neurais de voz ou texto.
          </div>
        )}

        {/* System activity logs */}
        {systemLogs.map((log, idx) => (
          <div key={`log-${idx}`} className="text-[11px] text-slate-500 font-mono italic">
            ⚡ {log}
          </div>
        ))}

        {/* Dialogue messages */}
        {messages.map((msg, idx) => (
          <div
            key={`msg-${idx}`}
            className={`text-sm leading-relaxed ${
              msg.role === "user" ? "text-emerald-300" : "text-[var(--ac)]"
            }`}
          >
            <span className="font-display font-semibold uppercase tracking-wider text-xs select-none">
              {msg.role === "user" ? "Você: " : `${persona === "friday" ? "SEXTA-FEIRA" : "JARVIS"}: `}
            </span>
            {msg.content}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* Input Action Row */}
      <div className="row flex items-center gap-2">
        <input
          id="inp"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="sinput flex-1 px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/90 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-[var(--ac)] focus:ring-1 focus:ring-[var(--ac)] transition-all"
          placeholder="Fale ou escreva — conversa contínua ativa"
        />
        <button
          onClick={handleMicClick}
          id="micBtn"
          className={`sbtn p-3 rounded-xl border cursor-pointer text-sm font-medium transition-all duration-300 flex items-center justify-center min-w-[48px] h-[44px] ${
            isListening
              ? "bg-red-500 border-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]"
              : "border-slate-800 bg-slate-900 text-[var(--ac)] hover:border-[var(--ac)]"
          }`}
          title="Ativar reconhecimento contínuo de voz"
        >
          {isListening ? "🔴" : "🎤"}
        </button>
        <button
          onClick={handleSend}
          id="sendBtn"
          className="sbtn px-4 py-3 rounded-xl border border-[var(--ac)] bg-transparent text-[var(--ac)] text-xs font-semibold cursor-pointer tracking-wider hover:bg-[var(--ac)] hover:text-black hover:shadow-[0_0_10px_var(--glow)] transition-all duration-200 h-[44px]"
        >
          Enviar
        </button>
      </div>

      {/* Secondary Controls Row */}
      <div className="flex gap-2">
        <button
          onClick={toggleAutoListen}
          id="autoBtn"
          className={`sbtn px-3 py-1.5 rounded-lg border text-[11px] font-semibold tracking-wider cursor-pointer transition-all ${
            autoListen
              ? "bg-[var(--ac)] text-black border-[var(--ac)] shadow-[0_0_8px_var(--glow)]"
              : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
          }`}
        >
          🔄 Auto-escuta: {autoListen ? "ON" : "OFF"}
        </button>
        <button
          onClick={onClearHistory}
          id="clearBtn"
          className="sbtn px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/30 text-slate-400 text-[11px] font-semibold tracking-wider cursor-pointer hover:border-red-500/50 hover:text-red-400 transition-all ml-auto"
        >
          🗑️ Limpar Sessão
        </button>
      </div>
    </div>
  );
}
