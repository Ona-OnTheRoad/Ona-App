import { OnaLogo } from "./ona-logo";

/** "Ona." wordmark wrapper using the reusable OnaLogo component. */
export function OnaWordmark({ className }: { className?: string }) {
  return <OnaLogo size="md" className={className} />;
}
