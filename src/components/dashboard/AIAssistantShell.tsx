import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/common/Button";
import { Send, Sparkles, User as UserIcon, Brain, Zap, Trash2, History, Wand2 } from "lucide-react";
import { InputField } from "@/components/common/InputField";
import { useState, useRef, useEffect } from "react";
import { askAI, getHistory, ChatMessage } from "@/services/aiApi";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export function AIAssistantShell() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistory();
                if (history.length > 0) {
                    setMessages(history);
                } else {
                    setMessages([
                        {
                            role: "assistant",
                            content: "# Welcome to Nextaro AI Assistant! 👋\n\nI'm your **Career Co-pilot**. How can I help you today?\n\n- **Roadmaps**: Ask for a personalized 6-month plan.\n- **Skills**: Get tips on mastering a specific technology.\n- **Salary**: Inquire about market trends and roles.\n\n*Type your first question below to get started!*"
                        }
                    ]);
                }
            } catch (error) {
                console.error("History fetch error:", error);
                toast.error("Failed to load chat history");
            } finally {
                setIsFetching(false);
            }
        };
        fetchHistory();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await askAI(userMessage);
            setMessages(prev => [...prev, { role: "assistant", content: response.answer }]);
        } catch (error: any) {
            console.error("AI Assistant Error:", error);
            toast.error(error.response?.data?.message || "Failed to get response from AI. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const suggestedPrompts = [
        "What's my next career milestone?",
        "Explain React Server Components",
        "How do I become a Cloud Architect?",
        "Check my skill gap for Senior roles"
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-14rem)] space-y-6 animate-in fade-in duration-700">
            {/* AI Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 shadow-lg shadow-primary/5">
                        <Brain className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight flex items-center gap-2">
                            Nextaro <span className="text-gradient">Intelligence</span>
                        </h2>
                        <p className="text-muted-foreground font-semibold flex items-center gap-2">
                            <Zap className="h-3 w-3 text-accent" />
                            LLM-powered career consultancy
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border/40">
                        <History className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border/40 hover:text-destructive">
                        <Trash2 className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Chat Container */}
            <Card className="flex-1 rounded-[2.5rem] border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden flex flex-col shadow-2xl shadow-black/5">
                <CardContent ref={scrollRef} className="flex-1 p-6 lg:p-10 overflow-auto space-y-8 scroll-smooth">
                    {isFetching ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <div className="h-12 w-12 animate-spin rounded-2xl border-4 border-primary border-t-transparent" />
                            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Hydrating your history...</p>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-5 group items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                    <div className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${msg.role === "assistant"
                                            ? "bg-gradient-to-br from-primary to-accent text-white"
                                            : "bg-muted border border-border/40 text-foreground"
                                        }`}>
                                        {msg.role === "assistant" ? <Wand2 className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
                                    </div>
                                    <div className={`max-w-[85%] p-6 rounded-[2rem] text-[15px] leading-relaxed shadow-sm border ${msg.role === "assistant"
                                            ? "bg-card/80 rounded-tl-none border-border/30 text-foreground prose-custom"
                                            : "bg-primary text-primary-foreground rounded-tr-none border-none shadow-xl shadow-primary/10"
                                        }`}>
                                        {msg.role === "assistant" ? (
                                            <div className="prose prose-sm dark:prose-invert max-w-none 
                                                prose-headings:font-black prose-headings:tracking-tight 
                                                prose-p:font-medium prose-p:text-muted-foreground dark:prose-p:text-slate-300
                                                prose-strong:text-foreground prose-strong:font-black
                                                prose-ul:list-disc prose-li:my-1 prose-code:bg-muted prose-code:px-1 prose-code:rounded">
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <p className="font-semibold">{msg.content}</p>
                                        )}
                                        {msg.timestamp && (
                                            <div className={`mt-3 text-[10px] font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-white/60' : 'text-muted-foreground/50'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-5 items-start">
                                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
                                        <Sparkles className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="bg-card/80 p-6 rounded-[2rem] rounded-tl-none border border-border/30 shadow-sm flex items-center gap-2">
                                        <div className="flex gap-1.5">
                                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <span className="w-2 h-2 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Nextaro is thinking</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>

                {/* Input Area */}
                <div className="p-6 border-t border-border/40 bg-card/60 space-y-6">
                    {messages.length < 5 && !isLoading && (
                        <div className="flex flex-wrap gap-2 px-2">
                            {suggestedPrompts.map((p, i) => (
                                <button
                                    key={i}
                                    onClick={() => setInput(p)}
                                    className="px-4 py-2 rounded-xl bg-muted/50 border border-border/40 text-xs font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}

                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex gap-3 relative"
                    >
                        <div className="relative flex-1">
                            <input
                                placeholder="Message Nextaro AI..."
                                className="w-full h-16 pl-6 pr-16 rounded-[1.25rem] bg-background border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground font-medium transition-all shadow-inner"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading || isFetching}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <Button
                                    type="submit"
                                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 p-0"
                                    disabled={isLoading || isFetching || !input.trim()}
                                >
                                    <Send className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </form>
                    <p className="text-[10px] text-center font-bold text-muted-foreground uppercase tracking-widest">
                        AI can make mistakes. Verify important career information.
                    </p>
                </div>
            </Card>
        </div>
    );
}
