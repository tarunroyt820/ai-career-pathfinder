import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/common/Button";
import { RefreshCw, Users, Star, MessageCircle } from "lucide-react";

export function SkillExchangeShell() {
    const matches = [
        { name: "Sarah Miller", gives: "Python", needs: "React", rating: 4.9 },
        { name: "David Chen", gives: "UI Design", needs: "Python", rating: 4.8 },
        { name: "Emma Wilson", gives: "AWS", needs: "Node.js", rating: 5.0 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Skill Exchange</h2>
                    <p className="text-muted-foreground">Connect with others to trade skills and grow together.</p>
                </div>
                <Button className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Find New Matches
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {matches.map((match) => (
                    <Card key={match.name} className="rounded-3xl border-border/50">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary">
                                    {match.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <CardTitle className="text-base">{match.name}</CardTitle>
                                    <div className="flex items-center text-xs text-amber-500">
                                        <Star className="h-3 w-3 fill-current" />
                                        <span className="ml-1">{match.rating}</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Will Teach</span>
                                    <div className="text-sm font-medium px-2 py-1 bg-green-100 text-green-700 rounded-lg text-center">
                                        {match.gives}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Wants to Learn</span>
                                    <div className="text-sm font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-center">
                                        {match.needs}
                                    </div>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full gap-2 rounded-xl">
                                <MessageCircle className="h-4 w-4" />
                                Request Exchange
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
