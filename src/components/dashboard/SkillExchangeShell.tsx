import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/common/Button";
import { RefreshCw, Users, Star, MessageCircle, ArrowRightLeft, Sparkles, MapPin, BadgeCheck, ShieldCheck } from "lucide-react";

export function SkillExchangeShell() {
    const matches = [
        {
            name: "Sarah Miller",
            gives: "Python (AI/ML)",
            needs: "React & Framer Motion",
            rating: 4.9,
            reviews: 24,
            location: "San Francisco, CA",
            online: true,
            expertiseTitle: "ML Engineer at Google"
        },
        {
            name: "David Chen",
            gives: "UI/UX & Design Systems",
            needs: "Next.js Backend",
            rating: 4.8,
            reviews: 18,
            location: "London, UK",
            online: false,
            expertiseTitle: "Lead Designer at Airbnb"
        },
        {
            name: "Emma Wilson",
            gives: "AWS & Cloud Infra",
            needs: "Node.js (NestJS)",
            rating: 5.0,
            reviews: 32,
            location: "Berlin, DE",
            online: true,
            expertiseTitle: "Cloud Architect"
        },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-1000">
            {/* Marketplace Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-black uppercase tracking-widest">
                        <Users className="h-3 w-3" />
                        Community Hub
                    </div>
                    <h2 className="text-4xl font-black tracking-tight">Skill Exchange</h2>
                    <p className="text-muted-foreground text-lg font-medium max-w-2xl">
                        Trade your expertise with top professionals. Learn something new, teach what you love.
                    </p>
                </div>
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <Button variant="outline" className="flex-1 lg:flex-none h-14 px-8 rounded-[1.25rem] font-black uppercase tracking-widest border-border/40 hover:bg-muted/50 gap-3">
                        <RefreshCw className="h-5 w-5" />
                        Refresh Matches
                    </Button>
                    <Button className="flex-1 lg:flex-none h-14 px-8 rounded-[1.25rem] font-black uppercase tracking-widest shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-accent hover:opacity-90 gap-3">
                        <Sparkles className="h-5 w-5" />
                        Post a Skill
                    </Button>
                </div>
            </div>

            {/* Top Matches Info */}
            <div className="rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/10 p-1">
                <div className="bg-card/40 backdrop-blur-xl rounded-[2.4rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-[1.25rem] bg-primary/20 flex items-center justify-center">
                            <ArrowRightLeft className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-foreground">Nextaro Matching Engine</h3>
                            <p className="text-muted-foreground font-medium">We've found 42 potential skill trade partners for you today.</p>
                        </div>
                    </div>
                    <div className="flex -space-x-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-12 w-12 rounded-full border-4 border-card bg-muted flex items-center justify-center font-bold text-xs ring-2 ring-primary/20 overflow-hidden">
                                <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                            </div>
                        ))}
                        <div className="h-12 w-12 rounded-full border-4 border-card bg-primary text-white flex items-center justify-center font-black text-xs ring-2 ring-primary/20">
                            +37
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid of Partner Cards */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {matches.map((match, idx) => (
                    <Card key={idx} className="group rounded-[2.5rem] border-border/40 bg-card/60 backdrop-blur-sm shadow-xl shadow-black/5 flex flex-col transition-all duration-500 hover:translate-y-[-8px] hover:border-primary/30">
                        <CardHeader className="p-8">
                            <div className="flex items-start justify-between">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <div className="h-20 w-20 rounded-[1.5rem] bg-gradient-to-br from-primary to-accent p-1 shadow-lg shadow-primary/20">
                                            <div className="h-full w-full rounded-[1.35rem] bg-card flex items-center justify-center overflow-hidden">
                                                <img src={`https://i.pravatar.cc/150?u=${match.name}`} alt={match.name} />
                                            </div>
                                        </div>
                                        {match.online && (
                                            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-4 border-card ring-1 ring-green-500/50" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <CardTitle className="text-xl font-black tracking-tight">{match.name}</CardTitle>
                                            <ShieldCheck className="h-5 w-5 text-primary" />
                                        </div>
                                        <p className="text-sm font-bold text-primary uppercase tracking-tighter">{match.expertiseTitle}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center text-amber-500">
                                        <Star className="h-4 w-4 fill-current" />
                                        <span className="ml-1.5 font-black text-sm">{match.rating}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{match.reviews} Reviews</span>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="px-8 pb-8 space-y-8 flex-1 flex flex-col justify-between">
                            <div className="space-y-6">
                                <div className="p-5 rounded-3xl bg-muted/30 border border-border/40 relative group-hover:bg-muted/50 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expert in</span>
                                        <div className="px-2.5 py-1 bg-green-500/10 text-green-500 rounded-lg text-[10px] font-black uppercase tracking-widest">Available</div>
                                    </div>
                                    <p className="text-lg font-black text-foreground leading-tight">{match.gives}</p>
                                </div>

                                <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10 relative group-hover:bg-primary/10 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Needs Mastery in</span>
                                        <div className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest">Priority</div>
                                    </div>
                                    <p className="text-lg font-black text-foreground leading-tight">{match.needs}</p>
                                </div>

                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">{match.location}</span>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center gap-3">
                                <Button className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/10 group-hover:scale-[1.02] transition-transform">
                                    Request Trade
                                </Button>
                                <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-border/40 hover:bg-muted/50">
                                    <MessageCircle className="h-6 w-6" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* View More */}
            <div className="flex justify-center pt-8">
                <Button variant="ghost" className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-muted-foreground hover:bg-muted/50 transition-all flex items-center gap-3">
                    Explore All Professionals
                    <BadgeCheck className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}
