import 'react-native';

declare module 'react-native' {
  // Define web-specific style properties
  interface WebStyle {
    cursor?: 'pointer' | 'default' | 'not-allowed' | 'text' | 'move' | 'grab' | 'grabbing' | 'zoom-in' | 'zoom-out';
    userSelect?: 'none' | 'auto' | 'text' | 'contain' | 'all';
    boxSizing?: 'border-box' | 'content-box' | 'initial' | 'inherit';
    transition?: string;
    transform?: string;
    WebkitOverflowScrolling?: 'auto' | 'touch';
    WebkitAppearance?: string;
    WebkitTapHighlightColor?: string;
    WebkitTextFillColor?: string;
    WebkitUserSelect?: string;
    WebkitTouchCallout?: string;
    overflow?: 'visible' | 'hidden' | 'scroll' | 'auto' | 'initial' | 'inherit' | 'overlay';
    overflowX?: 'visible' | 'hidden' | 'scroll' | 'auto' | 'initial' | 'inherit' | 'overlay';
    overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto' | 'initial' | 'inherit' | 'overlay';
  }

  // Extend the base ViewStyle with web-specific properties
  interface ViewStyle extends WebStyle {}
  
  // Extend TextStyle with web-specific properties
  interface TextStyle extends WebStyle {}
  
  // Extend ImageStyle with web-specific properties
  interface ImageStyle extends WebStyle {}
}

// Extend React's CSSProperties
declare module 'react' {
  interface CSSProperties {
    [key: string]: any;
  }
}
