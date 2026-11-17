import { useEffect, useState } from 'react';
import { NATIVE_AUTH_SCHEME } from '@/lib/nativeEnv';

export default function NativeAuthCallback() {
  const [message, setMessage] = useState('Completing sign-in...');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('access_token') || window.localStorage.getItem('base44_access_token');
    if (!token) {
      setMessage('Sign-in failed: authentication token not received.');
      return;
    }
    window.history.replaceState({}, document.title, window.location.pathname);
    window.location.replace(`${NATIVE_AUTH_SCHEME}://auth?access_token=${encodeURIComponent(token)}`);
  }, []);
  return <div className="flex items-center justify-center min-h-[50vh] p-6 text-sm text-muted-foreground">{message}</div>;
}
