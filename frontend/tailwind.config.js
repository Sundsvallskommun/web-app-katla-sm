module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      // Utility layouts read the same semantic colors as Astryx components.
      colors: {
        foreground: 'var(--color-text-primary)',
        muted: 'var(--color-text-secondary)',
        accent: 'var(--color-text-accent)',
        danger: 'var(--color-text-red)',
        surface: 'var(--color-background-surface)',
        canvas: 'var(--color-background-body)',
        subtle: 'var(--color-background-muted)',
        'accent-subtle': 'var(--color-accent-muted)',
        default: 'var(--color-border)',
      },
    },
  },
};
