import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FontAwesome, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function Icon({
  lib = 'Ionicons',
  name,
  size = 22,
  color,
  style
}) {
  const { theme } = useTheme();
  const iconColor = color || theme.colors.interactive;
  
  let IconComponent;
  switch(lib) {
    case 'Ionicons':
      IconComponent = Ionicons;
      break;
    case 'FontAwesome':
      IconComponent = FontAwesome;
      break;
    case 'MaterialIcons':
      IconComponent = MaterialIcons;
      break;
    case 'MaterialCommunityIcons':
      IconComponent = MaterialCommunityIcons;
      break;
    default:
      console.warn(`Unsupported icon library: ${lib}`);
      return null;
  }
  
  if(!IconComponent) return null;
  return <IconComponent name={name} size={size} color={iconColor} style={style} />;
}
