"use client";

import { useEffect, useRef, Suspense } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Shield,
  Music,
  Settings,
  Zap,
  Users,
  BarChart3,
  Crown,
  ArrowRight,
  Check,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { Logo3D, LogoIcon } from "@/components/logo-3d";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelfHostedExpandableSection } from "@/components/self-hosted-expandable-section";
import { Toaster } from "@/components/ui/sonner";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { MagicCard } from "@/components/magicui/magic-card";
import { BorderBeam } from "@/components/magicui/border-beam";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { ShimmerButton } from "@/components/magicui/shimmer-button";

// Feature data - clean solid colors
const features = [
  {
    icon: Crown,
    title: "Karma & Reputation",
    description: "Track good and bad deeds within your community. Build a positive culture with visible reputation scores.",
    color: "bg-indigo-500/10",
    iconColor: "text-indigo-400"
  },
  {
    icon: Zap,
    title: "Economy System",
    description: "Full-featured virtual currency with daily rewards, transfers, games, and server-specific shops.",
    color: "bg-amber-500/10",
    iconColor: "text-amber-400"
  },
  {
    icon: Shield,
    title: "Server Management",
    description: "Powerful moderation tools, custom commands, and automated actions to keep your community safe.",
    color: "bg-emerald-500/10",
    iconColor: "text-emerald-400"
  },
  {
    icon: Music,
    title: "Music & Fun",
    description: "High-quality music streaming from multiple sources plus trivia, games, and interactive commands.",
    color: "bg-pink-500/10",
    iconColor: "text-pink-400"
  },
  {
    icon: BarChart3,
    title: "Rich Dashboard",
    description: "Beautiful web interface to configure your bot, view analytics, and manage settings with ease.",
    color: "bg-sky-500/10",
    iconColor: "text-sky-400"
  },
  {
    icon: Settings,
    title: "Deep Customization",
    description: "Custom embeds, commands, and configurations tailored to your community's unique needs.",
    color: "bg-violet-500/10",
    iconColor: "text-violet-400"
  }
];

// Benefits
const benefits = [
  "Free forever with no paywalls",
  "Self-hosted for full control",
  "Real-time dashboard updates",
  "Custom economy & karma system",
  "12+ slash commands included",
  "PostgreSQL database backend"
];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const discordLoginUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || "123456789"}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || "http://localhost:3001/auth/callback")}&response_type=code&scope=identify%20guilds`;

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#0a0a0b] overflow-x-hidden">
      {/* Subtle grid pattern background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <FlickeringGrid
          className="absolute inset-0 z-0"
          squareSize={6}
          gridGap={8}
          color="#9E7AFF"
          maxOpacity={0.12}
          flickerChance={0.05}
        />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/[0.03] rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-500/[0.02] rounded-full blur-[128px]" />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 glass-strong"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 transition-transform duration-300 group-hover:scale-110">
                <LogoIcon className="w-full h-full" />
              </div>
              <span className="text-xl font-semibold text-white">Clout</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {[
                { label: "Features", href: "#features" },
                { label: "Benefits", href: "#benefits" },
                { label: "GitHub", href: "https://github.com" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-white/[0.03]"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link href={discordLoginUrl}>
                <Button
                  variant="ghost"
                  className="text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                >
                  Sign In
                </Button>
              </Link>
              <Link href={discordLoginUrl}>
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 transition-all">
                  <Users className="w-4 h-4 mr-2" />
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              style={{ opacity, scale }}
              className="text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <Badge
                  variant="secondary"
                  className="mb-6 px-4 py-1.5 bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/15"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-2" />
                  Self-hosted Discord Bot
                </Badge>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-6"
              >
                <span className="text-white">Build</span>
                <br />
                <SparklesText className="text-5xl md:text-6xl lg:text-7xl" colors={{ first: "#818cf8", second: "#38bdf8" }} sparklesCount={5}>Community</SparklesText>
                <span className="text-white">Clout</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-lg text-zinc-400 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed"
              >
                A premium, self-hosted Discord bot featuring karma tracking,
                economy systems, and a beautiful web dashboard.
                Built for communities that value quality.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
              >
                <Link href={discordLoginUrl}>
                  <ShimmerButton className="shadow-2xl" background="#4f46e5" shimmerColor="#ffffff">
                    <span className="flex items-center gap-2 whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white lg:text-base">
                      <Crown className="w-5 h-5" /> Add to Discord
                    </span>
                  </ShimmerButton>
                </Link>
                <a href="#features">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-zinc-700 text-zinc-300 hover:bg-white/[0.03] hover:text-white px-8 h-12 text-base bg-transparent"
                  >
                    Explore Features
                  </Button>
                </a>
              </motion.div>

              {/* Benefits list */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="mt-12 flex flex-wrap gap-4 justify-center lg:justify-start"
              >
                {benefits.slice(0, 3).map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-zinc-500">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right - 3D Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-[400px] md:h-[500px] lg:h-[600px]"
            >
              <Logo3D className="w-full h-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <Badge
              variant="secondary"
              className="mb-4 bg-violet-500/10 text-violet-300 border-violet-500/20"
            >
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              A complete suite of tools to engage, moderate, and grow your Discord community
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="group h-full"
              >
                <MagicCard className="glass rounded-2xl p-8 h-full inner-glow flex items-start flex-col justify-start">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </MagicCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section - Interactive Expandable */}
      <Suspense fallback={
        <div className="py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass rounded-3xl p-8 md:p-12 lg:p-16 inner-glow h-96 flex items-center justify-center">
              <div className="flex items-center gap-3 text-zinc-500">
                <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
                <span>Loading...</span>
              </div>
            </div>
          </div>
        </div>
      }>
        <SelfHostedExpandableSection />
      </Suspense>

      {/* CTA Section */}
      <section className="relative z-10 py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass rounded-3xl p-12 inner-glow relative overflow-hidden"
          >
            <BorderBeam size={250} duration={12} delay={9} />
            <div className="relative z-10 w-16 h-16 mx-auto mb-6">
              <LogoIcon className="w-full h-full" />
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Ready to elevate your community?
            </h2>
            <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
              Join communities using Clout to build engagement,
              reward participation, and create lasting connections.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={discordLoginUrl}>
                <InteractiveHoverButton>
                  Get Started Free
                </InteractiveHoverButton>
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="border-zinc-700 text-zinc-300 hover:bg-white/[0.03] px-8 h-12 text-base bg-transparent"
                >
                  View on GitHub
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8">
                <LogoIcon className="w-full h-full" />
              </div>
              <span className="text-lg font-semibold text-white">Clout</span>
            </div>

            <p className="text-zinc-500 text-sm">
              Self-hosted Discord bot with premium features
            </p>

            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "rgba(10, 10, 11, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "#fafafa",
          },
        }}
      />
    </div>
  );
}
