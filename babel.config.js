module.exports = function (api) {
  api.cache(true);
  
  return {
    presets: [
      'babel-preset-expo',
      '@babel/preset-typescript',
    ],
    plugins: [
      'expo-router/babel',
      'react-native-reanimated/plugin',
      ['module-resolver', {
        root: ['.'],
        extensions: [
          '.ios.js',
          '.android.js',
          '.ios.jsx',
          '.android.jsx',
          '.js',
          '.jsx',
          '.json',
          '.tsx',
          '.ts',
        ],
        alias: {
          '@': './app',
          '@app': './app',
          '@components': './app/components',
          '@contexts': './app/contexts',
          '@hooks': './app/hooks',
          '@screens': './app/screens',
          '@types': './app/types',
          '@utils': './app/utils',
          '@assets': './assets',
        },
      }],
    ],
  };
};
