// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get the path aliases from tsconfig.json
const { getTsconfig } = require('get-tsconfig');
const tsConfig = getTsconfig();
const { paths: tsPaths } = tsConfig.config.compilerOptions;

// Convert the paths to the format expected by Metro
const pathAliases = Object.entries(tsPaths || {}).reduce((aliases, [key, [value]]) => {
  const alias = key.replace('/*', '');
  const aliasPath = path.resolve(__dirname, value.replace('/*', '').replace('./', ''));
  aliases[alias] = aliasPath;
  return aliases;
}, {});

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configurar las extensiones de archivo
config.resolver.sourceExts = [
  'expo-router',
  'expo-router/entry',
  ...config.resolver.sourceExts,
  'mjs',
  'json',
  'js',
  'jsx',
  'ts',
  'tsx',
  'cjs',
];

// Configurar los activos estáticos
config.resolver.assetExts = [
  ...config.resolver.assetExts.filter(ext => ext !== 'svg'),
  'svg',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'ttf',
  'otf',
];

// Configurar watchFolders para incluir carpetas relevantes
config.watchFolders = [
  ...config.watchFolders,
  path.resolve(__dirname, 'app'),
  ...Object.values(pathAliases).filter(p => p && path.isAbsolute(p))
];

// Configurar el transformador para manejar SVG
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

// Configuración adicional para resolver
config.resolver = {
  ...config.resolver,
  resolverMainFields: ['sbmodern', 'browser', 'main'],
  extraNodeModules: new Proxy(
    {},
    {
      get: (target, name) => {
        // Resolver alias de rutas primero
        if (pathAliases[name]) {
          return pathAliases[name];
        }
        // Redirigir las dependencias resueltas a node_modules
        return path.join(__dirname, `node_modules/${name}`);
      },
    }
  ),
};

module.exports = config;
