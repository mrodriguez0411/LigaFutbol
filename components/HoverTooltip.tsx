import React, { useState } from 'react';
import { View, StyleSheet, Text, ViewStyle, StyleProp, Platform } from 'react-native';

interface HoverTooltipProps {
  children: React.ReactNode;
  content: string;
  style?: StyleProp<ViewStyle>;
}

export const HoverTooltip: React.FC<HoverTooltipProps> = ({ 
  children, 
  content,
  style 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Para dispositivos móviles
  const touchProps = Platform.select({
    native: {
      onPressIn: () => setIsVisible(true),
      onPressOut: () => setIsVisible(false),
    },
    default: {}
  });

  // Para web
  const webProps = Platform.select({
    web: {
      onMouseEnter: () => setIsVisible(true),
      onMouseLeave: () => setIsVisible(false),
    },
    default: {}
  });

  return (
    <View 
      style={[styles.container, style]}
      {...webProps}
    >
      <View 
        {...touchProps}
        style={{ flex: 1 }}
      >
        {children}
      </View>
      {isVisible && (
        <View style={[styles.tooltip, styles.tooltipTop]}>
          <Text style={styles.tooltipText}>{content}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    zIndex: 1000,
    minWidth: 100,
  },
  tooltipTop: {
    bottom: '100%',
    left: '50%',
    transform: [{ translateX: -50 }],
    marginBottom: 8,
  },
  tooltipText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
});
