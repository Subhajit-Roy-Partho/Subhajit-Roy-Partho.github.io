import { MagneticButton } from "@/components/magnetic-button";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center pt-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">404</p>
      <h1 className="font-display mt-4 text-3xl font-semibold sm:text-4xl">This strand didn&apos;t fold correctly.</h1>
      <p className="mt-4 max-w-md text-[var(--muted)]">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div className="mt-8">
        <MagneticButton href="/">Back home</MagneticButton>
      </div>
    </div>
  );
}
