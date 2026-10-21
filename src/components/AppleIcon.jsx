// Official Apple logo silhouette used for "Sign in with Apple" buttons.
// Path sourced from Apple's Human Interface Guidelines asset.
export default function AppleIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 12.43c-.02-2.05 1.67-3.04 1.75-3.09-.95-1.39-2.43-1.58-2.96-1.6-1.26-.13-2.46.74-3.1.74-.64 0-1.62-.72-2.66-.7-1.37.02-2.64.8-3.35 2.03-1.43 2.48-.36 6.15 1.03 8.16.68.98 1.49 2.08 2.55 2.04 1.02-.04 1.41-.66 2.65-.66 1.23 0 1.58.66 2.66.64 1.1-.02 1.79-.99 2.46-1.98.77-1.13 1.09-2.22 1.11-2.28-.02-.01-2.12-.81-2.14-3.22zM14.4 6.18c.56-.68.94-1.62.84-2.56-.81.03-1.79.54-2.37 1.21-.52.6-.98 1.56-.86 2.49.9.07 1.83-.46 2.39-1.14z" />
    </svg>
  );
}
