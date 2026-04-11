/* Override the admin layout for the login page — no auth check, no sidebar */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
