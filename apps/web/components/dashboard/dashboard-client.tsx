"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { toast } from "sonner";
import { clearCloutToken, getCloutToken } from "@/lib/auth-client";
import { AdminSection } from "./admin-section";
import { AnalyticsSection } from "./analytics-section";
import { CommandsSection } from "./commands-section";
import { DashboardShell } from "./dashboard-shell";
import { EmbedEditorSection } from "./embed-editor-section";
import { OverviewSection } from "./overview-section";
import { ServersSection } from "./servers-section";
import type { BotStatus, DashboardTabId, User } from "./dashboard-types";

export function DashboardClient() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [commands, setCommands] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTabId>("overview");
  const [isBotLoading, setIsBotLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const currentToken = getCloutToken();
    if (!currentToken) {
      setLoading(false);
      router.push("/");
      return;
    }

    setToken(currentToken);
    fetchUser(currentToken);
    fetchBotStatus(currentToken);
    fetchCommands(currentToken);
    fetchServers(currentToken);
  }, [router]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      apiUrl.replace(/^http/, "ws").replace(/\/$/, "") + "/ws";

    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    let reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
    const maxReconnectAttempts = 5;
    const baseDelay = 2000;
    let unmounted = false;

    function connect() {
      if (unmounted) return;
      try {
        ws = new WebSocket(wsUrl);
      } catch {
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        if (unmounted) return;
        reconnectAttempts = 0;
        ws?.send(JSON.stringify({ type: "subscribe_bot_status" }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string);
          if (message.type === "bot_status" && message.data) {
            setBotStatus(message.data);
            setIsBotLoading(false);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        ws = null;
        if (!unmounted) scheduleReconnect();
      };

      ws.onerror = () => {
        ws?.close();
      };
    }

    function scheduleReconnect() {
      if (unmounted || reconnectAttempts >= maxReconnectAttempts) return;
      const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempts), 30000);
      reconnectAttempts += 1;
      reconnectTimeoutId = setTimeout(connect, delay);
    }

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
      if (ws) {
        ws.onclose = () => {};
        ws.close();
      }
    };
  }, []);

  const handleAuthFailure = (): void => {
    clearCloutToken();
    setToken(null);
    router.push("/");
  };

  const fetchUser = async (authToken: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch user");
      }

      const data = await res.json();
      if (!data?.data) {
        throw new Error("Invalid user response");
      }
      setUser(data.data);
    } catch (error) {
      console.error("Error fetching user:", error);
      handleAuthFailure();
    } finally {
      setLoading(false);
    }
  };

  const fetchBotStatus = async (authToken: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/bot/status`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch bot status");
      }

      const data = await res.json();
      setBotStatus(data.data);
    } catch (error) {
      console.error("Error fetching bot status:", error);
    }
  };

  const fetchCommands = async (authToken: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/bot/commands`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setCommands(Array.isArray(data?.data) ? data.data : []);
      }
    } catch (error) {
      console.error("Error fetching commands:", error);
    }
  };

  const fetchServers = async (authToken: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/servers`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setServers(Array.isArray(data?.data) ? data.data : []);
      }
    } catch (error) {
      console.error("Error fetching servers:", error);
    }
  };

  const controlBot = async (action: "restart" | "start" | "stop") => {
    const authToken = getCloutToken();
    if (!authToken) return;

    setIsBotLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/bot/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Too many requests. Please try again in a few minutes.");
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? err?.message ?? `Failed to ${action} bot`);
      }

      if (action === "stop") {
        toast.success("Stop sent. Bot will disconnect within a few seconds.");
      } else if (action === "start") {
        toast.success("Start recorded. Run the bot process to bring it online.");
      } else {
        toast.success("Restart sent. Bot will exit; run the process again to bring it back.");
      }
      setTimeout(() => fetchBotStatus(authToken), 1000);
    } catch (error) {
      console.error(`Error ${action}ing bot:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${action} bot`);
    } finally {
      setIsBotLoading(false);
    }
  };

  const logout = (): void => {
    clearCloutToken();
    setToken(null);
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b]">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
          <span className="text-zinc-400">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell
      activeTab={activeTab}
      botStatus={botStatus}
      mobileMenuOpen={mobileMenuOpen}
      onMobileMenuChange={setMobileMenuOpen}
      onSignOut={logout}
      onTabChange={setActiveTab}
      user={user}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "overview" ? (
            <OverviewSection botStatus={botStatus} controlBot={controlBot} isBotLoading={isBotLoading} user={user} />
          ) : null}
          {activeTab === "servers" ? (
            <ServersSection
              guilds={user?.guilds ?? []}
              servers={servers}
              token={token || ""}
            />
          ) : null}
          {activeTab === "embeds" ? (
            <EmbedEditorSection
              servers={Array.isArray(servers) ? servers.map((s: any) => ({ id: s.id, discordId: s.discordId, name: s.name })) : []}
              token={token}
            />
          ) : null}
          {activeTab === "commands" ? (
            <CommandsSection
              commands={commands}
              servers={servers}
              token={token}
            />
          ) : null}
          {activeTab === "analytics" ? (
            <AnalyticsSection token={token} onRefresh={fetchBotStatus.bind(null, token || "")} />
          ) : null}
          {activeTab === "admin" ? (
            <AdminSection
              token={token}
              servers={Array.isArray(servers) ? servers.map((s: any) => ({ id: s.id, discordId: s.discordId, name: s.name })) : []}
              onServersRefresh={() => token && fetchServers(token)}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </DashboardShell>
  );
}
