const aiService = require('./ai/ai.service');
const { CAREER_PLAN_SYSTEM_PROMPT } = require('./ai/prompts/careerPlan.prompt');
const { getProvider } = require('../utils/providerRouter');

const CAREER_PATH_MAX_TOKENS = Number(process.env.CAREER_PATH_MAX_TOKENS || 2048);

/**
 * Fallback rule-based milestones when AI fails or returns invalid JSON.
 * Used as a safe default to ensure users always get recommendations.
 * @param {string} targetRole - The target role name
 * @returns {array} Array of milestone objects
 */
function getFallbackMilestones(targetRole) {
  const roleLower = (targetRole || '').toLowerCase();

  // Generic milestones for any role
  const genericMilestones = [
    {
      title: `Learn fundamentals of ${targetRole}`,
      type: 'skill',
      estimateHours: 40,
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      notes: 'Build foundational knowledge for the role',
      source: 'RULE',
    },
    {
      title: `Build a portfolio project for ${targetRole}`,
      type: 'project',
      estimateHours: 80,
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
      notes: 'Create a real-world example demonstrating your skills',
      source: 'RULE',
    },
    {
      title: `Get a relevant certification or course completion`,
      type: 'certification',
      estimateHours: 30,
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      notes: 'Demonstrate formal training in a key area',
      source: 'RULE',
    },
  ];

  return genericMilestones;
}

/**
 * Generate milestones using AI with robust error handling and fallback.
 * @async
 * @param {string} targetRole - Target career role (required)
 * @param {object} userProfile - User profile object { skills: [], experience: [], resume: '' }
 * @param {array} existingSkills - Array of user's existing skills
 * @returns {Promise<array>} Array of milestone objects with source and modelVersion
 */
async function generateMilestones(targetRole, userProfile = {}, existingSkills = []) {
  if (!targetRole) {
    throw new Error('targetRole is required');
  }

  const startTime = Date.now();

  try {
    // Build the user prompt with provided information
    const userPrompt = [
      `Generate 5 actionable milestones for: ${targetRole}`,
      `Skills: ${existingSkills.slice(0, 8).join(', ') || 'Not specified'}`,
      `Experience: ${userProfile.experience || 'Not provided'}`,
      `Resume summary: ${String(userProfile.resume || 'Not provided').slice(0, 120)}`,
      'Return ONLY valid JSON array. Keep each milestone concise and practical.'
    ].join('\n');

    console.log(`[RECOMMENDATION SERVICE] Generating milestones for ${targetRole}...`);

    // Call AI with the career plan system prompt
    const preferredProvider = (process.env.CAREER_PATH_PROVIDER || '').toLowerCase();
    const { provider, model } = getProvider('career path roadmap generation', preferredProvider);
    const aiResponse = await aiService.generate(userPrompt, {
      provider,
      model,
      maxTokens: CAREER_PATH_MAX_TOKENS,
    });

    console.log(`[RECOMMENDATION SERVICE] AI call completed in ${Date.now() - startTime}ms`);

    // Parse AI response
    let parsedMilestones;
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      parsedMilestones = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.warn(
        `[RECOMMENDATION SERVICE] Failed to parse AI response: ${parseErr.message}. Using fallback.`
      );
      parsedMilestones = getFallbackMilestones(targetRole);
    }

    // Validate and normalize milestones
    if (!Array.isArray(parsedMilestones)) {
      parsedMilestones = getFallbackMilestones(targetRole);
    }

    // Ensure all required fields and add source info
    const milestones = parsedMilestones.map((m, index) => ({
      title: m.title || `Milestone ${index + 1}`,
      type: m.type || 'skill',
      estimateHours: m.estimateHours || 20,
      priority: (m.priority || 'MEDIUM').toUpperCase(),
      dueDate: m.dueDate || new Date(Date.now() + (30 + index * 20) * 24 * 60 * 60 * 1000).toISOString(),
      notes: m.notes || m.reason || '',
      completed: false,
      evidence: [],
      source: 'AI',
    }));

    console.log(`[RECOMMENDATION SERVICE] Generated ${milestones.length} milestones`);
    return milestones;
  } catch (err) {
    console.error(`[RECOMMENDATION SERVICE] Error generating milestones: ${err.message}`);
    console.log('[RECOMMENDATION SERVICE] Using fallback milestones');
    return getFallbackMilestones(targetRole);
  }
}

/**
 * Generate recommendations (resources, skill gaps, etc) using AI.
 * @async
 * @param {object} plan - CareerPlan document
 * @param {object} userProfile - User profile object
 * @returns {Promise<array>} Array of recommendation objects
 */
async function generateRecommendations(plan, userProfile = {}) {
  if (!plan || !plan.targetRole) {
    throw new Error('plan with targetRole is required');
  }

  const startTime = Date.now();

  try {
    const userPrompt = [
      `Analyze the career transition to: ${plan.targetRole}`,
      `Milestones: ${plan.milestones.slice(0, 5).map((m) => m.title).join(', ') || 'None yet'}`,
      `Experience: ${userProfile.experience || 'not specified'}`,
      'Return ONLY valid JSON with skillGaps, resources, insights, and timelineAssessment.',
    ].join('\n');

    console.log(`[RECOMMENDATION SERVICE] Generating recommendations for ${plan.targetRole}...`);

    const preferredProvider = (process.env.CAREER_PATH_PROVIDER || '').toLowerCase();
    const { provider, model } = getProvider('career path roadmap generation', preferredProvider);
    const aiResponse = await aiService.generate(userPrompt, {
      provider,
      model,
      maxTokens: CAREER_PATH_MAX_TOKENS,
    });

    console.log(`[RECOMMENDATION SERVICE] Recommendations call completed in ${Date.now() - startTime}ms`);

    // Parse response
    let recommendations;
    try {
      const jsonMatch = aiResponse.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }

      recommendations = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.warn(
        `[RECOMMENDATION SERVICE] Failed to parse recommendations: ${parseErr.message}`
      );
      return [];
    }

    // Transform into Recommendation schema format
    const recommendationDocs = [];

    // Add skill gaps
    if (Array.isArray(recommendations.skillGaps)) {
      recommendationDocs.push(
        ...recommendations.skillGaps.map((sg) => ({
          source: 'AI',
          type: 'SKILL_GAP',
          payload: sg,
          confidence: 0.85,
          modelVersion: aiResponse.modelUsed,
        }))
      );
    }

    // Add resources
    if (Array.isArray(recommendations.resources)) {
      recommendationDocs.push(
        ...recommendations.resources.map((r) => ({
          source: 'AI',
          type: 'RESOURCE',
          payload: r,
          confidence: 0.8,
          modelVersion: aiResponse.modelUsed,
        }))
      );
    }

    // Add insights
    if (recommendations.insights) {
      recommendationDocs.push({
        source: 'AI',
        type: 'MARKET_INSIGHT',
        payload: recommendations.insights,
        confidence: 0.75,
        modelVersion: aiResponse.modelUsed,
      });
    }

    console.log(`[RECOMMENDATION SERVICE] Generated ${recommendationDocs.length} recommendations`);
    return recommendationDocs;
  } catch (err) {
    console.error(`[RECOMMENDATION SERVICE] Error generating recommendations: ${err.message}`);
    return [];
  }
}

/**
 * Refresh a plan's milestones and recommendations from AI.
 * @async
 * @param {object} plan - CareerPlan document
 * @param {object} userProfile - User profile object
 * @returns {Promise<object>} Updated plan object
 */
async function refreshPlanAI(plan, userProfile = {}) {
  if (!plan || !plan.targetRole) {
    throw new Error('plan with targetRole is required');
  }

  try {
    console.log(`[RECOMMENDATION SERVICE] Refreshing plan ${plan._id} for ${plan.targetRole}`);

    // Generate new milestones and recommendations
    const milestones = await generateMilestones(plan.targetRole, userProfile, []);
    const recommendations = await generateRecommendations(plan, userProfile);

    // Update plan
    plan.milestones = milestones;
    plan.recommendations = recommendations;
    plan.aiReady = true;
    plan.aiLastRefreshAt = new Date();

    await plan.save();

    console.log(`[RECOMMENDATION SERVICE] Plan refreshed successfully`);
    return plan;
  } catch (err) {
    console.error(`[RECOMMENDATION SERVICE] Error refreshing plan: ${err.message}`);
    throw err;
  }
}

module.exports = {
  generateMilestones,
  generateRecommendations,
  refreshPlanAI,
  getFallbackMilestones,
};
