import React from 'react';
import { Ionicons } from '@expo/vector-icons';

interface TabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
}

export default function TabIcon({ name, color }: TabIconProps) {
  return <Ionicons name={name as keyof typeof Ionicons.glyphMap} size={24} color={color} />;
}
