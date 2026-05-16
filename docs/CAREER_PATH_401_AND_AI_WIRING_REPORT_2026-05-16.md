# Career Path 401 And AI Wiring Report

Date: 2026-05-16
Project: `Nextaro`

## Implementation Status

The recommended core fixes from this report have now been applied in code:

- auth middleware added to all career-plan routes in `backend/routes/careerPlanRoutes.js`
- AI lifecycle fields added to `backend/models/CareerPlan.js`
- career-plan system prompt wired into milestone generation in `backend/services/recommendationService.js`
- AI queue and synchronous fallback now both persist generation timestamps in `backend/queues/aiQueue.js`

Verification completed:

- frontend production build passes
- backend syntax checks pass for the updated career-path files

## Executive Summary

The Career Path feature has two separate problems:

1. The immediate `401 Unauthorized` error is caused by backend career-plan routes not using auth middleware.
2. Even after fixing the `401`, the AI completion state is still not fully wired because the `CareerPlan` schema does not persist `aiReady`, `aiGeneratedAt`, or `aiLastRefreshAt`.

That means:

- right now the create/list/get/update career-plan endpoints can fail with `401`
- and after auth is fixed, the UI can still keep showing "AI is generating your milestones" because the completion flag is not stored in MongoDB

## Current Career Path Flow

### Frontend flow

The form is created in:

- `src/components/dashboard/CareerPathShell.tsx`

When the user submits:

- `CreatePlanModal` calls `useCreatePlan()`
- `useCreatePlan()` calls `createPlan()` from `src/services/careerPlanApi.ts`
- that posts to:
  - `POST /api/career-plans`

The details screen then:

- loads plans with `useGetPlans()`
- loads a selected plan with `useGetPlan(planId)`
- expects `aiReady` on the plan to know whether AI generation has finished

### Backend flow

The route file is:

- `backend/routes/careerPlanRoutes.js`

The controller is:

- `backend/controllers/careerPlanController.js`

The service is:

- `backend/services/careerPlanService.js`

The AI handoff is:

- `backend/queues/aiQueue.js`
- `backend/services/recommendationService.js`

## Root Cause 1: Why You Are Getting 401

### Problem

`careerPlanController.js` requires `req.user` on every endpoint.

Examples:

- `backend/controllers/careerPlanController.js:12`
- `backend/controllers/careerPlanController.js:52`
- `backend/controllers/careerPlanController.js:77`
- `backend/controllers/careerPlanController.js:97`
- `backend/controllers/careerPlanController.js:123`
- `backend/controllers/careerPlanController.js:161`

Each of those blocks returns:

- `401 Unauthorized: missing user`

But the routes in `backend/routes/careerPlanRoutes.js` are missing `protect`.

Current route wiring:

- `router.post('/', controller.createPlan);`
- `router.get('/', controller.listPlans);`
- `router.get('/:id', controller.getPlan);`
- `router.patch('/:id', controller.updatePlan);`
- `router.post('/:id/complete-milestone', controller.completeMilestone);`
- `router.post('/:id/refresh', controller.refreshPlan);`

Because `protect` is not attached, `req.user` is never populated.

### Result

The frontend sends valid requests, but the controller rejects them because the user context is missing.

## Root Cause 2: AI Completion State Is Not Persisted

### Problem

The frontend expects `CareerPlan.aiReady` to be stored and returned.

Examples:

- `src/hooks/useCareerPlans.ts`
- `src/components/dashboard/CareerPathShell.tsx`

But the Mongoose schema in:

- `backend/models/CareerPlan.js`

does not define:

- `aiReady`
- `aiGeneratedAt`
- `aiLastRefreshAt`

Meanwhile the queue and recommendation layer write those fields:

- `backend/queues/aiQueue.js` sets `plan.aiReady = true` and `plan.aiGeneratedAt = new Date()`
- `backend/services/recommendationService.js` sets `plan.aiReady = true` and `plan.aiLastRefreshAt = new Date()`

Since those fields are not in the schema, they are not reliably persisted.

### Result

The likely runtime behavior is:

- milestones may be generated and saved
- but `aiReady` stays missing in the returned Mongo document
- the frontend treats missing `aiReady` as falsy
- the UI keeps showing "AI is generating your milestones"
- polling may continue unnecessarily

## Root Cause 3: AI Prompt Wiring Is Partially Incomplete

### Problem

`backend/services/recommendationService.js` imports:

- `CAREER_PLAN_SYSTEM_PROMPT`

from:

- `backend/services/ai/prompts/careerPlan.prompt.js`

But that system prompt is not actually used in the AI request.

The current AI request builds only a simple `userPrompt` string and calls:

- `aiService.generate(userPrompt, { provider, model, maxTokens })`

So the structured career-plan prompt exists, but is not actually wired into the generation call.

### Result

This does not directly cause the `401`, but it does weaken the AI output quality and makes JSON formatting more fragile.

## Root Cause 4: Plan Refresh Timestamp Is Also Not Persisted

`refreshPlanAI()` writes:

- `plan.aiLastRefreshAt = new Date()`

But that field is also missing from the schema.

So the system currently has no reliable stored marker for AI refresh completion timing.

## Root Cause 5: Fallback Queue Mode Is Working, But It Is Incomplete

Your local queue is currently designed to fall back when Redis is not available.

That part is good:

- `backend/queues/aiQueue.js`
- if `REDIS_URL` is missing, it processes milestone generation synchronously

However:

- synchronous fallback only writes milestones and `aiReady`
- and `aiReady` is not properly stored because the schema is missing that field

So the fallback mode works functionally, but the status wiring is incomplete.

## What Is Working

The AI service itself is not completely disconnected.

The following pieces are present:

- provider routing exists in `backend/utils/providerRouter.js`
- AI generation exists in `backend/services/ai/ai.service.js`
- recommendation generation exists in `backend/services/recommendationService.js`
- create-plan controller queues or synchronously generates milestones

So this is not a case of "AI does not exist."

It is a case of:

- auth not wired on career-plan routes
- schema not wired for AI lifecycle fields
- prompt integration only partially wired

## Recommended Fix Plan

## Fix 1: Protect Career Plan Routes

In `backend/routes/careerPlanRoutes.js`, import auth middleware:

```js
const { protect } = require('../middleware/auth');
```

Then update all routes:

```js
router.post('/', protect, controller.createPlan);
router.get('/', protect, controller.listPlans);
router.get('/:id', protect, controller.getPlan);
router.patch('/:id', protect, controller.updatePlan);
router.post('/:id/complete-milestone', protect, controller.completeMilestone);
router.post('/:id/refresh', protect, controller.refreshPlan);
```

### Why this fixes the 401

`protect` attaches `req.user`, which the controller already expects.

This is the direct fix for the current unauthorized error.

## Fix 2: Add AI Lifecycle Fields To CareerPlan Schema

In `backend/models/CareerPlan.js`, add:

```js
aiReady: { type: Boolean, default: false },
aiGeneratedAt: { type: Date, default: null },
aiLastRefreshAt: { type: Date, default: null },
```

### Why this matters

This makes the UI and backend agree on AI completion state.

After this:

- the plan can persist AI generation status
- the frontend polling logic can stop correctly
- the loading banner can disappear when milestones are ready

## Fix 3: Use The Career Plan System Prompt During Milestone Generation

In `backend/services/recommendationService.js`, incorporate:

- `CAREER_PLAN_SYSTEM_PROMPT`

into the actual AI request.

Example direction:

```js
const prompt = [
  CAREER_PLAN_SYSTEM_PROMPT,
  userPrompt
].join('\n\n');

const aiResponse = await aiService.generate(prompt, {
  provider,
  model,
  maxTokens: CAREER_PATH_MAX_TOKENS,
});
```

### Why this matters

This increases the chance of getting:

- valid JSON
- correctly structured milestones
- better skill-gap and roadmap outputs

## Fix 4: Return AI Status Clearly To Frontend

Make sure newly created plans return:

- `aiReady: false`

and after generation completes the fetched plan returns:

- `aiReady: true`
- `aiGeneratedAt`

This makes the UI behavior deterministic.

## Fix 5: Optional Improvement For Create Response

After `createPlan`, you may also want the response to include a clear message like:

```json
{
  "success": true,
  "data": { ...plan },
  "message": "Plan created. AI milestone generation started."
}
```

That helps the frontend distinguish:

- plan saved
- AI still running

## Expected Behavior After Fix

When the user fills the career-path form:

1. frontend sends authenticated `POST /api/career-plans`
2. backend accepts request because `protect` sets `req.user`
3. plan is stored with `aiReady: false`
4. AI queue or synchronous fallback generates milestones
5. plan is updated with milestones and `aiReady: true`
6. frontend polling fetches updated plan
7. UI stops showing loading message and shows roadmap + recommendations

## Verification Checklist

After implementing the fixes, verify this order:

1. Create a plan while logged in
2. Confirm `POST /api/career-plans` returns `201` instead of `401`
3. Confirm saved Mongo document contains:
   - `aiReady`
   - `aiGeneratedAt`
4. Confirm milestones appear after AI generation
5. Confirm selected plan view stops showing "AI is generating your milestones"
6. Confirm `refresh` updates `aiLastRefreshAt`

## Final Conclusion

The `401` is not because the AI provider itself is missing.

The true issues are:

- career-path routes are not protected with auth middleware
- controller expects `req.user` anyway
- AI completion fields are not stored in the `CareerPlan` schema
- the career-plan system prompt exists but is not fully wired into generation

So the solution is not to rebuild the whole AI layer.

The correct fix is to complete the wiring between:

- frontend form
- authenticated route
- controller user context
- AI milestone generation
- persisted `aiReady` lifecycle state
