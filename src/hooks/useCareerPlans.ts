/**
 * React Query hooks for Career Plan management
 * Uses React Query (TanStack Query) for server state management
 * 
 * Prerequisites: npm install @tanstack/react-query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPlan,
  getPlans,
  getPlan,
  updatePlan,
  completeMilestone,
  refreshPlan,
} from '@/services/careerPlanApi';
import {
  CareerPlan,
  CreatePlanRequest,
  UpdatePlanRequest,
  CompleteMilestoneRequest,
} from '@/types/careerPlan';
import { useCallback } from 'react';

/**
 * Query keys for cache management
 */
const CAREER_PLAN_KEYS = {
  all: ['career-plans'] as const,
  lists: () => [...CAREER_PLAN_KEYS.all, 'list'] as const,
  list: (filters?: string) =>
    [...CAREER_PLAN_KEYS.lists(), { filters }] as const,
  details: () => [...CAREER_PLAN_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CAREER_PLAN_KEYS.details(), id] as const,
};

/**
 * Hook to get all plans for the current user
 */
export function useGetPlans() {
  return useQuery({
    queryKey: CAREER_PLAN_KEYS.lists(),
    queryFn: getPlans,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Hook to get a single plan by ID
 * Polls every 5s if aiReady is false to check for AI-generated recommendations
 */
export function useGetPlan(id: string | undefined) {
  return useQuery({
    queryKey: CAREER_PLAN_KEYS.detail(id || ''),
    queryFn: () => getPlan(id!),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds (shorter due to AI generation)
    refetchInterval: (query) => {
      const plan = query.state.data as CareerPlan | undefined;
      // Poll every 5 seconds if AI is still generating
      if (plan && !plan.aiReady) {
        return 5000;
      }
      // Otherwise, don't auto-refetch
      return false;
    },
    refetchIntervalInBackground: true,
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new plan
 * Automatically invalidates plans list on success
 */
export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlanRequest) => createPlan(data),
    onSuccess: (createdPlan) => {
      if (createdPlan._id) {
        queryClient.setQueryData(
          CAREER_PLAN_KEYS.detail(createdPlan._id),
          createdPlan
        );
        queryClient.invalidateQueries({
          queryKey: CAREER_PLAN_KEYS.detail(createdPlan._id),
        });
      }

      // Invalidate the plans list so it refetches
      queryClient.invalidateQueries({
        queryKey: CAREER_PLAN_KEYS.lists(),
      });
    },
    onError: (error: Error) => {
      console.error('Failed to create plan:', error.message);
    },
  });
}

/**
 * Hook to update a plan
 */
export function useUpdatePlan(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePlanRequest) => updatePlan(planId, data),
    onSuccess: (updatedPlan) => {
      // Update cache for this specific plan
      queryClient.setQueryData(
        CAREER_PLAN_KEYS.detail(planId),
        updatedPlan
      );
      // Also invalidate to sync with server
      queryClient.invalidateQueries({
        queryKey: CAREER_PLAN_KEYS.detail(planId),
      });
    },
    onError: (error: Error) => {
      console.error('Failed to update plan:', error.message);
    },
  });
}

/**
 * Hook to complete a milestone with optimistic updates
 * Immediately updates cache, rolls back on error
 */
export function useCompleteMilestone(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompleteMilestoneRequest) =>
      completeMilestone(planId, data),
    onMutate: async (data) => {
      // Cancel any ongoing refetches to avoid conflicts
      await queryClient.cancelQueries({
        queryKey: CAREER_PLAN_KEYS.detail(planId),
      });

      // Snapshot the previous plan data for rollback
      const previousPlan = queryClient.getQueryData<CareerPlan>(
        CAREER_PLAN_KEYS.detail(planId)
      );

      if (previousPlan) {
        // Optimistically update the milestone
        const optimisticPlan = {
          ...previousPlan,
          milestones: previousPlan.milestones.map((m) =>
            m._id === data.milestoneId
              ? {
                  ...m,
                  completed: true,
                  completedAt: new Date().toISOString(),
                  evidence: [...(m.evidence || []), ...(data.evidence || [])],
                  notes: data.notes || m.notes,
                }
              : m
          ),
        };

        // Update the overall progress based on completed milestones
        const totalMilestones = optimisticPlan.milestones.length;
        const completedCount = optimisticPlan.milestones.filter(
          (m) => m.completed
        ).length;
        optimisticPlan.overallProgress = Math.round(
          (completedCount / totalMilestones) * 100
        );

        // Set optimistic data
        queryClient.setQueryData(
          CAREER_PLAN_KEYS.detail(planId),
          optimisticPlan
        );
      }

      return { previousPlan };
    },
    onSuccess: (data) => {
      // Update with server response to ensure consistency
      queryClient.setQueryData(
        CAREER_PLAN_KEYS.detail(planId),
        data
      );
    },
    onError: (error: Error, _, context) => {
      // Rollback to previous data on error
      if (context?.previousPlan) {
        queryClient.setQueryData(
          CAREER_PLAN_KEYS.detail(planId),
          context.previousPlan
        );
      }
      console.error('Failed to complete milestone:', error.message);
    },
  });
}

/**
 * Hook to refresh AI recommendations for a plan
 */
export function useRefreshPlan(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => refreshPlan(planId),
    onSuccess: () => {
      // Invalidate the plan to refetch updated recommendations
      queryClient.invalidateQueries({
        queryKey: CAREER_PLAN_KEYS.detail(planId),
      });
    },
    onError: (error: Error) => {
      console.error('Failed to refresh plan:', error.message);
    },
  });
}

/**
 * Hook to clear all career plan caches
 */
export function useClearCareerPlanCache() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.removeQueries({
      queryKey: CAREER_PLAN_KEYS.all,
    });
  }, [queryClient]);
}
