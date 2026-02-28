export default function WhatsAppMockup() {
  const messages = [
    {
      from: 'bot',
      text: 'Hola Santiago 🏟️ Ya está activa tu cuota de Marzo: $65.000 COP. Puedes pagar por Bancolombia y enviarnos el comprobante por aquí. ¡Gracias!',
      time: '8:00 AM',
    },
    {
      from: 'user',
      text: 'Dale, ya pagué!',
      time: '2:15 PM',
    },
    {
      from: 'user',
      text: '📷 comprobante_bancolombia.jpg',
      time: '2:15 PM',
      isImage: true,
    },
    {
      from: 'bot',
      text: '✅ ¡Pago confirmado, Santiago! Tu cuota de Marzo por $65.000 quedó registrada. ¡Gracias! ⚽',
      time: '2:15 PM',
    },
  ];

  return (
    <div className="bg-[#161B22] rounded-2xl border border-[#30363D] p-6">
      <h2 className="text-lg font-semibold text-[#E6EDF3] mb-4">Así se ve en WhatsApp</h2>
      
      <div className="max-w-sm mx-auto">
        <div className="bg-[#0D1117] rounded-3xl p-2 shadow-xl border border-[#30363D]">
          {/* Status bar */}
          <div className="bg-[#075e54] rounded-t-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">⚽</div>
            <div>
              <p className="text-white text-sm font-medium">City FC Pagos</p>
              <p className="text-white/60 text-xs">en línea</p>
            </div>
          </div>
          
          {/* Chat */}
          <div className="bg-[#0B141A] p-3 space-y-2 min-h-[320px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  msg.from === 'user' 
                    ? 'bg-[#005C4B] rounded-tr-none' 
                    : 'bg-[#1F2C34] rounded-tl-none'
                }`}>
                  {msg.isImage ? (
                    <div className="bg-[#0D1117] rounded-lg p-4 mb-1 flex items-center justify-center">
                      <span className="text-2xl">🧾</span>
                    </div>
                  ) : null}
                  <p className="text-sm text-[#E6EDF3] leading-relaxed">{msg.text}</p>
                  <p className="text-[10px] text-[#8B949E] text-right mt-1">{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Input bar */}
          <div className="bg-[#1F2C34] rounded-b-2xl px-3 py-2 flex items-center gap-2">
            <div className="flex-1 bg-[#2A3942] rounded-full px-4 py-2 text-xs text-[#8B949E]">Escribe un mensaje...</div>
            <div className="w-8 h-8 rounded-full bg-[#00D084] flex items-center justify-center">
              <span className="text-white text-sm">🎤</span>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-center text-xs text-[#8B949E] mt-4">
        Todo automático: el bot cobra, recibe el comprobante, valida con IA y confirma al jugador
      </p>
    </div>
  );
}
