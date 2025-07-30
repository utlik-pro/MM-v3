import CallButton from '../src/components/CallButton';

export default function WidgetPage() {
  return (
    <>
      <style jsx global>{`
        /* Reset only specific elements, not all */
        html, body, #__next, main {
          background: transparent !important;
          border: none !important;
          outline: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Don't reset box-shadow globally */
        * {
          background: transparent !important;
          border: none !important;
          outline: none !important;
        }
        
        /* Restore specific styles for the new widget */
        .fixed .bg-white {
          background: white !important;
        }
        
        .fixed .border-gray-200 {
          border: 1px solid #e5e7eb !important;
        }
        
        /* Enhanced shadow styles with higher specificity - uniform soft shadows */
        .fixed .shadow-2xl {
          -webkit-box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
          -moz-box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
        }
        
        /* Force shadows even when client overrides - uniform */
        div[class*="shadow-2xl"] {
          -webkit-box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
          -moz-box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
        }
        
        /* Specific override for iframe content - uniform */
        .fixed div[class*="rounded-xl"] {
          -webkit-box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
          -moz-box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
        }
        
        /* Ultimate shadow override - target the exact element - uniform */
        .fixed .bg-white.rounded-xl.shadow-2xl.border.border-gray-200 {
          -webkit-box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
          -moz-box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
        }
        
        /* Force shadows on any element with rounded-xl class - uniform */
        [class*="rounded-xl"] {
          -webkit-box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
          -moz-box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
        }
        
        /* Force positioning in iframe mode */
        .fixed {
          position: fixed !important;
        }
        
        /* Ensure correct positioning */
        div[class*="fixed"] {
          position: fixed !important;
          bottom: 16px !important;
          right: 16px !important;
          z-index: 999999 !important;
        }
        
        .fixed .bg-gradient-to-r {
          background: linear-gradient(to right, var(--tw-gradient-stops)) !important;
        }
        
        .fixed .from-teal-600 {
          --tw-gradient-from: #0d9488;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(13, 148, 136, 0));
        }
        
        .fixed .to-green-700 {
          --tw-gradient-to: #15803d;
        }
        
        .fixed .bg-gray-100 {
          background: #f3f4f6 !important;
        }
        
        .fixed .bg-gray-400 {
          background: #9ca3af !important;
        }
        
        .fixed .bg-red-50 {
          background: #fef2f2 !important;
        }
        
        .fixed .border-red-200 {
          border: 1px solid #fecaca !important;
        }
        
        .fixed .text-gray-900 {
          color: #111827 !important;
        }
        
        .fixed .text-gray-500 {
          color: #6b7280 !important;
        }
        
        .fixed .text-white {
          color: white !important;
        }
        
        .fixed .text-red-600 {
          color: #dc2626 !important;
        }
        
        /* AI Icon sparkles colors */
        .fixed .bg-green-200 {
          background: #bbf7d0 !important;
        }
        
        .fixed .bg-green-300 {
          background: #86efac !important;
        }
        
        .fixed .bg-green-400 {
          background: #4ade80 !important;
        }
        
        .fixed .bg-green-500 {
          background: #22c55e !important;
        }
        
        .fixed .bg-gradient-to-br {
          background: linear-gradient(to bottom right, var(--tw-gradient-stops)) !important;
        }
        
        .fixed .from-teal-600 {
          --tw-gradient-from: #0d9488;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(13, 148, 136, 0));
        }
        
        .fixed .border-teal-200 {
          border: 2px solid #99f6e4 !important;
        }
        
        /* Custom red ЗАВЕРШИТЬ button color */
        .fixed button[style*="background-color: rgb(239, 64, 59)"] {
          background-color: #EF403B !important;
          color: white !important;
        }
        
        .fixed button[style*="background-color: rgb(239, 64, 59)"]:hover {
          background-color: #d93832 !important;
          color: white !important;
        }
        
        .fixed button[style*="backgroundColor: #EF403B"] {
          background-color: #EF403B !important;
          color: white !important;
        }
        
        .fixed button[style*="backgroundColor: #EF403B"]:hover {
          background-color: #d93832 !important;
          color: white !important;
        }
        
        /* Force white color for button text */
        .fixed button[aria-label="Завершить звонок"] {
          color: white !important;
        }
        
        .fixed button[aria-label="Завершить звонок"]:hover {
          background-color: #d93832 !important;
          color: white !important;
        }
        
        /* СОЕДИНЕНИЕ button white background with black border */
        .fixed button[style*="backgroundColor: white"] {
          background-color: white !important;
          color: black !important;
          border: 1px solid black !important;
        }
        
        .fixed button[style*="background-color: white"] {
          background-color: white !important;
          color: black !important;
          border: 1px solid black !important;
        }
        
        /* Focus states */
        button:focus, button:focus-visible, input:focus, textarea:focus, select:focus {
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
        }
      `}</style>
      
      <main className="w-full h-full flex items-center justify-center bg-transparent">
        <CallButton />
      </main>
    </>
  );
} 