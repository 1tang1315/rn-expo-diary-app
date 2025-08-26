import React, {
  useEffect,
  useRef,
  useState
} from 'react';
import {
  Pressable,
  Platform,
  Keyboard,
  Alert,
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView, InteractionManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { KeyboardAccessoryView } from 'react-native-keyboard-accessory';
import {
  Ionicons,
  FontAwesome5,
  MaterialIcons,
  Feather,
  Foundation, MaterialCommunityIcons
} from '@expo/vector-icons';

export default function Editor() {
  const textRef = useRef(null);
  const externalModalRef = useRef(false);
  
  const [content, setContent] = useState('');
  const [selection, setSelection] = useState({
    start: 0,
    end: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [blurred, setBlurred] = useState(false);
  
  // 键盘隐藏监听：只有当不是因为外部模块时，才认为用户收起键盘 -> 退出编辑状态
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidHide', () => {
      if(!externalModalRef.current) {
        setIsEditing(false);
      }
    });
    return () => sub.remove();
  }, []);
  
  // 简单历史记录（编辑时，每次内容变化记录，限制长度）
  useEffect(() => {
    if(!isEditing) return;
    const prev = history[historyIndex] ?? '';
    if(content === prev) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(content);
    if(newHistory.length > 20) {
      newHistory.shift();
    }
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [content]);
  
  const saveContent = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(content);
    if(newHistory.length > 20) {
      newHistory.shift();
    }
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setIsEditing(false);
    Keyboard.dismiss();
    console.log('已保存：', content);
  };
  
  // 返回时检查未保存
  const handleBack = () => {
    const saved = history[historyIndex] ?? '';
    if(isEditing && content !== saved) {
      Alert.alert(
        '提示',
        '是否保存修改？',
        [
          {
            text: '取消',
            style: 'cancel'
          },
          {
            text: '不保存',
            onPress: () => {
              setIsEditing(false);
              Keyboard.dismiss();
            },
            style: 'destructive'
          },
          {
            text: '保存',
            onPress: saveContent
          }
        ]
      );
    } else {
      setIsEditing(false);
      Keyboard.dismiss();
    }
  };
  
  // region 工具栏逻辑(折叠代码注释)
  // 历史记录，每条包含 text 和 selection
  const [history, setHistory] = useState([
    {
      text: '',
      selection: {
        start: 0,
        end: 0
      }
    }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // 抽取统一方法：更新内容并设置光标/选区
  const applyEdit = (handler) => {
    const start = selection.start ?? 0;
    const end = selection.end ?? 0;
    const before = content.slice(0, start);
    const mid = content.slice(start, end);
    const after = content.slice(end);
    
    const {
      newText,
      selection: newSel
    } = handler(before, mid, after, start, end);
    const finalSelection = {
      start: newSel.start,
      end: newSel.end
    };
    
    setContent(newText);
    InteractionManager.runAfterInteractions(() => {
      setSelection(finalSelection);
      textRef.current?.focus();
    });
    
    // 保存历史（限制长度 20）
    const newHistory = history.slice(0, historyIndex + 1).concat({
      text: newText,
      selection: finalSelection
    });
    if(newHistory.length > 20) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  // 通用切换前缀方法（同类工具互斥）
  // prefixes: 同类前缀列表, target: 本次点击的前缀
  const toggleLinePrefix = (prefixes, target) => {
    const pos = selection.start ?? 0;
    const lineStart = Math.max(content.lastIndexOf('\n', pos - 1) + 1, 0);
    const lineEnd = content.indexOf('\n', pos);
    const lineContent = content.slice(lineStart, lineEnd === -1 ? content.length : lineEnd);
    
    let newLine;
    if(lineContent.startsWith(target)) {
      // 已有目标前缀 → 移除
      newLine = lineContent.slice(target.length);
    } else {
      // 替换其他前缀或添加新前缀
      let removed = lineContent;
      for(const p of prefixes) {
        if(lineContent.startsWith(p)) {
          removed = lineContent.slice(p.length);
          break;
        }
      }
      newLine = target + removed;
    }
    
    applyEdit(() => {
      const before = content.slice(0, lineStart);
      const after = content.slice(lineEnd === -1 ? content.length : lineEnd);
      const newText = before + newLine + after;
      const cursor = lineStart + newLine.length;
      return {
        newText,
        selection: {
          start: cursor,
          end: cursor
        }
      };
    });
  };
  
  // 包裹选区（粗体/斜体/删线; 左对齐/居中/右对齐）
  const toggleWrap = (wraps, target, isBlock = false) => {
    const start = selection.start ?? 0;
    const end = selection.end ?? 0;
    const before = content.slice(0, start);
    const mid = content.slice(start, end);
    const after = content.slice(end);
    
    let newMid, cursorPos;
    
    // 检查是否已有目标
    const hasTarget = isBlock
      ? mid.startsWith(target) && mid.endsWith('</p>')
      : mid.startsWith(target) && mid.endsWith(target);
    
    if (hasTarget) {
      // 移除
      newMid = isBlock ? mid.slice(target.length, mid.length - 4) : mid.slice(target.length, mid.length - target.length);
      cursorPos = before.length + newMid.length;
    } else {
      // 替换其他同类标记
      let stripped = mid;
      wraps.forEach(w => {
        if (isBlock) {
          if (stripped.startsWith(w) && stripped.endsWith('</p>')) {
            stripped = stripped.slice(w.length, stripped.length - 4);
          }
        } else {
          if (stripped.startsWith(w) && stripped.endsWith(w)) {
            stripped = stripped.slice(w.length, stripped.length - w.length);
          }
        }
      });
      newMid = isBlock ? target + stripped + '</p>' : target + stripped + target;
      cursorPos = before.length + (isBlock ? target.length + stripped.length : target.length + stripped.length);
    }
    
    applyEdit(() => ({
      newText: before + newMid + after,
      selection: { start: cursorPos, end: cursorPos }
    }));
  };
  
  // 在当前行行首插入前缀
  const insertLinePrefix = (prefix) => {
    const pos = selection.start ?? 0;
    const lineStart = Math.max(content.lastIndexOf('\n', pos - 1) + 1, 0);
    applyEdit(() => {
      const before = content.slice(0, lineStart);
      const rest = content.slice(lineStart);
      const newText = before + prefix + rest;
      const cursor = (before + prefix).length + (pos - lineStart);
      return {
        newText,
        selection: {
          start: cursor,
          end: cursor
        }
      };
    });
  };
  
  // 减少缩进（移除两个空格）
  const removeLinePrefix = (prefix) => {
    const pos = selection.start ?? 0;
    const lineStart = Math.max(content.lastIndexOf('\n', pos - 1) + 1, 0);
    const lineContent = content.slice(lineStart);
    if(lineContent.startsWith(prefix)) {
      applyEdit(() => {
        const before = content.slice(0, lineStart);
        const rest = content.slice(lineStart + prefix.length);
        const cursor = Math.max(pos - prefix.length, 0);
        return {
          newText: before + rest,
          selection: {
            start: cursor,
            end: cursor
          }
        };
      });
    }
  };
  
  // 在光标处插入文本
  const insertAtCursor = (textToInsert) => {
    applyEdit((before, mid, after) => {
      const newText = before + textToInsert + after;
      const cursor = before.length + textToInsert.length;
      return {
        newText,
        selection: {
          start: cursor,
          end: cursor
        }
      };
    });
  };
  
  // 选择媒体并插入占位
  const pickMediaAndInsert = async () => {
    try {
      externalModalRef.current = true;
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if(!permission.granted) {
        externalModalRef.current = false;
        return;
      }
      
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1
      });
      externalModalRef.current = false;
      
      if(res.cancelled) return;
      const uri = res.uri ?? (res.assets && res.assets[0]?.uri) ?? null;
      let mediaType = res.type ?? (res.assets && res.assets[0]?.type) ?? null;
      
      if(!mediaType && uri) {
        const low = uri.toLowerCase();
        if(low.endsWith('.mp4') || low.endsWith('.mov') || low.endsWith('.webm')) {
          mediaType = 'video';
        } else {
          mediaType = 'image';
        }
      }
      
      const name = uri.split('/').pop();
      const placeholder =
        mediaType === 'video'
          ? `!video[${name}](${uri})`
          : `![${name}](${uri})`;
      
      insertAtCursor('\n' + placeholder + '\n');
      
      setTimeout(() => {
        textRef.current?.focus();
        setIsEditing(true);
      }, 250);
    } catch(err) {
      externalModalRef.current = false;
      console.warn('pick media error', err);
    }
  };
  
  // 撤销
  const undo = () => {
    if(historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const {
        text,
        selection
      } = history[newIndex];
      setHistoryIndex(newIndex);
      setContent(text);
      setSelection(selection);
      InteractionManager.runAfterInteractions(() => {
        textRef.current?.focus();
      });
    }
  };
  
  // 重做
  const redo = () => {
    if(historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const {
        text,
        selection
      } = history[newIndex];
      setHistoryIndex(newIndex);
      setContent(text);
      setSelection(selection);
      InteractionManager.runAfterInteractions(() => {
        textRef.current?.focus();
      });
    }
  };
  
  // 工具按钮（位于键盘上方 accessory，按下不应导致失焦）
  const DEFAULT_ICON_SIZE = 20;
  const DEFAULT_ICON_COLOR = "#333";
  
  const ToolButton = ({
    icon,
    onPress,
    active = false
  }) => {
    return (
      <Pressable
        onPress={() => {
          onPress && onPress();
        }}
        style={[styles.toolBtn, active && styles.toolBtnActive]}
        android_ripple={{ color: "#eee" }}
      >
        {React.cloneElement(icon, {
          size: icon.props.size || DEFAULT_ICON_SIZE,
          color: icon.props.color || DEFAULT_ICON_COLOR,
          style: [icon.props.style, styles.hText], // hText 自定义文字图标时生效
        })}
      </Pressable>
    );
  };
  // endregion
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={10}
      >
        {/* 顶部导航 */}
        <View style={styles.navBar}>
          <Pressable style={styles.navButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={22} color="#333" />
          </Pressable>
          <Text style={styles.navTitle}>
            {isEditing ? '编辑文档' : '文档预览'}
          </Text>
          <View style={styles.navRightButtons}>
            {isEditing ? (
              <>
                <Pressable style={styles.navButton} onPress={undo}>
                  <MaterialCommunityIcons name="undo-variant" size={24} color="black" />
                </Pressable>
                <Pressable style={styles.navButton} onPress={redo}>
                  <MaterialCommunityIcons name="redo-variant" size={24} color="black" />
                </Pressable>
                <Pressable style={styles.saveButton} onPress={saveContent}>
                  <Text style={styles.saveText}>保存</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable style={styles.navButton}>
                  <Ionicons name="color-palette" size={22} color="#333" />
                </Pressable>
                <Pressable style={styles.navButton}>
                  <Ionicons name="settings" size={22} color="#333" />
                </Pressable>
              </>
            )}
          </View>
        </View>
        
        {/* 编辑区：直接用 TextInput（多行）避免外层 ScrollView 拦截触摸 */}
        <View style={styles.editorContainer}>
          <TextInput
            ref={textRef}
            value={content}
            onChangeText={(t) => setContent(t)}
            multiline
            style={styles.textInput}
            textAlignVertical="top"
            placeholder="点击进入编辑..."
            onFocus={() => setIsEditing(true)}
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
            selection={selection}
            blurOnSubmit={false}
            onTouchStart={() => {
              // 确保触摸时聚焦以唤起键盘（有些设备需要）
              textRef.current?.focus();
            }}
            scrollEnabled={true} // 内容超出滚动
          />
          {blurred && (
            <View style={styles.blurMask} pointerEvents="none">
              <Text style={styles.blurText}>模糊输入中</Text>
            </View>
          )}
        </View>
        
        {/* 键盘上方工具栏（跨平台） */}
        <KeyboardAccessoryView
          attachTo={textRef} // 绑定输入框
          visible={isEditing}
          alwaysVisible={true} // 始终显示
          androidAdjustResize
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {/* 标题 H1/H2/H3 */}
            {['# ', '## ', '### '].map((prefix, idx) => (
              <ToolButton
                key={idx}
                icon={<Text style={styles.hText}>H{idx + 1}</Text>}
                onPress={() => toggleLinePrefix(['# ', '## ', '### '], prefix)}
              />
            ))}
            
            {/* 文本样式 */}
            <ToolButton
              icon={<FontAwesome5 name="bold" />}
              onPress={() => toggleWrap(['**', '*', '~~'], '**')} />
            <ToolButton
              icon={<FontAwesome5 name="italic" />}
              onPress={() => toggleWrap(['**', '*', '~~'], '*')} />
            <ToolButton
              icon={<FontAwesome5 name="strikethrough" />}
              onPress={() => toggleWrap(['**', '*', '~~'], '~~')} />
            
            {/* 列表（互斥） */}
            <ToolButton
              icon={<Ionicons name="list" />}
              onPress={() => toggleLinePrefix(['1. ', '- ', '- [ ] '], '1. ')} />
            <ToolButton
              icon={<Ionicons name="list-circle" />}
              onPress={() => toggleLinePrefix(['1. ', '- ', '- [ ] '], '- ')} />
            <ToolButton
              icon={<Ionicons name="checkbox-outline" />}
              onPress={() => toggleLinePrefix(['1. ', '- ', '- [ ] '], '- [ ] ')} />
            
            {/* 引用/分隔线 */}
            <ToolButton
              icon={<Feather name="chevron-right" />}
              onPress={() => toggleLinePrefix(['> '], '> ')} />
            <ToolButton
              icon={<MaterialIcons name="horizontal-rule" />}
              onPress={() => insertAtCursor('\n---\n')} />
            
            {/* 对齐（互斥） */}
            <ToolButton
              icon={<Foundation name="align-left" />}
              onPress={() => toggleWrap(['<p align="left">', '<p align="center">', '<p align="right">'], '<p align="left">', true)} />
            <ToolButton
              icon={<Foundation name="align-center" />}
              onPress={() => toggleWrap(['<p align="left">', '<p align="center">', '<p align="right">'], '<p align="center">', true)} />
            <ToolButton
              icon={<Foundation name="align-right" />}
              onPress={() => toggleWrap(['<p align="left">', '<p align="center">', '<p align="right">'], '<p align="right">', true)} />
            
            {/* 缩进 */}
            <ToolButton
              icon={<FontAwesome5 name="indent" />}
              onPress={() => insertLinePrefix('  ')} />
            <ToolButton
              icon={<FontAwesome5 name="outdent" />}
              onPress={() => removeLinePrefix('  ')} />
            
            {/* 图片 / 模糊 */}
            <ToolButton
              icon={<Ionicons name="image" />} onPress={pickMediaAndInsert} />
            <ToolButton
              icon={<Ionicons name="eye-off" />} onPress={() => setBlurred((v) => !v)}
              active={blurred} />
          </ScrollView>
        </KeyboardAccessoryView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  navBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff'
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333'
  },
  navRightButtons: {
    flexDirection: 'row'
  },
  saveButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007aff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500'
  },
  editorContainer: {
    flex: 1,
    padding: 12
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    textAlignVertical: 'top'
  },
  blurMask: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    bottom: 72,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8
  },
  blurText: {
    color: '#666'
  },
  toolbar: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fafafa',
    paddingVertical: 8
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    flexWrap: 'nowrap'
  },
  toolBtn: {
    minWidth: 44,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8
  },
  toolBtnActive: {
    backgroundColor: '#007aff',
    borderColor: '#007aff'
  },
  hText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333'
  }
});
