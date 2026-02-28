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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Así se ve en WhatsApp</h2>
      
      {/* Phone mockup */}
      <div className="max-w-sm mx-auto">
        <div className="bg-gray-900 rounded-3xl p-2 shadow-xl">
          {/* Status bar */}
          <div className="bg-[#075e54] rounded-t-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">⚽</div>
            <div>
              <p className="text-white text-sm font-medium">City FC Pagos</p>
              <p className="text-white/60 text-xs">en línea</p>
            </div>
          </div>
          
          {/* Chat */}
          <div className="bg-[#ece5dd] p-3 space-y-2 min-h-[320px]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000\' fill-opacity=\'0.02\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  msg.from === 'user' 
                    ? 'bg-[#dcf8c6] rounded-tr-none' 
                    : 'bg-white rounded-tl-none'
                }`}>
                  {msg.isImage ? (
                    <div className="bg-gray-200 rounded-lg p-4 mb-1 flex items-center justify-center">
                      <span className="text-2xl">🧾</span>
                    </div>
                  ) : null}
                  <p className="text-sm text-gray-800 leading-relaxed">{msg.text}</p>
                  <p className="text-[10px] text-gray-500 text-right mt-1">{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Input bar */}
          <div className="bg-[#f0f0f0] rounded-b-2xl px-3 py-2 flex items-center gap-2">
            <div className="flex-1 bg-white rounded-full px-4 py-2 text-xs text-gray-400">Escribe un mensaje...</div>
            <div className="w-8 h-8 rounded-full bg-[#075e54] flex items-center justify-center">
              <span className="text-white text-sm">🎤</span>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-center text-xs text-gray-400 mt-4">
        Todo automático: el bot cobra, recibe el comprobante, valida con IA y confirma al jugador
      </p>
    </div>
  );
}
