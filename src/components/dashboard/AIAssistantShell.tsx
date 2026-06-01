import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import ReactMarkdown from "react-markdown";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bot,
  Check,
  Cloud,
  Command,
  Copy,
  Figma,
  ImageIcon,
  LoaderIcon,
  Paperclip,
  PlusSquare,
  RefreshCw,
  SendIcon,
  Sparkles,
  Target,
  Trash2,
  User2,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { askAI, ChatMessage, deleteHistory, getHistory, streamAI } from "@/services/aiApi";

type Attachment = {
  name: string;
  url: string;
};

type StructuredCareerReply = {
  targetRole?: string;
  summary?: string;
  skillGaps?: Array<{ skill?: string; level?: string; recommendation?: string }>;
  milestones?: Array<{
    title?: string;
    type?: string;
    estimateHours?: number;
    priority?: string;
    reason?: string;
    exampleEvidence?: string;
  }>;
  recommendedResources?: Array<{ type?: string; title?: string; url?: string }>;
  confidence?: number;
};

function parseStructuredCareerReply(content: string): StructuredCareerReply | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as StructuredCareerReply;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const hasCareerShape =
      "summary" in parsed ||
      "milestones" in parsed ||
      "recommendedResources" in parsed ||
      "skillGaps" in parsed;

    return hasCareerShape ? parsed : null;
  } catch {
    return null;
  }
}

function formatStructuredCareerReply(content: string): string {
  const parsed = parseStructuredCareerReply(content);
  if (!parsed) {
    return content;
  }

  const lines: string[] = [];

  if (parsed.targetRole) {
    lines.push(`# ${parsed.targetRole}`);
    lines.push("");
  }

  if (parsed.summary) {
    lines.push(parsed.summary);
    lines.push("");
  }

  if (Array.isArray(parsed.skillGaps) && parsed.skillGaps.length > 0) {
    lines.push("## Skill Gaps");
    lines.push(
      ...parsed.skillGaps.map((gap) => {
        const label = gap.skill || "Skill gap";
        const details = [gap.level, gap.recommendation].filter(Boolean).join(" - ");
        return details ? `- **${label}**: ${details}` : `- **${label}**`;
      }),
    );
    lines.push("");
  }

  if (Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
    lines.push("## Milestones");
    lines.push(
      ...parsed.milestones.map((milestone, index) => {
        const meta = [milestone.type, milestone.priority, milestone.estimateHours ? `${milestone.estimateHours}h` : ""]
          .filter(Boolean)
          .join(" | ");
        const parts = [`${index + 1}. **${milestone.title || "Untitled milestone"}**`];
        if (meta) {
          parts.push(`  ${meta}`);
        }
        if (milestone.reason) {
          parts.push(`  ${milestone.reason}`);
        }
        if (milestone.exampleEvidence) {
          parts.push(`  Evidence: ${milestone.exampleEvidence}`);
        }
        return parts.join("\n");
      }),
    );
    lines.push("");
  }

  if (Array.isArray(parsed.recommendedResources) && parsed.recommendedResources.length > 0) {
    lines.push("## Recommended Resources");
    lines.push(
      ...parsed.recommendedResources.map((resource) => {
        const title = resource.title || "Resource";
        const label = resource.type ? `${title} (${resource.type})` : title;
        return resource.url ? `- [${label}](${resource.url})` : `- ${label}`;
      }),
    );
    lines.push("");
  }

  if (typeof parsed.confidence === "number") {
    const confidencePercent = parsed.confidence <= 1 ? Math.round(parsed.confidence * 100) : Math.round(parsed.confidence);
    lines.push(`Confidence: ${confidencePercent}%`);
  }

  return lines.join("\n").trim() || content;
}

function useAutoResizeTextarea(minHeight: number, maxHeight = 200) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.style.height = `${minHeight}px`;
      if (reset) return;
      textarea.style.height = `${Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight))}px`;
    },
    [maxHeight, minHeight],
  );

  useEffect(() => {
    adjustHeight(true);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

const starterPrompts = [
  {
    icon: Target,
    label: "What's my next career milestone?",
    accent: "from-sky-500/14 to-cyan-400/8 border-sky-400/20 text-sky-200",
  },
  {
    icon: BarChart3,
    label: "Explain React Server Components",
    accent: "from-amber-500/14 to-orange-400/8 border-amber-400/20 text-amber-200",
  },
  {
    icon: Cloud,
    label: "How do I become a Cloud Architect?",
    accent: "from-violet-500/14 to-fuchsia-400/8 border-violet-400/20 text-violet-200",
  },
  {
    icon: Sparkles,
    label: "Check my skill gap for Senior roles",
    accent: "from-emerald-500/14 to-green-400/8 border-emerald-400/20 text-emerald-200",
  },
];

const commandSuggestions = [
  { icon: <ImageIcon className="h-4 w-4" />, label: "Clone UI", description: "Generate a UI from a screenshot", prefix: "/clone" },
  { icon: <Figma className="h-4 w-4" />, label: "Import Figma", description: "Import a design from Figma", prefix: "/figma" },
  { icon: <BarChart3 className="h-4 w-4" />, label: "Create Page", description: "Generate a new web page", prefix: "/page" },
  { icon: <Sparkles className="h-4 w-4" />, label: "Improve", description: "Improve existing UI design", prefix: "/improve" },
];

function TypingDots() {
  return (
    <div className="ml-1 flex items-center">
      {[1, 2, 3].map((dot) => (
        <motion.div
          key={dot}
          className="mx-0.5 h-1.5 w-1.5 rounded-full bg-white/90"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.85, 1.1, 0.85] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: dot * 0.15, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

export function AIAssistantShell() {
  const STREAMING_ENABLED = false;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [recentCommand, setRecentCommand] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState("llama-3.1-8b-instant");
  const scrollRef = useRef<HTMLDivElement>(null);
  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea(60, 200);

  const loadHistory = async (withToast = false) => {
    try {
      setIsFetching(true);
      const history = await getHistory();
      setMessages(history);
      if (withToast) toast.success(history.length ? "Chat history restored." : "No saved chat history yet.");
    } catch (error) {
      console.error("History fetch error:", error);
      toast.error("Failed to load chat history");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    if (input.startsWith("/") && !input.includes(" ")) {
      setShowCommandPalette(true);
      setActiveSuggestion(commandSuggestions.findIndex((item) => item.prefix.startsWith(input)));
    } else {
      setShowCommandPalette(false);
      setActiveSuggestion(-1);
    }
  }, [input]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const trigger = document.querySelector("[data-command-button]");
      if (commandPaletteRef.current && !commandPaletteRef.current.contains(target) && !trigger?.contains(target)) {
        setShowCommandPalette(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const focusTextarea = () => window.requestAnimationFrame(() => textareaRef.current?.focus());

  const openAttachmentPicker = () => fileInputRef.current?.click();

  const handleAttachmentSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast.error("Please choose an image file.");
      event.target.value = "";
      return;
    }

    try {
      const nextAttachments = await Promise.all(
        imageFiles.map(async (file) => ({
          name: file.name,
          url: await readFileAsDataUrl(file),
        })),
      );
      setAttachments((prev) => [...prev, ...nextAttachments]);
      toast.success(`${nextAttachments.length} image${nextAttachments.length > 1 ? "s" : ""} attached`);
    } catch (error) {
      console.error("Attachment read error:", error);
      toast.error("Failed to attach image");
    } finally {
      event.target.value = "";
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || isFetching) return;
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage, timestamp: new Date().toISOString() }]);
    setInput("");
    const imageUrls = attachments.map((item) => item.url);
    setAttachments([]);
    adjustHeight(true);
    setIsLoading(true);
    try {
      const provider = imageUrls.length > 0 ? "huggingface" : "groq";
      if (STREAMING_ENABLED) {
        const assistantTimestamp = new Date().toISOString();
        setMessages((prev) => [...prev, { role: "assistant", content: "", timestamp: assistantTimestamp }]);
        try {
          await streamAI(userMessage, (text) => {
            setMessages((prev) => {
              const next = [...prev];
              const lastIndex = next.length - 1;
              if (lastIndex >= 0 && next[lastIndex].role === "assistant") {
                next[lastIndex] = {
                  ...next[lastIndex],
                  content: `${next[lastIndex].content}${text}`,
                };
              }
              return next;
            });
          }, { provider, imageUrls });
        } catch {
          const response = await askAI(userMessage, { provider, imageUrls });
          if (response.modelUsed) {
            setActiveModel(response.modelUsed);
          }
          setMessages((prev) => {
            const next = [...prev];
            const lastIndex = next.length - 1;
            if (lastIndex >= 0 && next[lastIndex].role === "assistant" && !next[lastIndex].content) {
              next[lastIndex] = {
                ...next[lastIndex],
                content: response.answer,
              };
              return next;
            }
            return [...prev, { role: "assistant", content: response.answer, timestamp: new Date().toISOString() }];
          });
          toast.message("Streaming interrupted. Delivered full response instead.");
        }
      } else {
        const response = await askAI(userMessage, { provider, imageUrls });
        if (response.modelUsed) {
          setActiveModel(response.modelUsed);
        }
        setMessages((prev) => [...prev, { role: "assistant", content: response.answer, timestamp: new Date().toISOString() }]);
      }
    } catch (error: any) {
      console.error("AI Assistant Error:", error);
      setMessages((prev) => {
        if (prev[prev.length - 1]?.role === "assistant" && !prev[prev.length - 1]?.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
      toast.error(error.response?.data?.message || error.message || "Failed to get response from AI. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      toast.success("Response copied");
      window.setTimeout(() => setCopiedIndex(null), 1800);
    } catch {
      toast.error("Unable to copy the response");
    }
  };

  const handleDeleteSavedHistory = async () => {
    const confirmed = window.confirm(
      "Delete all saved AI Assistant chats? This cannot be undone.",
    );
    if (!confirmed) return;

    try {
      setIsLoading(true);
      const result = await deleteHistory();
      setMessages([]);
      setInput("");
      setAttachments([]);
      adjustHeight(true);
      toast.success(
        result.deletedCount > 0
          ? `Deleted ${result.deletedCount} saved chat message${result.deletedCount === 1 ? "" : "s"}.`
          : "No saved AI chat history was found.",
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to delete AI chat history",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const selectCommandSuggestion = (index: number) => {
    const selected = commandSuggestions[index];
    setInput(`${selected.prefix} `);
    setShowCommandPalette(false);
    setRecentCommand(selected.label);
    window.setTimeout(() => setRecentCommand(null), 2200);
    focusTextarea();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveSuggestion((current) => (current < commandSuggestions.length - 1 ? current + 1 : 0));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveSuggestion((current) => (current > 0 ? current - 1 : commandSuggestions.length - 1));
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        if (activeSuggestion >= 0) selectCommandSuggestion(activeSuggestion);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setShowCommandPalette(false);
        return;
      }
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-violet-500/10 blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-[128px]" />
      </div>

      <div className="relative z-10 flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-indigo-500 to-violet-500 shadow-[0_8px_24px_rgba(99,102,241,0.32)]">
            <Bot className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="flex items-center gap-2 text-[18px] font-extrabold tracking-[-0.03em]">
              Nextaro
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">Intelligence</span>
            </h2>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] font-medium text-white/50">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span>Provider: Groq</span>
              <span className="text-white/25">·</span>
              <span>Model: {activeModel}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button type="button" onClick={() => { setMessages([]); setInput(""); setAttachments([]); adjustHeight(true); toast.success("Started a fresh chat"); }} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/45 transition hover:bg-white/5 hover:text-white">
            <PlusSquare className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => loadHistory(true)} disabled={isFetching} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/45 transition hover:bg-white/5 hover:text-white disabled:opacity-40">
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </button>
          <button type="button" onClick={handleDeleteSavedHistory} disabled={isLoading || isFetching} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/45 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative z-10 flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(22,22,29,0.96),rgba(22,22,29,0.74))] shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />

        <div
          ref={scrollRef}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-5 lg:px-6"
        >
          {isFetching ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-[18px] border-4 border-indigo-400 border-t-transparent" />
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">Hydrating your history</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-start px-2 pt-6 text-center">
              <div className="relative mb-3">
                <div className="absolute inset-[-24px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.12),transparent)] animate-pulse" />
                <div className="relative flex h-[56px] w-[56px] items-center justify-center rounded-[18px] bg-gradient-to-br from-indigo-500 to-violet-500 shadow-[0_10px_32px_rgba(99,102,241,0.35)]">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
              <h3 className="text-[22px] font-extrabold tracking-[-0.04em]">
                How can I help you <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">today?</span>
              </h3>
              <p className="mt-2 max-w-md text-[13px] leading-6 text-white/45">
                I&apos;m your AI career co-pilot. Ask me about roadmaps, skills, salary benchmarks, interview prep, and more.
              </p>
              <div className="mt-5 grid w-full max-w-[540px] gap-3 md:grid-cols-2">
                {starterPrompts.map((prompt) => (
                  <button key={prompt.label} type="button" onClick={() => { setInput(prompt.label); focusTextarea(); }} className={`flex items-start gap-3 rounded-2xl border bg-gradient-to-br p-4 text-left transition duration-200 hover:scale-[1.02] ${prompt.accent}`}>
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                      <prompt.icon className="h-4 w-4" />
                    </div>
                    <span className="text-[12px] font-semibold leading-5 text-white/80">{prompt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                const displayContent = isUser ? msg.content : formatStructuredCareerReply(msg.content);
                return (
                  <div key={`${msg.role}-${index}-${msg.timestamp ?? "pending"}`} className={cn("flex gap-3", isUser && "flex-row-reverse")}>
                    <div className={cn("flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px]", isUser ? "border border-white/12 bg-white/8 text-white/55" : "bg-gradient-to-br from-indigo-500 to-violet-500 shadow-[0_2px_12px_rgba(99,102,241,0.28)]")}>
                      {isUser ? <User2 className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={cn("flex max-w-[82%] flex-col", isUser && "items-end")}>
                      <div className={cn("rounded-2xl px-4 py-3 text-[13.5px] leading-7", isUser ? "rounded-tr-[6px] bg-gradient-to-br from-indigo-500 to-indigo-600 font-medium text-white shadow-[0_8px_24px_rgba(99,102,241,0.22)]" : "rounded-tl-[6px] border border-white/8 bg-[#1c1c26] text-white/80")}>
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <div className="prose prose-sm max-w-none prose-headings:font-extrabold prose-headings:text-white prose-p:text-white/75 prose-strong:text-white prose-li:text-white/75 prose-code:rounded prose-code:bg-white/8 prose-code:px-1 prose-code:text-white prose-pre:bg-black/30">
                            <ReactMarkdown>{displayContent}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                      <div className={cn("mt-1.5 flex items-center gap-2 px-1", isUser && "justify-end")}>
                        <span className="text-[10px] font-medium text-white/25">
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                        {!isUser && (
                          <button type="button" onClick={() => handleCopy(displayContent, index)} className="flex items-center gap-1 text-[10px] font-medium text-white/25 transition hover:text-white/55">
                            {copiedIndex === index ? <><Check className="h-3 w-3 text-emerald-400" /><span className="text-emerald-400">Copied</span></> : <><Copy className="h-3 w-3" />Copy</>}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-500">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl rounded-tl-[6px] border border-white/8 bg-[#1c1c26] px-4 py-3">
                    <span className="text-[11px] font-semibold text-white/45">Thinking...</span>
                    <TypingDots />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="sticky bottom-0 z-10 shrink-0 border-t border-white/[0.05] bg-[linear-gradient(0deg,rgba(18,18,24,0.98),rgba(22,22,29,0.9))] backdrop-blur-2xl">
          <AnimatePresence>
            {recentCommand && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="px-4 pt-2 text-center text-xs text-violet-200/80 sm:px-5 lg:px-6">
                Command ready: <span className="font-semibold text-white">{recentCommand}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {messages.length > 0 && messages.length < 6 && !isLoading && (
            <div className="flex flex-wrap gap-2 px-4 pt-3 sm:px-5 lg:px-6">
              {starterPrompts.map((prompt) => (
                <button key={prompt.label} type="button" onClick={() => { setInput(prompt.label); focusTextarea(); }} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/45 transition hover:bg-white/8 hover:text-white/80">
                  {prompt.label}
                </button>
              ))}
            </div>
          )}

          <div className="p-3 sm:px-5 lg:px-6">
            <div className="relative rounded-2xl border border-white/[0.05] bg-white/[0.02] shadow-2xl">
              <AnimatePresence>
                {showCommandPalette && (
                  <motion.div ref={commandPaletteRef} className="absolute bottom-full left-4 right-4 z-50 mb-2 overflow-hidden rounded-lg border border-white/10 bg-black/90 shadow-lg backdrop-blur-xl" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.15 }}>
                    <div className="bg-black/95 py-1">
                      {commandSuggestions.map((suggestion, index) => (
                        <button key={suggestion.prefix} type="button" className={cn("flex w-full items-start gap-3 px-3 py-2 text-left text-xs transition-colors", activeSuggestion === index ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5")} onClick={() => selectCommandSuggestion(index)}>
                          <div className="mt-0.5 flex h-5 w-5 items-center justify-center text-white/60">{suggestion.icon}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2"><span className="font-medium">{suggestion.label}</span><span className="text-[10px] text-white/35">{suggestion.prefix}</span></div>
                            <div className="mt-0.5 text-[10px] text-white/35">{suggestion.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-4">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => { setInput(event.target.value); adjustHeight(); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Nextaro anything about your career..."
                  className="min-h-[60px] w-full resize-none bg-transparent px-4 py-3 text-sm text-white/90 placeholder:text-white/20 focus:outline-none"
                  style={{ overflow: "hidden" }}
                  disabled={isFetching || isLoading}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAttachmentSelect}
                />
              </div>

              <AnimatePresence>
                {attachments.length > 0 && (
                  <motion.div className="flex flex-wrap gap-2 px-4 pb-3" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    {attachments.map((file, index) => (
                      <motion.div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-1.5 text-xs text-white/70" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                        <span>{file.name}</span>
                        <button type="button" onClick={() => setAttachments((prev) => prev.filter((_, itemIndex) => itemIndex !== index))} className="text-white/40 transition-colors hover:text-white">
                          <XIcon className="h-3 w-3" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between gap-4 border-t border-white/[0.05] p-4">
                <div className="flex items-center gap-3">
                  <motion.button type="button" onClick={openAttachmentPicker} whileTap={{ scale: 0.94 }} className="rounded-lg p-2 text-white/40 transition-colors hover:text-white/90">
                    <Paperclip className="h-4 w-4" />
                  </motion.button>
                  <motion.button type="button" data-command-button onClick={(event) => { event.stopPropagation(); setShowCommandPalette((current) => !current); focusTextarea(); }} whileTap={{ scale: 0.94 }} className={cn("rounded-lg p-2 text-white/40 transition-colors hover:text-white/90", showCommandPalette && "bg-white/10 text-white/90")}>
                    <Command className="h-4 w-4" />
                  </motion.button>
                </div>

                <motion.button type="button" onClick={handleSend} whileHover={{ scale: input.trim() ? 1.01 : 1 }} whileTap={{ scale: input.trim() ? 0.98 : 1 }} disabled={isLoading || isFetching || !input.trim()} className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all", input.trim() ? "bg-white text-[#0A0A0B] shadow-lg shadow-white/10" : "bg-white/[0.05] text-white/40")}>
                  {isLoading ? <LoaderIcon className="h-4 w-4 animate-[spin_2s_linear_infinite]" /> : <SendIcon className="h-4 w-4" />}
                  <span>Send</span>
                </motion.button>
              </div>
            </div>
          </div>

          <p className="px-4 pb-3 text-center text-[10px] font-medium tracking-[0.02em] text-white/25 sm:px-5 lg:px-6">
            Nextaro AI can make mistakes. Always verify important career decisions with real data.
          </p>
        </div>
      </div>
    </div>
  );
}
