import { useEffect } from 'react';
import { Platform } from 'react-native';

import type { ThemeColors } from '@/constants/theme';

/**
 * Custom hook to inject global web-specific styles.
 * This is necessary for styles like scrollbar customization, hover effects,
 * and other browser-specific CSS that cannot be applied via StyleSheet.create().
 * 
 * This hook should be called once at the root level of the app.
 */
export function useWebStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const styleId = 'ava-web-styles';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    const css = `
      :root {
        color-scheme: ${scheme};
        --ava-background: ${colors.background};
        --ava-surface: ${colors.surface};
        --ava-surface-muted: ${colors.surfaceMuted};
        --ava-text: ${colors.text};
        --ava-secondary-text: ${colors.secondaryText};
        --ava-border: ${colors.border};
        --ava-tint: ${colors.tint};
        --ava-tint-soft: ${colors.tintSoft};
        --ava-primary-muted: ${colors.primaryMuted};
        --ava-inverse-text: ${colors.inverseText};
        --ava-icon: ${colors.icon};
      }

      html {
        scroll-behavior: smooth;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: var(--ava-background);
        color: var(--ava-text);
      }

      body {
        margin: 0;
        padding: 0;
        background-color: var(--ava-background);
        color: var(--ava-text);
        min-height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
          'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
          sans-serif;
        transition: background-color 0.3s ease, color 0.3s ease;
      }

      body > #root {
        min-height: 100vh;
        background-color: var(--ava-background);
      }

      body > #root > div {
        background-color: var(--ava-background);
        min-height: 100vh;
        transition: background-color 0.3s ease;
      }

      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: var(--ava-surface-muted);
        border-radius: 10px;
      }

      ::-webkit-scrollbar-thumb {
        background: var(--ava-primary-muted);
        border-radius: 10px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: var(--ava-tint);
      }

      * {
        scrollbar-width: thin;
        scrollbar-color: var(--ava-primary-muted) var(--ava-surface-muted);
      }

      *:focus-visible {
        outline: 2px solid var(--ava-tint);
        outline-offset: 2px;
        border-radius: 4px;
      }

      [data-web-hover='true']:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
        transition: all 0.2s ease-in-out;
      }

      [data-web-hover='true'][disabled]:hover {
        transform: none;
        box-shadow: none;
        cursor: not-allowed;
      }

      button, [role="button"] {
        cursor: pointer;
        user-select: none;
      }

      button:disabled, [role="button"][disabled] {
        cursor: not-allowed;
        opacity: 0.6;
      }

      ::selection {
        background-color: var(--ava-tint);
        color: var(--ava-inverse-text);
      }

      a, button, [role="button"], input, select, textarea {
        transition: all 0.2s ease-in-out;
      }

      button, [role="button"], .no-select {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }

      input, textarea, select {
        font-family: inherit;
      }

      input:focus, textarea:focus, select:focus {
        outline: 2px solid var(--ava-tint);
        outline-offset: 2px;
      }

      @media (min-width: 1024px) {
        body > #root > div {
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
        }
      }

      @media (min-width: 768px) and (max-width: 1023px) {
        body > #root > div {
          padding: 24px;
        }
      }

      @media (max-width: 767px) {
        body > #root > div {
          padding: 16px;
        }

        button, [role="button"], a {
          min-height: 44px;
          min-width: 44px;
        }
      }

      @media print {
        body > #root > div {
          background-color: #ffffff;
        }

        button, [role="button"] {
          display: none;
        }
      }
    `;

    styleTag.textContent = css;

    return () => {
      if (styleTag && styleTag.parentElement) {
        styleTag.parentElement.removeChild(styleTag);
      }
    };
  }, [colors.background, colors.border, colors.icon, colors.inverseText, colors.primaryMuted, colors.secondaryText, colors.surface, colors.surfaceMuted, colors.text, colors.tint, colors.tintSoft, scheme]);
}

