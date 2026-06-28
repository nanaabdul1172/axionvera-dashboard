import React, { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { Wifi, WifiOff, RefreshCw, X } from "lucide-react";
import { register, activateWaitingWorker } from "./register";

interface OfflineContextType {
  isOnline: boolean;
  isUpdateAvailable: boolean;
  triggerUpdate: () => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error("useOffline must be used within an OfflineProvider");
  }
  return context;
}

interface OfflineProviderProps {
  children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState<boolean>(true);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Monitor network status
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Register Service Worker and monitor updates
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_ENABLE_PWA_DEV) {
      // Skip PWA registration in development by default to ease local debugging,
      // unless NEXT_PUBLIC_ENABLE_PWA_DEV is explicitly set.
      return;
    }

    register({
      onUpdate: (registration) => {
        registrationRef.current = registration;
        setIsUpdateAvailable(true);
        setShowUpdateBanner(true);
      },
      onSuccess: (registration) => {
        registrationRef.current = registration;
        console.log("[PWA] Service Worker registered successfully.");
      }
    });
  }, []);

  const triggerUpdate = () => {
    if (registrationRef.current) {
      activateWaitingWorker(registrationRef.current);
    } else {
      // Fallback reload if registration is missing
      window.location.reload();
    }
  };

  return (
    <OfflineContext.Provider value={{ isOnline, isUpdateAvailable, triggerUpdate }}>
      {children}

      {/* Modern floating glassmorphism notifications container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-[calc(100vw-3rem)] sm:w-[360px] pointer-events-none">
        
        {/* Style definitions for custom micro-animations */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes slideInFromRight {
            from { transform: translateX(100%) translateY(10px); opacity: 0; }
            to { transform: translateX(0) translateY(0); opacity: 1; }
          }
          .animate-slide-in-pwa {
            animation: slideInFromRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}} />

        {/* Offline Status Indicator */}
        {!isOnline && (
          <div className="pointer-events-auto flex items-center justify-between p-4 rounded-xl border border-amber-500/20 bg-amber-950/80 backdrop-blur-md text-amber-100 shadow-2xl transition-all duration-300 animate-slide-in-pwa">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  <WifiOff size={16} className="text-amber-400" />
                  <span>Offline Mode</span>
                </div>
                <p className="text-xs text-amber-200/80 mt-0.5">Using offline data. Functionality might be limited.</p>
              </div>
            </div>
          </div>
        )}

        {/* Update Available Notification Banner */}
        {isUpdateAvailable && showUpdateBanner && (
          <div className="pointer-events-auto flex flex-col gap-3 p-4 rounded-xl border border-indigo-500/20 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md text-white shadow-2xl transition-all duration-300 animate-slide-in-pwa">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex h-3.5 w-3.5 mt-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-500"></span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm flex items-center gap-1.5">
                    <RefreshCw size={14} className="text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} />
                    Update Available
                  </span>
                  <p className="text-xs text-slate-300 mt-1">A newer version of the dashboard is ready. Update now to access latest features.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowUpdateBanner(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Close update notification"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex gap-2 justify-end mt-1">
              <button
                onClick={() => setShowUpdateBanner(false)}
                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white font-medium rounded-lg hover:bg-white/5 transition-all cursor-pointer"
              >
                Later
              </button>
              <button
                onClick={triggerUpdate}
                className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-md hover:shadow-indigo-500/20 transition-all duration-200 cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw size={12} />
                Refresh App
              </button>
            </div>
          </div>
        )}
      </div>
    </OfflineContext.Provider>
  );
}
