import { Link } from '@tanstack/react-router'

const links = [
    {
        title: 'Morning Adhkar',
        href: '/play?q=morning',
    },
    {
        title: 'Evening Adhkar',
        href: '/play?q=evening',
    },
    {
        title: 'Travel Dua',
        href: '/play?q=travel',
    },
    {
        title: 'Feedback',
        href: 'https://fbdzikrdua.insanmustaqbal.or.id/s/cmp7ylxkx000sq6018s8qw07d',
    },
    {
        title: 'Privacy Policy',
        href: '#',
    },
]

export default function FooterSection() {
    return (
        <footer className="py-20 px-6 border-t border-border/50 text-center bg-card">
            <div className="mx-auto max-w-5xl px-6">
                <Link
                    to="/"
                    aria-label="go home"
                    className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    </div>
                    <span className="font-heading font-bold text-xl tracking-tight">
                        Dzikr <span className="text-primary">& Dua</span>
                    </span>
                </Link>

                <div className="my-8 flex flex-wrap justify-center gap-8 text-sm font-medium">
                    {links.map((link, index) => (
                        <Link
                            key={index}
                            to={link.href}
                            className="text-muted-foreground hover:text-primary transition-colors">
                            {link.title}
                        </Link>
                    ))}
                </div>

                <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
                    <a
                        href="https://github.com/abuhafi/DzikrDua"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub"
                        className="text-muted-foreground hover:text-primary transition-colors">
                        <svg className="size-6" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z"></path>
                        </svg>
                    </a>
                </div>
                <div className="my-12 flex flex-col items-center gap-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Developed for</p>
                    <div className="flex flex-col items-center gap-4">
                        <img 
                            src="/hsiITvibathon.png" 
                            alt="HSI-IT Vibathon" 
                            className="h-16 w-auto grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all"
                        />
                        <p className="text-sm font-medium text-muted-foreground max-w-xs">
                            Proudly developed as part of the <span className="text-foreground">HSI-IT Vibathon</span> event by HSI Abdullah Roy.
                        </p>
                    </div>
                </div>

                <div className="my-12 pt-8 border-t border-border/30">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-6">Data Sources & Credits</p>
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs text-muted-foreground">
                        <a href="https://github.com/BetimShala/mburoja-api" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Mburoja API</a>
                        <a href="https://www.kaggle.com/code/ahsanneural/islamic-dua-adhkar/input" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Islamic Dua Dataset</a>
                        <a href="https://github.com/wafaaelmaandy/Hisn-Muslim-Json" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Hisn Muslim JSON</a>
                        <a href="https://hisnmuslim.com/i/en/1" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">HisnMuslim.com</a>
                    </div>
                </div>

                <p className="text-muted-foreground text-sm">
                    Built with love for the Ummah. May Allah accept our remembrance.
                </p>
                <span className="text-muted-foreground block text-center text-xs mt-4"> © 2026 Dzikr & Dua. All rights reserved.</span>
            </div>
        </footer>
    )
}
