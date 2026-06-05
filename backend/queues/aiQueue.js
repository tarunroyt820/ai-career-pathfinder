/**
 * AI Job Queue using BullMQ
 * Handles asynchronous AI tasks like generating milestones and recommendations
 * 
 * Prerequisites:
 * - Install: npm install bullmq redis
 * - Set REDIS_URL in .env (default: redis://localhost:6379)
 * 
 * Usage:
 *   const { aiQueue } = require('./aiQueue');
 *   aiQueue.add('generateMilestones', { planId, targetRole, userProfile });
 */

let Queue;
try {
  Queue = require('bullmq').Queue;
} catch (err) {
  console.warn(
    '[AI QUEUE] BullMQ not installed. Install with: npm install bullmq redis'
  );
  Queue = null;
}

const recommendationService = require('../services/recommendationService');
const CareerPlan = require('../models/CareerPlan');

const REDIS_URL = process.env.REDIS_URL;
const AI_QUEUE_NAME = 'career-ai-jobs';

let aiQueue = null;
let aiWorker = null;
let queueDisabledReason = null;

function isQueueOperational() {
  return Boolean(aiQueue) && !queueDisabledReason;
}

function getAIQueueStatus() {
  return {
    available: isQueueOperational(),
    processingMode: isQueueOperational() ? 'queued' : 'synchronous',
    disabledReason: isQueueOperational() ? null : (queueDisabledReason || 'not_initialized'),
  };
}

async function disableQueueRuntime(reason, err) {
  const queueRef = aiQueue;
  const workerRef = aiWorker;

  aiQueue = null;
  aiWorker = null;
  queueDisabledReason = reason;

  if (workerRef) {
    try {
      await workerRef.close();
    } catch (closeErr) {
      console.warn(`[AI QUEUE] Failed to close worker after runtime failure: ${closeErr.message}`);
    }
  }

  if (queueRef) {
    try {
      await queueRef.close();
    } catch (closeErr) {
      console.warn(`[AI QUEUE] Failed to close queue after runtime failure: ${closeErr.message}`);
    }
  }

  if (err) {
    console.error(`[AI QUEUE] Queue disabled (${reason}): ${err.message}`);
  }
}

async function runSynchronousFallback(label, processor) {
  const startedAt = Date.now();
  const status = getAIQueueStatus();
  const reason = status.disabledReason || 'queue_unavailable';

  console.warn(`[AI QUEUE] ${label} running synchronously (${reason}).`);

  await processor();

  const durationMs = Date.now() - startedAt;
  console.log(`[AI QUEUE] ${label} synchronous fallback completed in ${durationMs}ms.`);

  return {
    queued: false,
    processed: true,
    processingMode: 'synchronous',
    reason,
    durationMs,
  };
}

/**
 * Initialize the AI queue and worker
 */
async function initializeQueue() {
  if (!Queue) {
    console.warn('[AI QUEUE] BullMQ not available. Using in-memory fallback.');
    queueDisabledReason = 'bullmq_unavailable';
    return;
  }

  if (process.env.DISABLE_AI_QUEUE === 'true') {
    console.warn('[AI QUEUE] Disabled via DISABLE_AI_QUEUE=true. Using synchronous fallback.');
    queueDisabledReason = 'disabled_by_env';
    return;
  }

  if (!REDIS_URL) {
    console.warn('[AI QUEUE] REDIS_URL not set. Using synchronous fallback for local development.');
    queueDisabledReason = 'missing_redis_url';
    return;
  }

  try {
    aiQueue = new Queue(AI_QUEUE_NAME, { connection: { url: REDIS_URL } });
    await aiQueue.waitUntilReady();
    queueDisabledReason = null;
    console.log(`[AI QUEUE] Queue initialized: ${AI_QUEUE_NAME}`);

    // Set up worker process
    await setupWorker();
  } catch (err) {
    console.error(`[AI QUEUE] Failed to initialize queue: ${err.message}`);
    await disableQueueRuntime('queue_init_failed', err);
  }
}

/**
 * Set up worker to process AI jobs
 */
async function setupWorker() {
  if (!Queue) return;

  try {
    const { Worker } = require('bullmq');

    aiWorker = new Worker(
      AI_QUEUE_NAME,
      async (job) => {
        console.log(`[AI QUEUE WORKER] Processing job: ${job.name} (ID: ${job.id})`);

        try {
          const { data } = job;

          if (job.name === 'generateMilestones') {
            return await processGenerateMilestones(data);
          }

          if (job.name === 'refreshRecommendations') {
            return await processRefreshRecommendations(data);
          }

          throw new Error(`Unknown job type: ${job.name}`);
        } catch (err) {
          console.error(`[AI QUEUE WORKER] Job failed: ${err.message}`);
          throw err;
        }
      },
      { connection: { url: REDIS_URL } }
    );

    await aiWorker.waitUntilReady();

    console.log('[AI QUEUE WORKER] Worker started');

    aiWorker.on('error', (err) => {
      if (queueDisabledReason !== 'worker_runtime_error') {
        console.error(`[AI QUEUE WORKER] Redis unavailable, falling back to synchronous mode: ${err.message}`);
      }
      void disableQueueRuntime('worker_runtime_error', err);
    });

    aiWorker.on('completed', (job) => {
      console.log(`[AI QUEUE WORKER] Job completed: ${job.name} (ID: ${job.id})`);
    });

    aiWorker.on('failed', (job, err) => {
      console.error(
        `[AI QUEUE WORKER] Job failed: ${job.name} (ID: ${job.id}) - ${err.message}`
      );
    });
  } catch (err) {
    console.error(`[AI QUEUE] Failed to setup worker: ${err.message}`);
    await disableQueueRuntime('worker_init_failed', err);
  }
}

/**
 * Process generateMilestones job
 */
async function processGenerateMilestones(data) {
  const { planId, userId, targetRole, userProfile } = data;

  if (!planId || !userId) {
    throw new Error('planId and userId are required');
  }

  // Fetch plan and verify ownership
  const plan = await CareerPlan.findById(planId);
  if (!plan) {
    throw new Error(`Plan not found: ${planId}`);
  }

  if (plan.userId.toString() !== userId) {
    throw new Error(`Unauthorized: plan does not belong to user`);
  }

  // Generate milestones using AI
  const milestones = await recommendationService.generateMilestones(
    targetRole,
    userProfile,
    []
  );
  const roadmap = recommendationService.buildRoadmapFromMilestones(
    targetRole,
    milestones
  );
  const recommendations = await recommendationService.generateRecommendations(
    {
      ...plan.toObject(),
      milestones,
      roadmap,
    },
    userProfile
  );

  // Update plan with generated milestones
  plan.milestones = milestones;
  plan.roadmap = roadmap;
  plan.recommendations = recommendations;
  plan.aiReady = true;
  plan.aiGeneratedAt = new Date();
  plan.aiLastRefreshAt = new Date();

  await plan.save();

  console.log(
    `[AI QUEUE] Successfully generated ${milestones.length} milestones for plan ${planId}`
  );

  return {
    success: true,
    planId,
    milestonesCount: milestones.length,
  };
}

/**
 * Process refreshRecommendations job
 */
async function processRefreshRecommendations(data) {
  const { planId, userId, userProfile } = data;

  if (!planId || !userId) {
    throw new Error('planId and userId are required');
  }

  // Fetch plan and verify ownership
  const plan = await CareerPlan.findById(planId);
  if (!plan) {
    throw new Error(`Plan not found: ${planId}`);
  }

  if (plan.userId.toString() !== userId) {
    throw new Error(`Unauthorized: plan does not belong to user`);
  }

  // Refresh using AI service
  const updated = await recommendationService.refreshPlanAI(plan, userProfile);

  console.log(
    `[AI QUEUE] Successfully refreshed recommendations for plan ${planId}`
  );

  return {
    success: true,
    planId,
    milestonesCount: updated.milestones.length,
    recommendationsCount: updated.recommendations.length,
  };
}

/**
 * Queue a job to generate milestones for a new plan
 */
async function queueGenerateMilestones(planId, userId, targetRole, userProfile = {}) {
  if (!isQueueOperational()) {
    return runSynchronousFallback('generateMilestones', async () => {
      const plan = await CareerPlan.findById(planId);
      if (!plan) {
        return;
      }

      const milestones = await recommendationService.generateMilestones(
        targetRole,
        userProfile,
        []
      );
      const roadmap = recommendationService.buildRoadmapFromMilestones(
        targetRole,
        milestones
      );
      const recommendations = await recommendationService.generateRecommendations(
        {
          ...plan.toObject(),
          milestones,
          roadmap,
        },
        userProfile
      );
      plan.milestones = milestones;
      plan.roadmap = roadmap;
      plan.recommendations = recommendations;
      plan.aiReady = true;
      plan.aiGeneratedAt = new Date();
      plan.aiLastRefreshAt = new Date();
      await plan.save();
    });
  }

  try {
    const job = await aiQueue.add('generateMilestones', {
      planId,
      userId,
      targetRole,
      userProfile,
    });

    console.log(`[AI QUEUE] Queued generateMilestones job (ID: ${job.id})`);
    return { queued: true, jobId: job.id, processingMode: 'queued', reason: null };
  } catch (err) {
    console.error(`[AI QUEUE] Failed to queue job: ${err.message}`);
    await disableQueueRuntime('queue_add_failed', err);
    return runSynchronousFallback('generateMilestones', async () => {
      const plan = await CareerPlan.findById(planId);
      if (!plan) {
        return;
      }

      const milestones = await recommendationService.generateMilestones(
        targetRole,
        userProfile,
        []
      );
      const roadmap = recommendationService.buildRoadmapFromMilestones(
        targetRole,
        milestones
      );
      const recommendations = await recommendationService.generateRecommendations(
        {
          ...plan.toObject(),
          milestones,
          roadmap,
        },
        userProfile
      );
      plan.milestones = milestones;
      plan.roadmap = roadmap;
      plan.recommendations = recommendations;
      plan.aiReady = true;
      plan.aiGeneratedAt = new Date();
      plan.aiLastRefreshAt = new Date();
      await plan.save();
    });
  }
}

/**
 * Queue a job to refresh recommendations for a plan
 */
async function queueRefreshRecommendations(planId, userId, userProfile = {}) {
  if (!isQueueOperational()) {
    return runSynchronousFallback('refreshRecommendations', async () => {
      const plan = await CareerPlan.findById(planId);
      if (!plan) {
        return;
      }

      await recommendationService.refreshPlanAI(plan, userProfile);
    });
  }

  try {
    const job = await aiQueue.add('refreshRecommendations', {
      planId,
      userId,
      userProfile,
    });

    console.log(`[AI QUEUE] Queued refreshRecommendations job (ID: ${job.id})`);
    return { queued: true, jobId: job.id, processingMode: 'queued', reason: null };
  } catch (err) {
    console.error(`[AI QUEUE] Failed to queue job: ${err.message}`);
    await disableQueueRuntime('queue_add_failed', err);
    return runSynchronousFallback('refreshRecommendations', async () => {
      const plan = await CareerPlan.findById(planId);
      if (!plan) {
        return;
      }

      await recommendationService.refreshPlanAI(plan, userProfile);
    });
  }
}

/**
 * Get job status
 */
async function getJobStatus(jobId) {
  if (!isQueueOperational()) {
    const status = getAIQueueStatus();
    return {
      id: jobId,
      name: null,
      state: 'unavailable',
      progress: 100,
      data: null,
      result: null,
      processingMode: status.processingMode,
      disabledReason: status.disabledReason,
    };
  }

  try {
    const job = await aiQueue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();
    const progress = job._progress;

    return {
      id: job.id,
      name: job.name,
      state,
      progress,
      data: job.data,
      result: job.returnvalue,
    };
  } catch (err) {
    console.error(`[AI QUEUE] Failed to get job status: ${err.message}`);
    return null;
  }
}

/**
 * Cleanup queue and worker
 */
async function closeQueue() {
  if (aiWorker) {
    await aiWorker.close();
    console.log('[AI QUEUE] Worker closed');
  }

  if (aiQueue) {
    await aiQueue.close();
    console.log('[AI QUEUE] Queue closed');
  }
}

module.exports = {
  initializeQueue,
  setupWorker,
  queueGenerateMilestones,
  queueRefreshRecommendations,
  getJobStatus,
  getAIQueueStatus,
  closeQueue,
  aiQueue,
};
