"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  Shield, 
  Music, 
  Settings, 
  Zap, 
  Users, 
  BarChart3,
  ChevronDown,
  Sparkles
} from "lucide-react";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

// Floating geometric shapes
function FloatingShape({ 
  position, 
  rotation, 
  scale, 
  color,
  geometry = "box",
  scrollProgress 
}: { 
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
  geometry?: "box" | "sphere" | "torus" | "octahedron";
  scrollProgress: React.MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialY = position[1];

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.003;
      meshRef.current.rotation.y += 0.005;
      meshRef.current.position.y = initialY + Math.sin(state.clock.elapsedTime * 0.5) * 0.3 - scrollProgress.current * 2;
    }
  });

  const GeometryComponent = {
    box: <boxGeometry args={[1, 1, 1]} />,
    sphere: <sphereGeometry args={[0.6, 32, 32]} />,
    torus: <torusGeometry args={[0.5, 0.2, 16, 32]} />,
    octahedron: <octahedronGeometry args={[0.6]} />,
  }[geometry];

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
        {GeometryComponent}
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={0.2}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

// Central logo shape
function LogoShape({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      groupRef.current.position.y = -scrollProgress.current * 3;
      const scale = Math.max(0.5, 1 - scrollProgress.current * 0.5);
      groupRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Outer ring */}
      <mesh>
        <torusGeometry args={[2, 0.05, 16, 100]} />
        <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Middle ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.03, 16, 100]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Inner octahedron */}
      <mesh>
        <octahedronGeometry args={[0.8]} />
        <meshStandardMaterial 
          color="#ec4899" 
          emissive="#ec4899" 
          emissiveIntensity={0.3}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
      
      {/* Floating particles around logo */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 2.5;
        return (
          <mesh 
            key={i}
            position={[Math.cos(angle) * radius, Math.sin(angle) * radius * 0.5, Math.sin(angle) * radius]}
          >
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
          </mesh>
        );
      })}
    </group>
  );
}

// Scene component
function Scene({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 8]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -10]} color="#6366f1" intensity={0.5} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <LogoShape scrollProgress={scrollProgress} />
      
      <FloatingShape 
        position={[-4, 2, -2]} 
        rotation={[0.5, 0.5, 0]} 
        scale={0.8} 
        color="#6366f1"
        geometry="box"
        scrollProgress={scrollProgress}
      />
      <FloatingShape 
        position={[4, -1, -3]} 
        rotation={[0.3, 0.8, 0]} 
        scale={0.6} 
        color="#8b5cf6"
        geometry="sphere"
        scrollProgress={scrollProgress}
      />
      
      <FloatingShape 
        position={[-3, -2, -1]} 
        rotation={[0.6, 0.2, 0.4]} 
        scale={0.7} 
        color="#ec4899"
        geometry="torus"
        scrollProgress={scrollProgress}
      />
      
      <FloatingShape 
        position={[3.5, 2.5, -2]} 
        rotation={[0.4, 0.6, 0.2]} 
        scale={0.5} 
        color="#10b981"
        geometry="octahedron"
        scrollProgress={scrollProgress}
      />
    </>
  );
}

// Feature card component
function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  delay 
}: { 
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay,
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }
  }, [delay]);

  return (
    <div
      ref={cardRef}
      className="glass rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 group cursor-pointer"
    >
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl font-semibold mb-3 text-white">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

// Stats section
function StatsSection() {
  const statsRef = useRef<HTMLDivElement>(null);
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const targets = [50000, 10000, 99.9, 24];
  const labels = ["Servers", "Users", "Uptime %", "/7 Support"];

  useEffect(() => {
    if (statsRef.current) {
      ScrollTrigger.create({
        trigger: statsRef.current,
        start: "top 80%",
        onEnter: () => {
          targets.forEach((target, index) => {
            gsap.to({}, {
              duration: 2,
              ease: "power2.out",
              onUpdate: function() {
                const progress = this.progress();
                setCounts(prev => {
                  const newCounts = [...prev];
                  if (index === 2) {
                    newCounts[index] = Math.round(target * progress * 10) / 10;
                  } else {
                    newCounts[index] = Math.round(target * progress);
                  }
                  return newCounts;
                });
              }
            });
          });
        },
        once: true
      });
    }
  }, []);

  return (
    <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-8 py-20">
      {counts.map((count, index) => (
        <div key={index} className="text-center">
          <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
            {index === 2 ? count.toFixed(1) : count.toLocaleString()}
            {index === 2 ? "%" : index === 3 ? "h" : "+"}
          </div>
          <div className="text-slate-400">{labels[index]}</div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const scrollProgress = useRef(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      scrollProgress.current = Math.min(scrollY / windowHeight, 1);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Hero text animations
    gsap.fromTo(
      ".hero-title",
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, delay: 0.5, ease: "power3.out" }
    );

    gsap.fromTo(
      ".hero-subtitle",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, delay: 0.8, ease: "power3.out" }
    );

    gsap.fromTo(
      ".hero-cta",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, delay: 1.1, ease: "power3.out" }
    );

    // Parallax for sections
    if (featuresRef.current) {
      gsap.to(featuresRef.current, {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
        y: -50,
      });
    }
  }, []);

  const features = [
    {
      icon: Shield,
      title: "Advanced Moderation",
      description: "Keep your server safe with auto-moderation, custom filters, and detailed logging."
    },
    {
      icon: Music,
      title: "Music Streaming",
      description: "High-quality music playback from YouTube, Spotify, and SoundCloud with playlist support."
    },
    {
      icon: Settings,
      title: "Custom Commands",
      description: "Create powerful custom commands with variables, conditions, and rich embeds."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized performance ensures commands execute instantly, even under heavy load."
    },
    {
      icon: Users,
      title: "User Management",
      description: "Advanced user tracking, XP systems, levels, and customizable role rewards."
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "Detailed server insights with beautiful charts and actionable recommendations."
    }
  ];

  const discordLoginUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || "123456789"}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || "http://localhost:3000/auth/callback")}&response_type=code&scope=identify%20guilds`;

  return (
    <main className="relative min-h-screen bg-[#0a0a0f] overflow-x-hidden">
      {/* 3D Canvas Background */}
      <div className="fixed inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 75 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <Scene scrollProgress={scrollProgress} />
        </Canvas>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Clout</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#stats" className="text-slate-300 hover:text-white transition-colors">Stats</a>
              <a href="#docs" className="text-slate-300 hover:text-white transition-colors">Docs</a>
            </div>

            <Link 
              href={discordLoginUrl}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Login with Discord
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10 min-h-screen flex items-center justify-center pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="hero-title mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              v2.0 Now Available
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
              <span className="gradient-text text-glow">Clout</span>
            </h1>
          </div>
          
          <p className="hero-subtitle text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-10">
            The most powerful Discord bot for moderation, music, and server management. 
            Built for communities that demand excellence.
          </p>
          
          <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href={discordLoginUrl}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-lg hover:opacity-90 transition-all hover:scale-105 glow"
            >
              Add to Discord
            </Link>
            <a 
              href="#features"
              className="px-8 py-4 rounded-full glass text-white font-semibold text-lg hover:bg-white/10 transition-all"
            >
              Learn More
            </a>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-slate-500" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features" 
        ref={featuresRef}
        className="relative z-10 py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Powerful <span className="gradient-text">Features</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Everything you need to manage and grow your Discord community
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="relative z-10 py-32 glass-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StatsSection />
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass rounded-3xl p-12 glow">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to <span className="gradient-text">Level Up</span>?
            </h2>
            <p className="text-xl text-slate-400 mb-10">
              Join thousands of servers already using Clout to power their communities.
            </p>
            <Link 
              href={discordLoginUrl}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-lg hover:opacity-90 transition-all hover:scale-105"
            >
              <Users className="w-5 h-5" />
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">Clout</span>
            </div>
            
            <p className="text-slate-500">© 2025 Clout Bot. All rights reserved.</p>
            
            <div className="flex items-center gap-6">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
