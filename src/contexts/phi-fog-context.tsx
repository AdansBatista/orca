'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PhiFogContextType {
	isFogEnabled: boolean;
	toggleFog: () => void;
	enableFog: () => void;
	disableFog: () => void;
}

const PhiFogContext = createContext<PhiFogContextType | undefined>(undefined);

interface PhiFogProviderProps {
	children: ReactNode;
	/** Initial fog state (defaults to environment variable) */
	initialFog?: boolean;
}

/**
 * PHI Fog Provider
 * 
 * Provides global PHI fogging state management.
 * Place at the root of your application.
 * 
 * @example
 * // In app layout
 * <PhiFogProvider>
 *   {children}
 * </PhiFogProvider>
 */
export function PhiFogProvider({ children, initialFog }: PhiFogProviderProps) {
	const [isFogEnabled, setIsFogEnabled] = useState(() => {
		if (initialFog !== undefined) return initialFog;
		
		// Check environment variable
		if (process.env.NEXT_PUBLIC_PHI_FOG === 'true') return true;
		
		// Check localStorage (client-side only)
		if (typeof window !== 'undefined') {
			return localStorage.getItem('phi-fog') === 'true';
		}
		
		return false;
	});

	useEffect(() => {
		// Persist to localStorage
		if (typeof window !== 'undefined') {
			localStorage.setItem('phi-fog', isFogEnabled.toString());
		}
	}, [isFogEnabled]);

	const toggleFog = () => setIsFogEnabled((prev) => !prev);
	const enableFog = () => setIsFogEnabled(true);
	const disableFog = () => setIsFogEnabled(false);

	return (
		<PhiFogContext.Provider
			value={{
				isFogEnabled,
				toggleFog,
				enableFog,
				disableFog,
			}}
		>
			{children}
		</PhiFogContext.Provider>
	);
}

/**
 * Hook to access PHI fog state
 * 
 * @example
 * const { isFogEnabled, toggleFog } = usePhiFog();
 */
export function usePhiFog() {
	const context = useContext(PhiFogContext);
	if (context === undefined) {
		throw new Error('usePhiFog must be used within a PhiFogProvider');
	}
	return context;
}
