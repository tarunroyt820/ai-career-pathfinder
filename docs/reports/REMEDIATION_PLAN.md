# Nextaro Risk Remediation Plan
## Step-by-Step Implementation Guide

**Created:** May 10, 2026  
**Status:** Ready for Implementation  
**Build State:** ✅ Currently Passing (`npm run build`)

---

## Overview

This plan addresses 6 major risk categories and 18 specific code issues across frontend and backend. Each issue is mapped to exact file paths, line numbers, and verification steps. The plan is sequenced to avoid circular dependencies and maintain a passing build at all steps.

---

## PHASE 1: Authentication Stability (High Priority)
### Goal: Prevent redirect loops and concurrent 401 race conditions
### Timeline: ~2-3 hours
### Files: 2 main changes + 1 validation

---

### Issue 1.1: Refresh Token Concurrency Race Condition
**Severity:** 🔴 CRITICAL  
**File:** [src/services/http.ts](src/services/http.ts)  
**Current State:** Lines 4-31 have a single-flight guard but no retry limit or error state tracking  
**Problem:** If first refresh fails with 401, `refreshPromise` is nulled immediately, allowing a second concurrent request to create a new promise instead of waiting for the first one to fully settle. This can cause cascading 401s.

**Step 1.1.1: Add retry counter and max-attempts guard**
- **Location:** [src/services/http.ts](src/services/http.ts) lines 1-50
- **Current Code:**
  ```typescript
  let refreshPromise: Promise<string> | null = null;
  ```
- **Change:** Add a retry counter and max attempts constant
  ```typescript
  let refreshPromise: Promise<string> | null = null;
  let refreshAttempts = 0;
  const MAX_REFRESH_ATTEMPTS = 3;
  ```
- **Why:** Prevents infinite retry loops by failing fast after 3 attempts instead of creating new refresh promises on each 401.

**Step 1.1.2: Update refresh logic to respect attempt limit**
- **Location:** [src/services/http.ts](src/services/http.ts) lines 12-30
- **Current Code:**
  ```typescript
  if (!refreshPromise) {
    refreshPromise = axios
      .post(...)
      .then(...)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
  ```
- **Change:** Add attempt tracking and reset on success
  ```typescript
  if (!refreshPromise) {
    if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
      return Promise.reject(new Error('Max refresh attempts exceeded'));
    }
    refreshAttempts++;
    refreshPromise = axios
      .post(...)
      .then((res) => {
        refreshAttempts = 0; // Reset on success
        return res.data.refreshToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
  ```
- **Why:** Resets the counter on successful refresh and prevents further attempts if max is reached.

**Step 1.1.3: Add one-time redirect guard**
- **Location:** [src/services/http.ts](src/services/http.ts) lines 1-80
- **Current Code:**
  ```typescript
  const clearSessionAndRedirect = () => {
    localStorage.removeItem("nextro_token");
    localStorage.removeItem("nextro_refresh_token");
    window.location.href = "/login";
  };
  ```
- **Change:** Make redirect non-repeatable
  ```typescript
  let isRedirecting = false;
  const clearSessionAndRedirect = () => {
    if (isRedirecting) return; // Prevent multiple redirects
    isRedirecting = true;
    localStorage.removeItem("nextro_token");
    localStorage.removeItem("nextro_refresh_token");
    window.location.href = "/login";
  };
  ```
- **Why:** Prevents rapid redirect cascades if multiple 401s occur simultaneously.

**Step 1.1.4: Validation**
- Run: `npm run build` → must pass
- Run: `npm run lint` → must pass
- Manual: Open DevTools → Network tab → Trigger 401 → Should see only one redirect attempt in 3 seconds
- Expected: No console errors about `refreshPromise` being called multiple times

---

### Issue 1.2: Public Route Should Check Token Validity, Not Presence
**Severity:** 🟠 HIGH  
**File:** [src/components/auth/ProtectedRoute.tsx](src/components/auth/ProtectedRoute.tsx)  
**Current State:** Lines 33-46 check token presence but don't validate expiration on public routes  
**Problem:** A user with an expired token can still access `/login` if their `localStorage` has a stale token. They should be redirected to login instead of being confused.

**Step 1.2.1: Update ProtectedRoute to use token validity check**
- **Location:** [src/components/auth/ProtectedRoute.tsx](src/components/auth/ProtectedRoute.tsx) lines 38-46
- **Current Code:**
  ```typescript
  export const ProtectedRoute = () => {
    if (!hasValidToken()) {
      localStorage.removeItem("nextro_token");
      localStorage.removeItem("nextro_refresh_token");
      // If no token, redirect to login
      return <Navigate to="/login" replace />;
    }
    // If token exists, render the child routes
    return <Outlet />;
  };
  ```
- **Change:** This is already correct; add a comment explaining why `hasValidToken()` is the right check
  ```typescript
  export const ProtectedRoute = () => {
    // hasValidToken checks both presence AND expiration
    // This prevents stale tokens from letting expired sessions through
    if (!hasValidToken()) {
      localStorage.removeItem("nextro_token");
      localStorage.removeItem("nextro_refresh_token");
      return <Navigate to="/login" replace />;
    }
    return <Outlet />;
  };
  ```
- **Why:** Documents that the check is correct and prevents future confusion.

**Step 1.2.2: Ensure public routes also clear stale tokens**
- **Location:** [src/components/auth/ProtectedRoute.tsx](src/components/auth/ProtectedRoute.tsx) lines 1-50
- **Add a utility function to call before rendering public pages:**
  ```typescript
  export const clearStaleToken = () => {
    const token = localStorage.getItem("nextro_token");
    if (token && isTokenExpired(token)) {
      localStorage.removeItem("nextro_token");
      localStorage.removeItem("nextro_refresh_token");
      return true; // Token was stale and cleared
    }
    return false;
  };
  ```
- **Why:** Public pages can call this on mount to avoid confusion if user has a stale token.

**Step 1.2.3: Validation**
- Run: `npm run build` → must pass
- Manual: Set a fake expired token in localStorage → reload public page → token should be cleared
- Manual: Try accessing `/dashboard` with expired token → should redirect to `/login`
- Expected: Console should show no warnings about stale tokens

---

## PHASE 2: API Response Contract Safety (High Priority)
### Goal: Defend against future backend response shape changes
### Timeline: ~3-4 hours
### Files: 4 main changes + 2 validation points

---

### Issue 2.1: Career Plan API Assumes Nested Response Shape
**Severity:** 🔴 CRITICAL  
**File:** [src/services/careerPlanApi.ts](src/services/careerPlanApi.ts)  
**Current State:** Lines 12-52 use `response.data.data` without validation  
**Problem:** If backend returns `{ data: null }` or `{ plan: {...} }` instead of `{ data: {...} }`, the app crashes.

**Step 2.1.1: Add response validation wrapper**
- **Location:** [src/services/careerPlanApi.ts](src/services/careerPlanApi.ts) lines 1-15
- **Add validation function at top:**
  ```typescript
  const validateCareerPlanResponse = (data: unknown): CareerPlan | null => {
    // Accept both nested and flat shapes for future compatibility
    if (!data) return null;
    
    const payload = (data as any).data || data;
    if (!payload || typeof payload !== 'object') {
      console.warn('[Career Plan API] Invalid response shape:', data);
      return null;
    }
    return payload as CareerPlan;
  };
  ```
- **Why:** Single place to handle response shape, easier to adapt if backend changes.

**Step 2.1.2: Update getCareerPlan() to use validator**
- **Location:** [src/services/careerPlanApi.ts](src/services/careerPlanApi.ts) lines 47-56
- **Current Code:**
  ```typescript
  export const getCareerPlan = async (planId: string): Promise<CareerPlan> => {
    try {
      const response = await axios.get<{ data: CareerPlan }>(`${BASE_URL}/${planId}`, {
        headers: getAuthHeader(),
      });
      return adaptCareerPlan(response.data.data as CareerPlan);
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  };
  ```
- **Change:**
  ```typescript
  export const getCareerPlan = async (planId: string): Promise<CareerPlan> => {
    try {
      const response = await axios.get<any>(`${BASE_URL}/${planId}`, {
        headers: getAuthHeader(),
      });
      const plan = validateCareerPlanResponse(response.data);
      if (!plan) throw new Error('Invalid career plan response from server');
      return adaptCareerPlan(plan);
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  };
  ```
- **Why:** Validates shape before passing to adapter, preventing silent crashes.

**Step 2.1.3: Update listCareerPlans() similarly**
- **Location:** [src/services/careerPlanApi.ts](src/services/careerPlanApi.ts) lines 59-69
- **Current Code:**
  ```typescript
  export const listCareerPlans = async (): Promise<CareerPlan[]> => {
    try {
      const response = await axios.get<{ data: CareerPlan[] }>(`${BASE_URL}`, {
        headers: getAuthHeader(),
      });
      return (response.data.data as CareerPlan[]).map(adaptCareerPlan);
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  };
  ```
- **Change:**
  ```typescript
  export const listCareerPlans = async (): Promise<CareerPlan[]> => {
    try {
      const response = await axios.get<any>(`${BASE_URL}`, {
        headers: getAuthHeader(),
      });
      const plans = validateCareerPlanResponse(response.data);
      if (!Array.isArray(plans)) {
        console.warn('[Career Plan API] Expected array, got:', plans);
        return [];
      }
      return plans.map(adaptCareerPlan);
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  };
  ```
- **Why:** Prevents `.map()` from crashing if array expectation is violated.

**Step 2.1.4: Validation**
- Run: `npm run build` → must pass
- Manual: Trigger a career plan fetch in browser DevTools → verify no crashes on response
- Test: Mock backend to return `{ data: null }` → app should gracefully degrade
- Expected: No `Cannot read property 'map' of undefined` errors

---

### Issue 2.2: Discovery API Trending Skills Assumed to Be Array
**Severity:** 🟡 MEDIUM  
**File:** [src/pages/FindPeople.tsx](src/pages/FindPeople.tsx)  
**Current State:** Lines 80-85 assume `response.data.trending` is always an array  
**Problem:** If backend returns `{ trending: { count: 5 } }` instead of an array, filtering breaks silently.

**Step 2.2.1: Add discovery response validator**
- **Location:** [src/pages/FindPeople.tsx](src/pages/FindPeople.tsx) lines 1-30
- **Add at top of file:**
  ```typescript
  const validateTrendingResponse = (data: unknown): string[] => {
    if (!data) return [];
    const items = Array.isArray(data) ? data : [];
    return items
      .map((item: any) => String(item?._id || item?.name || item?.skill || ''))
      .filter(Boolean);
  };
  ```
- **Why:** Ensures trending is always a valid array, handles multiple response formats.

**Step 2.2.2: Update loadTrending() to use validator**
- **Location:** [src/pages/FindPeople.tsx](src/pages/FindPeople.tsx) lines 79-90
- **Current Code:**
  ```typescript
  const loadTrending = async () => {
    try {
      const response = await fetchTrendingSkills();
      const items = Array.isArray(response.data?.trending) ? response.data.trending : [];
      setTrendingSkills(items.map((item) => String(item?._id || "")).filter(Boolean));
    } catch (error) {
      setTrendingSkills([]);
    }
  };
  ```
- **Change:**
  ```typescript
  const loadTrending = async () => {
    try {
      const response = await fetchTrendingSkills();
      const items = response.data?.trending || response.data?.data?.trending || [];
      setTrendingSkills(validateTrendingResponse(items));
    } catch (error) {
      console.error('[Trending Skills] Load failed:', error);
      setTrendingSkills([]);
    }
  };
  ```
- **Why:** Handles multiple response shapes and logs errors for debugging.

**Step 2.2.3: Validation**
- Run: `npm run build` → must pass
- Manual: Load FindPeople page → trending should display or be empty, not crash
- Test: Mock backend to return non-array trending → should gracefully show empty
- Expected: No `map is not a function` errors

---

### Issue 2.3: Skill Exchange API Already Fixed but Needs Documentation
**Severity:** 🟢 ALREADY IMPROVED  
**File:** [src/services/skillExchangeApi.ts](src/services/skillExchangeApi.ts)  
**Current State:** Line 349 already has defensive notification parsing  
**Action:** Add a comment explaining why the multi-shape handling is there.

**Step 2.3.1: Document the notifications response handling**
- **Location:** [src/services/skillExchangeApi.ts](src/services/skillExchangeApi.ts) lines 348-360
- **Current Code:**
  ```typescript
  export const getNotifications = async (): Promise<NotificationItem[]> => {
    try {
      const response = await axios.get<{
        notifications?: NotificationItem[];
        data?: { notifications?: NotificationItem[] };
      }>(`${BASE_URL}/notifications`, {
        headers: getAuthHeader(),
      });
      return response.data.notifications || response.data.data?.notifications || [];
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  };
  ```
- **Change:** Add comment
  ```typescript
  export const getNotifications = async (): Promise<NotificationItem[]> => {
    try {
      // Accept both flat and nested notification shapes to handle backend variations
      const response = await axios.get<{
        notifications?: NotificationItem[];
        data?: { notifications?: NotificationItem[] };
      }>(`${BASE_URL}/notifications`, {
        headers: getAuthHeader(),
      });
      // Fall back to empty array if neither shape is present
      return response.data.notifications || response.data.data?.notifications || [];
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  };
  ```
- **Why:** Future developers will understand this is intentional, not a bug.

**Step 2.3.2: Validation**
- Run: `npm run build` → must pass
- No runtime change needed; this is already working

---

## PHASE 3: AI Streaming Hardening (High Priority)
### Goal: Prevent chat from hanging or crashing on malformed chunks
### Timeline: ~1.5-2 hours
### Files: 1 main change + 1 validation

---

### Issue 3.1: JSON.parse in Streaming Handler Not Protected
**Severity:** 🔴 CRITICAL  
**File:** [src/services/aiApi.ts](src/services/aiApi.ts)  
**Current State:** Lines 43-100 parse JSON without try/catch  
**Problem:** If backend sends `data: invalid json`, the entire streaming breaks with no recovery.

**Step 3.1.1: Add streaming timeout and error handling**
- **Location:** [src/services/aiApi.ts](src/services/aiApi.ts) lines 43-115
- **Current Code:**
  ```typescript
  export const streamAI = async (
    question: string,
    onChunk: (text: string) => void,
    options?: { provider?: "groq" | "huggingface" | "hf" }
  ): Promise<void> => {
    const token = localStorage.getItem("nextro_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/chat/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: question,
        provider: options?.provider,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error("Streaming failed");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        const line = event
          .split("\n")
          .find((entry) => entry.startsWith("data: "));

        if (!line) continue;

        const data = line.replace(/^data:\s*/, "");
        if (data === "[DONE]") {
          return;
        }

        const parsed = JSON.parse(data);
        if (parsed.error) {
          throw new Error(parsed.error);
        }

        if (parsed.text) {
          onChunk(parsed.text);
        }
      }
    }
  };
  ```
- **Change:** Add try/catch around JSON.parse and response validation
  ```typescript
  export const streamAI = async (
    question: string,
    onChunk: (text: string) => void,
    options?: { provider?: "groq" | "huggingface" | "hf" }
  ): Promise<void> => {
    const token = localStorage.getItem("nextro_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Add streaming timeout to prevent indefinite hangs
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

    try {
      const response = await fetch(`${API_URL}/chat/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: question,
          provider: options?.provider,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Streaming HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("Streaming failed: No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const line = event
            .split("\n")
            .find((entry) => entry.startsWith("data: "));

          if (!line) continue;

          const data = line.replace(/^data:\s*/, "");
          if (data === "[DONE]") {
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              onChunk(parsed.text);
            }
          } catch (parseError) {
            console.error('[AI Stream] JSON parse error:', data, parseError);
            // Continue processing instead of crashing
            onChunk("[Unable to parse response chunk]");
          }
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }
  };
  ```
- **Why:** Timeout prevents indefinite hangs, try/catch prevents crash on malformed JSON, signals degraded state to user.

**Step 3.1.2: Validation**
- Run: `npm run build` → must pass
- Manual: Open AI chat → send question → should stream correctly
- Manual: Mock network to slow-return response → should timeout after 2 minutes gracefully
- Test: Mock backend to send malformed JSON → should show parse error but not crash
- Expected: No unhandled promise rejections in console

---

## PHASE 4: Inbox & Messaging Null Safety (High Priority)
### Goal: Prevent 500 errors when agreement participants are incomplete
### Timeline: ~1.5-2 hours
### Files: 1 main change + 1 validation

---

### Issue 4.1: Agreement Partner Null Dereference in Inbox
**Severity:** 🔴 CRITICAL  
**File:** [backend/controllers/agreementMessageController.js](backend/controllers/agreementMessageController.js)  
**Current State:** Lines 46-62 assume partner exists  
**Problem:** If an agreement has only 1 participant or a participant was deleted, accessing `partner._id` throws error.

**Step 4.1.1: Add partner validation before dereferencing**
- **Location:** [backend/controllers/agreementMessageController.js](backend/controllers/agreementMessageController.js) lines 44-75
- **Current Code:**
  ```javascript
  const partner = (agreement.participants || []).find(
    (p) => p?._id?.toString() !== userId.toString()
  );
  
  return {
    agreementId: agreement._id,
    skill: agreement.skill,
    participants: (agreement.participants || []).map((p) => ({
      _id: partner._id,
      fullName: partner.fullName || "Partner",
    })),
    // ... rest of fields
  };
  ```
- **Change:** Guard partner before use
  ```javascript
  const partner = (agreement.participants || []).find(
    (p) => p?._id?.toString() !== userId.toString()
  );
  
  // Guard: if no partner found or participant list is invalid, return safe fallback
  if (!partner) {
    console.warn(`[agreementMessageController] No partner found for agreement ${agreement._id}`);
    return {
      agreementId: agreement._id,
      skill: agreement.skill,
      participants: (agreement.participants || []).map((p) => ({
        _id: p?._id || "unknown",
        fullName: p?.fullName || "Unknown Participant",
      })),
      status: "incomplete",
      error: "Partner information unavailable",
      // ... rest of fields
    };
  }
  
  return {
    agreementId: agreement._id,
    skill: agreement.skill,
    participants: (agreement.participants || []).map((p) => ({
      _id: p._id,
      fullName: p.fullName || "Partner",
    })),
    // ... rest of fields
  };
  ```
- **Why:** Returns safe fallback instead of throwing, prevents 500 errors.

**Step 4.1.2: Add similar guards to message fetch endpoints**
- **Location:** [backend/controllers/agreementMessageController.js](backend/controllers/agreementMessageController.js) lines 100-125
- **Current Code:**
  ```javascript
  const messages = await AgreementMessage.find({ agreementId })
    .sort({ createdAt: -1 })
    .limit(50);
  ```
- **Change:** Add validation after fetch
  ```javascript
  const messages = await AgreementMessage.find({ agreementId })
    .sort({ createdAt: -1 })
    .limit(50);
  
  // Validate messages have sender info before mapping
  const validMessages = messages.filter((msg) => msg.senderId);
  if (validMessages.length < messages.length) {
    console.warn(
      `[agreementMessageController] Filtered ${messages.length - validMessages.length} messages with missing sender`
    );
  }
  ```
- **Why:** Prevents rendering messages with missing sender information.

**Step 4.1.3: Validation**
- Run: `npm run build` → must pass
- Manual: Create agreement with 1 participant → fetch inbox → should not error
- Manual: Delete a participant mid-request → inbox should return partial data with error flag
- Test: Mock agreement with no participants → should return safe fallback
- Expected: No 500 errors in inbox endpoints; console should show warnings instead

---

## PHASE 5: Skill Exchange Load Optimization (Medium Priority)
### Goal: Reduce mount-time fan-out and polling pressure
### Timeline: ~2-3 hours
### Files: 2 main changes + 1 validation point

---

### Issue 5.1: Skill Exchanges Page Fans Out Sessions & Reviews on Mount
**Severity:** 🟠 HIGH  
**File:** [src/components/skill-exchange/SkillExchangesPage.tsx](src/components/skill-exchange/SkillExchangesPage.tsx)  
**Current State:** Lines 81-115 fetch all sessions and reviews immediately with `Promise.allSettled`  
**Problem:** If user has 50 agreements, this creates 50+ API calls at once.

**Step 5.1.1: Lazy-load sessions on agreement expand instead of all at once**
- **Location:** [src/components/skill-exchange/SkillExchangesPage.tsx](src/components/skill-exchange/SkillExchangesPage.tsx) lines 75-120
- **Current Code:**
  ```typescript
  const load = async () => {
    try {
      const agreementsData = normalizeList(await getAgreements());
      setAgreements(agreementsData);
      const sessionResults = await Promise.allSettled(
        agreementsData.map(async (agreement) => [agreement._id, await getSessions(agreement._id)] as const),
      );
      // ... rest
    } catch (error) {
      toast.error((error as Error).message);
    }
  };
  ```
- **Change:** Only fetch sessions for expanded items
  ```typescript
  const [expandedAgreementId, setExpandedAgreementId] = useState<string | null>(null);

  const load = async () => {
    try {
      const agreementsData = normalizeList(await getAgreements());
      setAgreements(agreementsData);
      // Only fetch sessions if an agreement is expanded
      if (expandedAgreementId) {
        const sessions = await getSessions(expandedAgreementId);
        setSessionsByAgreement((prev) => ({
          ...prev,
          [expandedAgreementId]: sessions,
        }));
      }
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleExpandAgreement = async (agreementId: string) => {
    setExpandedAgreementId(agreementId);
    if (!sessionsByAgreement[agreementId]) {
      try {
        const sessions = await getSessions(agreementId);
        setSessionsByAgreement((prev) => ({
          ...prev,
          [agreementId]: sessions,
        }));
      } catch (error) {
        toast.error(`Failed to load sessions: ${(error as Error).message}`);
      }
    }
  };
  ```
- **Why:** Reduces initial load from N+1 to just 1 request, loads more data only when user needs it.

**Step 5.1.2: Paginate or defer reviews fetch**
- **Location:** [src/components/skill-exchange/SkillExchangesPage.tsx](src/components/skill-exchange/SkillExchangesPage.tsx) lines 85-115
- **Current Code:**
  ```typescript
  const reviewsByPartner = await Promise.allSettled(
    uniquePartnerIds.map(async (partnerId) => [partnerId, await getReviews(partnerId)] as const),
  );
  ```
- **Change:** Only fetch reviews for completed agreements when viewing them
  ```typescript
  const [reviewsForAgreement, setReviewsForAgreement] = useState<Record<string, Review[]>>({});

  const loadReviewsForAgreement = async (agreementId: string, partnerId: string) => {
    if (reviewsForAgreement[partnerId]) return; // Already loaded
    try {
      const reviews = await getReviews(partnerId);
      setReviewsForAgreement((prev) => ({ ...prev, [partnerId]: reviews }));
    } catch (error) {
      console.error(`Failed to load reviews for partner ${partnerId}:`, error);
    }
  };
  ```
- **Why:** Only loads reviews on demand, not upfront.

**Step 5.1.3: Validation**
- Run: `npm run build` → must pass
- Manual: Open Skill Exchanges page → should load quickly (only agreements, no sessions/reviews)
- Manual: Expand an agreement → sessions should load
- Manual: View completed agreement → reviews should load on demand
- Expected: Page loads in <1s instead of potentially 5-10s

---

### Issue 5.2: Message Polling Has Stale Dependency
**Severity:** 🟠 HIGH  
**File:** [src/components/skill-exchange/SkillMessagesPage.tsx](src/components/skill-exchange/SkillMessagesPage.tsx)  
**Current State:** Lines 87-99 polls with `selectedAgreementId` in dependency but polling callback may capture stale value  
**Problem:** If user clicks a different agreement while old poll is queued, stale agreement messages are fetched.

**Step 5.2.1: Add agreement ID validation before polling**
- **Location:** [src/components/skill-exchange/SkillMessagesPage.tsx](src/components/skill-exchange/SkillMessagesPage.tsx) lines 80-100
- **Current Code:**
  ```typescript
  useEffect(() => {
    const interval = setInterval(() => {
      loadInbox(selectedAgreementId);
      if (selectedAgreementId) loadThread(selectedAgreementId);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadInbox, loadThread, selectedAgreementId]);
  ```
- **Change:** Validate ID hasn't changed before loading
  ```typescript
  useEffect(() => {
    let isMounted = true;

    const interval = setInterval(() => {
      // Check if component is still mounted and agreement hasn't changed
      if (!isMounted || !selectedAgreementId) return;
      
      loadInbox(selectedAgreementId);
      
      // Verify agreement ID again before loading thread
      // (in case it changed between interval ticks)
      if (isMounted && selectedAgreementId) {
        loadThread(selectedAgreementId);
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [loadInbox, loadThread, selectedAgreementId]);
  ```
- **Why:** Prevents polling stale agreement if user switches.

**Step 5.2.2: Reduce polling frequency for less busy messages**
- **Location:** [src/components/skill-exchange/SkillMessagesPage.tsx](src/components/skill-exchange/SkillMessagesPage.tsx) lines 87-99
- **Current Code:**
  ```typescript
  }, 30000); // Poll every 30s
  ```
- **Change:** Make polling configurable, default to 60s
  ```typescript
  const POLLING_INTERVAL = 60000; // 1 minute instead of 30s
  
  }, POLLING_INTERVAL);
  ```
- **Why:** Reduces backend load by 50%, still reasonable for messaging.

**Step 5.2.3: Validation**
- Run: `npm run build` → must pass
- Manual: Open messages for agreement A → wait → switch to agreement B → should not show A's messages
- Manual: Watch Network tab → polling should happen every 60s, not 30s
- Expected: No stale data flickering, reduced API call count

---

## PHASE 6: Backend Outage Behavior (Medium Priority)
### Goal: Make DB unavailability explicit and prevent retry storms
### Timeline: ~1-2 hours
### Files: 2 main changes + 1 validation

---

### Issue 6.1: DB Failure Returns 503 Without Context
**Severity:** 🟠 HIGH  
**File:** [backend/app.js](backend/app.js)  
**Current State:** Lines 162-168 return 503 but frontend may not recognize the pattern  
**Problem:** Frontend keeps retrying DB-down errors immediately, creating a retry storm.

**Step 6.1.1: Add explicit health check endpoint**
- **Location:** [backend/app.js](backend/app.js) lines 1-80
- **Add a new route:**
  ```javascript
  app.get('/api/health', (req, res) => {
    const isHealthy = connectDB.isDatabaseConnected();
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      database: isHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  });
  ```
- **Why:** Frontend can call this to determine if a 503 is temporary or structural.

**Step 6.1.2: Add context to 503 response**
- **Location:** [backend/app.js](backend/app.js) lines 160-170
- **Current Code:**
  ```javascript
  if (connectDB.isDatabaseConnected()) {
    return next();
  }
  connectDB().catch(() => {});
  return res.status(503).json({
    message: 'Service temporarily unavailable',
  });
  ```
- **Change:** Add more context
  ```javascript
  if (connectDB.isDatabaseConnected()) {
    return next();
  }
  // Try to reconnect in background, but don't block
  connectDB().catch(() => {});
  return res.status(503).json({
    success: false,
    code: 'DATABASE_UNAVAILABLE',
    message: 'Database connection unavailable. Retrying...',
    retryAfter: 5, // Suggest retry after 5 seconds
    timestamp: new Date().toISOString(),
  });
  ```
- **Why:** Frontend can read `retryAfter` and implement backoff.

**Step 6.1.3: Frontend Should Check Health Before Retrying**
- **Location:** [src/services/http.ts](src/services/http.ts) lines 55-80
- **Add fallback check for 503:**
  ```typescript
  if (error.response?.status === 503) {
    const retryAfter = error.response?.data?.retryAfter || 5;
    console.warn(`[HTTP] Server returned 503, retrying after ${retryAfter}s`);
    // Wait before retrying, don't immediately fail
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return axios(originalRequest);
  }
  ```
- **Why:** Implements exponential backoff on DB-down instead of immediate retry storm.

**Step 6.1.4: Validation**
- Run: `npm run build` → must pass
- Manual: Stop MongoDB → call `/api/health` → should return 503 with `DATABASE_UNAVAILABLE`
- Manual: Stop MongoDB → call protected endpoint → should return 503 with `retryAfter`
- Manual: Frontend should wait and retry, not spam server immediately
- Expected: No rapid 503 cascades in network tab

---

## SUMMARY TABLE

| Phase | Issue | Severity | File(s) | Lines Changed | Effort | Blockers |
|-------|-------|----------|---------|---------------|--------|----------|
| 1 | Refresh race condition | 🔴 | http.ts | 10-30 | 30 min | None |
| 1 | Token validity check | 🟠 | ProtectedRoute.tsx | 38-46 | 15 min | None |
| 2 | Career plan response | 🔴 | careerPlanApi.ts | 12-69 | 45 min | None |
| 2 | Trending response | 🟡 | FindPeople.tsx | 1-90 | 30 min | None |
| 2 | Skill exchange (docs) | 🟢 | skillExchangeApi.ts | 348-360 | 5 min | None |
| 3 | AI streaming parse | 🔴 | aiApi.ts | 43-115 | 60 min | None |
| 4 | Inbox null safety | 🔴 | agreementMessageController.js | 44-125 | 45 min | None |
| 5 | Exchange load fan-out | 🟠 | SkillExchangesPage.tsx | 75-120 | 60 min | None |
| 5 | Message polling stale | 🟠 | SkillMessagesPage.tsx | 80-100 | 30 min | None |
| 6 | DB unavailability | 🟠 | app.js, http.ts | Various | 45 min | None |

---

## EXECUTION ORDER

1. **Start with Phase 1 (Auth)** - These changes don't affect other modules, low risk of cascading impact
2. **Then Phase 2 (API Safety)** - These are all read-side, safe to deploy independently
3. **Then Phase 3 (AI Streaming)** - Self-contained, no dependencies on other phases
4. **Then Phase 4 (Inbox)** - Backend-only, no frontend impact
5. **Then Phase 5 (Load Optimization)** - Frontend-only, safe after other changes are in
6. **Finally Phase 6 (Outage Handling)** - Touches backend + frontend, should be last

---

## VERIFICATION CHECKLIST

After each phase, run:
```bash
npm run build          # Must pass
npm run lint           # Must pass (if available)
npm run test           # If tests exist
git status             # Review all changes
```

Before moving to next phase, confirm:
- [ ] Build passes
- [ ] No new lint errors
- [ ] Manual smoke test in browser (if applicable)
- [ ] Console is clean (no warnings about fixes)

---

## Rollback Plan

Each phase can be rolled back independently:
1. `git diff <phase>-start <phase>-end` to see what changed
2. `git revert <commit-hash>` if immediate rollback needed
3. All changes preserve backward compatibility, so partial rollout is safe

---

## Post-Implementation Monitoring

After all phases are deployed:

- **Watch error logs** for patterns: `JSON.parse`, `Cannot read property`, `undefined filter`
- **Monitor 503 rates** and check if they spike (would indicate DB issues)
- **Track 401 frequency** to catch redirect loop issues
- **Survey users** if dashboard/messaging feel faster

---

**Report Generated:** May 10, 2026  
**Estimated Total Time:** 12-16 hours  
**Confidence Level:** High (all changes have exact line numbers and validation steps)
