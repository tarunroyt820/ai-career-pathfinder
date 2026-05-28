const { Readable } = require("stream");
const { InferenceClient } = require("@huggingface/inference");

const RETRY_COUNT = Number(process.env.HF_RETRY_COUNT || 2);
const RETRY_DELAY_MS = Number(process.env.HF_RETRY_DELAY_MS || 800);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getApiKey = (options = {}) => (
    options.apiKey ||
    (options.useSecondaryKey ? process.env.HUGGINGFACE_API_KEY_2 : "") ||
    process.env.HUGGINGFACE_API_KEY ||
    process.env.HUGGINGFACE_API_KEY_2 ||
    process.env.HF_TOKEN ||
    process.env.HF_API_TOKEN ||
    ""
).trim();

const hasImageContent = (messages = []) =>
    Array.isArray(messages) && messages.some((message) => {
        const content = message?.content;
        return Array.isArray(content) && content.some((part) => part && typeof part === "object" && part.type === "image_url");
    });

const getModel = (options = {}) =>
    options.model ||
    (hasImageContent(options.messages) ? process.env.HF_VISION_MODEL : "") ||
    process.env.HF_MODEL ||
    process.env.HF_CHAT_MODEL ||
    process.env.HF_HEAVY_MODEL ||
    process.env.HF_SKILLGAP_MODEL ||
    "";

const getClient = (apiKey) => new InferenceClient(apiKey);

const isTransientError = (error) => {
    const status = Number(error?.status || 0);
    return status === 429 || status === 502 || status === 503 || status === 504;
};

const summarizeError = (error) => ({
    name: error?.name || null,
    message: error?.message || null,
    status: error?.status || null,
    details: error?.details || null,
});

const toProviderError = (error) => {
    const status = Number(error?.status || 0);
    const summary = summarizeError(error);
    const wrapped = new Error(
        status
            ? `Hugging Face request failed with status ${status}${summary.message ? `: ${summary.message}` : ""}`
            : `Hugging Face request failed${summary.message ? `: ${summary.message}` : ""}`
    );

    wrapped.code = "AI_PROVIDER_UNAVAILABLE";
    wrapped.status = status || 503;
    wrapped.details = summary;
    return wrapped;
};

const buildChatOptions = (prompt, model, maxTokensOverride, options = {}) => {
    const temperature = Number(options.temperature ?? process.env.HF_TEMPERATURE ?? 0.6);
    const maxTokens = Number(maxTokensOverride || process.env.HF_MAX_NEW_TOKENS || 1200);
    const messages = Array.isArray(options.messages) && options.messages.length > 0
        ? options.messages
        : [
            {
                role: "user",
                content: prompt,
            },
        ];

    return {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
    };
};

const extractChatText = (payload) => {
    const firstChoice = payload?.choices?.[0];
    return (
        firstChoice?.message?.content ||
        firstChoice?.text ||
        payload?.generated_text ||
        ""
    );
};

const generateResponse = async (prompt, options = {}) => {
    const apiKey = getApiKey(options);
    if (!apiKey || apiKey.startsWith("REPLACE_")) {
        const error = new Error("HUGGINGFACE_API_KEY is missing for provider huggingface");
        error.code = "AI_NOT_CONFIGURED";
        error.status = 503;
        throw error;
    }

    const model = getModel(options);
    if (!model) {
        const error = new Error("HF_MODEL is missing for provider huggingface");
        error.code = "AI_NOT_CONFIGURED";
        error.status = 503;
        throw error;
    }

    const client = getClient(apiKey);
    const maxTokens = options.maxTokens;

    let lastError = null;
    for (let attempt = 1; attempt <= RETRY_COUNT + 1; attempt += 1) {
        try {
            const payload = await client.chatCompletion(buildChatOptions(prompt, model, maxTokens, options));
            return String(extractChatText(payload) || "").trim();
        } catch (error) {
            lastError = error;
            const transient = isTransientError(error);
            console.error(
                `[HUGGINGFACE] model ${model} attempt ${attempt}/${RETRY_COUNT + 1} failed` +
                `${error?.status ? ` (status: ${error.status})` : ""}` +
                `${error?.message ? `: ${error.message}` : ""}`
            );

            if (!transient || attempt > RETRY_COUNT) break;
            await sleep(RETRY_DELAY_MS * attempt);
        }
    }

    throw toProviderError(lastError);
};

const generateResponseStream = async (prompt, options = {}) => {
    const apiKey = getApiKey(options);
    if (!apiKey || apiKey.startsWith("REPLACE_")) {
        const error = new Error("HUGGINGFACE_API_KEY is missing for provider huggingface");
        error.code = "AI_NOT_CONFIGURED";
        error.status = 503;
        throw error;
    }

    const model = getModel(options);
    if (!model) {
        const error = new Error("HF_MODEL is missing for provider huggingface");
        error.code = "AI_NOT_CONFIGURED";
        error.status = 503;
        throw error;
    }

    const client = getClient(apiKey);
    const maxTokens = options.maxTokens;

    let stream;
    try {
        stream = await client.chatCompletionStream(buildChatOptions(prompt, model, maxTokens, options));
    } catch (error) {
        throw toProviderError(error);
    }

    async function* chunkGenerator() {
        try {
            for await (const chunk of stream) {
                const text = chunk?.choices?.[0]?.delta?.content;
                if (text) yield text;
            }
        } catch (error) {
            throw toProviderError(error);
        }
    }

    return Readable.from(chunkGenerator());
};

module.exports = { generateResponse, generateResponseStream };
