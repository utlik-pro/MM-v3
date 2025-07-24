import React from 'react';
import { CallButton } from '../src/components/CallButton';

export default function Widget() {
  return (
    <>
      <main className="w-full h-full flex items-center justify-center bg-transparent">
        <CallButton />
      </main>
      
      <style jsx global>{`
        /* Aggressive global resets to ensure complete transparency */
        *, *::before, *::after {
          background: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        html, body, #__next, main, div, span, button, p, h1, h2, h3, h4, h5, h6 {
          background: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        body {
          overflow: visible !important;
        }

        /* Restore button styles */
        button[aria-label*="звонок"] {
          background: #374151 !important;
          color: white !important;
          border-radius: 9999px !important;
          padding: 8px 16px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          font-size: 0.875rem !important;
          line-height: 1.25rem !important;
          text-align: center !important;
          min-width: 130px !important;
        }

        button[aria-label*="звонок"]:hover {
          background: #4b5563 !important;
        }

        button[aria-label*="звонок"]:disabled {
          background: #2563eb !important;
        }

        /* Profile card styles - white background with shadow */
        .fixed .bg-white {
          background: white !important;
          color: #374151 !important;
          border-radius: 12px !important;
          padding: 16px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          font-size: 0.875rem !important;
          line-height: 1.5 !important;
          text-align: center !important;
          max-width: 20rem !important;
          border: 1px solid #f3f4f6 !important;
        }

        /* Avatar gradient */
        .bg-gradient-to-br {
          background: linear-gradient(to bottom right, #60a5fa, #a855f7) !important;
          color: white !important;
          border-radius: 50% !important;
          width: 4rem !important;
          height: 4rem !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
          margin-bottom: 12px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-weight: bold !important;
          font-size: 1.25rem !important;
        }

        /* Profile name */
        .text-gray-900 {
          color: #111827 !important;
          font-weight: 600 !important;
          font-size: 1.125rem !important;
          line-height: 1.25 !important;
          margin-bottom: 4px !important;
        }

        /* Profile title */
        .text-gray-500 {
          color: #6b7280 !important;
          font-size: 0.75rem !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          font-weight: 500 !important;
          margin-bottom: 12px !important;
        }

        /* Message text */
        .text-gray-700 {
          color: #374151 !important;
          font-size: 0.875rem !important;
          line-height: 1.6 !important;
          margin-bottom: 16px !important;
        }

        /* Profile card sections */
        .flex.flex-col.items-center {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          text-align: center !important;
          margin-bottom: 12px !important;
        }

        .text-center.mb-4 {
          text-align: center !important;
          margin-bottom: 16px !important;
        }

        /* Ensure fixed positioning works */
        .fixed {
          position: fixed !important;
          z-index: 999999 !important;
        }

        /* Error message styles */
        .bg-red-50 {
          background: #fef2f2 !important;
          color: #991b1b !important;
          border: 1px solid #fecaca !important;
          border-radius: 8px !important;
          padding: 12px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
          font-size: 0.875rem !important;
          line-height: 1.25rem !important;
          max-width: 24rem !important;
        }
      `}</style>
    </>
  );
} 