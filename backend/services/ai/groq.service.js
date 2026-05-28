const { Groq } = require("groq-sdk");

const normalizeBaseUrl = (rawBaseUrl) => {
    const value = (rawBaseUrl || "https://api.groq.com").trim();
    return value.replace(/\/+$/, "").replace(/\/openai\/v1$/i, "");
};

const getClient = (apiKey) => new Groq({
    apiKey,
    baseURL: normalizeBaseUrl(process.env.GROQ_BASE_URL),
});

const RETRY_COUNT = Number(process.env.GROQ_RETRY_COUNT || 2);
const RETRY_DELAY_MS = Number(process.env.GROQ_RETRY_DELAY_MS || 800);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getApiKeys = () => (
    [
        process.env.GROQ_API_KEY,
        process.env.GROQ_API_KEY_2,
        process.env.GROQ_API_KEY_3,
        process.env.GROQ_API_KEY_4,
    ]
        .map((value) => (value || "").trim())
        .filter(Boolean)
        .filter((value, index, list) => list.indexOf(value) === index)
);

const isTransientError = (error) => {
    const status = Number(error?.status || 0);
    const causeCode = error?.cause?.code || "";
    return (
        status === 429 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        causeCode === "ECONNRESET" ||
        causeCode === "ETIMEDOUT"
    );
};

const summarizeError = (error) => ({
    name: error?.name || null,
    message: error?.message || null,
    status: error?.status || null,
    code: error?.code || null,
    type: error?.type || null,
    causeCode: error?.cause?.code || null,
    causeMessage: error?.cause?.message || null,
});

const toProviderError = (error) => {
    const status = Number(error?.status || 0);
    const summary = summarizeError(error);
    const wrapped = new Error(
        status
            ? `Groq request failed with status ${status}${summary.message ? `: ${summary.message}` : ""}`
            : `Groq connection failed${summary.causeCode ? ` (${summary.causeCode})` : ""}${summary.message ? `: ${summary.message}` : ""}`
    );

    wrapped.code = "AI_PROVIDER_UNAVAILABLE";
    wrapped.status = status || 503;
    wrapped.details = summary;
    return wrapped;
};

const generateResponse = async (prompt, options = {}) => {
    let lastError = null;
    const apiKeys = getApiKeys();
    const selectedModel = options.model || process.env.GROQ_MODEL || "openai/gpt-oss-120b";

    if (apiKeys.length === 0) {
        const error = new Error("GROQ_API_KEY is missing for provider groq");
        error.code = "AI_NOT_CONFIGURED";
        error.status = 503;
        throw error;
    }

    for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex += 1) {
        const apiKey = apiKeys[keyIndex];

        for (let attempt = 1; attempt <= RETRY_COUNT + 1; attempt += 1) {
            try {
                const client = getClient(apiKey);
                const model = selectedModel;
                const messages = Array.isArray(options.messages) && options.messages.length > 0
                    ? options.messages
                    : [
                        {
                            role: "system",
                            content: "You are an expert AI Career Advisor. Always provide structured, clear, and practical career guidance. Suggest 2-3 suitable career paths based on user input, explain why they fit, list required skills, and provide a simple step-by-step learning roadmap. Keep responses concise, personalized, and easy to understand."
                        },
                        { role: "user", content: prompt }
                    ];
                const requestBody = {
                    model,
                    messages,
                    temperature: Number(options.temperature ?? process.env.GROQ_TEMPERATURE ?? 1.2),
                    max_completion_tokens: Number(options.maxTokens || process.env.GROQ_MAX_COMPLETION_TOKENS || 4096),
                    top_p: 1,
                };

                if (model.includes("gpt-oss")) {
                    requestBody.reasoning_effort = process.env.GROQ_REASONING_EFFORT || "medium";
                }

                const response = await client.chat.completions.create(requestBody);

                return response.choices?.[0]?.message?.content || "";
            } catch (error) {
                lastError = error;
                const transient = isTransientError(error);
                const summary = summarizeError(error);
                console.error(
                    `[GROQ] key ${keyIndex + 1}/${apiKeys.length} attempt ${attempt}/${RETRY_COUNT + 1} failed` +
                    `${summary.status ? ` (status: ${summary.status})` : ""}` +
                    `${summary.code ? ` (code: ${summary.code})` : ""}` +
                    `${summary.causeCode ? ` (cause: ${summary.causeCode})` : ""}` +
                    `${summary.message ? `\n[GROQ] message: ${summary.message}` : ""}` +
                    `${summary.causeMessage ? `\n[GROQ] cause: ${summary.causeMessage}` : ""}`
                );

                if (!transient || attempt > RETRY_COUNT) break;
                await sleep(RETRY_DELAY_MS * attempt);
            }
        }
    }

    throw toProviderError(lastError);
};

module.exports = { generateResponse, getApiKeys };
