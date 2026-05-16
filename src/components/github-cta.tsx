import { GithubLogo, Code, DeviceMobile, ChatTeardropText } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

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
            href="https://fbdzikrdua.insanmustaqbal.or.id"
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
