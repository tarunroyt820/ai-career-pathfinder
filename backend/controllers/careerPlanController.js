const careerPlanService = require('../services/careerPlanService');
const { queueGenerateMilestones, queueRefreshRecommendations, getAIQueueStatus } = require('../queues/aiQueue');
const CareerPlan = require('../models/CareerPlan');
const recommendationService = require('../services/recommendationService');

/**
 * Create a new career plan.
 * POST /api/career-plans
 * Returns plan immediately, enqueues AI milestone generation asynchronously.
 */
exports.createPlan = async (req, res) => {
  try {
    // Validate auth
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, error: 'Unauthorized: missing user' });
    }

    const userId = req.user._id.toString();
    const { title, targetRole, timeframe, intensity } = req.body;

    // Validate required fields
    if (!title || !targetRole) {
      return res.status(400).json({ success: false, error: 'title and targetRole are required' });
    }

    const plan = await careerPlanService.createPlan(userId, { title, targetRole, timeframe, intensity });

    // Enqueue AI milestone generation (non-blocking)
    try {
      const userProfile = {
        experience: intensity ? `${intensity} intensity` : 'not specified',
        resume: '',
      };
      const queueResult = await queueGenerateMilestones(
        plan._id.toString(),
        userId,
        targetRole,
        userProfile
      );

      // If processed synchronously (fallback), return the updated plan
      if (queueResult && queueResult.processed) {
        const updatedPlan = await careerPlanService.getPlanById(plan._id.toString(), userId);
        return res.status(201).json({
          success: true,
          data: updatedPlan,
          message: 'Career plan created with recommendations in synchronous AI mode.',
          aiProcessing: {
            mode: queueResult.processingMode || 'synchronous',
            queued: false,
            processed: true,
            disabledReason: queueResult.reason || null,
            durationMs: queueResult.durationMs || null,
          },
        });
      }

      // If queued, persist the job id for status polling
      if (queueResult && queueResult.jobId) {
        try {
          await CareerPlan.findByIdAndUpdate(plan._id.toString(), { aiJobId: String(queueResult.jobId) });
        } catch (updErr) {
          console.warn('[CONTROLLER] Failed to persist aiJobId on plan:', updErr.message);
        }

        const updatedPlan = await careerPlanService.getPlanById(plan._id.toString(), userId);
        return res.status(202).json({
          success: true,
          data: updatedPlan,
          message: 'Career plan created. AI generation queued.',
          jobId: queueResult.jobId,
          aiProcessing: {
            mode: queueResult.processingMode || 'queued',
            queued: true,
            processed: false,
            disabledReason: null,
          },
        });
      }
    } catch (queueErr) {
      console.warn(`[CONTROLLER] Failed to queue AI job: ${queueErr.message}. Continuing.`);
      // Don't fail the request; AI can be generated later
    }

    const queueStatus = getAIQueueStatus();
    return res.status(201).json({
      success: true,
      data: plan,
      message: 'Career plan created. AI generation is in progress.',
      aiProcessing: {
        mode: queueStatus.processingMode,
        queued: false,
        processed: false,
        disabledReason: queueStatus.disabledReason,
      },
    });
  } catch (err) {
    console.error('createPlan error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get a single plan by ID.
 * GET /api/career-plans/:id
 */
exports.getPlan = async (req, res) => {
  try {
    // Validate auth
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, error: 'Unauthorized: missing user' });
    }

    const userId = req.user._id.toString();
    const planId = req.params.id;

    let plan = await careerPlanService.getPlanById(planId, userId);

    if (!plan.aiReady && (!Array.isArray(plan.milestones) || plan.milestones.length === 0)) {
      try {
        const hydratedPlan = await CareerPlan.findById(planId);
        if (hydratedPlan && hydratedPlan.userId.toString() === userId) {
          const repairedPlan = await recommendationService.refreshPlanAI(hydratedPlan, {
            experience: '',
            resume: '',
          });
          plan = repairedPlan.toObject();
        }
      } catch (repairErr) {
        console.warn(`[CONTROLLER] Failed to auto-repair stuck plan ${planId}: ${repairErr.message}`);
      }
    }

    return res.status(200).json({ success: true, data: plan });
  } catch (err) {
    console.error('getPlan error:', err);

    // Handle service errors with statusCode
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * List all plans for the authenticated user.
 * GET /api/career-plans
 */
exports.listPlans = async (req, res) => {
  try {
    // Validate auth
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, error: 'Unauthorized: missing user' });
    }

    const userId = req.user._id.toString();
    const plans = await careerPlanService.getUserPlans(userId);
    return res.status(200).json({ success: true, data: plans });
  } catch (err) {
    console.error('listPlans error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Update a plan (title, notes, status, etc).
 * PATCH /api/career-plans/:id
 */
exports.updatePlan = async (req, res) => {
  try {
    // Validate auth
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, error: 'Unauthorized: missing user' });
    }

    const userId = req.user._id.toString();
    const planId = req.params.id;
    const updateData = req.body;

    const plan = await careerPlanService.updatePlan(planId, userId, updateData);
    return res.status(200).json({ success: true, data: plan });
  } catch (err) {
    console.error('updatePlan error:', err);

    // Handle service errors with statusCode
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * Mark a milestone as complete.
 * POST /api/career-plans/:id/complete-milestone
 */
exports.completeMilestone = async (req, res) => {
  try {
    // Validate auth
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, error: 'Unauthorized: missing user' });
    }

    const userId = req.user._id.toString();
    const planId = req.params.id;
    const { milestoneId, evidence, notes } = req.body;

    // Validate required fields
    if (!milestoneId) {
      return res.status(400).json({ success: false, error: 'milestoneId is required' });
    }

    const plan = await careerPlanService.completeMilestone(
      planId,
      milestoneId,
      userId,
      { evidence, notes }
    );

    return res.status(200).json({ success: true, data: plan });
  } catch (err) {
    console.error('completeMilestone error:', err);

    // Handle service errors with statusCode
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * Refresh AI recommendations for a plan.
 * POST /api/career-plans/:id/refresh
 * Immediately returns; enqueues refresh job asynchronously.
 */
exports.refreshPlan = async (req, res) => {
  try {
    // Validate auth
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, error: 'Unauthorized: missing user' });
    }

    const userId = req.user._id.toString();
    const planId = req.params.id;

    // Verify plan exists and belongs to user
    const plan = await careerPlanService.getPlanById(planId, userId);
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    // Enqueue refresh job
    const userProfile = { experience: '', resume: '' };
    const queueResult = await queueRefreshRecommendations(planId, userId, userProfile);

    // Persist refresh job id when available
    if (queueResult && queueResult.jobId) {
      try {
        await CareerPlan.findByIdAndUpdate(planId, { aiLastRefreshJobId: String(queueResult.jobId) });
      } catch (updErr) {
        console.warn('[CONTROLLER] Failed to persist aiLastRefreshJobId on plan:', updErr.message);
      }
      return res.status(202).json({
        success: true,
        message: 'Plan refresh queued. Check back in a few seconds for updated recommendations.',
        jobId: queueResult.jobId,
        aiProcessing: {
          mode: queueResult.processingMode || 'queued',
          queued: true,
          processed: false,
          disabledReason: null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Plan refresh processed synchronously.',
      aiProcessing: {
        mode: queueResult?.processingMode || 'synchronous',
        queued: false,
        processed: true,
        disabledReason: queueResult?.reason || null,
        durationMs: queueResult?.durationMs || null,
      },
    });
  } catch (err) {
    console.error('refreshPlan error:', err);

    // Handle service errors with statusCode
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};
