module.exports = {
  exclude: [
    // Excluimos la carpeta hooks
    'hooks/**',
    // Excluimos todos los archivos .ts
    '**/*.ts',
    // Excluimos archivos .web.ts
    '**/*.web.ts',
    // Excluimos archivos de definición de tipos
    '**/*.d.ts'
  ],
  include: [
    // Solo incluimos archivos .tsx
    '**/*.tsx',
    // Incluimos archivos de configuración
    'app.config.js',
    'babel.config.js',
    'metro.config.js'
  ]
};
