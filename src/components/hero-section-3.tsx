import React from 'react'
import { RocketLaunch } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { TextEffect } from '@/components/motion-primitives/text-effect'
import { AnimatedGroup } from '@/components/motion-primitives/animated-group'

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring',
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}

export default function MobileHeroSection() {
    return (
        <main className="overflow-hidden bg-primary/5 py-24">
            <section>
                <div className="relative mx-auto max-w-6xl px-6">
                    <div className="relative z-10 mx-auto max-w-4xl text-center">
                        <TextEffect
                            preset="fade-in-blur"
                            speedSegment={0.3}
                            as="h2"
                            className="text-balance text-5xl font-black md:text-6xl tracking-tight">
                            Take Your Remembrance Everywhere
                        </TextEffect>
                        <TextEffect
                            per="line"
                            preset="fade-in-blur"
                            speedSegment={0.3}
                            delay={0.5}
                            as="p"
                            className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground leading-relaxed">
                            Experience Dzikr & Dua as a native Android app. Designed for seamless recitation with system integration, offline support, and high-fidelity audio transitions.
                        </TextEffect>

                        <AnimatedGroup
                            variants={{
                                container: {
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.05,
                                            delayChildren: 0.75,
                                        },
                                    },
                                },
                                ...transitionVariants,
                            }}
                            className="mt-12">
                            <div className="flex flex-wrap justify-center gap-4 mb-20">
                                <a 
                                    href="https://appdistribution.firebase.google.com/testerapps/1:734814370063:android:1d0ea63297521c106fe67a/releases/4ijdf5i0etr20" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    <Button size="lg" className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 gap-3 cursor-pointer">
                                        <RocketLaunch size={24} weight="bold" />
                                        <div className="flex flex-col items-start leading-none text-left">
                                            <span className="text-[10px] uppercase font-bold opacity-60">Join Early Access</span>
                                            <span className="text-lg font-bold">Become a Tester</span>
                                        </div>
                                    </Button>
                                </a>
                                <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl opacity-50 cursor-not-allowed gap-3">
                                    <div className="flex flex-col items-start leading-none text-left">
                                        <span className="text-[10px] uppercase font-bold opacity-60">Coming soon on</span>
                                        <span className="text-lg font-bold">App Store</span>
                                    </div>
                                </Button>
                            </div>

                            <div
                                aria-hidden
                                className="bg-radial from-primary/30 relative mx-auto mt-12 max-w-5xl to-transparent to-55% text-left flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24">
                                
                                {/* Android Auto Mockup */}
                                <div className="relative flex-1 group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-emerald-500/50 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                                    <div className="relative rounded-[2.5rem] overflow-hidden border-8 border-zinc-900 shadow-2xl bg-zinc-900 aspect-video">
                                        <img 
                                            src="/screenshots/android_auto.png" 
                                            alt="Dzikr & Dua Android Auto Support" 
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-6 left-8">
                                            <div className="px-4 py-2 rounded-full bg-primary/90 text-white text-xs font-bold flex items-center gap-2 backdrop-blur-sm">
                                                <span>Android Auto Support</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile App Mockup */}
                                <div className="relative flex-shrink-0 w-[280px] h-[580px] bg-zinc-900 rounded-[3rem] border-8 border-zinc-900 shadow-2xl overflow-hidden group">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-900 rounded-b-2xl z-10" />
                                    <img 
                                        src="/screenshots/android_mobile_1.jpg" 
                                        alt="Dzikr & Dua Android App" 
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-900/80 to-transparent"></div>
                                </div>

                                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] mix-blend-overlay [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:opacity-5 -z-10"></div>
                            </div>
                        </AnimatedGroup>
                    </div>
                </div>
            </section>
        </main>
    )
}
