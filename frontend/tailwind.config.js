/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Plus Jakarta Sans como fonte base (textos e tabelas)
        sans: ['"Plus Jakarta Sans"', 'sans-serif'], 
        // Sen como fonte de exibição (títulos e números de destaque)
        display: ['"Sen"', 'sans-serif'],           
      },
      colors: {
        // Mapeando a paleta 'slate' para a escala de Verde Escuro / Cinzas da marca
        slate: {
          50: '#F6F6F6',  // Cinza Claro da marca
          100: '#e6e9e7',
          200: '#cfd5d1',
          300: '#b1b9b4',
          400: '#8C8C8C', // Cinza Médio da marca
          500: '#6b7971',
          600: '#525e57',
          700: '#414b45',
          800: '#233328', // Fundo de cards/inputs (Mais claro que o principal)
          900: '#14211A', // Verde Escuro da marca (Cards em destaque)
          950: '#0B120E', // Fundo principal da aplicação (Verde super escuro)
        },
        // Mapeando a paleta 'blue' para a escala de Verde Claro da marca
        blue: {
          50: '#f7fceb',
          100: '#ecf8d1',
          200: '#d9f1a8',
          300: '#c2e777',
          400: '#aedd4b',
          500: '#9FD140', // Verde Claro da marca (Botões, ícones, destaques)
          600: '#7cb02c', // Cor de hover para botões
          700: '#5e8624',
          800: '#4c6a21',
          900: '#405920',
          950: '#21310e',
        }
      }
    },
  },
  plugins: [],
}