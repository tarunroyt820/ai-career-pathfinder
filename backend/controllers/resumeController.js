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
	aiResult = await aiService.generate(analysisPrompt, {
		provider: 'huggingface',
		model: getResumeModel(),
		useSecondaryKey: true,
	});

	if (!String(aiResult?.text || '').trim()) {
		const retryPrompt = [
			systemInstruction,
			'Return ONLY valid JSON. Do not leave response empty.',
			`RESUME_TEXT:\n${extractedText.slice(0, 12000)}`,
		].join('\n\n');

		const preferredProvider = aiResult?.providerUsed || 'huggingface';
		aiResult = await aiService.generate(retryPrompt, {
			provider: preferredProvider,
			model: getResumeModel(),
			useSecondaryKey: true,
		});
	}

	if (!String(aiResult?.text || '').trim()) {
		throw new Error('AI returned an empty analysis response. Please click Analyze Resume again.');
	}

	let analysis = null;
	try {
		analysis = parseAnalysisJson(aiResult.text);
	} catch (parseError) {
		console.warn(`[RESUME] Structured JSON parse failed, returning raw analysis. ${parseError.message}`);
	}

	return {
		analysis,
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
			message: 'Resume uploaded successfully',
			providerUsed: analysisResult.providerUsed,
			modelUsed: analysisResult.modelUsed,
			analysis: analysisResult.analysis,
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
			message: 'Resume analyzed successfully',
			providerUsed: analysisResult.providerUsed,
			modelUsed: analysisResult.modelUsed,
			analysis: analysisResult.analysis,
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
