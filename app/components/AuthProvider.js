
"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('auth');

    if (!isAuthenticated && pathname !== '/loginmain') {
      router.push('/loginmain');
    }
  }, [pathname, router]);

  return <>{children}</>;
}
