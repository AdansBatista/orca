'use client';

import { cn } from '@/lib/utils';
import { usePhiFog } from '@/contexts/phi-fog-context';

interface PhiProtectedProps {
	children: React.ReactNode;
	className?: string;
	/** Enable PHI fogging - can be controlled globally or per component */
	fog?: boolean;
	/** Fake data to show when fogged (optional) */
	fakeData?: string;
	/** Blur intensity (1-10) */
	blurIntensity?: number;
	/** Show a lock icon indicator */
	showLockIcon?: boolean;
}

/**
 * PHI Protected Component
 * 
 * Wraps sensitive patient information and applies a glass-fog effect when enabled.
 * Useful for demos, screenshots, and training environments.
 * 
 * @example
 * // Basic usage with global fog setting
 * <PhiProtected>
 *   {patient.name}
 * </PhiProtected>
 * 
 * @example
 * // With fake data
 * <PhiProtected fakeData="John Doe">
 *   {patient.name}
 * </PhiProtected>
 * 
 * @example
 * // Force fog on specific component
 * <PhiProtected fog={true}>
 *   {patient.ssn}
 * </PhiProtected>
 */
export function PhiProtected({
	children,
	className,
	fog,
	fakeData,
	blurIntensity = 8,
	showLockIcon = false,
}: PhiProtectedProps) {
	// Use the context hook to get real-time fog state
	const { isFogEnabled } = usePhiFog();
	
	// Component-level fog prop overrides global setting
	const isFogged = fog !== undefined ? fog : isFogEnabled;

	if (!isFogged) {
		return <>{children}</>;
	}

	return (
		<span
			className={cn(
				'relative inline-block rounded-full',
				className
			)}
			data-phi-protected="true"
		>
			{/* Fake data or original content (blurred) */}
			<span
				className={cn(
					'select-none rounded-full px-2',
					fakeData ? '' : 'blur-sm'
				)}
				style={{
					filter: fakeData ? undefined : `blur(${blurIntensity}px)`,
				}}
				aria-hidden="true"
			>
				{fakeData || children}
			</span>

			{/* Glass fog overlay - adapts to light/dark mode */}
			<span
				className="absolute inset-0 bg-gradient-to-r from-background/60 via-background/80 to-background/60 dark:from-background/70 dark:via-background/90 dark:to-background/70 backdrop-blur-sm pointer-events-none rounded-full"
				aria-hidden="true"
			/>

			{/* Lock icon indicator (optional) */}
			{showLockIcon && (
				<span
					className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
					aria-hidden="true"
				>
					<svg
						className="h-3 w-3 text-muted-foreground"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						/>
					</svg>
				</span>
			)}

			{/* Screen reader text */}
			<span className="sr-only">Protected health information (hidden)</span>
		</span>
	);
}

/**
 * PHI Protected Input Component
 * 
 * Input field that fogs the value when PHI protection is enabled.
 */
interface PhiProtectedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	fog?: boolean;
	fakeValue?: string;
}

export function PhiProtectedInput({
	fog,
	fakeValue,
	value,
	className,
	...props
}: PhiProtectedInputProps) {
	// Use the context hook to get real-time fog state
	const { isFogEnabled } = usePhiFog();
	
	// Component-level fog prop overrides global setting
	const isFogged = fog !== undefined ? fog : isFogEnabled;

	return (
		<div className="relative">
			<input
				{...props}
				value={isFogged ? (fakeValue || '••••••••') : value}
				className={cn(
					className,
					isFogged && 'select-none pointer-events-none'
				)}
				readOnly={isFogged}
			/>
			{isFogged && (
				<div className="absolute inset-0 bg-gradient-to-r from-background/60 via-background/80 to-background/60 dark:from-background/70 dark:via-background/90 dark:to-background/70 backdrop-blur-sm pointer-events-none rounded-md" />
			)}
		</div>
	);
}
