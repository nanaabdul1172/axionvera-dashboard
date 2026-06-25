import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useWalletContext } from "@/hooks/useWallet";
import { shortenAddress } from "@/utils/contractHelpers";
import { WalletId, WalletMeta } from "@/types/wallet";

/** Inline SVG icon renderer — wallets ship their own SVG strings. */
function WalletIcon({ svg, label }: { svg: string; label: string }) {
  return (
    <span
      className="h-5 w-5 shrink-0 [&>svg]:h-full [&>svg]:w-full"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
      title={label}
    />
  );
}

export default function HomePage() {
  const { publicKey, isConnected, isConnecting, connect, disconnect, availableWallets } =
    useWalletContext();

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [walletAvailability, setWalletAvailability] = useState<Record<string, boolean>>({});
  const pickerRef = useRef<HTMLDivElement>(null);

  /** Pre-check availability so we can show "Install" links for missing wallets. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      const { isWalletAvailable } = await import("@/services/walletService");
      const entries = await Promise.all(
        availableWallets.map(async (w) => {
          try {
            const ok = await isWalletAvailable(w.id);
            return [w.id, ok] as const;
          } catch {
            return [w.id, false] as const;
          }
        }),
      );
      if (!cancelled) setWalletAvailability(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, [availableWallets]);

  // Close picker on outside click
  useEffect(() => {
    if (!isPickerOpen) return;
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isPickerOpen]);

  function handleConnect(walletId: WalletId) {
    setIsPickerOpen(false);
    connect(walletId);
  }

  return (
    <>
      <Head>
        <title>Axionvera Dashboard</title>
        <meta
          name="description"
          content="Web interface for interacting with Axionvera smart contracts on Stellar (Soroban)."
        />
      </Head>
      <main className="min-h-screen transition-colors duration-300">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-10 shadow-xl dark:shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_80px_rgba(0,0,0,0.6)] transition-all duration-300">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 transition-colors">
              <span className="h-2 w-2 rounded-full bg-axion-500" />
              Axionvera Network · Stellar (Soroban)
            </div>
            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl transition-colors">
              Axionvera Dashboard
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 dark:text-slate-300 transition-colors">
              Connect your Stellar wallet, deposit into the Axionvera vault, withdraw tokens, claim
              rewards, and track your on-chain activity.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              {isConnected ? (
                <>
                  <div className="inline-flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/30 px-5 py-3">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium text-slate-200">
                      {shortenAddress(publicKey!, 6)}
                    </span>
                  </div>
                  <Link
                    href="/dashboard"
                    aria-label="Open the dashboard to manage your vault"
                    className="inline-flex items-center justify-center rounded-xl bg-axion-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400"
                  >
                    Open Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={disconnect}
                    aria-label="Disconnect Stellar wallet"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/30 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-900/60"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <>
                  {/* Wallet picker trigger */}
                  <div className="relative" ref={pickerRef}>
                    <button
                      id="home-connect-wallet"
                      type="button"
                      onClick={() => {
                        if (availableWallets.length === 1) {
                          handleConnect(availableWallets[0].id);
                        } else {
                          setIsPickerOpen((v) => !v);
                        }
                      }}
                      disabled={isConnecting}
                      aria-label={isConnecting ? "Connecting to Stellar wallet" : "Connect Stellar wallet"}
                      aria-haspopup={availableWallets.length > 1 ? "true" : undefined}
                      aria-expanded={availableWallets.length > 1 ? isPickerOpen : undefined}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-axion-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isConnecting ? "Connecting…" : "Connect Wallet"}
                    </button>

                    {/* Wallet picker dropdown */}
                    {isPickerOpen && !isConnecting && (
                      <div
                        id="home-wallet-picker"
                        role="menu"
                        aria-labelledby="home-connect-wallet"
                        className="absolute left-0 mt-2 w-72 origin-top-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl ring-1 ring-black/5 dark:ring-white/5 z-50 overflow-hidden"
                      >
                        <p className="px-4 pt-3 pb-1 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Choose a wallet
                        </p>
                        <div className="px-2 pb-2 space-y-0.5">
                          {availableWallets.map((w: WalletMeta) => {
                            const available = walletAvailability[w.id] ?? true;
                            return (
                              <button
                                key={w.id}
                                id={`home-connect-${w.id}`}
                                type="button"
                                role="menuitem"
                                onClick={() => handleConnect(w.id)}
                                title={!available ? `Install ${w.label}` : w.description}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition"
                              >
                                <WalletIcon svg={w.icon} label={w.label} />
                                <div className="min-w-0 flex-1 text-left">
                                  <div className="font-medium leading-tight">{w.label}</div>
                                  <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                    {w.description}
                                  </div>
                                </div>
                                {!available && (
                                  <a
                                    href={w.installUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="shrink-0 text-xs text-axion-500 hover:underline"
                                  >
                                    Install
                                  </a>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <a
                    href="https://github.com/Axionvera/axionvera-dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View the project source code on GitHub"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/30 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-900/60"
                  >
                    View on GitHub
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { title: "Multi-Wallet", body: "Connect via Freighter or Albedo. Switch wallets at any time without losing your session." },
              { title: "Vault", body: "Deposit, withdraw, and claim rewards via an SDK adapter." },
              { title: "History", body: "Track your latest vault transactions and statuses." },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/20 p-6 shadow-sm transition-all duration-300"
              >
                <div className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">{card.title}</div>
                <div className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300 transition-colors">{card.body}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
