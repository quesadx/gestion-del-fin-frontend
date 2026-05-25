import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen grid place-items-center bg-transparent relative overflow-hidden">
      <main className="relative z-10 w-full max-w-md px-6">
        <Outlet />
      </main>
    </div>
  );
}
