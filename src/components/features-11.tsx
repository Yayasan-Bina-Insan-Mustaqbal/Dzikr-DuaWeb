import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Globe, Palette, SpeakerHigh, BookOpen, Clock, Translate, DeviceMobile } from '@phosphor-icons/react'

export default function Features11() {
    return (
        <section id="features" className="dark:bg-muted/25 bg-zinc-50 py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-black tracking-tight mb-4">Crafted for Peace of Mind</h2>
                    <p className="text-muted-foreground max-w-xl mx-auto text-lg">Modern technology meets spiritual tradition. Every feature is built to help you stay connected with your Creator.</p>
                </div>
                <div className="mx-auto grid gap-4 sm:grid-cols-5">
                    <Card className="group overflow-hidden shadow-zinc-950/5 sm:col-span-3 sm:rounded-none sm:rounded-tl-3xl border-border/50">
                        <CardHeader>
                            <div className="md:p-6 text-left">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                                    <SpeakerHigh size={24} weight="bold" />
                                </div>
                                <p className="font-bold text-xl">High-Fidelity Recitations</p>
                                <p className="text-muted-foreground mt-3 max-w-sm text-sm">Switch seamlessly between multiple high-quality audio sources including Rodja and Mburoja. Experience immersive soundscapes designed for focus.</p>
                            </div>
                        </CardHeader>

                        <div className="relative h-fit pl-6 md:pl-12 pb-6">
                            <div className="bg-background overflow-hidden rounded-tl-3xl border-l border-t pl-4 pt-4 shadow-2xl">
                                <img
                                    src="/screenshots/android_mobile_2.jpg"
                                    alt="Player View"
                                    className="w-full h-auto object-cover rounded-tl-2xl"
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="group overflow-hidden shadow-zinc-950/5 sm:col-span-2 sm:rounded-none sm:rounded-tr-3xl border-border/50">
                        <CardHeader>
                            <div className="md:p-6 text-left">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                                    <Palette size={24} weight="bold" />
                                </div>
                                <p className="font-bold text-xl">Beautiful Themes</p>
                                <p className="text-muted-foreground mt-3 text-sm">Emerald, Sepia, and Dark modes designed for comfortable reading at any time of day or night.</p>
                            </div>
                        </CardHeader>

                        <CardContent className="mt-auto h-fit">
                            <div className="relative p-6 flex justify-center">
                                <div className="grid grid-cols-3 gap-3 w-full max-w-[200px]">
                                    <div className="aspect-square rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-500/20" />
                                    <div className="aspect-square rounded-2xl bg-[#704214] shadow-lg shadow-amber-900/20" />
                                    <div className="aspect-square rounded-2xl bg-zinc-900 shadow-lg border border-white/10" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group p-6 shadow-zinc-950/5 sm:col-span-2 sm:rounded-none sm:rounded-bl-3xl border-border/50 md:p-12">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 mx-auto">
                            <BookOpen size={24} weight="bold" />
                        </div>
                        <p className="mx-auto mb-12 max-w-md text-balance text-center text-xl font-bold">Intelligent Arabic text parsing focuses on the matan while de-emphasizing markers.</p>

                        <div className="flex justify-center gap-6">
                            <div className="bg-background relative flex aspect-square size-16 items-center justify-center rounded-2xl border shadow-lg">
                                <span className="font-arabic text-2xl">أ</span>
                            </div>
                            <div className="bg-background flex aspect-square size-16 items-center justify-center rounded-2xl border shadow-lg">
                                <span className="font-arabic text-2xl">ب</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="group relative shadow-zinc-950/5 sm:col-span-3 sm:rounded-none sm:rounded-br-3xl border-border/50">
                        <CardHeader className="p-6 md:p-12 text-left">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                                <Clock size={24} weight="bold" />
                            </div>
                            <p className="font-bold text-xl">Smart Playlists</p>
                            <p className="text-muted-foreground mt-2 max-w-sm text-sm">Automatic queue population based on your current time (Morning/Evening Adhkar), or curated sets for travel.</p>
                        </CardHeader>
                        <CardContent className="relative h-fit px-6 pb-12 md:px-12">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="rounded-2xl bg-primary/5 border border-primary/20 aspect-square flex items-center justify-center">
                                    <Clock className="text-primary opacity-40" size={24} />
                                </div>
                                <div className="rounded-2xl bg-primary flex aspect-square items-center justify-center shadow-lg shadow-primary/20">
                                    <Translate className="text-white" size={24} />
                                </div>
                                <div className="rounded-2xl bg-primary/5 border border-primary/20 aspect-square flex items-center justify-center">
                                    <DeviceMobile className="text-primary opacity-40" size={24} />
                                </div>
                                <div className="rounded-2xl bg-primary flex aspect-square items-center justify-center shadow-lg shadow-primary/20">
                                    <Globe className="text-white" size={24} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}
