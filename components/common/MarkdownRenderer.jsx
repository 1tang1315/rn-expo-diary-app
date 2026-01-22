import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

const MarkdownRenderer = ({ content, style }) => {
  const { theme } = useTheme();

  const markdownStyles = StyleSheet.create({
    body: {
      padding: 0,
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.text
    },
    heading1: {
      marginVertical: 10,
      color: theme.colors.text,
      fontSize: 24,
      fontWeight: 'bold',
    },
    heading2: {
      marginVertical: 8,
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: 'bold'
    },
    heading3: {
      marginVertical: 6,
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: 'bold'
    },
    heading4: {
      marginVertical: 4,
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: 'bold'
    },
    heading5: {
      marginVertical: 2,
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: 'bold'
    },
    heading6: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: 'bold'
    },
    strong: {
      color: theme.colors.text,
      fontWeight: 'bold',
    },
    em: {
      color: theme.colors.text,
      fontStyle: 'italic',
    },
    paragraph: {
      color: theme.colors.text,
      lineHeight: 24,
    },
    list_item: {
      color: theme.colors.text,
      lineHeight: 24,
    },
    bullet_list: {
      marginTop: 8,
      marginBottom: 8,
      color: theme.colors.text
    },
    ordered_list: {
      marginTop: 8,
      marginBottom: 8,
      color: theme.colors.text
    },
    code_inline: {
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      color: '#d63384',
      fontFamily: 'monospace',
      fontSize: 14,
      backgroundColor: theme.colors.innerCard
    },
    code_block: {
      marginTop: 8,
      marginBottom: 8,
      padding: 12,
      borderRadius: 8,
      color: theme.colors.text,
      fontFamily: 'monospace',
      fontSize: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.innerCard,
    },
    fence: {
      marginTop: 8,
      marginBottom: 8,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      fontSize: 14,
      fontFamily: 'monospace',
      color: theme.colors.text,
      backgroundColor: theme.colors.innerCard,
    },
    blockquote: {
      marginTop: 8,
      marginBottom: 8,
      paddingLeft: 12,
      paddingVertical: 8,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.interactive,
      fontStyle: 'italic',
      color: theme.colors.subText,
      backgroundColor: theme.colors.innerCard
      
    },
    hr: {
      height: 1,
      marginTop: 10,
      marginBottom: 10,
      backgroundColor: theme.colors.border
    },
    link: {
      color: theme.colors.interactive,
      textDecorationLine: 'underline',
    },
    table: {
      marginTop: 8,
      marginBottom: 8,
      borderRadius: 8,
      borderColor: theme.colors.border,
      overflow: 'hidden'
    },
    thead: {
      borderColor: theme.colors.border
    },
    tbody: {
      borderColor: theme.colors.border,
      backgroundColor: 'transparent',
    },
    th: {
      padding: 8,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: theme.colors.border,
      color: theme.colors.text,
      fontWeight: 'bold',
      fontSize: 14,
    },
    td: {
      padding: 8,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: theme.colors.border,
      color: theme.colors.text,
      fontSize: 14,
    },
    tr: {
      borderColor: theme.colors.border,
      backgroundColor: 'transparent',
    },
  });

  const rules = {
    heading1: (node, children, parent, styles) => (
      <Text key={node.key} style={styles.heading1}>
        {children}
      </Text>
    ),
    heading2: (node, children, parent, styles) => (
      <Text key={node.key} style={styles.heading2}>
        {children}
      </Text>
    ),
    heading3: (node, children, parent, styles) => (
      <Text key={node.key} style={styles.heading3}>
        {children}
      </Text>
    ),
    heading4: (node, children, parent, styles) => (
      <Text key={node.key} style={styles.heading4}>
        {children}
      </Text>
    ),
    heading5: (node, children, parent, styles) => (
      <Text key={node.key} style={styles.heading5}>
        {children}
      </Text>
    ),
    heading6: (node, children, parent, styles) => (
      <Text key={node.key} style={styles.heading6}>
        {children}
      </Text>
    ),
  };

  const componentStyles = StyleSheet.create({
    container: {
      width: '100%',
    },
  });

  return (
    <View style={[componentStyles.container, style]}>
      <Markdown style={markdownStyles} rules={rules}>
        {content || ''}
      </Markdown>
    </View>
  );
};

export default MarkdownRenderer;
