import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Turnero • Dr. Issac | Control de Asistencias Clínicas',
  description: 'Sistema integral de gestión de personal, fichaje con geolocalización y asistencias clínicas para el equipo del Dr. Issac.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/Icon-192.png',
    apple: '/icons/Icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Turnero',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#070C16',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/Icon-192.png" />
      </head>
      <body className="bg-[#070C16] text-[#F8FAFC] min-h-screen selection:bg-[#00E5A3] selection:text-[#070C16] antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
