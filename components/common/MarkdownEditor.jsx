import { useTheme } from '@/context/ThemeContext';
import React, { useEffect, useRef, useState } from 'react';
import {
    Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
    TextInput, TouchableOpacity, View
} from 'react-native';
import Icon from "@/components/common/Icon";
import MarkdownRenderer from "@/components/common/MarkdownRenderer";

const MarkdownEditor = ({
  value,
  onChangeText,
  placeholder = '开始输入...',
  editable = true
}) => {
  const { theme } = useTheme();
  const [mode, setMode] = useState('edit');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  
  const textInputRef = useRef(null);
  
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardWillHide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    
    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);
  
  const toolbarButtons = [
    { icon: 'format-header-1', lib: 'MaterialCommunityIcons', action: () => insertMarkdown('# ') },
    { icon: 'format-header-2', lib: 'MaterialCommunityIcons', action: () => insertMarkdown('## ') },
    { icon: 'format-header-3', lib: 'MaterialCommunityIcons', action: () => insertMarkdown('### ') },
    { icon: 'format-bold', lib: 'MaterialCommunityIcons', action: () => insertMarkdown('**', '**') },
    { icon: 'format-italic', lib: 'MaterialCommunityIcons', action: () => insertMarkdown('*', '*') },
    { icon: 'format-strikethrough', lib: 'MaterialCommunityIcons', action: () => insertMarkdown('~~', '~~') },
    { icon: 'format-list-bulleted', lib: 'MaterialCommunityIcons', action: () => insertMarkdown('- ') },
    { icon: 'format-list-numbered', lib: 'MaterialCommunityIcons', action: () => insertMarkdown('1. ') },
    { icon: 'highlighter', lib: 'FontAwesome5', action: () => insertMarkdown('`', '`') },
    { icon: 'code-tags', lib: 'MaterialCommunityIcons', action: () => insertMarkdown('```\n', '\n```') },
    { icon: 'format-quote-open', lib: 'MaterialCommunityIcons', action: () => insertMarkdown('> ') },
    { icon: 'link-variant', lib: 'MaterialCommunityIcons', action: () => insertMarkdown('[', '](url)') },
    { icon: 'image-outline', lib: 'Ionicons', action: () => insertMarkdown('![alt](', ')') },
    { icon: 'table', lib: 'MaterialCommunityIcons', action: () => insertTable() },
    { icon: 'minus', lib: 'AntDesign', action: () => insertMarkdown('\n---\n') },
  ];
  
  const insertMarkdown = (prefix, suffix = '') => {
    const text = value || '';
    const { start, end } = selection;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    onChangeText(newText);
    
    const newSelection = {
      start: start + prefix.length,
      end: end + prefix.length
    };
    setSelection(newSelection);
  };
  
  const insertTable = () => {
    const tableTemplate = '\n| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n|     |     |     |\n|     |     |     |\n';
    insertMarkdown(tableTemplate);
  };
  
  const renderEditor = () => {
    return (
      <TextInput
        style={[styles.textInput, { color: theme.colors.text }]}
        ref={textInputRef}
        value={value}
        multiline
        autoFocus
        selection={selection}
        textAlignVertical="top"
        keyboardType="default"
        placeholder={placeholder}
        placeholderTextColor={theme.colors.subText}
        onChangeText={onChangeText}
        onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
        editable={editable}
      />
    );
  };
  
  const renderPreview = () => {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        <MarkdownRenderer content={value || ''} />
      </ScrollView>
    );
  };
  
  const renderModeButton = () => {
    const isEditMode = mode === 'edit';
    return (
      <TouchableOpacity
        style={[styles.modeButton, { backgroundColor: theme.colors.innerCard }]}
        onPress={() => setMode(isEditMode ? 'preview' : 'edit')}
      >
        <Icon
          lib={"Ionicons"}
          name={isEditMode ? 'eye-outline' : 'create-outline'}
          size={20}
          color={theme.colors.interactive}
        />
      </TouchableOpacity>
    );
  };
  
  const renderToolbar = () => {
    return (
      <View style={[
        styles.toolbar,
        {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border
        }
      ]}>
        <View style={styles.toolbarLeft}>
          <View style={styles.modeButtons}>
            {renderModeButton()}
          </View>
          
          <View style={[
            styles.toolbarSeparator,
            { backgroundColor: theme.colors.border }
          ]} />
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarContent}
          keyboardShouldPersistTaps="always"
          style={styles.toolbarScrollView}
        >
          {toolbarButtons?.map((button, index) => (
            <TouchableOpacity
              key={index}
              style={styles.toolbarButton}
              onPress={() => {
                button.action();
                textInputRef.current?.focus();
              }}
              disabled={!editable}
            >
              <Icon
                lib={button.lib} name={button.icon} size={20}
                color={editable ? theme.colors.text : theme.colors.subText}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : (isKeyboardVisible ? 105 : 60)}
    >
      <View style={styles.editorContainer}>
        {mode === 'edit' && renderEditor()}
        {mode === 'preview' && renderPreview()}
      </View>
      {renderToolbar()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  editorContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  toolbar: {
    height: 50,
    marginHorizontal: -15,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  modeButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modeButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toolbarScrollView: {
    flex: 1,
  },
  toolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingRight: 8
  },
  toolbarButton: {
    paddingVertical: 6,
    borderRadius: 6,
  },
  toolbarSeparator: {
    width: 1,
    height: 24,
    marginHorizontal: 8,
  },
});

export default MarkdownEditor;
