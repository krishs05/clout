"use client";

import { memo, useEffect, useState } from "react";
import {
  AlertTriangle,
  Ban,
  FileText,
  RefreshCw,
  Shield,
  ShieldAlert,
  UserX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface ModEvent {
  id: string;
  action: string;
  targetUsername: string;
  moderatorUsername: string;
  reason: string | null;
  createdAt: string;
  serverName: string;
}

interface BotSettings {
  prefix: string;
  logLevel: string;
}

interface ServerOption {
  id: string;
  discordId: string;
  name: string;
}

interface AdminSectionProps {
  token: string | null;
  servers: ServerOption[];
  onServersRefresh?: () => void;
}

export const AdminSection = memo(function AdminSection({
  token,
  servers = [],
  onServersRefresh,
}: AdminSectionProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const [modEvents, setModEvents] = useState<ModEvent[]>([]);
  const [modLoading, setModLoading] = useState(true);
  const [settings, setSettings] = useState<BotSettings>({ prefix: "!", logLevel: "info" });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [leaveServerId, setLeaveServerId] = useState<string>("");
  const [resetServerId, setResetServerId] = useState<string>("");
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const fetchModEvents = async () => {
    if (!token) return;
    setModLoading(true);
    try {
      const res = await fetch(`${apiUrl}/servers/moderation/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setModEvents(data.data ?? []);
      }
    } catch {
      toast.error("Failed to load moderation log");
    } finally {
      setModLoading(false);
    }
  };

  const fetchSettings = async () => {
    if (!token) return;
    setSettingsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/bot/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.data ?? { prefix: "!", logLevel: "info" });
      }
    } catch {
      toast.error("Failed to load bot settings");
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    fetchModEvents();
  }, [token]);
  useEffect(() => {
    fetchSettings();
  }, [token]);

  const handleLeaveServer = async () => {
    if (!token || !leaveServerId) {
      toast.error("Select a server first");
      return;
    }
    setLeaveLoading(true);
    try {
      const res = await fetch(`${apiUrl}/servers/${leaveServerId}/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { error?: string }).error || "Failed to leave server");
      toast.success("Bot has left the server");
      setLeaveServerId("");
      onServersRefresh?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to leave server");
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleResetModeration = async () => {
    if (!token || !resetServerId) {
      toast.error("Select a server first");
      return;
    }
    if (!confirm("Clear all warns, kicks, and bans for this server? This cannot be undone.")) return;
    setResetLoading(true);
    try {
      const res = await fetch(`${apiUrl}/servers/${resetServerId}/moderation/reset`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { error?: string }).error || "Failed to reset");
      toast.success("Moderation data reset");
      setResetServerId("");
      fetchModEvents();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reset moderation data");
    } finally {
      setResetLoading(false);
    }
  };

  const actionLabel = (action: string) => {
    const a = action.toLowerCase();
    if (a === "warn") return "Warn";
    if (a === "kick") return "Kick";
    if (a === "ban") return "Ban";
    return action;
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass rounded-[1.75rem] border-white/[0.06] inner-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-indigo-300" />
              Moderation log
            </CardTitle>
            <CardDescription className="text-zinc-500">
              Recent warns, kicks, and bans across your servers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-[1.25rem] border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="mb-3 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-zinc-400 hover:text-white"
                  onClick={fetchModEvents}
                  disabled={modLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${modLoading ? "animate-spin" : ""}`} />
                  <span className="ml-1">Refresh</span>
                </Button>
              </div>
              {modLoading ? (
                <p className="py-6 text-center text-sm text-zinc-500">Loading…</p>
              ) : modEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
                    <Shield className="h-6 w-6 text-zinc-500" />
                  </div>
                  <p className="text-sm font-medium text-zinc-300">No moderation events yet</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Warns, kicks, and bans will appear here when they occur.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2 max-h-[320px] overflow-y-auto">
                  {modEvents.map((e) => (
                    <li
                      key={e.id}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm"
                    >
                      <span className="font-medium text-zinc-200">{actionLabel(e.action)}</span>
                      <span className="text-zinc-500"> — {e.targetUsername}</span>
                      <span className="text-zinc-500"> by {e.moderatorUsername}</span>
                      {e.reason && (
                        <p className="mt-1 text-xs text-zinc-500">Reason: {e.reason}</p>
                      )}
                      <p className="mt-0.5 text-xs text-zinc-600">
                        {e.serverName} · {new Date(e.createdAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass rounded-[1.75rem] border-white/[0.06] inner-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-violet-300" />
              Bot settings
            </CardTitle>
            <CardDescription className="text-zinc-500">
              Global defaults and feature toggles (per-server in Servers)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settingsLoading ? (
              <p className="text-sm text-zinc-500">Loading…</p>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Command prefix</p>
                    <p className="text-xs text-zinc-500">Fallback when slash commands are unavailable</p>
                  </div>
                  <span className="rounded-xl bg-white/[0.05] px-3 py-1.5 font-mono text-sm text-zinc-300">
                    {settings.prefix}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Log level</p>
                    <p className="text-xs text-zinc-500">Console and file verbosity</p>
                  </div>
                  <span className="rounded-xl bg-white/[0.05] px-3 py-1.5 text-sm text-zinc-300">
                    {settings.logLevel}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass rounded-[1.75rem] border-red-500/10 inner-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-200">
            <ShieldAlert className="h-5 w-5" />
            Dangerous zone
          </CardTitle>
          <CardDescription className="text-zinc-500">
            Irreversible or high-impact actions. Use with care.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator className="bg-white/[0.06]" />
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                  <UserX className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">Leave server (bot)</p>
                  <p className="text-xs text-zinc-500">Remove the bot from a Discord server</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={leaveServerId}
                  onChange={(e) => setLeaveServerId(e.target.value)}
                  className="w-[180px] rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="">Choose server</option>
                  {servers.map((s) => (
                    <option key={s.id} value={s.discordId}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  className="border-amber-500/20 text-amber-300 hover:bg-amber-500/10 hover:text-amber-200"
                  onClick={handleLeaveServer}
                  disabled={leaveLoading || !leaveServerId}
                >
                  {leaveLoading ? "Leaving…" : "Leave"}
                </Button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                  <Ban className="h-5 w-5 text-red-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">Reset moderation data</p>
                  <p className="text-xs text-zinc-500">Clear warns and logs for a server</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={resetServerId}
                  onChange={(e) => setResetServerId(e.target.value)}
                  className="w-[180px] rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                >
                  <option value="">Choose server</option>
                  {servers.map((s) => (
                    <option key={s.id} value={s.discordId}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  className="border-red-500/20 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                  onClick={handleResetModeration}
                  disabled={resetLoading || !resetServerId}
                >
                  {resetLoading ? "Resetting…" : "Reset"}
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-xs text-amber-200/90">
              These actions may require confirmation in a future update. Ensure you have backups or exports if needed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
