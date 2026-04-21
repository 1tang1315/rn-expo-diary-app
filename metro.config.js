const { getDefaultConfig } = require("@expo/metro-config");
const config = getDefaultConfig(__dirname);

// Let Metro treat .wasm as static binary assets.
if (!config.resolver.assetExts.includes("wasm")) {
  config.resolver.assetExts.push("wasm");
}

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: false,
  },
});

module.exports = config;