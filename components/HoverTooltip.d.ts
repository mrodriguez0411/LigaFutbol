import React from 'react';
import { ViewStyle } from 'react-native';

declare interface HoverTooltipProps {
  children: React.ReactNode;
  content: string;
  style?: ViewStyle;
}

declare const HoverTooltip: React.FC<HoverTooltipProps>;

export { HoverTooltip };
