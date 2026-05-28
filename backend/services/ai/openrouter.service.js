const { Readable } = require('stream');

const normalizeBaseUrl = (rawBaseUrl) => {
    const value = (rawBaseUrl || 'https://openrouter.ai/api/v1').trim();
    return value.replace(/\/+$/, '');
};

const getApiKey = () => (process.env.OPENROUTER_API_KEY || '').trim();

const getModel = (options = {}) =>
    options.model ||
    process.env.OPENROUTER_MODEL ||
    process.env.OPENROUTER_CHAT_MODEL ||
    process.env.OPENROUTER_HEAVY_MODEL ||
    'google/gemma-4-26b-a4b-it:free';

const buildMessages = (prompt, options = {}) => {
    if (Array.isArray(options.messages) && options.messages.length > 0) {
        return options.messages;
    }

    return [
        {
            role: 'user',
            content: prompt
        }
    ];
};

const buildRequestBody = (prompt, model, options = {}) => ({
    model,
    messages: buildMessages(prompt, options),
    reasoning: { enabled: String(process.env.OPENROUTER_REASONING_ENABLED || 'true').toLowerCase() === 'true' },
    temperature: Number(options.temperature ?? process.env.OPENROUTER_TEMPERATURE ?? 1),
    max_tokens: Number(process.env.OPENROUTER_MAX_TOKENS || options.maxTokens || 4096),
    top_p: Number(process.env.OPENROUTER_TOP_P || options.topP || 1),
    stream: Boolean(options.stream),
});

const toProviderError = async (response) => {
    let details = null;
    try {
        details = await response.json();
    } catch {
        details = null;
    }

    const error = new Error(
        `OpenRouter request failed with status ${response.status}${details?.error?.message ? `: ${details.error.message}` : ''}`
    );
    error.code = 'AI_PROVIDER_UNAVAILABLE';
    error.status = response.status || 503;
    error.details = details;
    return error;
};

const validateConfiguration = (apiKey, model) => {
    if (!apiKey || apiKey.startsWith('REPLACE_')) {
        const error = new Error('OPENROUTER_API_KEY is missing for provider openrouter');
        error.code = 'AI_NOT_CONFIGURED';
        error.status = 503;
        throw error;
    }

    if (!model) {
        const error = new Error('OPENROUTER_MODEL is missing for provider openrouter');
        error.code = 'AI_NOT_CONFIGURED';
        error.status = 503;
        throw error;
    }
};

const generateResponse = async (prompt, options = {}) => {
    const apiKey = getApiKey();
    const model = getModel(options);
    validateConfiguration(apiKey, model);

    const response = await fetch(`${normalizeBaseUrl(process.env.OPENROUTER_BASE_URL)}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(buildRequestBody(prompt, model, { ...options, stream: false })),
    });

    if (!response.ok) {
        throw await toProviderError(response);
    }

    const payload = await response.json();
    const message = payload?.choices?.[0]?.message || {};

    return {
        text: String(message.content || '').trim(),
        reasoningDetails: message.reasoning_details || null
    };
};

const generateResponseStream = async (prompt, options = {}) => {
    const result = await generateResponse(prompt, options);
    const chunks = (result.text || '').match(/.{1,80}(\s|$)|\S+/g) || [result.text || ''];

    async function* chunkGenerator() {
        for (const chunk of chunks) {
            yield chunk;
        }
    }

    return Readable.from(chunkGenerator());
};

module.exports = { generateResponse, generateResponseStream };
