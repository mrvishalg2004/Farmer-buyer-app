/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#2E7D32';
const tintColorDark = '#A5D6A7';

export const Colors = {
  light: {
    text: '#1B5E20',
    background: '#F1F8E9',
    tint: tintColorLight,
    icon: '#4E342E',
    tabIconDefault: '#9E9E9E',
    tabIconSelected: tintColorLight,
    surface: '#FFFFFF',
    border: '#C8E6C9',
    accent: '#FFB300',
    earthy: '#795548',
    secondaryText: '#558B2F',
  },
  dark: {
    text: '#ECEDEE',
    background: '#1B2E1C',
    tint: tintColorDark,
    icon: '#A5D6A7',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    surface: '#263238',
    border: '#384347',
    accent: '#FFD54F',
    earthy: '#A1887F',
    secondaryText: '#C5E1A5',
  },
};

export const Shadows = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  }
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
