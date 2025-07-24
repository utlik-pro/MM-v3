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
        * {
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
          background: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }
        
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: transparent !important;
          overflow: visible !important;
          width: 100% !important;
          height: 100% !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }
        
        #__next {
          background: transparent !important;
          width: 100% !important;
          height: 100% !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        main {
          background: transparent !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }
        
        /* Restore button styles */
        button[aria-label*="звонок"] {
          background: #000000 !important;
          border: none !important;
          outline: none !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.25) !important;
          color: white !important;
          border-radius: 9999px !important;
          padding: 6px 12px !important;
          font-weight: 500 !important;
          font-size: 14px !important;
          line-height: 20px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          min-width: 120px !important;
          transition: all 0.3s ease-in-out !important;
          cursor: pointer !important;
        }
        
        button[aria-label*="звонок"]:hover {
          background: #374151 !important;
          transform: scale(1.05) !important;
        }
        
        button[aria-label*="звонок"]:active {
          transform: scale(0.95) !important;
        }
        
        /* Connected state */
        button[aria-label*="Завершить"] {
          background: #dc2626 !important;
          animation: pulse 2s infinite !important;
        }
        
        /* Connecting state */
        button[aria-label*="звонок"][disabled] {
          background: #2563eb !important;
          cursor: wait !important;
        }
        
        /* Error state */
        button[aria-label*="звонок"].error {
          background: #ef4444 !important;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        /* Tooltip positioning */
        .fixed {
          position: fixed !important;
          z-index: 999999 !important;
        }
        
        /* Remove any possible container styles */
        div, span {
          background: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }
        
        /* RESTORE TOOLTIP STYLES - very specific */
        .fixed .bg-gray-900,
        div.fixed div.bg-gray-900,
        .fixed > div.bg-gray-900 {
          background: #111827 !important;
          color: white !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3) !important;
          font-size: 14px !important;
          line-height: 1.4 !important;
          text-align: center !important;
          max-width: 280px !important;
          margin: 0 !important;
        }
        
        /* RESTORE TOOLTIP ARROW */
        .fixed .bg-gray-900 div[class*="absolute"],
        .fixed .bg-gray-900 .absolute {
          background: transparent !important;
          border: 4px solid transparent !important;
          border-top-color: #111827 !important;
          box-shadow: none !important;
        }
        
        /* RESTORE ERROR MESSAGE STYLES */
        .bg-red-50 {
          background: #fef2f2 !important;
          border: 1px solid #fecaca !important;
          border-radius: 8px !important;
          padding: 12px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        }
        
        .bg-red-50 p {
          color: #b91c1c !important;
          font-size: 14px !important;
          margin: 0 !important;
        }
        
        .bg-red-50 button {
          color: #dc2626 !important;
          text-decoration: underline !important;
          background: transparent !important;
          border: none !important;
          cursor: pointer !important;
          font-size: 14px !important;
          margin-top: 8px !important;
          padding: 0 !important;
        }
      `}</style>
    </>
  );
} 