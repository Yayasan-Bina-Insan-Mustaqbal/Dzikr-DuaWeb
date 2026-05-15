import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { motion } from "framer-motion"

export const Route = createFileRoute("/")({ component: LandingPage })

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-20 border-b border-border/50 bg-background/80 backdrop-blur-md z-50 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <span className="font-heading font-bold text-xl tracking-tight">
            Dzikr <span className="text-primary">& Dua</span>
          </span>
        </div>
        <button 
          onClick={() => navigate({ to: "/play" })}
          className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold hover:scale-105 transition-all shadow-lg shadow-primary/20 cursor-pointer text-sm"
        >
          Open App
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-30 blur-[120px]">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full animate-pulse [animation-delay:2s]" />
        </div>

        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-8"
          >
            <span className="material-symbols-outlined text-sm">verified</span>
            Bismillah-ir-Rahman-ir-Rahim
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-heading font-black tracking-tight mb-8 leading-[1.1]"
          >
            Your Companion for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">Digital Remembrance</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed"
          >
            A high-fidelity audio player designed for focus, clarity, and peace. 
            Experience the morning and evening Adhkar with immersive recitations and 
            beautiful typography.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <button 
              onClick={() => navigate({ to: "/play" })}
              className="px-10 py-5 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-primary/30 cursor-pointer"
            >
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
              Start Remembrance
            </button>
            <a 
              href="#features"
              className="px-10 py-5 rounded-2xl bg-muted text-foreground font-bold text-lg hover:bg-muted/80 transition-all cursor-pointer"
            >
              Explore Features
            </a>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Crafted for Peace of Mind</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Modern technology meets spiritual tradition. Every feature is built to help you stay connected with your Creator.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "graphic_eq",
                title: "Multiple Reciters",
                desc: "Switch seamlessly between high-quality audio sources including Rodja and Mburoja API."
              },
              {
                icon: "palette",
                title: "Beautiful Themes",
                desc: "Emerald, Sepia, and Dark modes designed for comfortable reading at any time of day."
              },
              {
                icon: "format_quote",
                title: "Matan Highlighting",
                desc: "Intelligent Arabic text parsing that focuses on the core matan while de-emphasizing markers."
              },
              {
                icon: "history",
                title: "Smart Playlists",
                desc: "Automatic queue population based on your current time, or curated sets for travel and morning."
              },
              {
                icon: "translate",
                title: "Multi-Language",
                desc: "Full translations and transliterations to help you understand every word you recite."
              },
              {
                icon: "offline_bolt",
                title: "PWA Optimized",
                desc: "Install it on your device and access your Adhkar anytime, anywhere with a native feel."
              }
            ].map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 rounded-[32px] bg-card border border-border/50 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <span className="material-symbols-outlined">{f.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-border/50 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <span className="font-heading font-bold text-lg tracking-tight">
            Dzikr <span className="text-primary">& Dua</span>
          </span>
        </div>
        <p className="text-muted-foreground text-sm mb-8">
          Built with love for the Ummah. May Allah accept our remembrance.
        </p>
        <div className="flex items-center justify-center gap-6">
          <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">GitHub</a>
          <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Privacy</a>
          <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Contact</a>
        </div>
      </footer>
    </div>
  )
}
