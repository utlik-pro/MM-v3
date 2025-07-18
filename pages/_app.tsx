import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Detect if running in iframe and add class to body
    if (window !== window.top) {
      document.body.classList.add('iframe-mode');
    }

    // Add resize listener for responsive iframe behavior
    const handleResize = () => {
      if (window !== window.top) {
        // Send size information to parent window
        const height = document.documentElement.scrollHeight;
        window.parent.postMessage({
          type: 'resize',
          height: height
        }, '*');
      }
    };

    // Initial size calculation
    handleResize();

    // Listen for content changes
    const observer = new ResizeObserver(handleResize);
    observer.observe(document.body);

    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <Component {...pageProps} />;
} 