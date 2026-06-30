import { motion } from "motion/react";

interface MemoryPanelProps {
  topics: { [key: string]: number };
  sessionSummary: string;
  isGeneratingSummary: boolean;
  onRefreshSummary: () => void;
}

export default function MemoryPanel({
  topics,
  sessionSummary,
  isGeneratingSummary,
  onRefreshSummary,
}: MemoryPanelProps) {
  const activeTopics = Object.entries(topics).sort((a, b) => b[1] - a[1]);

  return (
    <div id="tab-mem" className="space-y-5">
      <div>
        <div className="font-display font-semibold text-xs text-[var(--ac)] tracking-wider uppercase mb-3">
          🧠 Temas Mais Discutidos
        </div>
        {activeTopics.length > 0 ? (
          <div className="topics-wrap flex flex-wrap gap-2">
            {activeTopics.map(([theme, count]) => {
              const opacity = Math.min(0.4 + count * 0.12, 1);
              return (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity }}
                  key={theme}
                  className="topic-chip px-3 py-1.5 rounded-full border border-[var(--ac)] text-[var(--ac)] text-xs font-medium font-display shadow-[0_0_5px_rgba(0,0,0,0.5)] bg-slate-950/20"
                >
                  {theme} <span className="text-[10px] opacity-75 ml-1 font-mono">({count}x)</span>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-slate-500 font-mono italic">
            Nenhum tópico recorrente foi detectado na conversa ainda. Interaja no chat para mapear os temas.
          </div>
        )}
        <div className="text-[10px] text-slate-500 font-mono mt-2 leading-relaxed">
          Os tópicos são conectados em tempo real no cérebro holográfico conforme palavras-chave de interesse são mencionadas.
        </div>
      </div>

      <div className="border-t border-slate-900 pt-4">
        <div className="flex justify-between items-center mb-3">
          <div className="font-display font-semibold text-xs text-[var(--ac)] tracking-wider uppercase">
            ⚡ Resumo Cognitivo da Sessão
          </div>
          <button
            onClick={onRefreshSummary}
            disabled={isGeneratingSummary}
            className="text-[10px] font-mono border border-slate-800 bg-slate-950/50 hover:border-[var(--ac)] hover:text-white text-slate-400 px-2 py-1 rounded transition-all cursor-pointer disabled:opacity-50"
          >
            {isGeneratingSummary ? "Analisando..." : "🔄 Atualizar Resumo"}
          </button>
        </div>

        <div className="bg-slate-950/50 border border-slate-900 rounded-lg p-4 font-mono text-xs leading-relaxed text-slate-300">
          {sessionSummary}
        </div>
        <div className="text-[9px] text-slate-500 font-mono mt-1.5">
          O resumo condensa as principais temáticas e dúvidas do usuário usando o modelo cognitivo para manter o alinhamento de contexto.
        </div>
      </div>
    </div>
  );
}
