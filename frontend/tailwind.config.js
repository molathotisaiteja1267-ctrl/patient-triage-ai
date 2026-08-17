/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hospital: {
          bg: '#F5F8FC',
          surface: '#FFFFFF',
          text: '#172033',
          muted: '#64748B',
          border: '#E2E8F0',
          blue: {
            DEFAULT: '#2563EB',
            light: '#EAF2FF',
            border: '#C9DBF8',
            dark: '#1D4ED8'
          },
          success: {
            DEFAULT: '#16A34A',
            light: '#EAF8EF',
            border: '#B7E4C7',
            dark: '#15803D'
          },
          warning: {
            DEFAULT: '#F59E0B',
            light: '#FFF7E6',
            border: '#F5C451',
            dark: '#D97706'
          },
          orange: {
            DEFAULT: '#F97316',
            light: '#FFF1E8',
            border: '#FDBA74',
            dark: '#C2410C'
          },
          danger: {
            DEFAULT: '#DC2626',
            light: '#FDECEC',
            border: '#F3A6A6',
            dark: '#B91C1C'
          },
          critical: {
            DEFAULT: '#B91C1C',
            light: '#FEE2E2',
            border: '#F87171',
            dark: '#991B1B'
          }
        },
        triage: {
          red: {
            DEFAULT: '#DC2626',
            light: '#FDECEC',
            dark: '#B91C1C',
            border: '#F3A6A6'
          },
          orange: {
            DEFAULT: '#F97316',
            light: '#FFF1E8',
            dark: '#C2410C',
            border: '#FDBA74'
          },
          yellow: {
            DEFAULT: '#F59E0B',
            light: '#FFF7E6',
            dark: '#D97706',
            border: '#F5C451'
          },
          green: {
            DEFAULT: '#16A34A',
            light: '#EAF8EF',
            dark: '#15803D',
            border: '#B7E4C7'
          },
          blue: {
            DEFAULT: '#2563EB',
            light: '#EAF2FF',
            dark: '#1D4ED8',
            border: '#C9DBF8'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'dropdown': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'modal': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
      }
    },
  },
  plugins: [],
}
