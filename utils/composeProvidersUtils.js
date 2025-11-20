/**
 * 将多个返回 React Context Provider 的“工厂函数”组合成一个。
 * 这样可以在组合的同时，为每个 Provider 传递各自所需的 props。
 *
 * @param  {...Function} providerFactories
 * - 一系列“工厂函数”。
 *   每个函数接收从最外层传入的 props 对象，
 *   并返回一个渲染好的 Provider 组件。
 * @returns {React.Component} 返回一个新的组合组件。
 *
 * @example
 * // 定义带 props 的 Provider 工厂
 * const ThemeProviderWithProps = (props) => (
 *   <ThemeProvider initialConfig={props.initialThemeConfig}>
 *     {props.children}
 *   </ThemeProvider>
 * );
 *
 * const AIConfigProviderWithProps = (props) => (
 *   <AIConfigProvider apiKey={props.aiApiKey}>
 *     {props.children}
 *   </AIConfigProvider>
 * );
 *
 * // 组合它们
 * const AppProviders = composeProviders(
 *   ThemeProviderWithProps,
 *   AIConfigProviderWithProps
 * );
 *
 * // 使用组合后的组件，并传入所有需要的 props
 * ReactDOM.render(
 *   <AppProviders
 *     initialThemeConfig={myThemeConfig}
 *     aiApiKey={myAiApiKey}
 *   >
 *     <App />
 *   </AppProviders>,
 *   document.getElementById('root')
 * );
 */
export function composeProviders(...providerFactories) {
  if (providerFactories.length === 0) {
    return function ComposedProviders(props) {
      return props.children;
    };
  }
  
  return providerFactories.reduce((acc, currentFactory) => {
    return function ComposedProviders(props) {
      // currentFactory 是一个函数，我们调用它并传入所有 props
      // 它会返回一个渲染好的 Provider 组件（例如 <ThemeProvider ... />）
      // 然后我们将累积的组件（acc）作为它的 children
      return currentFactory({
        ...props,
        children: <acc {...props} />,
      });
    };
  });
}