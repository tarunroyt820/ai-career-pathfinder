const aiService = require('./ai/ai.service');
const { CAREER_PLAN_SYSTEM_PROMPT } = require('./ai/prompts/careerPlan.prompt');
const { getProvider } = require('../utils/providerRouter');

const CAREER_PATH_MAX_TOKENS = Number(process.env.CAREER_PATH_MAX_TOKENS || 2048);

function slugifyNodeId(value, fallback = 'node') {
  return String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || fallback;
}

function buildRoadmapFromMilestones(targetRole, milestones = []) {
  const startNodeId = `start-${slugifyNodeId(targetRole, 'career')}`;
  const destinationNodeId = `destination-${slugifyNodeId(targetRole, 'career')}`;
  const nodes = [
    {
      nodeId: startNodeId,
      label: milestones[0]?.title || `Start ${targetRole}`,
      type: 'start',
      description: `Your starting point for becoming a ${targetRole}.`,
      estimateHours: milestones[0]?.estimateHours || 0,
      priority: 'HIGH',
      order: 0,
      milestoneId: milestones[0]?._id ? String(milestones[0]._id) : null,
    },
  ];

  const roadmapMilestones = milestones.map((milestone, index) => ({
    nodeId: `milestone-${slugifyNodeId(milestone.title, `step-${index + 1}`)}`,
    label: milestone.title,
    type: index === milestones.length - 1 ? 'specialization' : 'milestone',
    description: milestone.notes || `Build ${milestone.title} on your way to ${targetRole}.`,
    estimateHours: milestone.estimateHours || 0,
    priority: milestone.priority || 'MEDIUM',
    order: index + 1,
    milestoneId: milestone._id ? String(milestone._id) : null,
  }));

  nodes.push(...roadmapMilestones);
  nodes.push({
    nodeId: destinationNodeId,
    label: targetRole,
    type: 'destination',
    description: `End destination: become job-ready for ${targetRole}.`,
    estimateHours: 0,
    priority: 'HIGH',
    order: roadmapMilestones.length + 1,
    milestoneId: null,
  });

  const edges = [];
  for (let index = 0; index < nodes.length - 1; index += 1) {
    edges.push({
      from: nodes[index].nodeId,
      to: nodes[index + 1].nodeId,
      label: index === nodes.length - 2 ? 'Launch' : 'Next step',
    });
  }

  return {
    title: `${targetRole} Roadmap`,
    startNodeId,
    endNodeId: destinationNodeId,
    nodes,
    edges,
  };
}

function getTemplateMilestones(targetRole) {
  const roleLower = String(targetRole || '').toLowerCase();
  const now = Date.now();
  const makeMilestone = (title, index, type = 'skill', estimateHours = 24, priority = 'MEDIUM', notes = '') => ({
    title,
    type,
    estimateHours,
    priority,
    dueDate: new Date(now + (index + 1) * 21 * 24 * 60 * 60 * 1000).toISOString(),
    completed: false,
    evidence: [],
    notes,
    source: 'RULE',
  });

  if (
    roleLower.includes('web') ||
    roleLower.includes('frontend') ||
    roleLower.includes('front end') ||
    roleLower.includes('full stack') ||
    roleLower.includes('fullstack')
  ) {
    return [
      makeMilestone('HTML', 0, 'skill', 18, 'HIGH', 'Learn page structure, semantic tags, and accessibility basics.'),
      makeMilestone('CSS', 1, 'skill', 24, 'HIGH', 'Build layouts, responsive design, and visual polish.'),
      makeMilestone('JavaScript', 2, 'skill', 40, 'HIGH', 'Understand logic, DOM manipulation, and async behavior.'),
      makeMilestone('Tailwind CSS', 3, 'skill', 16, 'MEDIUM', 'Speed up styling workflows with utility-first CSS.'),
      makeMilestone('React', 4, 'skill', 42, 'HIGH', 'Build component-driven user interfaces and stateful apps.'),
      makeMilestone('Node.js', 5, 'skill', 28, 'HIGH', 'Learn server-side JavaScript fundamentals.'),
      makeMilestone('Express', 6, 'skill', 24, 'HIGH', 'Build APIs, middleware, and backend routing.'),
      makeMilestone('Full Stack Portfolio Project', 7, 'project', 60, 'HIGH', 'Combine frontend and backend into one deployable app.'),
    ];
  }

  if (roleLower.includes('management') || roleLower.includes('manager') || roleLower.includes('leadership')) {
    return [
      makeMilestone('Communication Fundamentals', 0, 'skill', 18, 'HIGH', 'Practice clear written, verbal, and stakeholder communication.'),
      makeMilestone('Task Ownership', 1, 'skill', 20, 'HIGH', 'Learn how to own delivery, priorities, and follow-through.'),
      makeMilestone('Planning and Delegation', 2, 'skill', 24, 'HIGH', 'Break work into phases and assign responsibilities.'),
      makeMilestone('Conflict Resolution', 3, 'skill', 16, 'MEDIUM', 'Handle disagreements with calm structure and empathy.'),
      makeMilestone('Team Coordination', 4, 'skill', 22, 'HIGH', 'Run meetings, updates, and cross-functional alignment.'),
      makeMilestone('Performance Feedback', 5, 'skill', 16, 'MEDIUM', 'Deliver useful feedback and coaching.'),
      makeMilestone('Project Leadership Simulation', 6, 'project', 36, 'HIGH', 'Lead a real or simulated project from kickoff to review.'),
    ];
  }

  if (roleLower.includes('video') || roleLower.includes('editor') || roleLower.includes('editing')) {
    return [
      makeMilestone('Editing Basics', 0, 'skill', 16, 'HIGH', 'Learn cuts, trims, pacing, and project organization.'),
      makeMilestone('Timeline Workflow', 1, 'skill', 18, 'HIGH', 'Master bins, sequences, proxies, and timeline efficiency.'),
      makeMilestone('Transitions and Story Rhythm', 2, 'skill', 20, 'HIGH', 'Use transitions intentionally to support storytelling.'),
      makeMilestone('Audio Cleanup', 3, 'skill', 16, 'MEDIUM', 'Balance dialogue, music, and effects for clarity.'),
      makeMilestone('Color Correction', 4, 'skill', 22, 'HIGH', 'Improve consistency, mood, and professional finish.'),
      makeMilestone('Motion Graphics Basics', 5, 'skill', 24, 'MEDIUM', 'Add titles, overlays, and motion support where helpful.'),
      makeMilestone('Client-ready Edit', 6, 'project', 40, 'HIGH', 'Produce a polished piece from raw footage to final delivery.'),
    ];
  }

  return null;
}

/**
 * Fallback rule-based milestones when AI fails or returns invalid JSON.
 * Used as a safe default to ensure users always get recommendations.
 * @param {string} targetRole - The target role name
 * @returns {array} Array of milestone objects
 */
function getFallbackMilestones(targetRole) {
  const templateMilestones = getTemplateMilestones(targetRole);
  if (templateMilestones) {
    return templateMilestones;
  }

  return [
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
}

function getFallbackRecommendations(plan) {
  const targetRole = plan?.targetRole || 'your target role';
  const primarySkillMilestones = (plan?.milestones || [])
    .filter((milestone) => milestone.type === 'skill')
    .slice(0, 3);

  const skillGapRecommendations = primarySkillMilestones.map((milestone) => ({
    source: 'RULE',
    type: 'SKILL_GAP',
    payload: {
      skill: milestone.title,
      currentLevel: 'Developing',
      requiredLevel: 'Job-ready',
      recommendation: `Prioritize focused practice on ${milestone.title} to move closer to ${targetRole}.`,
    },
    confidence: 0.7,
    modelVersion: 'fallback-rule',
  }));

  const resourceRecommendations = primarySkillMilestones.map((milestone) => ({
    source: 'RULE',
    type: 'RESOURCE',
    payload: {
      type: 'course',
      title: `Learning resource for ${milestone.title}`,
      url: '',
      rationale: `Choose a practical course or project-based resource that helps you build ${milestone.title}.`,
    },
    confidence: 0.65,
    modelVersion: 'fallback-rule',
  }));

  const marketInsight = {
    source: 'RULE',
    type: 'MARKET_INSIGHT',
    payload: {
      marketDemand: `${targetRole} roles typically reward demonstrable projects and recent hands-on work.`,
      growthOpportunities: 'Strengthen portfolio evidence, core skills, and interview-ready examples.',
      timelineAssessment: 'A consistent weekly practice schedule usually improves progress visibility fastest.',
    },
    confidence: 0.6,
    modelVersion: 'fallback-rule',
  };

  return [...skillGapRecommendations, ...resourceRecommendations, marketInsight];
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
      `Generate 6-8 sequenced roadmap milestones for: ${targetRole}`,
      `Skills: ${existingSkills.slice(0, 8).join(', ') || 'Not specified'}`,
      `Experience: ${userProfile.experience || 'Not provided'}`,
      `Resume summary: ${String(userProfile.resume || 'Not provided').slice(0, 120)}`,
      'Order the milestones from starting point to destination. Use concrete stage names, not vague titles.',
      'Return ONLY valid JSON array. Keep each milestone concise and practical.'
    ].join('\n');
    const prompt = [CAREER_PLAN_SYSTEM_PROMPT, userPrompt].join('\n\n');

    console.log(`[RECOMMENDATION SERVICE] Generating milestones for ${targetRole}...`);

    // Call AI with the career plan system prompt
    const preferredProvider = (process.env.CAREER_PATH_PROVIDER || '').toLowerCase();
    const { provider, model } = getProvider('career path roadmap generation', preferredProvider);
    const aiResponse = await aiService.generate(prompt, {
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
      CAREER_PLAN_SYSTEM_PROMPT,
      `Analyze the career transition to: ${plan.targetRole}`,
      `Milestones: ${plan.milestones.slice(0, 5).map((m) => m.title).join(', ') || 'None yet'}`,
      `Experience: ${userProfile.experience || 'not specified'}`,
      'Return ONLY valid JSON with skillGaps, recommendedResources, summary, insights, and timelineAssessment.',
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
      return getFallbackRecommendations(plan);
    }

    // Transform into Recommendation schema format
    const recommendationDocs = [];

    // Add skill gaps
    if (Array.isArray(recommendations.skillGaps)) {
      recommendationDocs.push(
        ...recommendations.skillGaps.map((sg) => ({
          source: 'AI',
          type: 'SKILL_GAP',
          payload: {
            skill: sg.skill || sg.title || 'Skill Gap',
            currentLevel: sg.currentLevel || sg.current || sg.level || 'Current level not specified',
            requiredLevel: sg.requiredLevel || sg.required || 'Required level not specified',
            recommendation:
              sg.recommendation || sg.reason || sg.summary || 'Focus on deliberate practice and project work.',
          },
          confidence: 0.85,
          modelVersion: aiResponse.modelUsed,
        }))
      );
    }

    // Add resources
    const resources = Array.isArray(recommendations.resources)
      ? recommendations.resources
      : Array.isArray(recommendations.recommendedResources)
        ? recommendations.recommendedResources
        : [];

    if (resources.length > 0) {
      recommendationDocs.push(
        ...resources.map((r) => ({
          source: 'AI',
          type: 'RESOURCE',
          payload: {
            type: r.type || 'resource',
            title: r.title || r.name || 'Recommended resource',
            url: r.url || '',
            rationale: r.rationale || r.reason || r.description || 'Selected to support your next milestone.',
          },
          confidence: 0.8,
          modelVersion: aiResponse.modelUsed,
        }))
      );
    }

    // Add insights
    if (recommendations.insights || recommendations.summary || recommendations.timelineAssessment) {
      recommendationDocs.push({
        source: 'AI',
        type: 'MARKET_INSIGHT',
        payload: {
          ...(typeof recommendations.insights === 'object' && recommendations.insights
            ? recommendations.insights
            : {}),
          summary:
            typeof recommendations.summary === 'string' ? recommendations.summary : undefined,
          timelineAssessment:
            typeof recommendations.timelineAssessment === 'string'
              ? recommendations.timelineAssessment
              : undefined,
        },
        confidence: 0.75,
        modelVersion: aiResponse.modelUsed,
      });
    }

    if (recommendationDocs.length === 0) {
      console.warn('[RECOMMENDATION SERVICE] Recommendation response was empty after normalization. Using fallback.');
      return getFallbackRecommendations(plan);
    }

    console.log(`[RECOMMENDATION SERVICE] Generated ${recommendationDocs.length} recommendations`);
    return recommendationDocs;
  } catch (err) {
    console.error(`[RECOMMENDATION SERVICE] Error generating recommendations: ${err.message}`);
    return getFallbackRecommendations(plan);
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
    const roadmap = buildRoadmapFromMilestones(plan.targetRole, milestones);
    const recommendations = await generateRecommendations(
      {
        ...plan.toObject(),
        milestones,
        roadmap,
      },
      userProfile
    );

    // Update plan
    plan.milestones = milestones;
    plan.roadmap = roadmap;
    plan.recommendations = recommendations;
    plan.aiReady = true;
    plan.aiLastRefreshAt = new Date();
    if (!plan.aiGeneratedAt) {
      plan.aiGeneratedAt = new Date();
    }

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
  getFallbackRecommendations,
  buildRoadmapFromMilestones,
};
