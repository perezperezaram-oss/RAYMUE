'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';

interface ApiKeyContextType {
  resetApiKey: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextType>({ resetApiKey: () => {} });

export const useApiKey = () => useContext(ApiKeyContext);

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function ApiKeyGate({ children }: { children: React.ReactNode }) {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (typeof window !== 'undefined' && window.aistudio && window.aistudio.hasSelectedApiKey) {
        try {
          const result = await window.aistudio.hasSelectedApiKey();
          setHasKey(result);
        } catch (e) {
          console.error("Error checking API key:", e);
          setHasKey(false);
        }
      } else {
        // Not in AI Studio environment, assume true or handle differently
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (typeof window !== 'undefined' && window.aistudio && window.aistudio.openSelectKey) {
      try {
        await window.aistudio.openSelectKey();
        setHasKey(true); // Assume success to mitigate race condition
      } catch (e) {
        console.error("Error opening select key dialog:", e);
      }
    }
  };

  const resetApiKey = () => {
    setHasKey(false);
  };

  if (hasKey === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-zinc-200">
        <div className="animate-pulse">Checking API Key status...</div>
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-200 p-6 text-center">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
          <h1 className="text-2xl font-bold mb-4 text-white">API Key Required</h1>
          <p className="mb-6 text-zinc-400">
            To use Veo video generation, you must select a paid API key from a Google Cloud project.
          </p>
          <div className="mb-8 p-4 bg-zinc-800/50 rounded-lg text-sm text-zinc-400">
            Learn more about billing at{' '}
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noreferrer" 
              className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
            >
              ai.google.dev/gemini-api/docs/billing
            </a>.
          </div>
          <button
            onClick={handleSelectKey}
            className="w-full px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            Select API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <ApiKeyContext.Provider value={{ resetApiKey }}>
      {children}
    </ApiKeyContext.Provider>
  );
}
