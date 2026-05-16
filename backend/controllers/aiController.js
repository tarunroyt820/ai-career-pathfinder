const User = require('../models/User');
const Message = require('../models/Message');
const CareerPlan = require('../models/CareerPlan');
const AIRequestLog = require('../models/AIRequestLog');
const aiService = require('../services/ai/ai.service');
const profileCache = require('../utils/profileCache');
const { getProvider } = require('../utils/providerRouter');
const { CAREER_PLAN_SYSTEM_PROMPT } = require('../services/ai/prompts/careerPlan.prompt');
const { getJobStatus } = require('../queues/aiQueue');

const timer = (label) => {
    const start = Date.now();
    return () => {
        const duration = Date.now() - start;
        console.log(`[LATENCY] ${label}: ${duration}ms`);
        return duration;
    };
};

const buildCompactProfile = (profile) => {
    return `User: ${profile.fullName || 'Unknown'}. Role: ${profile.jobTitle || 'Not set'}. Goal: ${profile.careerGoal || 'Not set'}. Skills: ${(profile.skills || []).slice(0, 5).join(', ')}.`;
};

const buildPlanContext = (plan) => {
    if (!plan) return 'The user does not have a career plan yet.';
    return [
        `Career Goal: ${plan.careerGoal}`,
        `Milestones: ${plan.milestones?.map((milestone) => milestone.title).join(', ') || 'none'}`,
        `Skills Needed: ${plan.recommendedSkills?.slice(0, 5).join(', ') || 'none'}`,
        `Weekly Tasks: ${plan.weeklyTasks?.slice(0, 3).join(', ') || 'none'}`
    ].join(' | ');
};

const buildCompactContext = (profile, plan) => {
    const parts = [
        profile?.name ? `Name: ${profile.name}` : null,
        profile?.fullName ? `Name: ${profile.fullName}` : null,
        profile?.currentRole ? `Role: ${profile.currentRole}` : null,
        profile?.jobTitle ? `Role: ${profile.jobTitle}` : null,
        plan?.careerGoal ? `Goal: ${plan.careerGoal}` : null,
        profile?.careerGoal && !plan?.careerGoal ? `Goal: ${profile.careerGoal}` : null,
        profile?.skills?.length ? `Skills: ${profile.skills.slice(0, 4).join(', ')}` : null
    ].filter(Boolean);

    const context = [...new Set(parts)].join('. ');
    console.log(`[PROMPT] context length: ${context.length} chars`);
    return context;
};

const buildLocalFallbackAnswer = (question, profile, plan) => {
    const name = profile?.fullName || profile?.name || "there";
    const goal = plan?.careerGoal || profile?.careerGoal || "your next career milestone";
    const skills = profile?.skills?.slice(0, 4) || [];
    const missingSkills = plan?.recommendedSkills?.slice(0, 3) || [];

    return [
        `Hi ${name}, the primary AI provider is temporarily unavailable, so I am giving you a quick fallback answer based on your profile.`,
        "",
        `Question: ${question}`,
        "",
        `Recommended focus:`,
        `- Primary goal: ${goal}`,
        `- Strengths to build on: ${skills.length ? skills.join(", ") : "your existing profile strengths"}`,
        `- Next skills to develop: ${missingSkills.length ? missingSkills.join(", ") : "communication, project depth, and portfolio proof"}`,
        `- Immediate next step: choose one project or learning task today that moves you closer to ${goal}`,
        "",
        `If you want, ask again in a minute and I will retry the full AI-powered response.`
    ].join("\n");
};

const isFallbackEnabled = () => String(process.env.AI_ENABLE_FALLBACK || 'false').toLowerCase() === 'true';

const saveAiLog = async ({
    userId,
    endpoint,
    provider,
    model,
    intent,
    promptLength,
    responseLength,
    status,
    httpStatus,
    errorCode,
    errorMessage,
    latencyMs
}) => {
    try {
        await AIRequestLog.create({
            userId,
            endpoint,
            provider,
            model,
            intent,
            promptLength,
            responseLength,
            status,
            httpStatus,
            errorCode: errorCode || '',
            errorMessage: errorMessage || '',
            latencyMs: latencyMs || 0
        });
    } catch (error) {
        console.error('saveAiLog failed:', error.message);
    }
};

const MAX_HISTORY_TURNS = 6;
const MAX_HISTORY_CHARS_PER_MESSAGE = 500;

const buildTrimmedHistory = (fullHistory) => {
    if (!fullHistory || fullHistory.length === 0) return [];

    const recent = fullHistory
        .slice(-MAX_HISTORY_TURNS)
        .map((message) => {
            const raw = String(message.content || '');
            const isFallback = raw.includes('primary AI provider is temporarily unavailable');
            const normalized = isFallback
                ? '[Previous fallback response omitted to keep prompt compact.]'
                : raw;

            return {
                role: message.role,
                content: normalized.slice(0, MAX_HISTORY_CHARS_PER_MESSAGE),
                reasoningDetails: message.reasoningDetails || null
            };
        });

    if (fullHistory.length > MAX_HISTORY_TURNS) {
        const older = fullHistory.slice(0, -MAX_HISTORY_TURNS);
        const summary = {
            role: 'system',
            content: `Earlier in this conversation the user discussed: ${older.map((message) => message.content).join(' ').slice(0, 300)}...`
        };
        return [summary, ...recent];
    }

    return recent;
};

exports.askAI = async (req, res) => {
    try {
        const question = req.body.question || req.body.message;
        const imageUrls = Array.isArray(req.body.imageUrls)
            ? req.body.imageUrls.map((url) => String(url || "").trim()).filter(Boolean)
            : [];
        const userId = req.user.id;
        const preferredProvider = (req.body.provider || '').toLowerCase();
        const aiStartedAt = Date.now();

        if (!question) {
            return res.status(400).json({ message: "Question is required" });
        }

        let existingPlan = null;
        try {
            const endPlanFetch = timer('career_plan_fetch');
            existingPlan = await CareerPlan.findOne({ userId }).lean();
            endPlanFetch();
        } catch {
            // non-critical — continue without plan context
        }

        const endUserSave = timer('user_message_save');
        await Message.create({
            userId,
            role: 'user',
            content: question
        });
        endUserSave();

        let userProfile = profileCache.get(req.user.id);
        if (!userProfile) {
            const endProfileFetch = timer('profile_fetch_db');
            userProfile = await User.findById(req.user.id).lean();
            endProfileFetch();
            profileCache.set(req.user.id, userProfile);
        } else {
            console.log('[CACHE] profile_fetch: served from cache');
        }

        if (!userProfile) {
            return res.status(404).json({ message: "User not found" });
        }

        const endHistoryFetch = timer('chat_history_fetch');
        const chatHistory = await Message.find({ userId }).sort({ timestamp: 1 }).lean();
        endHistoryFetch();

        const trimmedHistory = buildTrimmedHistory(
            chatHistory.map((message) => ({
                role: message.role,
                content: message.content,
                reasoningDetails: message.reasoningDetails || null
            }))
        );
        console.log(`[HISTORY] sending ${trimmedHistory.length} turns to model`);

        const compactContext = buildCompactContext(userProfile, existingPlan);

        // Use shared career plan system prompt for consistency
        const systemPrompt = [
            CAREER_PLAN_SYSTEM_PROMPT,
            `You are a career guidance AI assistant. Current plan: ${buildPlanContext(existingPlan)}. ${compactContext}. Help the user refine, update, or act on their plan. Be concise.`,
        ].join('\n\n');

        const legacyPrompt = `
            The following is the professional profile of a student/professional using Nextro Career Pathfinder.
        
            USER PROFILE CONTEXT:
            - Full Name: ${userProfile.fullName}
            - Current Job Title: ${userProfile.jobTitle || "Student/Aspiring Professional"}
            - Experience Level: ${userProfile.experienceLevel || "Not Specified"}
            - Career Goal: ${userProfile.careerGoal || "Not specified yet"}
            - Skills: ${userProfile.skills && userProfile.skills.length > 0 ? userProfile.skills.join(", ") : "None listed yet"}
            - Education: ${userProfile.education?.degree || "N/A"} from ${userProfile.education?.college || "N/A"} (Graduation: ${userProfile.education?.graduationYear || "N/A"})
        
            INSTRUCTIONS:
            - Provide clear, personalized career guidance based strictly on the profile provided.
            - If the user has a specific career goal, suggest actionable steps to reach it.
            - Be encouraging and focus on skill growth.
            - Use Markdown for response formatting (bullet points, bold text).
        
            USER QUESTION:
            "${question}"
        
            AI RESPONSE:
        `;

        const prompt = [
            `SYSTEM PROMPT: ${systemPrompt}`,
            trimmedHistory.length ? `RECENT CHAT HISTORY:\n${trimmedHistory.map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}` : '',
            `USER QUESTION:\n"${question}"`,
        ].filter(Boolean).join('\n\n');

        try {
            const { provider, model: routedModel, intent } = getProvider(question, preferredProvider);
            const effectiveProvider = imageUrls.length > 0 ? 'huggingface' : provider;
            const effectiveModel = imageUrls.length > 0
                ? (process.env.HF_VISION_MODEL || process.env.HF_SKILLGAP_MODEL || routedModel)
                : routedModel;
            console.log(`[ROUTER] intent: ${intent} -> provider: ${effectiveProvider} -> model: ${effectiveModel}`);
            const endAiCall = timer('ai_provider_call');
            let result;
            try {
                const maxTokens = (
                    effectiveProvider === "huggingface" || effectiveProvider === "hf"
                ) && intent === "skillgap"
                    ? Number(process.env.HF_SKILLGAP_MAX_NEW_TOKENS || process.env.HF_MAX_NEW_TOKENS || 512)
                    : undefined;

                const structuredMessages = imageUrls.length > 0 && (effectiveProvider === "huggingface" || effectiveProvider === "hf")
                    ? [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: prompt },
                                ...imageUrls.map((url) => ({ type: "image_url", image_url: { url } }))
                            ]
                        }
                    ]
                    : provider === "openrouter"
                    ? [
                        { role: "system", content: systemPrompt },
                        ...trimmedHistory.map((msg) => {
                            const base = {
                                role: msg.role,
                                content: msg.content
                            };

                            if (msg.role === "assistant" && msg.reasoningDetails) {
                                base.reasoning_details = msg.reasoningDetails;
                            }

                            return base;
                        }),
                        { role: "user", content: question }
                    ]
                    : undefined;

                result = await aiService.generate(prompt, { provider: effectiveProvider, model: effectiveModel, maxTokens, messages: structuredMessages });
            } catch (primaryError) {
                // Retry once with a compact prompt to avoid token/latency spikes on long chat histories.
                const compactRetryPrompt = [
                    CAREER_PLAN_SYSTEM_PROMPT,
                    `SYSTEM: You are a concise career guidance AI.`,
                    `PROFILE: ${buildCompactProfile(userProfile)}`,
                    `PLAN: ${buildPlanContext(existingPlan)}`,
                    `QUESTION: ${question}`
                ].join('\n');
                const maxTokens = (
                    effectiveProvider === "huggingface" || effectiveProvider === "hf"
                ) && intent === "skillgap"
                    ? Number(process.env.HF_SKILLGAP_MAX_NEW_TOKENS || process.env.HF_MAX_NEW_TOKENS || 512)
                    : undefined;

                const structuredRetryMessages = imageUrls.length > 0 && (effectiveProvider === "huggingface" || effectiveProvider === "hf")
                    ? [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: compactRetryPrompt },
                                ...imageUrls.map((url) => ({ type: "image_url", image_url: { url } }))
                            ]
                        }
                    ]
                    : provider === "openrouter"
                    ? [
                        { role: "system", content: "You are a concise career guidance AI." },
                        ...trimmedHistory.map((msg) => {
                            const base = {
                                role: msg.role,
                                content: msg.content
                            };

                            if (msg.role === "assistant" && msg.reasoningDetails) {
                                base.reasoning_details = msg.reasoningDetails;
                            }

                            return base;
                        }),
                        { role: "user", content: question }
                    ]
                    : undefined;

                result = await aiService.generate(compactRetryPrompt, { provider: effectiveProvider, model: effectiveModel, maxTokens, messages: structuredRetryMessages });
            }
            endAiCall();
            const answer = result && result.text ? result.text : String(result);

            if (answer.includes('"careerGoal"')) {
                try {
                    const raw = answer.replace(/```json|```/g, '').trim();
                    const updatedPlan = JSON.parse(raw);
                    await CareerPlan.findOneAndUpdate(
                        { userId: req.user.id },
                        { ...updatedPlan, lastUpdated: new Date() },
                        { upsert: true, new: true }
                    );
                    console.log('[AI ASSISTANT] Career plan updated from chat');
                } catch {
                    // response was not a plan update — that is fine
                }
            }

            const endResponseSave = timer('ai_response_save');
            await Message.create({
                userId,
                role: 'assistant',
                content: answer,
                reasoningDetails: result.reasoningDetails || null
            });
            endResponseSave();

            await saveAiLog({
                userId,
                endpoint: '/api/ai/ask',
                provider: result.providerUsed || effectiveProvider,
                model: result.modelUsed || effectiveModel || '',
                intent,
                promptLength: prompt.length,
                responseLength: String(answer || '').length,
                status: 'success',
                httpStatus: 200,
                latencyMs: Date.now() - aiStartedAt
            });

            res.json({
                answer,
                success: true,
                providerUsed: result.providerUsed,
                modelUsed: result.modelUsed
            });
        } catch (error) {
            console.error("AI Controller Error:", error);
            if (error.details) {
                console.error("AI Controller Error Details:", error.details);
            }
            if (error.code === 'AI_PROVIDER_UNAVAILABLE' && isFallbackEnabled()) {
                const fallbackAnswer = buildLocalFallbackAnswer(question, userProfile, existingPlan);

                await Message.create({
                    userId,
                    role: 'assistant',
                    content: fallbackAnswer
                });

                return res.json({
                    answer: fallbackAnswer,
                    success: true,
                    providerUsed: 'nextaro-local-fallback',
                    fallback: true
                });
            }
            const statusCode = (
                error.code === 'AI_NOT_CONFIGURED' ||
                error.code === 'AI_PROVIDER_UNAVAILABLE'
            ) ? 503 : 500;
            await saveAiLog({
                userId,
                endpoint: '/api/ai/ask',
                provider: preferredProvider || (imageUrls.length > 0 ? 'huggingface' : process.env.AI_PROVIDER || 'groq'),
                model: '',
                intent: 'chat',
                promptLength: String(question || '').length,
                responseLength: 0,
                status: 'failed',
                httpStatus: statusCode,
                errorCode: error.code || 'AI_FAILED',
                errorMessage: error.message || 'AI service temporarily unavailable',
                latencyMs: Date.now() - aiStartedAt
            });
            res.status(statusCode).json({
                success: false,
                code: error.code || "AI_FAILED",
                message: error.message || "AI service temporarily unavailable"
            });
        }
    } catch (error) {
        console.error("askAI Error:", error);
        res.status(500).json({
            message: "Failed to process AI request",
            success: false
        });
    }
};

exports.streamChat = async (req, res) => {
    const message = req.body.message || req.query.message;
    const imageUrls = Array.isArray(req.body.imageUrls)
        ? req.body.imageUrls.map((url) => String(url || "").trim()).filter(Boolean)
        : [];
    const preferredProvider = (req.body.provider || req.query.provider || '').toLowerCase();
    const { provider, model: routedModel, intent } = getProvider(message || "", preferredProvider);
    const effectiveProvider = imageUrls.length > 0 ? 'huggingface' : provider;
    const effectiveModel = imageUrls.length > 0
        ? (process.env.HF_VISION_MODEL || process.env.HF_SKILLGAP_MODEL || routedModel)
        : routedModel;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        console.log(`[ROUTER] intent: ${intent} -> provider: ${effectiveProvider} -> model: ${effectiveModel}`);
        const endAiCall = timer('ai_provider_stream_call');
        const structuredMessages = imageUrls.length > 0 && (effectiveProvider === 'huggingface' || effectiveProvider === 'hf')
            ? [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: message },
                        ...imageUrls.map((url) => ({ type: 'image_url', image_url: { url } }))
                    ]
                }
            ]
            : undefined;
        const stream = await aiService.generateStream(message, { provider: effectiveProvider, model: effectiveModel, messages: structuredMessages });
        endAiCall();

        stream.on('data', (chunk) => {
            res.write(`data: ${JSON.stringify({ text: chunk.toString() })}\n\n`);
        });
        stream.on('end', () => {
            res.write('data: [DONE]\n\n');
            res.end();
        });
        stream.on('error', (err) => {
            res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
            res.end();
        });
    } catch (err) {
        console.error("streamChat Error:", err);
        const statusCode = (
            err.code === 'AI_NOT_CONFIGURED' ||
            err.code === 'AI_PROVIDER_UNAVAILABLE'
        ) ? 503 : 500;
        res.status(statusCode).json({
            error: err.message || 'Streaming failed',
            code: err.code || 'AI_STREAM_FAILED'
        });
    }
};

exports.generateCareerPlan = async (req, res) => {
    try {
        const aiStartedAt = Date.now();
        let userProfile = profileCache.get(req.user.id);
        if (!userProfile) {
            const endProfileFetch = timer('profile_fetch_db');
            userProfile = await User.findById(req.user.id).lean();
            endProfileFetch();
            profileCache.set(req.user.id, userProfile);
        } else {
            console.log('[CACHE] profile_fetch: served from cache');
        }

        if (!userProfile) {
            return res.status(404).json({ message: "User not found" });
        }

                const prompt = [
                        CAREER_PLAN_SYSTEM_PROMPT,
                        `PROFILE SUMMARY:\n${buildCompactProfile(userProfile)}`,
                        `You MUST respond with only a valid JSON object. No markdown, no explanation, no extra text.`,
                        `Follow this exact schema:`,
                        JSON.stringify({
                                careerGoal: 'string - the main career goal',
                                milestones: [{ title: 'string', description: 'string', dueDate: 'string e.g. Month Year' }],
                                weeklyTasks: ['string', 'string'],
                                recommendedSkills: ['string', 'string'],
                                recommendedCourses: ['string', 'string'],
                                skillGapAnalysis: ['string - one gap per item'],
                        }, null, 2)
                ].join('\n\n');

        const preferredProvider = (process.env.CAREER_PATH_PROVIDER || '').toLowerCase();
        const { provider, model: roadmapModel } = getProvider('career path roadmap generation', preferredProvider);
        console.log(`[ROUTER] intent: roadmap -> provider: ${provider} -> model: ${roadmapModel}`);
        const endAiCall = timer('career_plan_ai_call');
        const result = await aiService.generate(prompt, {
            provider,
            model: roadmapModel,
            maxTokens: Number(process.env.CAREER_PATH_MAX_TOKENS || process.env.GROQ_MAX_COMPLETION_TOKENS || 2048)
        });
        endAiCall();
        const aiResponse = result && result.text ? result.text : String(result);

        let careerPlan;
        try {
            const raw = aiResponse.replace(/```json|```/g, '').trim();
            careerPlan = JSON.parse(raw);
        } catch (err) {
            return res.status(500).json({ error: 'AI returned invalid plan format. Please try again.' });
        }

        const endPlanSave = timer('career_plan_save');
        const savedPlan = await CareerPlan.findOneAndUpdate(
            { userId: req.user.id },
            {
                ...careerPlan,
                userId: req.user.id,
                providerUsed: result.providerUsed,
                lastUpdated: new Date()
            },
            { upsert: true, new: true }
        );
        endPlanSave();

        await saveAiLog({
            userId: req.user.id,
            endpoint: '/api/ai/generate-career-plan',
            provider: result.providerUsed || provider,
            model: result.modelUsed || roadmapModel || '',
            intent: 'roadmap',
            promptLength: prompt.length,
            responseLength: String(aiResponse || '').length,
            status: 'success',
            httpStatus: 200,
            latencyMs: Date.now() - aiStartedAt
        });

        res.json({
            success: true,
            answer: aiResponse,
            savedPlan
        });
    } catch (error) {
        console.error("Generate Career Plan Error:", error);
        const statusCode = (
            error.code === 'AI_NOT_CONFIGURED' ||
            error.code === 'AI_PROVIDER_UNAVAILABLE'
        ) ? 503 : 500;
        await saveAiLog({
            userId: req.user?.id || null,
            endpoint: '/api/ai/generate-career-plan',
            provider: process.env.CAREER_PATH_PROVIDER || process.env.AI_PROVIDER || 'groq',
            model: '',
            intent: 'roadmap',
            promptLength: 0,
            responseLength: 0,
            status: 'failed',
            httpStatus: statusCode,
            errorCode: error.code || 'AI_FAILED',
            errorMessage: error.message || 'AI service temporarily unavailable',
            latencyMs: 0
        });
        res.status(statusCode).json({
            success: false,
            code: error.code || "AI_FAILED",
            message: error.message || "AI service temporarily unavailable"
        });
    }
};

exports.getJobStatus = async (req, res) => {
    try {
        const jobId = req.params.jobId;
        if (!jobId) return res.status(400).json({ success: false, error: 'jobId required' });
        const status = await getJobStatus(String(jobId));
        if (!status) return res.status(404).json({ success: false, error: 'Job not found' });
        return res.json({ success: true, job: status });
    } catch (err) {
        console.error('getJobStatus error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const endHistoryFetch = timer('history_fetch');
        const messages = await Message.find({ userId }).sort({ timestamp: 1 });
        endHistoryFetch();
        res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error("Fetch History Error:", error);
        res.status(500).json({
            message: "Failed to fetch chat history",
            success: false
        });
    }
};
