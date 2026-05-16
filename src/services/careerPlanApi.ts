import axios from "./http";
import {
  CareerPlan,
  CareerRoadmap,
  CreatePlanRequest,
  UpdatePlanRequest,
  CompleteMilestoneRequest,
  ApiResponse,
} from "@/types/careerPlan";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/career-plans`;

const normalizePlanCollections = (plan: CareerPlan): CareerPlan => ({
  ...plan,
  milestones: Array.isArray(plan.milestones) ? plan.milestones : [],
  recommendations: Array.isArray(plan.recommendations) ? plan.recommendations : [],
});

const buildRoadmapFromMilestones = (plan: CareerPlan): CareerRoadmap => {
  const milestones = Array.isArray(plan.milestones) ? plan.milestones : [];
  const startNodeId = `start-${plan._id || "career"}`;
  const destinationNodeId = `destination-${plan._id || "career"}`;
  const roadmapNodes = milestones.map((milestone, index) => ({
    nodeId: milestone._id || `milestone-${index + 1}`,
    label: milestone.title,
    type: index === milestones.length - 1 ? "specialization" as const : "milestone" as const,
    description: milestone.notes,
    estimateHours: milestone.estimateHours,
    priority: milestone.priority,
    order: index + 1,
    milestoneId: milestone._id || null,
  }));

  const nodes = [
    {
      nodeId: startNodeId,
      label: roadmapNodes[0]?.label || `Start ${plan.targetRole}`,
      type: "start" as const,
      description: `Starting point for ${plan.targetRole}`,
      estimateHours: roadmapNodes[0]?.estimateHours || 0,
      priority: "HIGH" as const,
      order: 0,
      milestoneId: roadmapNodes[0]?.milestoneId || null,
    },
    ...roadmapNodes,
    {
      nodeId: destinationNodeId,
      label: plan.targetRole,
      type: "destination" as const,
      description: `Target destination: ${plan.targetRole}`,
      estimateHours: 0,
      priority: "HIGH" as const,
      order: roadmapNodes.length + 1,
      milestoneId: null,
    },
  ];

  const edges = nodes.slice(0, -1).map((node, index) => ({
    from: node.nodeId,
    to: nodes[index + 1].nodeId,
    label: index === nodes.length - 2 ? "Launch" : "Next step",
  }));

  return {
    title: `${plan.targetRole} Roadmap`,
    startNodeId,
    endNodeId: destinationNodeId,
    nodes,
    edges,
  };
};

const adaptCareerPlan = (plan: CareerPlan): CareerPlan => {
  const normalizedPlan = normalizePlanCollections(plan);

  const recommendedSkills = normalizedPlan.milestones
    .filter((milestone) => milestone.type === "skill")
    .map((milestone) => milestone.title);

  const weeklyTasks = normalizedPlan.milestones
    .filter((milestone) => !milestone.completed)
    .slice(0, 5)
    .map((milestone) => milestone.title);

  const skillGapAnalysis = normalizedPlan.recommendations
    .filter((recommendation) =>
      recommendation.type?.toUpperCase().includes("SKILL_GAP")
    )
    .flatMap((recommendation) => {
      const payload = recommendation.payload || {};
      if (Array.isArray(payload.gaps)) return payload.gaps;
      if (Array.isArray(payload.skills)) return payload.skills;
      if (typeof payload.summary === "string") return [payload.summary];
      if (typeof payload.title === "string") return [payload.title];
      return [];
    });

  return {
    ...normalizedPlan,
    careerGoal: normalizedPlan.targetRole,
    roadmap: normalizedPlan.roadmap && normalizedPlan.roadmap.nodes?.length > 0
      ? normalizedPlan.roadmap
      : buildRoadmapFromMilestones(normalizedPlan),
    recommendedSkills,
    weeklyTasks,
    skillGapAnalysis,
  };
};

/**
 * Create a new career plan
 */
export const createPlan = async (data: CreatePlanRequest): Promise<CareerPlan> => {
  const response = await axios.post<ApiResponse<CareerPlan>>(API_URL, data);
  if (!response.data.success) {
    throw new Error(response.data.error || "Failed to create plan");
  }
  return adaptCareerPlan(response.data.data as CareerPlan);
};

/**
 * Get all plans for the current user
 */
export const getPlans = async (): Promise<CareerPlan[]> => {
  const response = await axios.get<ApiResponse<CareerPlan[]>>(API_URL);
  if (!response.data.success) {
    throw new Error(response.data.error || "Failed to fetch plans");
  }
  return (response.data.data as CareerPlan[]).map(adaptCareerPlan);
};

/**
 * Get the current user's primary career plan
 * Compatibility helper for older dashboard screens.
 */
export const getCareerPlan = async (): Promise<CareerPlan | null> => {
  const plans = await getPlans();
  return plans[0] || null;
};

/**
 * Get a single plan by ID
 */
export const getPlan = async (id: string): Promise<CareerPlan> => {
  const response = await axios.get<ApiResponse<CareerPlan>>(`${API_URL}/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.error || "Failed to fetch plan");
  }
  return adaptCareerPlan(response.data.data as CareerPlan);
};

/**
 * Update a plan
 */
export const updatePlan = async (
  id: string,
  data: UpdatePlanRequest
): Promise<CareerPlan> => {
  const response = await axios.patch<ApiResponse<CareerPlan>>(
    `${API_URL}/${id}`,
    data
  );
  if (!response.data.success) {
    throw new Error(response.data.error || "Failed to update plan");
  }
  return adaptCareerPlan(response.data.data as CareerPlan);
};

/**
 * Mark a milestone as complete
 */
export const completeMilestone = async (
  planId: string,
  data: CompleteMilestoneRequest
): Promise<CareerPlan> => {
  const response = await axios.post<ApiResponse<CareerPlan>>(
    `${API_URL}/${planId}/complete-milestone`,
    data
  );
  if (!response.data.success) {
    throw new Error(response.data.error || "Failed to complete milestone");
  }
  return adaptCareerPlan(response.data.data as CareerPlan);
};

/**
 * Refresh AI recommendations for a plan
 */
export const refreshPlan = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await axios.post<{ success: boolean; message: string }>(
    `${API_URL}/${id}/refresh`,
    {}
  );
  return response.data;
};
