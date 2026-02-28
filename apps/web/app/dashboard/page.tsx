"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  ChevronDown,
  Sparkles
} from "lucide-react";
import Link from "next/link";

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

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isBotLoading, setIsBotLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("clout_token");
    if (!token) {
      router.push("/");
      return;
    }

    // Fetch user data
    fetchUser(token);
    fetchBotStatus(token);
  }, [router]);

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
      
      // Refresh status after action
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
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="glass rounded-2xl p-8">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Sidebar */}
      <aside className="w-64 glass-strong border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Clout</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "embeds", label: "Embed Editor", icon: Settings },
            { id: "commands", label: "Custom Commands", icon: Command },
            { id: "analytics", label: "Analytics", icon: BarChart3 },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="glass-strong border-b border-white/10 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white capitalize">{activeTab}</h1>
            <p className="text-slate-400">Welcome back, {user?.username}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="glass rounded-lg px-4 py-2 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${botStatus?.online ? "bg-green-500" : "bg-red-500"}`}></div>
              <span className="text-sm text-slate-300">Bot {botStatus?.online ? "Online" : "Offline"}</span>
            </div>
          </div>
        </header>

        <div className="p-8">
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Bot Controls */}
              <section className="glass rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Bot Controls</h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => controlBot("start")}
                    disabled={botStatus?.online || isBotLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Play className="w-5 h-5" />
                    Start Bot
                  </button>

                  <button
                    onClick={() => controlBot("stop")}
                    disabled={!botStatus?.online || isBotLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Square className="w-5 h-5" />
                    Stop Bot
                  </button>

                  <button
                    onClick={() => controlBot("restart")}
                    disabled={isBotLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <RefreshCw className={`w-5 h-5 ${isBotLoading ? "animate-spin" : ""}`} />
                    Restart
                  </button>
                </div>
              </section>

              {/* Stats Grid */}
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Servers", value: botStatus?.guilds || 0, icon: Server },
                  { label: "Users", value: botStatus?.users || 0, icon: LayoutDashboard },
                  { label: "Commands", value: botStatus?.commands || 0, icon: Command },
                  { label: "Ping", value: `${botStatus?.websocketPing || 0}ms`, icon: BarChart3 },
                ].map((stat) => (
                  <div key={stat.label} className="glass rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <stat.icon className="w-6 h-6 text-indigo-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </section>

              {/* User Stats */}
              <section className="glass rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Your Stats</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-3xl font-bold text-green-400">{user?.goodDeeds || 0}</p>
                    <p className="text-slate-400">Good Deeds</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-3xl font-bold text-red-400">{user?.badDeeds || 0}</p>
                    <p className="text-slate-400">Bad Deeds</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-3xl font-bold text-yellow-400">{user?.balance || 0}</p>
                    <p className="text-slate-400">Coins</p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "embeds" && <EmbedEditor />}
          {activeTab === "commands" && <CustomCommands />}
          {activeTab === "analytics" && <Analytics />}
        </div>
      </main>
    </div>
  );
}

// Placeholder components for other tabs
function EmbedEditor() {
  const [color, setColor] = useState("#5865F2");
  const [title, setTitle] = useState("{username}'s Profile");
  const [description, setDescription] = useState("Good deeds: {goodDeeds} | Bad deeds: {badDeeds}");
  const [footer, setFooter] = useState("Clout Bot");

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Editor */}
        <div className="glass rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white">Embed Configuration</h2>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Footer</label>
            <input
              type="text"
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
            />
          </div>

          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity">
            Save Changes
          </button>
        </div>

        {/* Preview */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Preview</h2>
          
          <div 
            className="rounded-lg overflow-hidden"
            style={{ borderLeft: `4px solid ${color}` }}
          >
            <div className="bg-[#2f3136] p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  C
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">Clout</span>
                    <span className="text-xs bg-[#5865F2] text-white px-1 rounded">BOT</span>
                  </div>
                  <div className="text-xs text-gray-400">Today at 4:20 PM</div>
                  
                  <div className="mt-2 bg-[#36393f] rounded-lg p-3">
                    <div 
                      className="font-semibold mb-2"
                      style={{ color }}
                    >
                      {title.replace("{username}", "DemoUser")}
                    </div>
                    <div className="text-gray-300 text-sm">
                      {description.replace("{goodDeeds}", "42").replace("{badDeeds}", "7")}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-400">
                      {footer}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomCommands() {
  return (
    <div className="glass rounded-2xl p-8 text-center">
      <Command className="w-16 h-16 text-slate-600 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">Custom Commands</h2>
      <p className="text-slate-400">Create and manage custom slash commands for your server.</p>
    </div>
  );
}

function Analytics() {
  return (
    <div className="glass rounded-2xl p-8 text-center">
      <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">Analytics</h2>
      <p className="text-slate-400">View detailed statistics about your bot usage.</p>
    </div>
  );
}