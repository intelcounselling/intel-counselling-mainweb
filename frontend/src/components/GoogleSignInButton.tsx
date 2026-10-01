import React, { useEffect, useRef } from 'react';

// "Sign in with Google" via Google Identity Services. Renders nothing until
// VITE_GOOGLE_CLIENT_ID is configured, so email sign-in keeps working without it.
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const GSI_SRC = 'https://accounts.google.com/gsi/client';

let gsiPromise: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if (!gsiPromise) {
    gsiPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GSI_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        gsiPromise = null;
        reject(new Error('Could not load Google sign-in'));
      };
      document.head.appendChild(script);
    });
  }
  return gsiPromise;
}

interface Props {
  onCredential: (credential: string) => void;
  onError?: (message: string) => void;
}

const GoogleSignInButton: React.FC<Props> = ({ onCredential, onError }) => {
  const ref = useRef<HTMLDivElement>(null);
  // Latest callback without re-initialising GSI on every render
  const cb = useRef(onCredential);
  cb.current = onCredential;

  useEffect(() => {
    if (!CLIENT_ID) return;
    let alive = true;
    loadGsi()
      .then(() => {
        const gsi = (window as any).google?.accounts?.id;
        if (!alive || !gsi || !ref.current) return;
        gsi.initialize({
          client_id: CLIENT_ID,
          callback: (response: { credential?: string }) => {
            if (response.credential) cb.current(response.credential);
          },
        });
        gsi.renderButton(ref.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: Math.min(ref.current.offsetWidth || 320, 400),
        });
      })
      .catch((err) => onError?.(err.message));
    return () => {
      alive = false;
    };
  }, []);

  if (!CLIENT_ID) return null;
  return <div ref={ref} className="w-full flex justify-center min-h-[44px]" />;
};

export const googleSignInEnabled = !!CLIENT_ID;
export default GoogleSignInButton;
