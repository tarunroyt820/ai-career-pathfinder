import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/common/Button";
import { MessageSquare, Send, Sparkles } from "lucide-react";
import { InputField } from "@/components/common/InputField";

export function AIAssistantShell() {
    return (
        <div className="flex flex-col h-[calc(100vh-12rem)] space-y-4">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">AI Career Assistant</h2>
                <p className="text-muted-foreground">Ask anything about your career path, skills, or job market trends.</p>
            </div>

            <Card className="flex-1 rounded-3xl border-border/50 bg-muted/20 overflow-hidden flex flex-col">
                <CardContent className="flex-1 p-6 overflow-auto space-y-4">
                    <div className="flex gap-3 max-w-[80%]">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-card p-4 rounded-2xl rounded-tl-none border border-border/50 text-sm shadow-sm">
                            Hello! I'm your AI career guide. How can I help you today? You can ask me about:
                            <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                                <li>Improving your React skills</li>
                                <li>Salary expectations for Frontend roles</li>
                                <li>Reviewing your current learning roadmap</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex gap-3 max-w-[80%] ml-auto flex-row-reverse">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                            JD
                        </div>
                        <div className="bg-primary text-primary-foreground p-4 rounded-2xl rounded-tr-none text-sm shadow-md">
                            What are the top 3 skills I should learn next to become a Senior Frontend Developer?
                        </div>
                    </div>
                </CardContent>
                <div className="p-4 bg-card border-t border-border/50 flex gap-2">
                    <InputField label="" placeholder="Ask me anything..." className="flex-1" containerClassName="mb-0" />
                    <Button className="rounded-xl px-4 py-0 h-10 self-end">
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </Card>
        </div>
    );
}
