"use client";

import { useEffect, useState, memo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Settings,
  Command,
  BarChart3,
  LogOut,
  Play,
  Square,
  RefreshCw,
  Server,
  Users,
  Sparkles,
  Crown,
  Activity,
  Clock,
  Database,
  ChevronRight,
  Menu,
  X,
  Zap,
  Save,
  ArrowLeft,
  Shield,
  Music,
  Heart,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { LogoIcon } from "@/components/logo-3d";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/theme-toggle";
import { MagicCard } from "@/components/magicui/magic-card";
import { NumberTicker } from "@/components/magicui/number-ticker";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface BotStatus {
  online: boolean;
  uptime: number;
  guilds: number;
  users: number;
  commands: number;
  websocketPing: number;
  memoryUsage: number;
}

interface User {
  id: string;
  discordId: string;
  username: string;
  avatar: string | null;
  balance: number;
  goodDeeds: number;
  badDeeds: number;
}

interface ServerSettings {
  economyEnabled: boolean;
  gamesEnabled: boolean;
  musicEnabled: boolean;
  aiChatEnabled: boolean;
  dailyReward: number;
}

const sidebarItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "servers", label: "Servers", icon: Server },
  { id: "embeds", label: "Embed Editor", icon: Settings },
  { id: "commands", label: "Commands", icon: Command },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [commands, setCommands] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isBotLoading, setIsBotLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("clout_token");
    if (!token) {
      router.push("/");
      return;
    }

    fetchUser(token);
    fetchBotStatus(token);
    fetchCommands(token);
    fetchServers(token);
  }, [router]);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // Subscribe to live status
      ws.send(JSON.stringify({ type: "subscribe_bot_status" }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "bot_status" && message.data) {
          setBotStatus(message.data);
          setIsBotLoading(false);
        }
      } catch (error) {
        console.error("Error parsing websocket message:", error);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch user");

      const data = await res.json();
      setUser(data.data);
    } catch (error) {
      console.error("Error fetching user:", error);
      localStorage.removeItem("clout_token");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchBotStatus = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/bot/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch bot status");

      const data = await res.json();
      setBotStatus(data.data);
    } catch (error) {
      console.error("Error fetching bot status:", error);
    }
  };

  const fetchCommands = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/bot/commands`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setCommands(data.data);
      }
    } catch (error) {
      console.error("Error fetching commands:", error);
    }
  };

  const fetchServers = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/servers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setServers(data.data);
      }
    } catch (error) {
      console.error("Error fetching servers:", error);
    }
  };

  const controlBot = async (action: "start" | "stop" | "restart") => {
    const token = localStorage.getItem("clout_token");
    if (!token) return;

    setIsBotLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/bot/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed to ${action} bot`);

      setTimeout(() => fetchBotStatus(token), 1000);
    } catch (error) {
      console.error(`Error ${action}ing bot:`, error);
    } finally {
      setIsBotLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("clout_token");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 transition-transform duration-300 group-hover:scale-110">
            <LogoIcon className="w-full h-full" />
          </div>
          <span className="text-xl font-semibold text-white">Clout</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 pb-4 space-y-1">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id
              ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
              }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <Separator className="bg-white/[0.06] mb-4" />
        <div className="flex items-center gap-3 px-2 mb-4">
          <Avatar className="w-10 h-10 border border-white/[0.06]">
            <AvatarImage src={user?.avatar || undefined} />
            <AvatarFallback className="bg-indigo-500/10 text-indigo-300">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">
              {user?.username}
            </p>
            <p className="text-xs text-zinc-500">Logged in</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-50 glass-strong border-r border-border">
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-background/95 backdrop-blur-xl border-r border-border">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          {/* Header */}
          <header className="sticky top-0 z-40 glass-strong border-b border-border px-4 md:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Sheet>
                  <SheetTrigger asChild className="lg:hidden">
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                </Sheet>

                <div>
                  <h1 className="text-xl font-semibold text-foreground capitalize">
                    {activeTab}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Welcome back, {user?.username}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${botStatus?.online
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                      <div className={`w-2 h-2 rounded-full ${botStatus?.online ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                      <span className="text-sm font-medium hidden sm:inline">
                        {botStatus?.online ? "Online" : "Offline"}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Bot Status</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-4 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "overview" && (
                  <OverviewTab
                    botStatus={botStatus}
                    user={user}
                    isBotLoading={isBotLoading}
                    controlBot={controlBot}
                  />
                )}
                {activeTab === "servers" && <ServersTab servers={servers} token={typeof window !== 'undefined' ? localStorage.getItem("clout_token") || "" : ""} />}
                {activeTab === "embeds" && <EmbedEditor />}
                {activeTab === "commands" && <CommandsTab commands={commands} />}
                {activeTab === "analytics" && <AnalyticsTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}

// Overview Tab Component
const OverviewTab = memo(({
  botStatus,
  user,
  isBotLoading,
  controlBot
}: {
  botStatus: BotStatus | null;
  user: User | null;
  isBotLoading: boolean;
  controlBot: (action: "start" | "stop" | "restart") => void;
}) => {
  return (
    <div className="space-y-6">
      {/* Bot Control Card */}
      <Card className="glass border-white/[0.06] inner-glow">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Bot Controls</CardTitle>
              <CardDescription className="text-zinc-500">
                Manage your bot instance
              </CardDescription>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${botStatus?.online
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-slate-500/10 text-zinc-400 border border-slate-500/20"
              }`}>
              {botStatus?.online ? "Running" : "Stopped"}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!botStatus?.online && (
            <Alert className="mb-6 bg-indigo-500/10 border-indigo-500/20 text-indigo-200">
              <Sparkles className="h-4 w-4" />
              <AlertTitle>Welcome to Clout Dashboard!</AlertTitle>
              <AlertDescription>
                Your bot is currently offline. Start the bot below, and head over to the <strong>Servers</strong> tab to invite it to your community.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => controlBot("start")}
              disabled={botStatus?.online || isBotLoading}
              className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30"
            >
              <Play className="w-4 h-4 mr-2" />
              Start
            </Button>

            <Button
              onClick={() => controlBot("stop")}
              disabled={!botStatus?.online || isBotLoading}
              variant="outline"
              className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-400"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>

            <Button
              onClick={() => controlBot("restart")}
              disabled={isBotLoading}
              variant="outline"
              className="border-amber-500/20 text-amber-400 hover:bg-amber-500/10 hover:text-amber-400"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isBotLoading ? "animate-spin" : ""}`} />
              Restart
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Servers"
          value={botStatus?.guilds || 0}
          icon={Server}
          description="Connected guilds"
          trend="active"
        />
        <StatCard
          label="Users"
          value={botStatus?.users || 0}
          icon={Users}
          description="Total members"
          trend="neutral"
        />
        <StatCard
          label="Commands"
          value={botStatus?.commands || 0}
          icon={Command}
          description="Available commands"
          trend="neutral"
        />
        <StatCard
          label="Ping"
          value={`${botStatus?.websocketPing || 0}ms`}
          icon={Activity}
          description="Response time"
          trend={botStatus?.websocketPing && botStatus.websocketPing < 100 ? "good" : "warning"}
        />
      </div>

      {/* User Stats & System Info */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* User Stats */}
        <Card className="glass border-white/[0.06] inner-glow">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-indigo-400" />
              Your Reputation
            </CardTitle>
            <CardDescription className="text-zinc-500">
              Your karma and economy stats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <Heart className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-semibold text-emerald-400">
                  {user?.goodDeeds || 0}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Good Deeds</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-semibold text-red-400">
                  {user?.badDeeds || 0}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Bad Deeds</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <Sparkles className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-semibold text-amber-400">
                  {user?.balance || 0}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Coins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="glass border-white/[0.06] inner-glow">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-violet-400" />
              System Status
            </CardTitle>
            <CardDescription className="text-zinc-500">
              Bot performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-zinc-400" />
                <span className="text-sm text-zinc-400">Uptime</span>
              </div>
              <span className="text-sm font-medium text-zinc-200">
                {botStatus?.uptime
                  ? `${Math.floor(botStatus.uptime / 3600)}h ${Math.floor((botStatus.uptime % 3600) / 60)}m`
                  : "--"
                }
              </span>
            </div>
            <Separator className="bg-white/[0.06]" />
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-zinc-400" />
                <span className="text-sm text-zinc-400">Memory Usage</span>
              </div>
              <span className="text-sm font-medium text-zinc-200">
                {botStatus?.memoryUsage
                  ? `${(botStatus.memoryUsage / 1024 / 1024).toFixed(1)} MB`
                  : "--"
                }
              </span>
            </div>
            <Separator className="bg-white/[0.06]" />
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-zinc-400" />
                <span className="text-sm text-zinc-400">WebSocket</span>
              </div>
              <span className="text-sm font-medium text-zinc-200">
                {botStatus?.websocketPing || 0}ms
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

// Stat Card Component
const StatCard = memo(({
  label,
  value,
  icon: Icon,
  description,
  trend
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  trend: "good" | "warning" | "neutral" | "active";
}) => {
  const trendColors = {
    good: "text-emerald-400",
    warning: "text-amber-400",
    neutral: "text-zinc-400",
    active: "text-indigo-400"
  };

  return (
    <MagicCard
      className="glass border-white/[0.06] shadow-xl overflow-hidden"
      gradientColor={"rgba(255, 255, 255, 0.05)"}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-lg bg-white/[0.03] ${trendColors[trend]}`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend === "active" && (
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </div>
        <div className="mt-4">
          <div className="text-2xl font-semibold text-white flex items-center">
            {typeof value === "number" ? (
              <NumberTicker value={value} className="text-white dark:text-white" />
            ) : typeof value === "string" && !isNaN(Number(value.replace(/[^0-9.-]+/g, ""))) && Number(value.replace(/[^0-9.-]+/g, "")) !== 0 ? (
              <>
                <NumberTicker value={Number(value.replace(/[^0-9.-]+/g, ""))} className="text-white dark:text-white tracking-widest" />
                <span>{value.replace(/[0-9.-]+/g, "")}</span>
              </>
            ) : (
              value
            )}
          </div>
          <p className="text-sm text-zinc-400 mt-0.5">{label}</p>
          <p className="text-xs text-zinc-500 mt-1">{description}</p>
        </div>
      </CardContent>
    </MagicCard>
  );
});

// Servers Tab
const ServersTab = memo(({ servers, token }: { servers: any[], token: string }) => {
  const [selectedServer, setSelectedServer] = useState<any | null>(null);
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectServer = async (server: any) => {
    setSelectedServer(server);
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/servers/${server.discordId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.data.settings || {});
      }
    } catch (e) {
      console.error("Failed to load server", e);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      await fetch(`${apiUrl}/servers/${selectedServer.discordId}/settings`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          welcomeChannelId: settings.welcomeChannelId || null,
          welcomeMessage: settings.welcomeMessage || null,
          leaveChannelId: settings.leaveChannelId || null,
          leaveMessage: settings.leaveMessage || null,
          antiLinkEnabled: settings.antiLinkEnabled ?? false,
          antiSpamEnabled: settings.antiSpamEnabled ?? false,
          antiInvitesEnabled: settings.antiInvitesEnabled ?? false,
          modLogChannelId: settings.modLogChannelId || null,
        }),
      });
    } catch (e) {
      console.error("Failed to save", e);
    }
    setLoading(false);
  };

  if (selectedServer) {
    return (
      <Card className="glass border-white/[0.06] inner-glow">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <Button variant="ghost" size="icon" onClick={() => setSelectedServer(null)}>
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Button>
          <div>
            <CardTitle className="text-white">{selectedServer.name} Settings</CardTitle>
            <CardDescription className="text-zinc-500">
              Configure Welcome and Leave messages
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 mt-4">
          {loading ? (
            <div className="text-zinc-400 text-sm">Loading...</div>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-zinc-400">Welcome Channel ID</Label>
                <Input
                  className="bg-white/[0.03] border-white/[0.06] text-zinc-200"
                  placeholder="e.g. 123456789012345678"
                  value={settings?.welcomeChannelId || ""}
                  onChange={(e) => setSettings({ ...settings, welcomeChannelId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Welcome Message</Label>
                <Textarea
                  className="bg-white/[0.03] border-white/[0.06] text-zinc-200 min-h-[100px]"
                  placeholder="Welcome {user} to {server}!"
                  value={settings?.welcomeMessage || ""}
                  onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                />
                <p className="text-xs text-zinc-500">Variables: {'{user}'}, {'{server}'}, {'{memberCount}'}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Leave Channel ID</Label>
                <Input
                  className="bg-white/[0.03] border-white/[0.06] text-zinc-200"
                  placeholder="e.g. 123456789012345678"
                  value={settings?.leaveChannelId || ""}
                  onChange={(e) => setSettings({ ...settings, leaveChannelId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Leave Message</Label>
                <Textarea
                  className="bg-white/[0.03] border-white/[0.06] text-zinc-200 min-h-[100px]"
                  placeholder="{user} has left the server."
                  value={settings?.leaveMessage || ""}
                  onChange={(e) => setSettings({ ...settings, leaveMessage: e.target.value })}
                />
              </div>

              <Separator className="bg-white/[0.06]" />

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  Auto-Moderation
                </h4>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="space-y-0.5">
                    <Label className="text-sm text-zinc-200">Anti-Link</Label>
                    <p className="text-xs text-zinc-500">Deletes messages containing links</p>
                  </div>
                  <Switch
                    checked={settings?.antiLinkEnabled || false}
                    onCheckedChange={(checked) => setSettings({ ...settings, antiLinkEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="space-y-0.5">
                    <Label className="text-sm text-zinc-200">Anti-Invite</Label>
                    <p className="text-xs text-zinc-500">Deletes Discord server invites</p>
                  </div>
                  <Switch
                    checked={settings?.antiInvitesEnabled || false}
                    onCheckedChange={(checked) => setSettings({ ...settings, antiInvitesEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="space-y-0.5">
                    <Label className="text-sm text-zinc-200">Anti-Spam</Label>
                    <p className="text-xs text-zinc-500">Deletes rapid duplicate messages</p>
                  </div>
                  <Switch
                    checked={settings?.antiSpamEnabled || false}
                    onCheckedChange={(checked) => setSettings({ ...settings, antiSpamEnabled: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-400">Mod Log Channel ID</Label>
                  <Input
                    className="bg-white/[0.03] border-white/[0.06] text-zinc-200"
                    placeholder="e.g. 123456789012345678"
                    value={settings?.modLogChannelId || ""}
                    onChange={(e) => setSettings({ ...settings, modLogChannelId: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleSave} disabled={loading} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white mt-4">
                <Save className="w-4 h-4 mr-2" /> Save Settings
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-white/[0.06] inner-glow">
      <CardHeader>
        <CardTitle className="text-white">Connected Servers</CardTitle>
        <CardDescription className="text-zinc-500">
          Manage your Discord servers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {servers && servers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servers.map((server) => (
              <div
                key={server.id}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-4 cursor-pointer hover:bg-white/[0.08] transition-colors"
                onClick={() => handleSelectServer(server)}
              >
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 flex-shrink-0">
                  <Server className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{server.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-zinc-500">ID: {server.discordId}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Server className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-zinc-400">No servers connected yet</p>
            <p className="text-sm text-zinc-500 mt-1">
              Invite the bot to your server to get started
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Embed Editor Tab
const EmbedEditor = memo(() => {
  const [color, setColor] = useState("#818cf8");
  const [title, setTitle] = useState("{username}'s Profile");
  const [description, setDescription] = useState("Good deeds: {goodDeeds} | Bad deeds: {badDeeds}");
  const [footer, setFooter] = useState("Clout Bot");

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="glass border-white/[0.06] inner-glow">
        <CardHeader>
          <CardTitle className="text-white">Embed Configuration</CardTitle>
          <CardDescription className="text-zinc-500">
            Customize how embeds appear in Discord
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-zinc-400">Accent Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 bg-white/[0.03] border-white/[0.06] text-zinc-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400">Title Template</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/[0.03] border-white/[0.06] text-zinc-200"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400">Description Template</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="bg-white/[0.03] border-white/[0.06] text-zinc-200 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400">Footer Text</Label>
            <Input
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              className="bg-white/[0.03] border-white/[0.06] text-zinc-200"
            />
          </div>

          <Button className="w-full bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/20">
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="glass border-white/[0.06] inner-glow">
        <CardHeader>
          <CardTitle className="text-white">Preview</CardTitle>
          <CardDescription className="text-zinc-500">
            How it looks in Discord
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-lg overflow-hidden"
            style={{ borderLeft: `4px solid ${color}` }}
          >
            <div className="bg-[#2f3136] p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                  C
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">Clout</span>
                    <Badge className="bg-[#5865F2] text-white text-[10px] px-1 py-0 border-0">BOT</Badge>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Today at 4:20 PM</div>

                  <div className="mt-3 bg-[#36393f] rounded-lg p-3">
                    <div
                      className="font-semibold text-sm mb-2"
                      style={{ color }}
                    >
                      {title.replace("{username}", "DemoUser")}
                    </div>
                    <div className="text-gray-300 text-sm">
                      {description.replace("{goodDeeds}", "12").replace("{badDeeds}", "3")}
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-400 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      {footer}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

// Commands Tab
const CommandsTab = memo(({ commands }: { commands: any[] }) => {
  return (
    <Card className="glass border-white/[0.06] inner-glow">
      <CardHeader>
        <CardTitle className="text-white">Bot Commands</CardTitle>
        <CardDescription className="text-zinc-500">
          Manage your bot's slash commands
        </CardDescription>
      </CardHeader>
      <CardContent>
        {commands && commands.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {commands.map((cmd) => (
              <div key={cmd.name} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-indigo-500/10 text-indigo-400 border-0">{cmd.category}</Badge>
                  <h3 className="font-semibold text-white">/{cmd.name}</h3>
                </div>
                <p className="text-sm text-zinc-400 mb-3">{cmd.description}</p>
                <code className="text-xs bg-black/30 px-2 py-1 rounded text-zinc-500 font-mono">
                  {cmd.usage}
                </code>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Command className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-zinc-400">No commands loaded.</p>
            <p className="text-sm text-zinc-500 mt-1">
              Start the bot to fetch the active slash commands.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

const analyticsData = [
  { name: "Mon", commands: 400, users: 240 },
  { name: "Tue", commands: 300, users: 139 },
  { name: "Wed", commands: 200, users: 980 },
  { name: "Thu", commands: 278, users: 390 },
  { name: "Fri", commands: 189, users: 480 },
  { name: "Sat", commands: 239, users: 380 },
  { name: "Sun", commands: 349, users: 430 },
];

// Analytics Tab
const AnalyticsTab = memo(() => {
  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <MagicCard
          className="glass border-white/[0.06] shadow-xl overflow-hidden"
          gradientColor={"rgba(255, 255, 255, 0.05)"}
        >
          <CardHeader>
            <CardTitle className="text-white">Command Usage</CardTitle>
            <CardDescription className="text-zinc-500">Weekly commands executed</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCommands" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "rgba(10, 10, 11, 0.9)", borderColor: "rgba(255,255,255,0.06)", borderRadius: "8px" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Area type="monotone" dataKey="commands" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorCommands)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </MagicCard>

        <MagicCard
          className="glass border-white/[0.06] shadow-xl overflow-hidden"
          gradientColor={"rgba(255, 255, 255, 0.05)"}
        >
          <CardHeader>
            <CardTitle className="text-white">New Users</CardTitle>
            <CardDescription className="text-zinc-500">Weekly user growth</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "rgba(10, 10, 11, 0.9)", borderColor: "rgba(255,255,255,0.06)", borderRadius: "8px" }}
                    itemStyle={{ color: "#fff" }}
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  />
                  <Bar dataKey="users" fill="#34d399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </MagicCard>
      </div>
    </div>
  );
});
