"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { LogoIcon } from "@/components/logo-3d";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AuthCallback() {
  return (
    <Suspense fallback={<AuthCallbackLoading />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-4">
      <div className="flex items-center gap-3">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        <span className="text-zinc-400">Loading...</span>
      </div>
    </div>
  );
}

function AuthCallbackContent() {
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
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-[128px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10"
      >
        <Card className="glass border-white/[0.06] inner-glow w-full max-w-md">
          <CardContent className="p-8 text-center">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-16 h-16 mx-auto mb-6"
            >
              <LogoIcon className="w-full h-full" />
            </motion.div>

            {error ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h1 className="text-2xl font-semibold text-white mb-2">
                  Authentication Failed
                </h1>
                <p className="text-zinc-400 mb-6">{error}</p>
                <Button
                  onClick={() => router.push("/")}
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-white/[0.03]"
                >
                  Return Home
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
                  {status.includes("Success") ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  )}
                </div>
                <h1 className="text-2xl font-semibold text-white mb-2">
                  {status.includes("Success") ? "Welcome!" : "Authenticating"}
                </h1>
                <p className="text-zinc-400">{status}</p>
                
                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 mt-6">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-indigo-400"
                      animate={{
                        opacity: status.includes("Success") ? 1 : [0.3, 1, 0.3],
                        scale: status.includes("Success") ? 1 : [0.8, 1, 0.8],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: status.includes("Success") ? 0 : Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-zinc-500 text-sm mt-8"
        >
          Clout - Premium Discord Bot Experience
        </motion.p>
      </motion.div>
    </div>
  );
}
