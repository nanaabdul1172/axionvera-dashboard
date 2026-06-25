import type { AppProps } from "next/app";
import { Toaster } from 'sonner';

import "@/styles/globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { VaultProvider } from "@/contexts/VaultContext";
import { useWalletContext } from "@/hooks/useWallet";
import ThemeToggle from "@/components/ThemeToggle";
import { inter, jetbrainsMono } from "@/lib/fonts";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { initTelemetry } from "@/utils/telemetry";
import { emit } from "@/observability/diagnostics";
import { GovernanceProvider } from "@/contexts/GovernanceContext";


function AppInner(props: AppProps) {
  const router = useRouter();

  useEffect(() => {
    initTelemetry();
  }, []);

  useEffect(() => {
    const handleRouteChange = (url: string) => emit('page_view', { url });
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  return (
    // Apply CSS-variable font classes to the root so the custom properties
    // (--font-inter, --font-mono) are available globally via Tailwind's
    // fontFamily tokens and any CSS that references them directly.
    <div className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <ErrorBoundary>
        <ThemeProvider>
          <WalletProvider>
            <ProvidersInner {...props} />
          </WalletProvider>
          <Toaster />
        </ThemeProvider>
      </ErrorBoundary>
    </div>
  );
}

/**
 * Inner wrapper that has access to the WalletContext, so it can pass
 * `walletAddress` down to GovernanceProvider and VaultProvider.
 */
function ProvidersInner({ Component, pageProps }: AppProps) {
  const wallet = useWalletContext();
  return (
    <GovernanceProvider walletAddress={wallet.publicKey}>
      <VaultProvider walletAddress={wallet.publicKey}>
        <Component {...pageProps} />
      </VaultProvider>
    </GovernanceProvider>
  );
}

export default function App(props: AppProps) {
  return <AppInner {...props} />;
}
