module.exports = {
  presets: [
    ["babel-preset-expo", { reanimated: false }]
  ],
  plugins: [
    '@babel/plugin-proposal-export-namespace-from',
    'react-native-worklets/plugin',
  ],
};