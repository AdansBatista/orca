'use client';

/**
 * Clinic Branding Footer
 *
 * Floating footer that displays clinic logo at the bottom center of all pages.
 * Designed to be visible but not block scrollable content.
 */

export function ClinicFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 pointer-events-none z-10">
      <div className="flex justify-center pb-4">
        <div className="bg-background/95 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-border/50 pointer-events-auto">
          <img
            src="/WillowPrimaryTransparent trimmed.png"
            alt="Willow Orthodontics"
            className="h-8"
          />
        </div>
      </div>
    </footer>
  );
}
