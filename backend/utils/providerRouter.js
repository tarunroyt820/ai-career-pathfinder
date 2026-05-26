const SUPPORTED_PROVIDERS = new Set(["groq", "huggingface", "hf", "nvidia", "openrouter"]);

const DEFAULT_PROVIDER = (() => {
    const value = String(process.env.AI_PROVIDER || "groq").toLowerCase().trim();
    return SUPPORTED_PROVIDERS.has(value) ? value : "groq";
})();

const MODEL_POLICY_BY_PROVIDER = {
    groq: {
        chat: process.env.GROQ_CHAT_MODEL || process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        roadmap: process.env.GROQ_ROADMAP_MODEL || process.env.GROQ_HEAVY_MODEL || process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        skillgap: process.env.GROQ_SKILLGAP_MODEL || process.env.GROQ_HEAVY_MODEL || process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        resume: process.env.GROQ_RESUME_MODEL || process.env.GROQ_HEAVY_MODEL || process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        reasoning: process.env.GROQ_REASONING_MODEL || process.env.GROQ_HEAVY_MODEL || process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    },
    huggingface: {
        chat: process.env.HF_CHAT_MODEL || process.env.HF_MODEL || "",
        roadmap: process.env.HF_HEAVY_MODEL || process.env.HF_MODEL || "",
        skillgap: process.env.HF_SKILLGAP_MODEL || process.env.HF_HEAVY_MODEL || process.env.HF_MODEL || "",
        resume: process.env.HF_HEAVY_MODEL || process.env.HF_MODEL || "",
        reasoning: process.env.HF_HEAVY_MODEL || process.env.HF_MODEL || "",
    },
    hf: {
        chat: process.env.HF_CHAT_MODEL || process.env.HF_MODEL || "",
        roadmap: process.env.HF_HEAVY_MODEL || process.env.HF_MODEL || "",
        skillgap: process.env.HF_SKILLGAP_MODEL || process.env.HF_HEAVY_MODEL || process.env.HF_MODEL || "",
        resume: process.env.HF_HEAVY_MODEL || process.env.HF_MODEL || "",
        reasoning: process.env.HF_HEAVY_MODEL || process.env.HF_MODEL || "",
    },
    nvidia: {
        chat: process.env.NVIDIA_MODEL || process.env.NVIDIA_CHAT_MODEL || process.env.NVIDIA_HEAVY_MODEL || 'meta/llama-3.1-8b-instruct',
        roadmap: process.env.NVIDIA_MODEL || process.env.NVIDIA_CHAT_MODEL || process.env.NVIDIA_HEAVY_MODEL || 'meta/llama-3.1-8b-instruct',
        skillgap: process.env.NVIDIA_MODEL || process.env.NVIDIA_CHAT_MODEL || process.env.NVIDIA_HEAVY_MODEL || 'meta/llama-3.1-8b-instruct',
        resume: process.env.NVIDIA_MODEL || process.env.NVIDIA_CHAT_MODEL || process.env.NVIDIA_HEAVY_MODEL || 'meta/llama-3.1-8b-instruct',
        reasoning: process.env.NVIDIA_MODEL || process.env.NVIDIA_CHAT_MODEL || process.env.NVIDIA_HEAVY_MODEL || 'meta/llama-3.1-8b-instruct',
    },
    openrouter: {
        chat: process.env.OPENROUTER_MODEL || process.env.OPENROUTER_CHAT_MODEL || process.env.OPENROUTER_HEAVY_MODEL || 'google/gemma-4-26b-a4b-it:free',
        roadmap: process.env.OPENROUTER_ROADMAP_MODEL || process.env.OPENROUTER_MODEL || process.env.OPENROUTER_CHAT_MODEL || process.env.OPENROUTER_HEAVY_MODEL || 'google/gemma-4-26b-a4b-it:free',
        skillgap: process.env.OPENROUTER_MODEL || process.env.OPENROUTER_CHAT_MODEL || process.env.OPENROUTER_HEAVY_MODEL || 'google/gemma-4-26b-a4b-it:free',
        resume: process.env.OPENROUTER_MODEL || process.env.OPENROUTER_CHAT_MODEL || process.env.OPENROUTER_HEAVY_MODEL || 'google/gemma-4-26b-a4b-it:free',
        reasoning: process.env.OPENROUTER_MODEL || process.env.OPENROUTER_CHAT_MODEL || process.env.OPENROUTER_HEAVY_MODEL || 'google/gemma-4-26b-a4b-it:free',
    },
};

const classifyIntent = (message = '') => {
    const lower = message.toLowerCase();
    if (lower.includes('roadmap') || lower.includes('plan') || lower.includes('career path')) return 'roadmap';
    if (lower.includes('skill gap') || lower.includes('missing skill')) return 'skillgap';
    if (lower.includes('resume') || lower.includes('cv')) return 'resume';
    if (lower.includes('explain') || lower.includes('why') || lower.includes('compare')) return 'reasoning';
    return 'chat';
};

module.exports = {
    getProvider: (message, preferredProvider) => {
        const intent = classifyIntent(message);
        const preferred = String(preferredProvider || "").toLowerCase().trim();

        // Allow an explicit preferred provider to win
        let provider = SUPPORTED_PROVIDERS.has(preferred) ? preferred : DEFAULT_PROVIDER;

        // If this is a roadmap generation intent and there is an OpenRouter API key
        // available, and the environment hasn't explicitly set a CAREER_PATH_PROVIDER,
        // prefer OpenRouter for roadmap tasks because it is configured for reasoning-heavy flows.
        try {
            const careerOverride = String(process.env.CAREER_PATH_PROVIDER || '').toLowerCase().trim();
            const openrouterKeyPresent = Boolean(process.env.OPENROUTER_API_KEY && String(process.env.OPENROUTER_API_KEY).trim());
            if (intent === 'roadmap' && !careerOverride && openrouterKeyPresent) {
                provider = 'openrouter';
            }
        } catch (e) {
            // ignore and fallback to configured provider
        }
        const modelPolicy = MODEL_POLICY_BY_PROVIDER[provider] || MODEL_POLICY_BY_PROVIDER[DEFAULT_PROVIDER] || MODEL_POLICY_BY_PROVIDER.groq;

        return {
            provider,
            model: modelPolicy[intent],
            intent
        };
    },
};
