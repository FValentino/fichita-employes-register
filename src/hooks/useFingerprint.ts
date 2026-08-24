"use client";

import { useEffect, useState } from "react";

let fingerprintCache: string | null = null;

/**
 * Returns a stable browser fingerprint using FingerprintJS.
 * Result is cached per session to avoid repeated computation.
 */
export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState<string | null>(fingerprintCache);

  useEffect(() => {
    if (fingerprintCache !== null) {
      setFingerprint(fingerprintCache);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const FingerprintJS = await import("@fingerprintjs/fingerprintjs");
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const visitorId = result.visitorId;

        if (!cancelled) {
          fingerprintCache = visitorId;
          setFingerprint(visitorId);
        }
      } catch {
        // Fingerprint failed — return null, attendance still works
        if (!cancelled) {
          setFingerprint(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return fingerprint;
}
