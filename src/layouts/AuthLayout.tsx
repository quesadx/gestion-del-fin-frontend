import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen grid place-items-center bg-black relative overflow-hidden scanline">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-zinc-900)_0%,_transparent_100%)] opacity-50" />
      <main className="relative z-10 w-full max-w-md px-6">
        <Outlet />
      </main>
    </div>
  );
}
