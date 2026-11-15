// CARETRACE Design Tokens
// System-wide design variables ensuring consistency, visual hierarchy, and elder accessibility

export const tokens = {
  colors: {
    primary: {
      DEFAULT: '#123C43', // Primary deep teal
      hover: '#0E3036',
      active: '#092125',
      light: '#1B545D',
    },
    secondary: {
      DEFAULT: '#247C78', // Secondary teal
      hover: '#1D6461',
      active: '#164E4C',
      light: '#319590',
    },
    mint: {
      DEFAULT: '#E8F4EF', // Soft mint surface
      hover: '#DCEDE5',
      border: '#CBE4D9',
    },
    canvas: {
      background: '#F7F8F5', // Warm background
      surface: '#FFFFFF', // White surface
      subtle: '#F0F3F1',
    },
    text: {
      main: '#172B2B', // Main text (High contrast)
      secondary: '#627270', // Secondary text
      muted: '#859593',
      inverse: '#FFFFFF',
    },
    border: {
      subtle: '#E2E9E5', // Subtle card and divider borders
      strong: '#CCD6D1',
      focus: '#247C78', // Focus indicator
    },
    feedback: {
      success: {
        DEFAULT: '#237A57',
        bg: '#EAF5F0',
        border: '#BFE4D3',
        text: '#17563C',
      },
      warning: {
        DEFAULT: '#B7791F',
        bg: '#FEF7ED',
        border: '#F6D9A9',
        text: '#83520E',
      },
      danger: {
        DEFAULT: '#B54747',
        bg: '#FDF2F2',
        border: '#F4C5C5',
        text: '#852D2D',
      },
      info: {
        DEFAULT: '#3478A5',
        bg: '#EFF6FA',
        border: '#C1DEF0',
        text: '#225577',
      },
    },
  },
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.875rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    },
  },
  touchTarget: {
    min: '44px',
    elder: '54px',
  },
  radii: {
    sm: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    '2xl': '1.25rem', // 20px
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(18, 60, 67, 0.05)',
    card: '0 1px 3px 0 rgba(18, 60, 67, 0.06), 0 1px 2px -1px rgba(18, 60, 67, 0.04)',
    elevated: '0 4px 6px -1px rgba(18, 60, 67, 0.08), 0 2px 4px -2px rgba(18, 60, 67, 0.05)',
    modal: '0 20px 25px -5px rgba(18, 60, 67, 0.12), 0 8px 10px -6px rgba(18, 60, 67, 0.06)',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;
