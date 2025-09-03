import React from 'react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="px-6 py-4 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-2xl font-bold text-primary-600">OCR TTS Platform</div>
          <a
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 transition"
          >
            Go to App
          </a>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
};


