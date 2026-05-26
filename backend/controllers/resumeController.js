const path = require('path');
const fs = require('fs/promises');
const aiService = require('../services/ai/ai.service');
const ResumeUploadLog = require('../models/ResumeUploadLog');
const { RESUME_ANALYSIS_PROMPT, JOB_TARGETED_ANALYSIS_PROMPT } = require('../services/ai/prompts/resumeAnalysis.prompt');
const { extractResumeText } = require('../services/resumeTextExtractor');

const uploadsDir = path.join(__dirname, '..', 'uploads');
const getResumeModel = () =>
	process.env.HF_RESUME_MODEL ||
	process.env.HF_HEAVY_MODEL ||
	process.env.HF_MODEL ||
	process.env.HF_SKILLGAP_MODEL;

const parseAnalysisJson = (raw) => {
	const value = String(raw || '').trim();
	if (!value) return null;

	const noFence = value.replace(/```json|```/gi, '').trim();
	try {
		return JSON.parse(noFence);
	} catch {
		const first = noFence.indexOf('{');
		const last = noFence.lastIndexOf('}');
		if (first >= 0 && last > first) {
			return JSON.parse(noFence.slice(first, last + 1));
		}
		throw new Error('AI did not return valid JSON analysis');
	}
};

const normalizeParsedAnalysis = (parsed) => {
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		throw new Error('Normalized analysis must be a JSON object');
	}

	const asList = (value) => Array.isArray(value)
		? value.map((item) => String(item || '').trim()).filter(Boolean)
		: [];
	const asString = (value) => (value == null ? '' : String(value).trim());
	const asNumber = (value) => {
		const numeric = Number(value);
		return Number.isFinite(numeric) ? Math.max(0, Math.min(100, numeric)) : 0;
	};

	const scores = parsed.scores && typeof parsed.scores === 'object' ? parsed.scores : {};
	const keywords = parsed.keywords && typeof parsed.keywords === 'object' ? parsed.keywords : {};
	const impactReview = parsed.impactReview && typeof parsed.impactReview === 'object' ? parsed.impactReview : {};
	const formatting = parsed.formatting && typeof parsed.formatting === 'object' ? parsed.formatting : {};
	const technicalSkills = parsed.technicalSkills && typeof parsed.technicalSkills === 'object' ? parsed.technicalSkills : {};
	const jobRoleMatching = parsed.jobRoleMatching && typeof parsed.jobRoleMatching === 'object' ? parsed.jobRoleMatching : {};

	return {
		scores: {
			atsCompatibility: asNumber(scores.atsCompatibility),
			contentStrength: asNumber(scores.contentStrength),
			impactAchievements: asNumber(scores.impactAchievements),
			keywordOptimization: asNumber(scores.keywordOptimization),
			formattingClarity: asNumber(scores.formattingClarity),
			overallScore: asNumber(scores.overallScore || scores.atsCompatibility),
		},
		summary: asString(parsed.summary),
		overallEvaluation: asString(parsed.overallEvaluation),
		strengths: asList(parsed.strengths),
		weaknesses: asList(parsed.weaknesses),
		sections: Array.isArray(parsed.sections)
			? parsed.sections.map((section) => ({
				name: asString(section?.name),
				score: asNumber(section?.score),
				status: asString(section?.status),
				issues: asList(section?.issues),
				suggestions: asList(section?.suggestions),
			}))
			: [],
		keywords: {
			present: asList(keywords.present),
			missing: asList(keywords.missing),
			density: Number(keywords.density) || 0,
			recommendations: asList(keywords.recommendations),
		},
		impactReview: {
			metricsUsed: asString(impactReview.metricsUsed),
			weakStatements: asList(impactReview.weakStatements),
			improvedExamples: asList(impactReview.improvedExamples),
		},
		formatting: {
			issues: Array.isArray(formatting.issues)
				? formatting.issues.map((issue) => ({
					type: asString(issue?.type),
					severity: asString(issue?.severity),
					description: asString(issue?.description),
					fix: asString(issue?.fix),
				}))
				: [],
		},
		technicalSkills: {
			detected: asList(technicalSkills.detected),
			skillLevel: asString(technicalSkills.skillLevel),
			missing: asList(technicalSkills.missing),
			suggestions: asList(technicalSkills.suggestions),
		},
		jobRoleMatching: {
			bestFitRole: asString(jobRoleMatching.bestFitRole),
			matchLevel: asString(jobRoleMatching.matchLevel),
			gaps: asList(jobRoleMatching.gaps),
			suggestions: asList(jobRoleMatching.suggestions),
		},
		improvements: Array.isArray(parsed.improvements)
			? parsed.improvements.map((item) => ({
				section: asString(item?.section),
				original: asString(item?.original),
				improved: asString(item?.improved),
				reason: asString(item?.reason),
				priority: asString(item?.priority),
			}))
			: [],
		actionPlan: asList(parsed.actionPlan),
		estimatedATSPassRate: asString(parsed.estimatedATSPassRate),
		estimatedATSPassRateAfterFixes: asString(parsed.estimatedATSPassRateAfterFixes),
		finalInsight: asString(parsed.finalInsight),
	};
};

const repairAnalysisJson = async (rawText, systemInstruction, providerUsed, modelUsed) => {
	const repairPrompt = [
		systemInstruction,
		'Your previous response was malformed or incomplete JSON.',
		'Repair it and return ONLY one valid JSON object that matches the required schema.',
		'Do not add markdown fences, explanations, or extra text.',
		`BROKEN_RESPONSE:\n${String(rawText || '').slice(0, 14000)}`,
	].join('\n\n');

	const options = providerUsed
		? { provider: providerUsed, model: modelUsed || getResumeModel() }
		: undefined;

	const repairedResult = await aiService.generate(repairPrompt, options);
	return String(repairedResult?.text || '').trim();
};

const analyzeResumeFile = async (filePath, mimeType, targetRole = '') => {
	const extractedText = await extractResumeText(filePath, mimeType);
	if (!extractedText || extractedText.length < 40) {
		throw new Error('Could not read enough text from resume. Use a clear text-based PDF or DOCX.');
	}

	const systemInstruction = targetRole
		? JOB_TARGETED_ANALYSIS_PROMPT(targetRole)
		: RESUME_ANALYSIS_PROMPT;

	const analysisPrompt = [
		systemInstruction,
		'Resume content starts below. Analyze it now and return JSON only.',
		`RESUME_TEXT:\n${extractedText.slice(0, 15000)}`,
	].join('\n\n');

	let aiResult;
	// Try Hugging Face explicitly first (preferred for resume parsing), but
	// fall back to the default configured provider if HF is not configured or fails.
	try {
		aiResult = await aiService.generate(analysisPrompt, {
			provider: 'huggingface',
			model: getResumeModel(),
			useSecondaryKey: true,
		});
	} catch (hfError) {
		console.warn('[RESUME] HuggingFace analysis failed or not configured:', hfError?.message || hfError);
		try {
			aiResult = await aiService.generate(analysisPrompt);
		} catch (fallbackError) {
			console.error('[RESUME] Fallback provider also failed:', fallbackError?.message || fallbackError);
			throw fallbackError;
		}
	}

	if (!String(aiResult?.text || '').trim()) {
		const retryPrompt = [
			systemInstruction,
			'Return ONLY valid JSON. Do not leave response empty.',
			`RESUME_TEXT:\n${extractedText.slice(0, 12000)}`,
		].join('\n\n');

		const preferredProvider = aiResult?.providerUsed || undefined;
		try {
			aiResult = await aiService.generate(retryPrompt, preferredProvider ? { provider: preferredProvider, model: getResumeModel() } : undefined);
		} catch (retryError) {
			console.error('[RESUME] Retry attempt failed:', retryError?.message || retryError);
			throw retryError;
		}
	}

	if (!String(aiResult?.text || '').trim()) {
		throw new Error('AI returned an empty analysis response. Please click Analyze Resume again.');
	}

	let analysis = null;
	let structured = true;
	let parseWarning = '';
	try {
		analysis = normalizeParsedAnalysis(parseAnalysisJson(aiResult.text));
	} catch (parseError) {
		console.warn(`[RESUME] Initial structured JSON parse failed. ${parseError.message}`);
		try {
			analysis = normalizeParsedAnalysis(parseAnalysisJson(String(aiResult.text || '').replace(/,\s*([}\]])/g, '$1')));
			parseWarning = 'AI response required lightweight JSON normalization before rendering.';
		} catch (normalizationError) {
			console.warn(`[RESUME] Lightweight normalization failed. ${normalizationError.message}`);
			try {
				const repairedText = await repairAnalysisJson(
					aiResult.text,
					systemInstruction,
					aiResult?.providerUsed,
					aiResult?.modelUsed,
				);
				analysis = normalizeParsedAnalysis(parseAnalysisJson(repairedText));
				aiResult = {
					...aiResult,
					text: repairedText,
				};
				parseWarning = 'AI response was auto-repaired before rendering.';
			} catch (repairError) {
				structured = false;
				parseWarning = 'AI generated feedback, but structured analysis could not be parsed.';
				console.warn(`[RESUME] Structured JSON repair failed, returning raw analysis. ${repairError.message}`);
			}
		}
	}

	return {
		analysis,
		structured,
		parseWarning,
		analysisRaw: aiResult.text,
		providerUsed: aiResult.providerUsed,
		modelUsed: aiResult.modelUsed,
	};
};

exports.uploadResume = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({
				success: false,
				message: 'Resume file is required'
			});
		}

		const fileUrl = `/uploads/${req.file.filename}`;
		const targetRole = String(req.body?.targetRole || '').trim();
		const analysisResult = await analyzeResumeFile(req.file.path, req.file.mimetype, targetRole);

		await ResumeUploadLog.create({
			userId: req.user._id || req.user.id,
			originalName: req.file.originalname,
			fileName: req.file.filename,
			mimeType: req.file.mimetype,
			size: req.file.size,
			targetRole,
			providerUsed: analysisResult.providerUsed || '',
			modelUsed: analysisResult.modelUsed || ''
		});

		return res.status(200).json({
			success: true,
			message: analysisResult.structured
				? 'Resume uploaded and analyzed successfully'
				: 'Resume uploaded and analyzed with fallback feedback',
			providerUsed: analysisResult.providerUsed,
			modelUsed: analysisResult.modelUsed,
			analysis: analysisResult.analysis,
			structured: analysisResult.structured,
			parseWarning: analysisResult.parseWarning,
			analysisRaw: analysisResult.analysisRaw,
			file: {
				originalName: req.file.originalname,
				fileName: req.file.filename,
				mimeType: req.file.mimetype,
				size: req.file.size,
				extension: path.extname(req.file.originalname).toLowerCase(),
				url: fileUrl,
			},
		});
	} catch (error) {
		console.error('Resume upload error:', error);
		return res.status(500).json({
			success: false,
			message: error?.message || 'Failed to upload and analyze resume'
		});
	}
};

exports.analyzeResume = async (req, res) => {
	try {
		const fileName = String(req.body?.fileName || '').trim();
		const targetRole = String(req.body?.targetRole || '').trim();

		if (!fileName) {
			return res.status(400).json({ success: false, message: 'fileName is required' });
		}

		const safeFileName = path.basename(fileName);
		const filePath = path.join(uploadsDir, safeFileName);

		await fs.access(filePath);

		const analysisResult = await analyzeResumeFile(filePath, '', targetRole);

		return res.status(200).json({
			success: true,
			message: analysisResult.structured
				? 'Resume analyzed successfully'
				: 'Resume analyzed with fallback feedback',
			providerUsed: analysisResult.providerUsed,
			modelUsed: analysisResult.modelUsed,
			analysis: analysisResult.analysis,
			structured: analysisResult.structured,
			parseWarning: analysisResult.parseWarning,
			analysisRaw: analysisResult.analysisRaw,
		});
	} catch (error) {
		console.error('Resume analysis error:', error);
		return res.status(500).json({
			success: false,
			message: error?.message || 'Failed to analyze resume'
		});
	}
};
