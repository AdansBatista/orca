'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

/**
 * Expansion levels for the Chair Status Sidebar
 * 0 = Collapsed (donut chart only, 50px)
 * 1 = Semi-expanded (vertical stack, 50px)
 * 2 = Fully expanded (full cards, 320px)
 */
export type ExpansionLevel = 0 | 1 | 2;

interface ChairSidebarContextType {
	level: ExpansionLevel;
	setLevel: (level: ExpansionLevel) => void;
	expand: () => void;      // Go to level 2
	collapse: () => void;    // Go to level 0
	toggle: () => void;      // Cycle: 0 → 1 → 2 → 0
	semiExpand: () => void;  // Go to level 1
}

const ChairSidebarContext = createContext<ChairSidebarContextType | undefined>(undefined);

interface ChairSidebarProviderProps {
	children: ReactNode;
	/** Initial expansion level (defaults to 0 - collapsed) */
	initialLevel?: ExpansionLevel;
}

/**
 * Chair Sidebar Provider
 *
 * Provides global chair sidebar state management.
 * Place at the root of your application (in layout.tsx).
 *
 * @example
 * <ChairSidebarProvider>
 *   {children}
 * </ChairSidebarProvider>
 */
export function ChairSidebarProvider({ children, initialLevel }: ChairSidebarProviderProps) {
	const [level, setLevelState] = useState<ExpansionLevel>(() => {
		if (initialLevel !== undefined) return initialLevel;

		// Check localStorage (client-side only)
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('chair-sidebar-level');
			if (stored !== null) {
				const parsedLevel = parseInt(stored, 10);
				if (parsedLevel === 0 || parsedLevel === 1 || parsedLevel === 2) {
					return parsedLevel as ExpansionLevel;
				}
			}
		}

		// Default to collapsed (level 0)
		return 0;
	});

	useEffect(() => {
		// Persist to localStorage
		if (typeof window !== 'undefined') {
			localStorage.setItem('chair-sidebar-level', level.toString());
		}
	}, [level]);

	const setLevel = useCallback((newLevel: ExpansionLevel) => {
		setLevelState(newLevel);
	}, []);

	const expand = useCallback(() => setLevelState(2), []);
	const collapse = useCallback(() => setLevelState(0), []);
	const semiExpand = useCallback(() => setLevelState(1), []);

	const toggle = useCallback(() => {
		setLevelState(prev => ((prev + 1) % 3) as ExpansionLevel);
	}, []);

	return (
		<ChairSidebarContext.Provider
			value={{
				level,
				setLevel,
				expand,
				collapse,
				toggle,
				semiExpand,
			}}
		>
			{children}
		</ChairSidebarContext.Provider>
	);
}

/**
 * Hook to access chair sidebar state
 *
 * @example
 * const { level, toggle, expand, collapse } = useChairSidebar();
 */
export function useChairSidebar() {
	const context = useContext(ChairSidebarContext);
	if (context === undefined) {
		throw new Error('useChairSidebar must be used within a ChairSidebarProvider');
	}
	return context;
}
