import { useRef, useState, useEffect } from "react";
import { PersonaId } from "../types";

interface CameraPanelProps {
  persona: PersonaId;
  onAssistantResponse: (text: string) => void;
  addLogMessage: (who: "you" | "ai" | "sys", text: string) => void;
  isTabActive: boolean;
}

export default function CameraPanel({
  persona,
  onAssistantResponse,
  addLogMessage,
  isTabActive,
}: CameraPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraNote, setCameraNote] = useState<string>(
    "A câmera permite cadastrar e reconhecer seu rosto localmente, além de análise de visão via IA."
  );
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [storedFace, setStoredFace] = useState<ImageData | null>(null);

  // Handle webcam stream start and stop based on active tab state
  useEffect(() => {
    if (isTabActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isTabActive]);

  const startCamera = async () => {
    try {
      if (stream) return;
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraNote("📹 Câmera ativada com sucesso.");
    } catch (error) {
      console.error("Camera access error:", error);
      setCameraNote("⚠️ Câmera indisponível ou permissão negada nesta visualização.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  // Helper to capture a frame from the running video element
  const captureFrameData = (width = 64, height = 64) => {
    if (!videoRef.current || !stream) return null;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Draw video frame to canvas
    ctx.drawImage(videoRef.current, 0, 0, width, height);

    const rawData = ctx.getImageData(0, 0, width, height);
    const base64 = canvas.toDataURL("image/jpeg", 0.75).split(",")[1];

    return { rawData, base64 };
  };

  const handleRegisterFace = () => {
    const captured = captureFrameData(64, 64);
    if (!captured) {
      setCameraNote("⚠️ Ative a câmera primeiro para registrar seu rosto.");
      return;
    }
    setStoredFace(captured.rawData);
    addLogMessage("sys", "Dados biométricos faciais registrados localmente.");
    setCameraNote("✅ Rosto cadastrado com sucesso para esta sessão.");
  };

  const handleRecognizeFace = () => {
    if (!storedFace) {
      setCameraNote("⚠️ Cadastre seu rosto primeiro.");
      return;
    }
    const current = captureFrameData(64, 64);
    if (!current) {
      setCameraNote("⚠️ Ative a câmera para reconhecimento facial.");
      return;
    }

    // Dynamic pixel delta sum logic to check facial similarity
    let delta = 0;
    const len = storedFace.data.length;
    for (let i = 0; i < len; i += 4) {
      delta += Math.abs(storedFace.data[i] - current.rawData.data[i]); // Red channels
      delta += Math.abs(storedFace.data[i + 1] - current.rawData.data[i + 1]); // Green channels
    }

    // Similarity thresholding
    const isRecognized = delta < 350000; // calibrated for typical webcam changes
    if (isRecognized) {
      const greetText =
        persona === "jarvis"
          ? "Acesso concedido. Bem-vindo de volta, senhor Stark."
          : "Oi chefe! Que bom te ver de novo. Sistemas prontos!";
      setCameraNote("✅ Biometria facial confirmada. Acesso liberado.");
      addLogMessage("sys", `Reconhecimento facial bem sucedido. Delta biométrico: ${delta}`);
      onAssistantResponse(greetText);
    } else {
      setCameraNote("❌ Identidade facial não confirmada. Tente novamente.");
      addLogMessage("sys", `Tentativa de reconhecimento facial falhou. Delta biométrico: ${delta}`);
    }
  };

  const handleIAVision = async () => {
    const captured = captureFrameData(320, 240);
    if (!captured) {
      setCameraNote("⚠️ Por favor, ative a câmera para que eu possa analisar o ambiente.");
      return;
    }

    setIsAnalyzing(true);
    setCameraNote("👁️ Analisando imagem da câmera via IA...");

    try {
      const response = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: captured.base64,
          persona,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro de comunicação com o servidor de visão.");
      }

      const data = await response.json();
      const reply = data.text || "Não consegui interpretar a imagem.";

      setCameraNote(reply);
      addLogMessage("ai", reply);
      onAssistantResponse(reply);
    } catch (error: any) {
      console.error("Vision Error:", error);
      setCameraNote("❌ Falha na análise de imagem. Verifique suas credenciais de IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div id="tab-cam" className="space-y-4">
      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-[340px] aspect-video bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
          {stream ? (
            <video
              ref={videoRef}
              id="camVid"
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
          ) : (
            <div className="text-center p-6 space-y-2 text-slate-500">
              <span className="text-3xl block">📹</span>
              <span className="text-xs font-mono">FEED DE VIDEO DESATIVADO</span>
            </div>
          )}

          {isAnalyzing && (
            <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-2 border-t-[var(--ac)] border-slate-700 rounded-full animate-spin" />
              <span className="text-[11px] font-mono text-[var(--ac)] animate-pulse uppercase tracking-widest">
                PROCESSANDO VISÃO COGNITIVA
              </span>
            </div>
          )}
        </div>

        <div className="camrow flex flex-wrap justify-center gap-2 mt-4 w-full">
          <button
            onClick={handleRegisterFace}
            className="p-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 font-display text-xs cursor-pointer tracking-wide hover:border-[var(--ac)] hover:text-white transition-all flex-1 min-w-[130px]"
          >
            📸 Cadastrar Rosto
          </button>
          <button
            onClick={handleRecognizeFace}
            className="p-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 font-display text-xs cursor-pointer tracking-wide hover:border-[var(--ac)] hover:text-white transition-all flex-1 min-w-[130px]"
          >
            🔍 Reconhecer Rosto
          </button>
          <button
            onClick={handleIAVision}
            disabled={isAnalyzing}
            className="p-2.5 rounded-lg border border-[var(--ac)] text-[var(--ac)] font-display text-xs cursor-pointer tracking-wide font-medium bg-slate-950/20 hover:bg-[var(--ac)] hover:text-black transition-all flex-1 min-w-[130px] disabled:opacity-40"
          >
            👁️ O que ela vê?
          </button>
        </div>
      </div>

      <div className="note text-[11px] font-mono text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-900 leading-relaxed">
        <span className="text-[var(--ac)] font-bold">● FEEDBACK DO SENSOR:</span>{" "}
        <span className="text-slate-200">{cameraNote}</span>
      </div>
    </div>
  );
}
