import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';

interface ThemedViewProps extends React.ComponentProps<typeof View> {
  light: string;
  dark: string;
  style?: ViewStyle | ViewStyle[];
}

export const ThemedView: React.FC<ThemedViewProps> = ({ light, dark, style, ...props }) => {
  const backgroundColor = useThemeColor({ light, dark }, 'background');
  const themedStyle = StyleSheet.flatten([style, { backgroundColor }]);
  return <View style={themedStyle} {...props} />;
};

interface ThemedTextProps extends React.ComponentProps<typeof Text> {
  light: string;
  dark: string;
  style?: TextStyle | TextStyle[];
  type?: 'title' | 'subtitle' | 'body';
}

export const ThemedText: React.FC<ThemedTextProps> = ({ style, type = 'body', children, ...props }) => {
  const color = useThemeColor({}, 'text');
  const themedStyle = StyleSheet.flatten([{
    color,
    ...(type === 'title' && { fontSize: 24, fontWeight: 'bold' }),
    ...(type === 'subtitle' && { fontSize: 18, color: useThemeColor({}, 'secondaryText') }),
    ...(type === 'body' && { fontSize: 16 }),
  }, style]);
  return <Text style={themedStyle} {...props}>{children}</Text>;
};
