import Head from 'next/head';
import { CallButton } from '@/components/CallButton';

export default function Widget() {
  return (
    <>
      <Head>
        <title>MinskMir Voice Assistant</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Allow iframe embedding */}
        <meta httpEquiv="X-Frame-Options" content="ALLOWALL" />
        <meta httpEquiv="Content-Security-Policy" content="frame-ancestors *" />
        
        {/* Prevent page caching in iframe */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </Head>
      
      <main className="w-full h-screen flex items-center justify-center p-4 bg-transparent">
        <CallButton />
      </main>
      
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background: transparent !important;
          overflow: hidden;
        }
        
        html {
          background: transparent !important;
        }
      `}</style>
    </>
  );
} 