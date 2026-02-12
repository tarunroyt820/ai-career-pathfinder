const groqService = require("./groq.service");
const geminiService = require("./gemini.service");
const openaiService = require("./openai.service");

// Priority order: Groq -> Gemini -> OpenAI
const providers = [
    { name: "groq", service: groqService },
    { name: "gemini", service: geminiService },
    { name: "openai", service: openaiService }
];

/**
 * Main AI Gateway with Fallback Logic
 * If the selected provider fails, attempts fallback in priority order.
 */
const getAIResponse = async (prompt) => {
    const selectedProvider = (process.env.AI_PROVIDER || "groq").toLowerCase();
    let lastError = null;

    // 1. Try Selected Provider First
    const primaryIndex = providers.findIndex(p => p.name === selectedProvider);
    if (primaryIndex !== -1) {
        try {
            console.log(`AI Service: Attempting primary provider "${selectedProvider}"`);
            return await providers[primaryIndex].service.generateResponse(prompt);
        } catch (error) {
            console.warn(`AI Service: Primary provider "${selectedProvider}" failed. Error: ${error.message}`);
            lastError = error;
        }
    } else {
        console.warn(`AI Service: Selected provider "${selectedProvider}" is not supported. Falling back.`);
    }

    // 2. Try Fallback Chain (Priority Order)
    console.log("AI Service: Starting fallback attempts...");
    for (const provider of providers) {
        // Skip if we already tried this provider as primary
        if (provider.name === selectedProvider) continue;

        try {
            console.log(`AI Service: Attempting fallback provider "${provider.name}"`);
            return await provider.service.generateResponse(prompt);
        } catch (error) {
            console.warn(`AI Service: Fallback provider "${provider.name}" failed. Error: ${error.message}`);
            lastError = error;
        }
    }

    // 3. All attempts failed
    console.error("AI Service: All providers failed.");
    throw new Error("AI service temporarily unavailable");
};

module.exports = { getAIResponse };
