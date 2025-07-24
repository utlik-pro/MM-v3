import Head from 'next/head';
import { CallButton } from '../src/components/CallButton';

export default function Widget() {
  return (
    <>
      <Head>
        <title>MinskMir Voice Assistant</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Prevent page caching in iframe */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </Head>
      
      <main className="w-full h-full flex items-center justify-center bg-transparent">
        <CallButton />
      </main>
      
      <style jsx global>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: transparent !important;
          overflow: visible !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        #__next {
          background: transparent !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        main {
          background: transparent !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        
        /* Keep button styles but ensure tooltip is on top */
        button {
          position: relative !important;
        }
        
        /* Tooltip positioning */
        .absolute {
          position: fixed !important;
          z-index: 999999 !important;
        }
      `}</style>
    </>
  );
} 