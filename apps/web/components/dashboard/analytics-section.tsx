"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { MagicCard } from "@/components/magicui/magic-card";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DEFAULT_HISTORY = [
  { name: "Sun", users: 0, commands: 0, good: 0, bad: 0, coins: 0 },
  { name: "Mon", users: 0, commands: 0, good: 0, bad: 0, coins: 0 },
  { name: "Tue", users: 0, commands: 0, good: 0, bad: 0, coins: 0 },
  { name: "Wed", users: 0, commands: 0, good: 0, bad: 0, coins: 0 },
  { name: "Thu", users: 0, commands: 0, good: 0, bad: 0, coins: 0 },
  { name: "Fri", users: 0, commands: 0, good: 0, bad: 0, coins: 0 },
  { name: "Sat", users: 0, commands: 0, good: 0, bad: 0, coins: 0 },
];

const DEFAULT_TOP = [
  { name: "—", count: 0, fill: "#6366f1" },
];

const tooltipStyle = {
  contentStyle: { backgroundColor: "rgba(10, 10, 11, 0.9)", borderColor: "rgba(255,255,255,0.06)", borderRadius: "8px" },
  itemStyle: { color: "#fff" },
};

interface AnalyticsSectionProps {
  token?: string | null;
  onRefresh?: () => void;
}

export const AnalyticsSection = memo(function AnalyticsSection({ token, onRefresh }: AnalyticsSectionProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const [analyticsData, setAnalyticsData] = useState(DEFAULT_HISTORY);
  const [topCommandsData, setTopCommandsData] = useState(DEFAULT_TOP);
  const [modCounts, setModCounts] = useState({ warn: 0, kick: 0, ban: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [histRes, topRes] = await Promise.all([
        fetch(`${apiUrl}/bot/stats/historical`),
        fetch(`${apiUrl}/bot/stats/top-commands`),
      ]);
      if (histRes.ok) {
        const histBody = await histRes.json();
        setAnalyticsData(Array.isArray(histBody.data) && histBody.data.length > 0 ? histBody.data : DEFAULT_HISTORY);
      }
      if (topRes.ok) {
        const topBody = await topRes.json();
        setTopCommandsData(Array.isArray(topBody.data) && topBody.data.length > 0 ? topBody.data : DEFAULT_TOP);
      }

      if (token) {
        const modRes = await fetch(`${apiUrl}/servers/moderation/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (modRes.ok) {
          const modBody = await modRes.json();
          const events = modBody.data ?? [];
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          const recent = events.filter((e: { createdAt: string }) => new Date(e.createdAt).getTime() >= sevenDaysAgo);
          const warn = recent.filter((e: { action: string }) => e.action.toLowerCase() === "warn").length;
          const kick = recent.filter((e: { action: string }) => e.action.toLowerCase() === "kick").length;
          const ban = recent.filter((e: { action: string }) => e.action.toLowerCase() === "ban").length;
          setModCounts({ warn, kick, ban });
        }
      }
    } catch {
      // keep previous data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiUrl, token]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
    onRefresh?.();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-zinc-400 hover:text-white"
          onClick={handleRefresh}
          disabled={refreshing || loading}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          <span className="ml-1">Refresh data</span>
        </Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <MagicCard className="glass overflow-hidden rounded-[1.75rem] border-white/[0.06] shadow-xl" gradientColor="rgba(255,255,255,0.05)">
          <CardHeader>
            <CardTitle className="text-white">Command usage</CardTitle>
            <CardDescription className="text-zinc-500">Weekly commands executed (transactions per day)</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-[300px] min-h-[200px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={0}>
                <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCommands" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip {...tooltipStyle} />
                  <Area type="monotone" dataKey="commands" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCommands)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </MagicCard>

        <MagicCard className="glass overflow-hidden rounded-[1.75rem] border-white/[0.06] shadow-xl" gradientColor="rgba(255,255,255,0.05)">
          <CardHeader>
            <CardTitle className="text-white">User growth</CardTitle>
            <CardDescription className="text-zinc-500">New users per day (last 7 days)</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-[300px] min-h-[200px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={0}>
                <BarChart data={analyticsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip {...tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                  <Bar dataKey="users" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </MagicCard>

        <MagicCard className="glass overflow-hidden rounded-[1.75rem] border-white/[0.06] shadow-xl" gradientColor="rgba(255,255,255,0.05)">
          <CardHeader>
            <CardTitle className="text-white">Karma activity</CardTitle>
            <CardDescription className="text-zinc-500">Good vs bad deeds over the week (from DB when available)</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-[300px] min-h-[200px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={0}>
                <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => <span className="text-zinc-400">{value}</span>} />
                  <Area type="monotone" dataKey="good" name="Good deeds" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorGood)" />
                  <Area type="monotone" dataKey="bad" name="Bad deeds" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorBad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </MagicCard>

        <MagicCard className="glass overflow-hidden rounded-[1.75rem] border-white/[0.06] shadow-xl" gradientColor="rgba(255,255,255,0.05)">
          <CardHeader>
            <CardTitle className="text-white">Economy snapshot</CardTitle>
            <CardDescription className="text-zinc-500">Transaction activity by day (coins from DB when tracked)</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-[300px] min-h-[200px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={0}>
                <BarChart data={analyticsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} layout="vertical" barCategoryGap="12%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} width={32} />
                  <RechartsTooltip {...tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                  <Bar dataKey="commands" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Transactions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </MagicCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MagicCard className="glass overflow-hidden rounded-[1.75rem] border-white/[0.06] shadow-xl" gradientColor="rgba(255,255,255,0.05)">
          <CardHeader>
            <CardTitle className="text-white">Top commands</CardTitle>
            <CardDescription className="text-zinc-500">Transaction types (economy activity)</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-[280px] min-h-[200px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={0}>
                <PieChart>
                  <Pie
                    data={topCommandsData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={{ stroke: "rgba(255,255,255,0.2)" }}
                  >
                    {topCommandsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip {...tooltipStyle} formatter={(value: number | undefined) => [value ?? 0, "Uses"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </MagicCard>

        <MagicCard className="glass overflow-hidden rounded-[1.75rem] border-white/[0.06] shadow-xl" gradientColor="rgba(255,255,255,0.05)">
          <CardHeader>
            <CardTitle className="text-white">Moderation summary</CardTitle>
            <CardDescription className="text-zinc-500">Warns, kicks, and bans (last 7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
                <p className="text-2xl font-semibold text-amber-300">{modCounts.warn}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">Warns</p>
              </div>
              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 text-center">
                <p className="text-2xl font-semibold text-orange-300">{modCounts.kick}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">Kicks</p>
              </div>
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                <p className="text-2xl font-semibold text-red-300">{modCounts.ban}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">Bans</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              Connect a mod log channel in Server settings to track events in real time.
            </p>
          </CardContent>
        </MagicCard>
      </div>
    </div>
  );
});
