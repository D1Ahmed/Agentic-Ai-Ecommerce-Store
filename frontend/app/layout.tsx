import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import ChatWindow from "@/components/ChatWindow";
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased" suppressHydrationWarning>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          <StoreProvider>
            {children}
            {/* Injecting Chat globally so it persists across all pages! */}
            <ChatWindow />
          </StoreProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
