import '@/app/globals.css';
import { Inter } from 'next/font/google';
import { DeepResearchProvider } from '@/lib/deep-research-context';

// Remove Analytics import if not installed
let Analytics;
try {
  Analytics = require('@vercel/analytics/react').Analytics;
} catch (error) {
  Analytics = () => null;
}

// Conditionally import auth-related modules to prevent errors if auth isn't fully set up
let getServerSession: Function;
let authOptions: any;

try {
  const authModule = require('@/auth');
  const nextAuthModule = require('next-auth/next');
  
  authOptions = authModule.authOptions;
  getServerSession = nextAuthModule.getServerSession;
} catch (error) {
  // If auth modules fail to load, provide fallbacks
  console.warn('Auth module not available or correctly configured');
  getServerSession = async () => null;
  authOptions = {};
}

// Use a simpler approach for Providers to avoid hydration issues
const ClientProvidersImport = () => {
  // Using dynamic import with next/dynamic would be better
  // but keeping it simple for now
  const { Providers } = require('@/components/providers');
  return Providers;
};

const inter = Inter({ subsets: ['latin'] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Try to get session, but don't break if auth isn't set up
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.warn('Failed to get session:', error);
  }
  
  // Simplify the provider structure
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="transparent" />
      </head>
      <body className={inter.className}>
        {/* ClientProviders will only run on client-side */}
        <ClientProviders>
          <DeepResearchProvider>
            {children}
          </DeepResearchProvider>
        </ClientProviders>
        {typeof Analytics === 'function' && <Analytics />}
      </body>
    </html>
  );
}

// Client component to handle theme provider
function ClientProviders({ children }: { children: React.ReactNode }) {
  'use client';
  
  // Attempt to load the Providers component
  try {
    const ProvidersComponent = ClientProvidersImport();
    return <ProvidersComponent>{children}</ProvidersComponent>;
  } catch (error) {
    // Fallback to simple wrapper if providers can't be loaded
    console.warn('Failed to load Providers component:', error);
    return <>{children}</>;
  }
}
