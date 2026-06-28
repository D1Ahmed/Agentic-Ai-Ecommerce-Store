import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import ChatWindow from "@/components/ChatWindow"; // <-- Import it here

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        <StoreProvider>
          {children}
          {/* Injecting Chat globally so it persists across all pages! */}
          <ChatWindow />
        </StoreProvider>
      </body>
    </html>
  );
}
