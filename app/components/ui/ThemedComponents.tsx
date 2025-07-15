import React from 'react';
import { Text as RNText, View as RNView, StyleSheet } from 'react-native';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface ThemedTextProps {
  children?: React.ReactNode;
  style?: any;
}

export const ThemedText: React.FC<ThemedTextProps> = ({ children, style, ...props }) => {
  const colorScheme = useColorScheme();
  const themedStyle = {
    color: Colors[colorScheme as 'light' | 'dark'].text,
    ...style,
  };

  return <RNText style={themedStyle} {...props}>{children}</RNText>;
};

interface ThemedViewProps {
  children?: React.ReactNode;
  style?: any;
}

export const ThemedView: React.FC<ThemedViewProps> = ({ children, style, ...props }) => {
  const colorScheme = useColorScheme();
  const themedStyle = {
    backgroundColor: Colors[colorScheme as 'light' | 'dark'].background,
    ...style,
  };

  return <RNView style={themedStyle} {...props}>{children}</RNView>;
};
