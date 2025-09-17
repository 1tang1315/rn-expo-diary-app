const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

// 让 Metro 识别 .wasm 文件（视为二进制资源）
config.resolver.assetExts.push('wasm');

// 处理 WASM 文件的打包规则（避免被转译）
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: false,
  },
});

module.exports = wrapWithReanimatedMetroConfig(config);