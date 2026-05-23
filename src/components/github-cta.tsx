import { GithubLogo, Code, DeviceMobile, ChatTeardropText } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { Link } from '@tanstack/react-router'

export default function GithubCTA() {
  return (
    <section id="contribute" className="py-24 px-6 bg-primary/5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6"
          >
            <Code size={18} weight="bold" />
            <span>Community</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black tracking-tight mb-6"
          >
            Build with Us
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Dzikr & Dua is a community-driven project. Help us build the best spiritual companion for Muslims worldwide. Join our mission on GitHub or share your thoughts.
          </motion.p>
        </div>

        {/* Contribution Hub Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 p-8 md:p-12 rounded-[32px] bg-card border border-primary/20 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row gap-8 items-center"
        >
          {/* Subtle green glow decoration */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" />
          
          <div className="flex-1 flex flex-col gap-6 text-left">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold w-fit">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span>Online Contribution Hub</span>
            </div>
            
            <h3 className="text-3xl md:text-4xl font-black tracking-tight leading-tight text-foreground">
              Secure Your Attributions in the <span className="text-primary">Isnād Chain</span>
            </h3>
            
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
              Become a verified contributor (Rāwī) by reviewing translation scripts and recording authentic voice recitations directly inside our in-app workspace. 
            </p>
            
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 max-w-xl">
              <span className="material-symbols-outlined text-amber-500 text-xl flex-shrink-0">shield_person</span>
              <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed font-medium">
                <strong>GitHub Account Required:</strong> To maintain secure custody of spiritual narration history, all stage actions require GitHub authentication to sign commits directly to your personal account.
              </p>
            </div>
            
            <Link 
              to="/contribute"
              className="px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 w-fit cursor-pointer flex items-center gap-2.5"
            >
              <span className="material-symbols-outlined text-lg">edit_note</span>
              <span>Open Contribution Hub</span>
            </Link>
          </div>
          
          <div className="w-full lg:w-[380px] bg-muted/40 border border-border/40 rounded-3xl p-6 md:p-8 flex flex-col gap-6 text-left relative overflow-hidden">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80 border-b border-border/50 pb-3 flex items-center justify-between">
              <span>How It Works</span>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-mono">Workflow</span>
            </h4>
            
            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">1</div>
                <div className="flex flex-col gap-0.5">
                  <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs text-primary">login</span>
                    <span>Authenticate Identity</span>
                  </h5>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">Securely sign in with GitHub to verify narration custody.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">2</div>
                <div className="flex flex-col gap-0.5">
                  <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs text-primary">mic</span>
                    <span>Correct & Record</span>
                  </h5>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">Stage corrected text translations or record recitation audios.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">3</div>
                <div className="flex flex-col gap-0.5">
                  <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs text-primary">publish</span>
                    <span>Push Pull Request</span>
                  </h5>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">Submit staged updates which automatically compile into a PR under your credit!</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mx-auto">
          <motion.a
            href="https://github.com/decaller/Dzikr-DuaWeb"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="flex flex-col p-8 rounded-3xl bg-background border border-border/50 shadow-xl shadow-primary/5 hover:shadow-primary/10 transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
              <GithubLogo size={32} weight="bold" />
            </div>
            <h3 className="text-2xl font-bold mb-3 font-heading">Web App</h3>
            <p className="text-muted-foreground mb-6 flex-grow text-sm leading-relaxed"> Contribute to our React web experience built with TanStack Start and Tailwind CSS.</p>
            <div className="flex items-center gap-2 text-primary font-bold">
              <span>View Repository</span>
              <GithubLogo size={20} weight="bold" />
            </div>
          </motion.a>

          <motion.a
            href="https://github.com/decaller/DzikrAndDuaMobile"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -5 }}
            className="flex flex-col p-8 rounded-3xl bg-background border border-border/50 shadow-xl shadow-primary/5 hover:shadow-primary/10 transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
              <DeviceMobile size={32} weight="bold" />
            </div>
            <h3 className="text-2xl font-bold mb-3 font-heading">Mobile App</h3>
            <p className="text-muted-foreground mb-6 flex-grow text-sm leading-relaxed">Join the development of our cross-platform mobile application built with Flutter.</p>
            <div className="flex items-center gap-2 text-primary font-bold">
              <span>View Repository</span>
              <GithubLogo size={20} weight="bold" />
            </div>
          </motion.a>

          <motion.a
            href="https://fbdzikrdua.insanmustaqbal.or.id/s/cmp7ylxkx000sq6018s8qw07d"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -5 }}
            className="flex flex-col p-8 rounded-3xl bg-background border border-border/50 shadow-xl shadow-primary/5 hover:shadow-primary/10 transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
              <ChatTeardropText size={32} weight="bold" />
            </div>
            <h3 className="text-2xl font-bold mb-3 font-heading">Feedback</h3>
            <p className="text-muted-foreground mb-6 flex-grow text-sm leading-relaxed">Have a feature request or found a bug? Share your feedback via our Formbricks hub.</p>
            <div className="flex items-center gap-2 text-primary font-bold">
              <span>Give Feedback</span>
              <ChatTeardropText size={20} weight="bold" />
            </div>
          </motion.a>
        </div>
      </div>
    </section>
  )
}
