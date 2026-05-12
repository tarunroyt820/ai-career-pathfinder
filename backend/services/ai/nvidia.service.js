const { Readable } = require('stream');

const normalizeBaseUrl = (rawBaseUrl) => {
    const value = (rawBaseUrl || 'https://integrate.api.nvidia.com/v1').trim();
    return value.replace(/\/+$/, '');
};

const getApiKey = () => (process.env.NVIDIA_API_KEY || process.env.NVIDIA_TOKEN || '').trim();

const getModel = (options = {}) =>
    options.model ||
    process.env.NVIDIA_MODEL ||
    process.env.NVIDIA_CHAT_MODEL ||
    process.env.NVIDIA_HEAVY_MODEL ||
    'meta/llama-3.1-8b-instruct';

const buildRequestBody = (prompt, model, options = {}) => ({
    model,
    messages: [
        { role: 'user', content: prompt },
    ],
    temperature: Number(process.env.NVIDIA_TEMPERATURE || options.temperature || 1),
    top_p: Number(process.env.NVIDIA_TOP_P || options.topP || 0.9),
    max_tokens: Number(process.env.NVIDIA_MAX_TOKENS || options.maxTokens || 4096),
    stream: Boolean(options.stream),
});

const extractText = (payload) => {
    const choice = payload?.choices?.[0];
    return (
        choice?.message?.content ||
        choice?.delta?.content ||
        payload?.output_text ||
        payload?.text ||
        ''
    );
};

const toProviderError = async (response) => {
    let details = null;
    try {
        details = await response.json();
    } catch {
        details = null;
    }

    const error = new Error(
        `NVIDIA request failed with status ${response.status}${details?.error?.message ? `: ${details.error.message}` : ''}`
    );
    error.code = response.status === 402 ? 'AI_PROVIDER_UNAVAILABLE' : 'AI_PROVIDER_UNAVAILABLE';
    error.status = response.status || 503;
    error.details = details;
    return error;
};

const generateResponse = async (prompt, options = {}) => {
    const apiKey = getApiKey();
    if (!apiKey || apiKey.startsWith('REPLACE_')) {
        const error = new Error('NVIDIA_API_KEY is missing for provider nvidia');
        error.code = 'AI_NOT_CONFIGURED';
        error.status = 503;
        throw error;
    }

    const model = getModel(options);
    if (!model) {
        const error = new Error('NVIDIA_MODEL is missing for provider nvidia');
        error.code = 'AI_NOT_CONFIGURED';
        error.status = 503;
        throw error;
    }

    const response = await fetch(`${normalizeBaseUrl(process.env.NVIDIA_BASE_URL)}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(buildRequestBody(prompt, model, options)),
    });

    if (!response.ok) {
        throw await toProviderError(response);
    }

    const payload = await response.json();
    return String(extractText(payload) || '').trim();
};

const generateResponseStream = async (prompt, options = {}) => {
    const text = await generateResponse(prompt, { ...options, stream: false });
    const chunks = text.match(/.{1,80}(\s|$)|\S+/g) || [text];

    async function* chunkGenerator() {
        for (const chunk of chunks) {
            yield chunk;
        }
    }

    return Readable.from(chunkGenerator());
};

module.exports = { generateResponse, generateResponseStream };