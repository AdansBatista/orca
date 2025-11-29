import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			// Modern Cyan-Teal Primary (Green-ish Blue)
  			primary: {
  				'50': '#ecfeff',
  				'100': '#cffafe',
  				'200': '#a5f3fc',
  				'300': '#67e8f9',
  				'400': '#22d3ee',
  				'500': '#06b6d4',
  				'600': '#0891b2',
  				'700': '#0e7490',
  				'800': '#155e75',
  				'900': '#164e63',
  				'950': '#083344',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			// Darker Silk/Slate for sophisticated backgrounds
  			silk: {
  				'50': '#f8fafc',
  				'100': '#f1f5f9',
  				'200': '#e2e8f0',
  				'300': '#cbd5e1',
  				'400': '#94a3b8',
  				'500': '#64748b',
  				'600': '#475569',
  				'700': '#334155',
  				'800': '#1e293b',
  				'900': '#0f172a',
  				'950': '#020617'
  			},
  			// Accent - Vibrant Emerald for highlights
  			accent: {
  				'50': '#ecfdf5',
  				'100': '#d1fae5',
  				'200': '#a7f3d0',
  				'300': '#6ee7b7',
  				'400': '#34d399',
  				'500': '#10b981',
  				'600': '#059669',
  				'700': '#047857',
  				'800': '#065f46',
  				'900': '#064e3b',
  				'950': '#022c22',
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			// Secondary - Soft violet for variety
  			secondary: {
  				'50': '#faf5ff',
  				'100': '#f3e8ff',
  				'200': '#e9d5ff',
  				'300': '#d8b4fe',
  				'400': '#c084fc',
  				'500': '#a855f7',
  				'600': '#9333ea',
  				'700': '#7e22ce',
  				'800': '#6b21a8',
  				'900': '#581c87',
  				'950': '#3b0764',
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			// Semantic colors - modern variants
  			success: {
  				'50': '#f0fdf4',
  				'100': '#dcfce7',
  				'500': '#22c55e',
  				'600': '#16a34a',
  				'700': '#15803d',
  				DEFAULT: '#22c55e',
  				foreground: '#ffffff'
  			},
  			warning: {
  				'50': '#fffbeb',
  				'100': '#fef3c7',
  				'500': '#f59e0b',
  				'600': '#d97706',
  				'700': '#b45309',
  				DEFAULT: '#f59e0b',
  				foreground: '#000000'
  			},
  			error: {
  				'50': '#fef2f2',
  				'100': '#fee2e2',
  				'500': '#ef4444',
  				'600': '#dc2626',
  				'700': '#b91c1c',
  				DEFAULT: '#ef4444',
  				foreground: '#ffffff'
  			},
  			info: {
  				'50': '#eff6ff',
  				'100': '#dbeafe',
  				'500': '#3b82f6',
  				'600': '#2563eb',
  				'700': '#1d4ed8',
  				DEFAULT: '#3b82f6',
  				foreground: '#ffffff'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'sans-serif'
  			],
  			mono: [
  				'JetBrains Mono',
  				'Fira Code',
  				'Consolas',
  				'monospace'
  			]
  		},
  		borderRadius: {
  			'4xl': '2rem',
  			'5xl': '2.5rem',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
  			'glass-sm': '0 2px 15px rgba(0, 0, 0, 0.05)',
  			'lift': '0 10px 40px -10px rgba(0, 0, 0, 0.2)',
  			'lift-sm': '0 4px 20px -5px rgba(0, 0, 0, 0.15)',
  			'glow': '0 0 10px rgba(6, 182, 212, 0.2)',
  			'glow-accent': '0 0 10px rgba(16, 185, 129, 0.2)',
  			'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
  		},
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
  			'gradient-primary': 'linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%)',
  			'gradient-primary-hover': 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 50%, #0891b2 100%)',
  			'gradient-accent': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  			'gradient-dark': 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  			'gradient-silk': 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  			'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  			'gradient-mesh': 'radial-gradient(at 40% 20%, rgba(6, 182, 212, 0.1) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(16, 185, 129, 0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(147, 51, 234, 0.1) 0px, transparent 50%)'
  		},
  		backdropBlur: {
  			xs: '2px'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
  			'fade-in': {
  				from: { opacity: '0' },
  				to: { opacity: '1' }
  			},
  			'fade-up': {
  				from: { opacity: '0', transform: 'translateY(10px)' },
  				to: { opacity: '1', transform: 'translateY(0)' }
  			},
  			'scale-in': {
  				from: { opacity: '0', transform: 'scale(0.95)' },
  				to: { opacity: '1', transform: 'scale(1)' }
  			},
  			shimmer: {
  				'100%': { transform: 'translateX(100%)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.3s ease-out',
  			'fade-up': 'fade-up 0.4s ease-out',
  			'scale-in': 'scale-in 0.2s ease-out',
  			shimmer: 'shimmer 2s infinite'
  		},
  		spacing: {
  			'18': '4.5rem',
  			'88': '22rem',
  			'128': '32rem'
  		},
  		// Layout-specific values
  		width: {
  			'sidebar': '16rem',
  			'sidebar-sm': '4rem',
  			'list-narrow': '18rem',
  			'list': '20rem',
  			'list-wide': '24rem',
  		},
  		height: {
  			'header': '4rem',
  			'header-sm': '3.5rem',
  			'toolbar': '3.25rem',
  			'row': '3rem',
  			'row-sm': '2.5rem',
  		},
  		minHeight: {
  			'content': 'calc(100vh - 4rem)',
  		},
  		maxWidth: {
  			'content': '80rem',
  		},
  		zIndex: {
  			'sidebar': '40',
  			'header': '30',
  			'dropdown': '50',
  			'modal': '100',
  			'toast': '200',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
