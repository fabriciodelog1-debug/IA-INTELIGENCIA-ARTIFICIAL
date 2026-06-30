import { SmartDevice, PersonaId } from "../types";

interface DevicesPanelProps {
  devices: SmartDevice[];
  onToggleDevice: (id: string) => void;
}

export default function DevicesPanel({ devices, onToggleDevice }: DevicesPanelProps) {
  return (
    <div id="tab-dev" className="space-y-4">
      <div className="devgrid grid grid-cols-2 gap-3">
        {devices.map((dev) => (
          <div
            key={dev.id}
            className="devcard neon-glass border border-slate-800 rounded-xl p-4 flex justify-between items-center transition-all duration-300 hover:border-slate-700"
          >
            <div className="flex flex-col">
              <span className="font-display font-medium text-sm tracking-wide text-slate-100 flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono select-none">ID: {dev.id}</span>
                {dev.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-0.5">
                {dev.type === "light" && "💡 Iluminação"}
                {dev.type === "ac" && "❄️ Climatização"}
                {dev.type === "gate" && "🔒 Controle de Acesso"}
                {dev.type === "tv" && "📺 Multimídia"}
                {dev.type === "camera" && "📹 Monitoramento"}
              </span>
            </div>

            {/* Custom Interactive Switch */}
            <button
              onClick={() => onToggleDevice(dev.id)}
              className={`sw w-[44px] h-[24px] rounded-full relative cursor-pointer border transition-all duration-300 focus:outline-none ${
                dev.status
                  ? "bg-[var(--ac)] border-[var(--ac)] shadow-[0_0_8px_var(--glow)]"
                  : "bg-slate-900 border-slate-800"
              }`}
              aria-label={`Toggle ${dev.name}`}
            >
              <div
                className={`swdot w-4 h-4 rounded-full bg-white absolute top-[3px] transition-all duration-300 ${
                  dev.status ? "left-[23px]" : "left-[3px]"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
      <div className="note text-[11px] font-mono text-slate-500 bg-slate-950/40 p-3 rounded-lg border border-slate-900 leading-relaxed">
        <span className="text-[var(--ac)] font-bold">● NOTA DE DEMONSTRAÇÃO:</span> Esta central simula o acionamento de relés de automação residencial. A integração real pode ser facilmente feita com protocolos de IoT (Tuya, Philips Hue, Home Assistant, Tapo) adicionando requisições HTTP na ação de disparo.
      </div>
    </div>
  );
}
