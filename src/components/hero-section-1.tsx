import React from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { TextEffect } from '@/components/motion-primitives/text-effect'
import { AnimatedGroup } from '@/components/motion-primitives/animated-group'

export default function HeroSection1() {
    return (
        <main className="overflow-hidden">
            <section className="relative mx-auto max-w-6xl px-6 pb-24 pt-32 lg:pt-48 text-center">
                <div className="relative z-10 mx-auto max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-8">
                        Bismillah-ir-Rahman-ir-Rahim
                    </div>
                    <TextEffect
                        preset="fade-in-blur"
                        speedSegment={0.3}
                        as="h1"
                        className="text-balance text-5xl font-black md:text-7xl tracking-tight leading-[1.1]">
                        Your Companion for Digital Remembrance
                    </TextEffect>
                    <TextEffect
                        per="line"
                        preset="fade-in-blur"
                        speedSegment={0.3}
                        delay={0.5}
                        as="p"
                        className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground leading-relaxed">
                        A high-fidelity audio player designed for focus, clarity, and peace. Experience the morning and evening Adhkar with immersive recitations and beautiful typography.
                    </TextEffect>

                    <AnimatedGroup
                        preset="fade"
                        className="mt-12 flex items-center justify-center gap-4">
                        <Button
                            asChild
                            size="lg"
                            className="rounded-2xl h-14 px-8 font-bold text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                            <Link to="/play" search={{ queue: undefined }}>Start Remembrance</Link>
                        </Button>
                        <Button
                            asChild
                            variant="secondary"
                            size="lg"
                            className="rounded-2xl h-14 px-8 font-bold text-lg hover:bg-muted/80 transition-all">
                            <a href="#features">Explore Features</a>
                        </Button>
                    </AnimatedGroup>
                </div>

                <div className="bg-radial from-primary/10 relative mx-auto mt-24 max-w-5xl to-transparent to-70% pb-12">
                    <div className="relative rounded-2xl border bg-background/50 p-2 shadow-2xl backdrop-blur-sm lg:rounded-[2.5rem]">
                        <div className="relative h-[24rem] overflow-hidden rounded-xl border bg-muted lg:h-[36rem] lg:rounded-[2rem]">
                            {/* Main App Screenshot */}
                            <img 
                                src="/screenshots/web_desktop.png" 
                                alt="Dzikr & Dua App Interface" 
                                className="w-full h-full object-cover object-top opacity-90"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent"></div>
                        </div>
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
                    <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 animate-pulse [animation-delay:2s]"></div>
                    
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-background to-transparent"></div>
                </div>
            </section>
        </main>
    )
}
