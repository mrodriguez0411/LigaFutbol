// Extender las tipificaciones globales para el navegador
declare interface Window {
  // Aquí puedes agregar propiedades globales si es necesario
}

// Asegurar que las propiedades del DOM estén disponibles
declare namespace JSX {
  interface IntrinsicElements {
    input: React.DetailedHTMLProps<
      React.InputHTMLAttributes<HTMLInputElement>,
      HTMLInputElement
    >;
  }
}
