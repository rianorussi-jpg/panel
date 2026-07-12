// Design tokens del dashboard — estética "rollo de comandas"
// Mostrador oscuro + tickets de papel con borde perforado

export const tokens = {
  colors: {
    counter: '#1C1B19',       // fondo del "mostrador" (chrome de la app)
    counterRaised: '#26241F', // paneles sobre el mostrador (sidebar, header)
    counterLine: '#3A372F',   // líneas divisorias sobre el mostrador
    paper: '#FFFDF7',         // tarjetas tipo ticket
    paperShade: '#F4EFE2',    // franjas alternas / hover sobre papel
    ink: '#2B2822',           // texto principal sobre papel
    inkFaded: '#83796A',      // texto secundario sobre papel
    onCounter: '#EDE9DD',     // texto principal sobre mostrador
    onCounterFaded: '#9A9488',// texto secundario sobre mostrador
    stampRed: '#B23A2E',      // negativo / cancelado / cerrado
    registerGreen: '#4F7A4F', // positivo / pagado / abierto
    pendingAmber: '#C98A2C',  // pendiente / en preparación
    border: '#E6DFCC',
  },
  fonts: {
    mono: "'JetBrains Mono', 'Courier New', monospace",
    sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  radius: {
    sm: '4px',
    md: '8px',
  },
};

// Franja de "perforación" para simular el borde arrancado de un ticket
export const perforatedEdge = (color = tokens.colors.counter) => ({
  content: '""',
  display: 'block',
  height: '10px',
  width: '100%',
  backgroundImage: `radial-gradient(circle at 7px 5px, ${color} 5px, transparent 5.5px)`,
  backgroundSize: '14px 10px',
  backgroundRepeat: 'repeat-x',
});
