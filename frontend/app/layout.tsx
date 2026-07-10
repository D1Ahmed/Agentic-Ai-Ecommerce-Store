import { Great_Vibes, Playfair_Display } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import ChatWindow from "@/components/ChatWindow";
import { GoogleOAuthProvider } from '@react-oauth/google';
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import type { Viewport } from 'next';

const greatVibes = Great_Vibes({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-great-vibes',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: 'resizes-content'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`scroll-smooth ${greatVibes.variable} ${playfair.variable}`}>
      <body className="antialiased" suppressHydrationWarning>
        <ReactQueryProvider>
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
            <StoreProvider>
              {children}
              {/* Injecting Chat globally so it persists across all pages! */}
              <ChatWindow />
            </StoreProvider>
          </GoogleOAuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
