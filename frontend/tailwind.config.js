import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Brand colours (mirror the --color-* vars in src/index.css). Registered
      // here so opacity variants like text-intel-dark/60 or bg-serene-green/5
      // actually generate CSS — as plain CSS classes they silently did nothing.
      colors: {
        'intel-dark': '#1A1A1A',
        'serene-green': '#1C3F39',
        terracotta: '#C19B6C',
        // Soft pastel tints for a warmer, cosier feel alongside the brand colours
        peach: '#F6DCC8',
        sage: '#DCE8DC',
        sky: '#DCE6EE',
        lavender: '#E6DEEC',
      },
      // A gentle spring for hover and entrance motion
      transitionTimingFunction: {
        bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      // font-black is used ~190 times for headings, labels and buttons. 900 read
      // as loud and heavy; 700 keeps the hierarchy with a calmer, clinical tone.
      fontWeight: {
        black: '700',
      },
    },
  },
  plugins: [animate],
};
