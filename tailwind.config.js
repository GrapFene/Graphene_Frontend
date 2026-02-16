/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss').Config} */
/**
 * Tailwind Configuration
 * 
 * Functionality: Configures Tailwind CSS, including content paths, dark mode, and theme extensions.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
};
