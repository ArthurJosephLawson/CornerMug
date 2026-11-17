/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FAF7F2',
        'ivory-deep': '#F5F2EB',
        charcoal: '#1E1E24',
        'charcoal-soft': '#2A2A32',
        lavender: '#C8B6FF',
        'lavender-deep': '#A98FE8',
        pink: '#F4ACB7',
        'pink-deep': '#E58CA0',
        butter: '#FDE49E',
        'butter-deep': '#F0CE6B',
        sage: '#B7E4C7',
        'sage-deep': '#8CCBA0',
        powder: '#BDE0FE',
        'powder-deep': '#8FC4F2',
        peach: '#FFD6BA',
        'peach-deep': '#F2B98A',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 2px 12px rgba(30, 30, 36, 0.06)',
        card: '0 6px 24px rgba(30, 30, 36, 0.08)',
        lift: '0 12px 32px rgba(30, 30, 36, 0.14)',
      },
    },
  },
  plugins: [],
};
