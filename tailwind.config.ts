import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
    darkMode: 'class',
    content: ['./src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                heading: ['DM Serif Display', 'Georgia', 'serif'],
                body: ['Geist', 'IBM Plex Sans', 'system-ui', 'sans-serif'],
                mono: ['Geist Mono', 'Fira Code', 'monospace'],
                accent: ['Schoolbell', 'cursive'],
            },
            colors: {
                brand: {
                    chalkboard: '#2D4A3E',
                    'chalkboard-h': '#243D33',
                    pencil: '#E8B84B',
                    chalk: '#FAFAF9',
                    apple: '#C0392B',
                    wood: '#C4A77D',
                    slate: '#5B7B8A',
                    gold: '#D4A843',
                    ink: '#1A1A18',
                    'dark-base': '#111318',
                    'dark-surface': '#1A1D24',
                    'dark-elevated': '#22262F',
                    'dark-border': '#2E3340',
                }
            },
            fontSize: {
                'xs': ['0.75rem', { lineHeight: '1rem' }],
                'sm': ['0.875rem', { lineHeight: '1.25rem' }],
                'base': ['1rem', { lineHeight: '1.6rem' }],
                'lg': ['1.125rem', { lineHeight: '1.75rem' }],
                'xl': ['1.25rem', { lineHeight: '1.75rem' }],
                '2xl': ['1.5rem', { lineHeight: '2rem' }],
                '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
                '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],
                '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
            },
            borderRadius: {
                'none': '0',
                'sm': '3px',
                DEFAULT: '6px',
                'md': '6px',
                'lg': '8px',
                'xl': '12px',
                '2xl': '16px',
                'full': '9999px',
            },
            boxShadow: {
                'xs': '0 1px 2px rgba(0,0,0,0.05)',
                'sm': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
                'md': '0 4px 8px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
                'lg': '0 8px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.04)',
                'xl': '0 16px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06)',
            },
            transitionDuration: {
                '75': '75ms',
                '100': '100ms',
                '150': '150ms',
                '200': '200ms',
                '250': '250ms',
                '400': '400ms',
            },
            transitionTimingFunction: {
                'default': 'cubic-bezier(0.16, 1, 0.3, 1)',
                'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            },
            animation: {
                'fade-in': 'fadeIn 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-up': 'slideUp 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-down': 'slideDown 200ms cubic-bezier(0.16, 1, 0.3, 1)',
            },
            keyframes: {
                fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
                slideUp: { from: { transform: 'translateY(4px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
                slideDown: { from: { transform: 'translateY(-4px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
            },
        }
    },
    plugins: [tailwindcssAnimate],
}

export default config
