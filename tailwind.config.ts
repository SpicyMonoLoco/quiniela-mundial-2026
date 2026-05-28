import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      colors: {
        ink: '#0b0f17',
        card: '#121826',
        line: '#1f2937',
        accent: '#22d3ee',
        gold: '#fbbf24',
        win: '#34d399',
        lose: '#f87171'
      }
    }
  },
  plugins: []
}

export default config
