import { Bell, DollarSign, Clock, AlertTriangle, XCircle } from 'lucide-react';

const steps = [
  {
    day: '25-28',
    label: 'Preventivo',
    icon: Bell,
    color: 'bg-blue-500',
    msg: '"Tu cuota del próximo mes se acerca"',
    desc: 'Aviso amigable a todos los jugadores',
  },
  {
    day: '1',
    label: 'Cobro Activo',
    icon: DollarSign,
    color: 'bg-emerald-500',
    msg: '"Tu cuota de [mes] ya está activa: $65.000"',
    desc: 'Se activa el cobro oficial',
  },
  {
    day: '4',
    label: 'Recordatorio',
    icon: Clock,
    color: 'bg-amber-500',
    msg: '"Quedan 3 días para pagar"',
    desc: 'Solo a quienes no han pagado',
  },
  {
    day: '7',
    label: 'Vencimiento',
    icon: AlertTriangle,
    color: 'bg-orange-500',
    msg: '"⚠️ HOY vence el plazo!"',
    desc: 'Último aviso antes de mora',
  },
  {
    day: '8+',
    label: 'Mora',
    icon: XCircle,
    color: 'bg-red-500',
    msg: '"Tu cuota está vencida"',
    desc: 'Se marca mora + alerta al presidente',
  },
];

export default function TimelineCobro() {
  const today = new Date().getDate();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Ciclo de Cobro Automático</h2>
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200"></div>
        
        <div className="space-y-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = 
              (step.day === '25-28' && today >= 25 && today <= 28) ||
              (step.day === '1' && today === 1) ||
              (step.day === '4' && today >= 2 && today <= 4) ||
              (step.day === '7' && today >= 5 && today <= 7) ||
              (step.day === '8+' && today >= 8 && today <= 24);

            return (
              <div key={i} className={`relative flex items-start gap-4 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                <div className={`relative z-10 w-12 h-12 rounded-xl ${step.color} flex items-center justify-center flex-shrink-0 ${isActive ? 'ring-4 ring-offset-2 ring-emerald-200' : ''}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">Día {step.day}</span>
                    <span className="text-sm text-gray-500">— {step.label}</span>
                    {isActive && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">HOY</span>}
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">{step.desc}</p>
                  <p className="text-sm italic text-gray-500 mt-1 bg-gray-50 rounded-lg px-3 py-1.5 inline-block">{step.msg}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
