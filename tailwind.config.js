/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Things3-inspired palette
                'app-bg': '#ffffff',
                'sidebar-bg': '#f3f4f6', // gray-100
                'accent-blue': '#007AFF',
                'text-primary': '#1f2937', // gray-800
                'text-secondary': '#6b7280', // gray-500
                'border-color': '#e5e7eb', // gray-200
            }
        },
    },
    plugins: [],
}
