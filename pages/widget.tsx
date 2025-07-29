import CallButton from '../src/components/CallButton';

export default function WidgetPage() {
  return (
    <>
      <style jsx global>{`
        * {
          background: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }
        
        html, body, #__next, main, div, span, button, p, h1, h2, h3, h4, h5, h6 {
          background: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }
        
        /* Restore specific styles for the new widget */
        .fixed .bg-white {
          background: white !important;
        }
        
        .fixed .border-gray-200 {
          border: 1px solid #e5e7eb !important;
        }
        
        .fixed .shadow-2xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
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