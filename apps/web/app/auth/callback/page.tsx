"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Processing authentication...");

  useEffect(() => {
    const token = searchParams.get("token");
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (errorParam) {
      setError(errorDescription || "Authentication failed");
      setTimeout(() => router.push("/?error=auth_failed"), 3000);
      return;
    }

    if (!token) {
      setError("No token received");
      setTimeout(() => router.push("/?error=no_token"), 3000);
      return;
    }

    // Store token and redirect
    localStorage.setItem("clout_token", token);
    setStatus("Success! Redirecting to dashboard...");
    
    setTimeout(() => router.push("/dashboard"), 1000);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
        {error ? (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Authentication Failed</h1>
            <p className="text-slate-400 mb-6">{error}</p>
            <p className="text-sm text-slate-500">Redirecting you back...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-6">
              {status.includes("Success") ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{status.includes("Success") ? "Welcome!" : "Authenticating"}</h1>
            <p className="text-slate-400">{status}</p>
          </>
        )}
      </div>
    </div>
  );
}