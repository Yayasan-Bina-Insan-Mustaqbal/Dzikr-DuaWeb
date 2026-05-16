import { createFileRoute, useNavigate } from "@tanstack/react-router"
import HeroSection1 from "@/components/hero-section-1"
import MobileHeroSection from "@/components/hero-section-3"
import Features11 from "@/components/features-11"
import GithubCTA from "@/components/github-cta"
import FooterSection from "@/components/footer"

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

      {/* Main Hero Section */}
      <HeroSection1 />

      {/* Mobile App Promotion Section */}
      <MobileHeroSection />

      {/* Features Grid */}
      <Features11 />

      {/* GitHub Contribute Section */}
      <GithubCTA />

      {/* Footer */}
      <FooterSection />
    </div>
  )
}
