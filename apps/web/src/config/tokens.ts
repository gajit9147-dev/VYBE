export const tokens = {
  colors: {
    bgApp: "var(--vybe-bg-app)",
    bgElevated: "var(--vybe-bg-elevated)",
    glassBg: "var(--vybe-glass-bg)",
    glassStrongBg: "var(--vybe-glass-strong-bg)",
    glassSubtleBg: "var(--vybe-glass-subtle-bg)",
    glassHoverBg: "var(--vybe-glass-hover-bg)",
    glassBorder: "var(--vybe-glass-border)",
    glassHoverBorder: "var(--vybe-glass-hover-border)",
    textPrimary: "var(--vybe-text-primary)",
    textSecondary: "var(--vybe-text-secondary)",
    textMuted: "var(--vybe-text-muted)",
    accentPink: "var(--vybe-accent-pink)",
    accentPeach: "var(--vybe-accent-peach)",
    accentPurple: "var(--vybe-accent-purple)",
    accentBlue: "var(--vybe-accent-blue)",
    statusSuccess: "var(--vybe-status-success)",
    statusWarning: "var(--vybe-status-warning)",
    statusDanger: "var(--vybe-status-danger)",
    statusInfo: "var(--vybe-status-info)"
  },
  radius: {
    sm: "var(--vybe-radius-sm)",
    md: "var(--vybe-radius-md)",
    lg: "var(--vybe-radius-lg)",
    xl: "var(--vybe-radius-xl)",
    "2xl": "var(--vybe-radius-2xl)",
    pill: "var(--vybe-radius-pill)"
  },
  transitions: {
    fast: "var(--vybe-motion-fast)",
    normal: "var(--vybe-motion-normal)",
    slow: "var(--vybe-motion-slow)"
  }
} as const;
