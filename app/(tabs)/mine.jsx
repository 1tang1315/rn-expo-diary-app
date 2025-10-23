import { SafeAreaView } from 'react-native-safe-area-context';
import DatabaseViewer  from "@/db/DatabaseViewer";
import { Demo2 } from "@/components/Demo2";
import AIStreamText from "@/components/common/AIStreamText";
import { Button } from "react-native";
import { useState } from "react";

const content = {
  thought: "用户的报错信息显示在 Expo Router 中，RNSScreenContainer 处发生了 Cannot read property 'toString' of undefined，这通常是因为屏幕组件缺少正确的 key 或 id 导致的。结合 Expo Router 的机制，_layout.jsx 中定义的路由表会作为 children 传递给 Tabs 或 Stack 组件，而每个子元素需要有明确的 name（会被用作 key）。\n" +
    "因此，我首先会怀疑用户在 (tabs)/_layout.jsx 中使用了动态生成的路由，例如 map 循环但没有提供稳定的 key，或者直接渲染了没有 name 属性的组件。\n" +
    "我需要指导用户检查 _layout.jsx 的 children 部分，确保每个路由项都有固定的 name，并且 key 与 name 一致。\n" +
    "为了帮助用户快速验证问题，我可以提供一个正确的静态路由示例，以及一个如果必须动态生成路由时如何正确设置 key 和 name 的示例。\n" +
    "最后，总结常见的错误模式，帮助用户对照排查。",
  output: `
    ⚠️ 在 Expo + 流式回复可能遇到的问题
SSE 支持与网络拦截：Expo 的版本里有 issue 提到 SSE（或 fetch 的 streaming body）被网络拦截器拦住，导致流式响应被延迟或整块返回。
GitHub
** polyfills**：React Native 在一些版本里对 ReadableStream、TextDecoder 等 web API 支持不全，可能要引入 polyfill（或用已有库如 react-native-sse）来处理 SSE。
性能：逐 token 更新 UI 时，如果每次都大量重渲染列表或整条消息组件，性能可能会掉，滚动／闪动问题。要优化 state 更新粒度、尽量局部更新 UI。
💡 简易组件思路实现（用 Vue 的思路你也可以改成 RN + JS）
下面是一个在 Expo RN + JS + React Hooks 的伪代码思路，只保留核心流式显示部分。你可以基于这个自己封装成组件。
如果你愿意的话，我可以帮你写一个完整的 RN + Expo 的“流式回复组件”，包含问答输入框、逐字显示、loading 指示 etc，你要吗？
  `
}
export default function Mine() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1); // 每次刷新 key 改变
  };
  
  return (
    <SafeAreaView style={{flex: 1}}>
      <DatabaseViewer />
      <Button title="刷新" onPress={handleRefresh} />
      <AIStreamText key={refreshKey} content={content} />
    </SafeAreaView>
  );
}
