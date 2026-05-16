# Nextaro - Frontend & Backend Code Documentation

## Table of Contents
1. [Login Page](#1-login-page)
2. [Dashboard Page](#2-dashboard-page)
3. [Skill Exchange Page](#3-skill-exchange-page)
4. [Path Finder (Find People)](#4-path-finder-find-people)
5. [AI Assistant Page](#5-ai-assistant-page)
6. [AI Resume Analysis Page](#6-ai-resume-analysis-page)

---

## 1. LOGIN PAGE

### Frontend Code

**File Location:** `src/components/auth/AuthPage.tsx`

#### Key Features:
- Login and Signup modes
- Email verification with OTP
- JWT token management
- Error handling with toast notifications
- Responsive design with mobile & desktop views
- Animated UI components

#### Component Structure:
```typescript
interface AuthPageProps {
  mode: "login" | "signup";
}

export function AuthPage({ mode }: AuthPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [joinSkillExchange, setJoinSkillExchange] = useState(false);
  const navigate = useNavigate();
```

#### Key Functions:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (isLoading) return;
  
  setIsLoading(true);
  
  try {
    if (mode === "signup") {
      const response = await signup(fullName, email, password, joinSkillExchange);
      toast.success(response.message || "Account created. Check your inbox for the OTP.");
      navigate("/verify-email", { replace: true, state: { verificationEmail: email } });
      return;
    } else {
      await login(email, password);
      toast.success("Identity Verified: Welcome Back.");
    }
    
    // Token verification
    const storedToken = localStorage.getItem("nextro_token");
    if (!storedToken) {
      throw new Error("Token functionality verification failed.");
    }
    
    navigate("/dashboard/overview", { replace: true });
  } catch (error: any) {
    // Error handling with different status codes
    console.error("Auth Transaction Failed:", error);
    const errorMessage = error.response?.data?.message || error.message;
    const statusCode = error.response?.status;
    
    if (statusCode === 503) {
      toast.error("Database is reconnecting. Try again in a moment.");
    } else if (statusCode === 429) {
      toast.error("Too many attempts. Please wait a few minutes.");
    } else if (errorMessage.includes("User already exists")) {
      toast.error("Identity Conflict: User already exists.");
    } else {
      toast.error(errorMessage);
    }
    setIsLoading(false);
  }
};
```

#### UI Layout:
- Left Panel (Desktop): Brand narrative with security badge, hero title, trust cards, professional count
- Right Panel: Auth form with email, password fields, optional full name for signup
- Mobile: Responsive layout with collapsible sidebar
- Animated transitions with Framer Motion

#### Styling:
- Custom theme variables (color-teal, bg-primary, bg-card, text-primary)
- Neural grid background pattern
- Gradient effects and shadow cards
- Responsive breakpoints (lg:, md:, xl:)

---

### Backend Code

**File Location:** `backend/routes/authRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/verify-email', authController.verifyEmail);
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
```

**File Location:** `backend/controllers/authController.js`

#### Signup Function:
```javascript
exports.signup = async (req, res) => {
  try {
    if (!(await ensureDatabaseReady(res))) {
      return;
    }
    
    const { fullName, email, password } = req.body;
    console.log(`Auth: Signup request for ${email}`);
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Generate email verification token
    const emailVerificationToken = buildVerificationCode();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Create user
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
      passwordResetToken: null,
      passwordResetExpires: null
    });
    
    // Send verification email
    try {
      await sendVerificationEmail(user.email, emailVerificationToken);
    } catch (mailError) {
      await User.deleteOne({ _id: user._id });
      throw mailError;
    }
    
    res.status(201).json({
      message: 'Account created. Please check your email and enter the OTP to verify your account.',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    respondWithAuthError(res, error);
  }
};
```

#### Login Function:
```javascript
exports.login = async (req, res) => {
  try {
    if (!(await ensureDatabaseReady(res))) {
      return;
    }
    
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Update last active timestamp
    user.lastActiveAt = new Date();
    await user.save();
    
    // Generate JWT tokens
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: "Login successful",
      token,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    respondWithAuthError(res, error);
  }
};
```

#### Email Verification Function:
```javascript
exports.verifyEmail = async (req, res) => {
  try {
    if (!(await ensureDatabaseReady(res))) {
      return;
    }
    
    const { email, otp } = req.body.email ? req.body : req.query;
    
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }
    
    const user = await User.findOne({
      email,
      emailVerificationToken: otp,
      emailVerificationExpires: { $gt: new Date() }
    }).select('+emailVerificationToken +emailVerificationExpires');
    
    if (!user) {
      return res.status(400).json({ message: 'OTP is invalid or expired.' });
    }
    
    user.isEmailVerified = true;
    // ... continue with verification
  } catch (error) {
    respondWithAuthError(res, error);
  }
};
```

#### Security Features:
- Password hashing with bcrypt (salt rounds: 10)
- JWT token generation (15 min access, 7 days refresh)
- Email verification with OTP
- Database connection verification
- Error handling with proper HTTP status codes
- User blocking and rate limiting support

---

## 2. DASHBOARD PAGE

### Frontend Code

**File Location:** `src/components/dashboard/Dashboard.tsx`

#### Key Features:
- Multi-section dashboard with navigation
- Lazy-loaded shell components
- Mobile/Desktop responsive sidebar
- Profile data fetching
- Admin access detection
- Logout functionality

#### Main Navigation Items:
```typescript
const primaryNavItems = [
  { icon: LayoutGrid, label: "Overview", id: "overview", path: "/dashboard/overview" },
  { icon: Compass, label: "Career Path", id: "career", path: "/dashboard/career" },
  { icon: TrendingUp, label: "Skill Gap", id: "skillgap", path: "/dashboard/skillgap" },
  { icon: BookOpen, label: "Learning", id: "learning", path: "/dashboard/learning" },
  { icon: RefreshCw, label: "Skill Exchange", id: "skills", path: "/dashboard/skills" },
  { icon: MessageSquare, label: "AI Assistant", id: "assistant", path: "/dashboard/assistant" },
];

const secondaryNavItems = [
  { icon: FileText, label: "My Resume", id: "resume", path: "/dashboard/resume" },
  { icon: Settings, label: "Settings", id: "settings", path: "/dashboard/settings" },
];
```

#### Component State:
```typescript
export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarExpanded, setDesktopSidebarExpanded] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    fullName: "Nextaro Explorer",
    email: "",
    education: { college: "", degree: "", graduationYear: "" },
    skills: [],
    careerGoal: "",
  });
  const [searchValue, setSearchValue] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
```

#### Profile Loading:
```typescript
useEffect(() => {
  const fetchProfile = async () => {
    try {
      const [data, adminResponse] = await Promise.allSettled([
        getProfile(),
        fetchAdminAccess(),
      ]);
      
      if (data.status === "fulfilled") {
        setProfile(data.value);
      }
      
      setIsAdmin(adminResponse.status === "fulfilled");
    } catch (error) {
      console.error("Dashboard: Error fetching profile", error);
    }
  };
  
  fetchProfile();
}, [navigate]);
```

#### Logout Handler:
```typescript
const handleLogout = () => {
  logout();
  navigate("/login");
};

const handleDashboardLogoDoubleClick = () => {
  const confirmed = window.confirm("Do you want to sign out?");
  if (confirmed) handleLogout();
};
```

#### Sidebar Navigation Section:
```typescript
const renderNavSection = (
  title: string,
  items: typeof primaryNavItems,
  closeOnClick = false,
  expanded = true,
) => (
  <div>
    {expanded && (
      <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.25)]">
        {title}
      </p>
    )}
    <nav className="space-y-1">
      {items.map((item) => (
        <NavLink
          key={item.id}
          to={item.path}
          onClick={() => closeOnClick && setSidebarOpen(false)}
          style={({ isActive }) => ({
            background: isActive
              ? "linear-gradient(135deg, rgba(22,160,133,0.22), rgba(22,160,133,0.08))"
              : "transparent",
            color: isActive ? "#16A085" : "rgba(255,255,255,0.45)",
            fontWeight: isActive ? 600 : 500,
          })}
          className={`group relative flex items-center rounded-[10px] py-2.5 text-[13px] transition-all duration-200 hover:bg-[rgba(255,255,255,0.04)] hover:text-[rgba(255,255,255,0.7)] ${
            expanded ? "gap-3 px-3 justify-start" : "justify-center px-0"
          }`}
          title={!expanded ? item.label : undefined}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-[3px] bg-[#16A085]" />
              )}
              <item.icon className="h-[17px] w-[17px] shrink-0 opacity-90" />
              {expanded && <span className="truncate">{item.label}</span>}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  </div>
);
```

#### Layout Structure:
- Left Sidebar: Navigation with logo, primary/secondary nav items, admin access indicator
- Mobile Sidebar: Collapsible hamburger menu
- Main Content: Lazy-loaded shells (Overview, Career Path, Skill Gap, Learning, Skills Exchange, AI Assistant)
- Header: Notification bell, user profile, search functionality
- Desktop-optimized with responsive breakpoints

#### Shell Components (Lazy Loaded):
```typescript
const AIAssistantShell = lazy(() => import("./AIAssistantShell").then((module) => ({ default: module.AIAssistantShell })));
const CareerPathShell = lazy(() => import("./CareerPathShell").then((module) => ({ default: module.CareerPathShell })));
const LearningShell = lazy(() => import("./LearningShell").then((module) => ({ default: module.LearningShell })));
const OverviewShell = lazy(() => import("./OverviewShell").then((module) => ({ default: module.OverviewShell })));
const ResumeUpload = lazy(() => import("./ResumeUpload").then((module) => ({ default: module.ResumeUpload })));
const SettingsShell = lazy(() => import("./SettingsShell").then((module) => ({ default: module.SettingsShell })));
const SkillExchangeShell = lazy(() => import("./SkillExchangeShell").then((module) => ({ default: module.SkillExchangeShell })));
const SkillGapShell = lazy(() => import("./SkillGapShell").then((module) => ({ default: module.SkillGapShell })));
```

---

### Backend Code

**File Location:** `backend/routes/dashboardRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.get('/overview', protect, dashboardController.getOverview);

module.exports = router;
```

**File Location:** `backend/controllers/dashboardController.js`

#### Overview Function:
```javascript
exports.getOverview = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      'fullName jobTitle experienceLevel careerGoal education skills createdAt'
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const profileCompletion = computeProfileCompletion(user);
    const totalSections = 7;
    const sectionsCompleted = Math.round((profileCompletion / 100) * totalSections);
    
    const conversationCount = await Message.countDocuments({ userId: req.user.id });
    
    const recentActivityCount = await Message.countDocuments({
      userId: req.user.id,
      timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    const latestMessages = await Message.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(5);
    
    const activityFeed = latestMessages.map((message) => ({
      id: message._id.toString(),
      type: message.role === 'user' ? 'career' : 'learning',
      title: message.role === 'user'
        ? `You asked: ${truncate(message.content, 70)}`
        : `AI replied: ${truncate(message.content, 70)}`,
      timestamp: message.timestamp
    }));
    
    res.json({
      success: true,
      message: 'Overview data loaded successfully',
      lastUpdated: new Date().toISOString(),
      user: {
        id: user._id,
        fullName: user.fullName || '',
        jobTitle: user.jobTitle || '',
      },
      profileCompletion,
      sectionsCompleted,
      totalSections,
      conversationCount,
      recentActivityCount,
      activityFeed
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

#### Helper Functions:
```javascript
const truncate = (value, limit = 72) => {
  if (!value) return '';
  return value.length > limit ? `${value.slice(0, limit).trim()}...` : value;
};

const computeProfileCompletion = (user) => {
  const checks = [
    Boolean(user.fullName),
    Boolean(user.jobTitle),
    Boolean(user.experienceLevel),
    Boolean(user.careerGoal),
    Boolean(user.education?.college),
    Boolean(user.education?.degree),
    Array.isArray(user.skills) && user.skills.length > 0
  ];
  
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const buildRecommendations = (user) => {
  const skills = new Set((user.skills || []).map((skill) => skill.toLowerCase()));
  const goal = (user.careerGoal || '').toLowerCase();
  const recommendations = [];
  
  // Generate dynamic recommendations based on user profile
  if (goal.includes('engineer') && !skills.has('system design')) {
    recommendations.push({
      id: 'system-design-1',
      name: 'System Design',
      level: 'Intermediate',
      demand: 'High',
      progress: 15,
      category: 'system-design'
    });
  }
  
  return recommendations;
};
```

#### Data Models Used:
- User model: Fetches user profile data
- Message model: Retrieves activity history and conversation count

---

## 3. SKILL EXCHANGE PAGE

### Frontend Code

**File Location:** `src/components/skill-exchange/SkillExchangesPage.tsx`

#### Key Features:
- View and manage active skill exchange agreements
- Session scheduling and management
- Dispute resolution workflow
- Review and rating system
- Real-time session status tracking
- Agreement messaging thread

#### Component State:
```typescript
export function SkillExchangesPage() {
  const currentUserId = getCurrentUserIdFromToken();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [sessionsByAgreement, setSessionsByAgreement] = useState<Record<string, Session[]>>({});
  const [sessionDraft, setSessionDraft] = useState<Record<string, string>>({});
  const [disputeAgreementId, setDisputeAgreementId] = useState<string | null>(null);
  const [noShowSessionId, setNoShowSessionId] = useState<string | null>(null);
  const [reviewAgreementId, setReviewAgreementId] = useState<string | null>(null);
  const [reviewTargetId, setReviewTargetId] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [disputeReason, setDisputeReason] = useState<"noshow" | "quality" | "other">("noshow");
  const [disputeEvidence, setDisputeEvidence] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [noShowReason, setNoShowReason] = useState("");
  const [noShowProof, setNoShowProof] = useState("");
  const [reviewedAgreementIds, setReviewedAgreementIds] = useState<Record<string, boolean>>({});
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
```

#### Load Data Function:
```typescript
const load = async () => {
  try {
    const agreementsData = normalizeList(await getAgreements());
    setAgreements(agreementsData);
    
    const sessionResults = await Promise.allSettled(
      agreementsData.map(async (agreement) => 
        [agreement._id, await getSessions(agreement._id)] as const
      ),
    );
    
    const sessionPairs = sessionResults
      .filter((result): result is PromiseFulfilledResult<readonly [string, Session[]]> => 
        result.status === "fulfilled"
      )
      .map((result) => result.value);
    
    setSessionsByAgreement(Object.fromEntries(sessionPairs));
    
    // Load reviews for completed agreements
    const completedAgreements = agreementsData.filter((agreement) => agreement.status === "completed");
    const participantsByAgreement = Object.fromEntries(
      completedAgreements.map((agreement) => {
        const partner = agreement.participants
          .map((participant) => ({
            id: getUserId(participant),
            name: getUserName(participant, "Partner"),
          }))
          .find((participant) => participant.id !== currentUserId);
        
        return [agreement._id, partner?.id || ""] as const;
      }),
    );
  } catch (error) {
    console.error("Load failed:", error);
  }
};
```

#### Session Status Badge Styling:
```typescript
const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case "active":
      return "bg-green-600";
    case "completed":
      return "bg-blue-600";
    case "disputed":
      return "bg-orange-500";
    case "cancelled":
      return "bg-red-600";
    default:
      return "bg-gray-500";
  }
};

const getTimeRemaining = (scheduledAt: string, nowTimestamp: number): string => {
  const diff = new Date(scheduledAt).getTime() - nowTimestamp;
  if (!Number.isFinite(diff) || diff <= 0) return "Started";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `Starts in ${hours}h ${minutes}m`;
};
```

#### Key Actions:
- **Create Session:** Schedule a new skill exchange session
- **Confirm Session:** Agree to a proposed session
- **Report No-Show:** Report partner didn't attend scheduled session
- **File Dispute:** Raise quality or other dispute issues
- **Submit Review:** Rate and review partner after completion
- **View Agreement Messages:** Thread for partner communication

#### UI Components Used:
- Button, InputField components
- Agreement messaging thread display
- Session cards with status indicators
- Dispute form modal
- Review submission form
- Time remaining counter

---

### Backend Code

**File Location:** `backend/routes/skillsRoutes.js`

```javascript
const express = require('express');
const { protect } = require('../middleware/auth');
const exchangeController = require('../controllers/exchangeController');

const router = express.Router();

router.post('/', protect, exchangeController.upsertSkillProfile);
router.get('/search', protect, exchangeController.searchExchangeUsers);
router.get('/:userId', protect, exchangeController.getSkillProfile);

module.exports = router;
```

**Additional Routes for Skill Exchange:**
- `POST /api/agreements` - Create new agreement
- `GET /api/agreements` - List user's agreements
- `POST /api/agreements/:id/sessions` - Schedule session
- `POST /api/agreements/:id/sessions/:sessionId/confirm` - Confirm session
- `POST /api/agreements/:id/disputes` - File dispute
- `POST /api/agreements/:id/reviews` - Submit review
- `GET /api/agreements/:id/messages` - Get agreement messages

#### SkillProfile Model Fields:
```javascript
{
  userId: ObjectId,
  skillsOffered: [{
    name: String,
    category: String,
    level: String,
    yearsOfExperience: Number,
    description: String
  }],
  skillsWanted: [{
    name: String,
    category: String,
    level: String
  }],
  hourlyRate: Number,
  availability: {
    // Availability slots
  },
  bio: String,
  languages: [String],
  verificationStatus: String,
  trustScore: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Agreement Model Fields:
```javascript
{
  participants: [ObjectId], // 2 users
  skillsExchanging: {
    skill1: String,
    skill2: String
  },
  status: String, // 'active', 'completed', 'disputed', 'cancelled'
  sessions: [ObjectId],
  messages: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

#### Session Model Fields:
```javascript
{
  agreementId: ObjectId,
  scheduledAt: Date,
  duration: Number,
  status: String, // 'scheduled', 'ongoing', 'completed', 'no-show'
  participants: [ObjectId],
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 4. PATH FINDER (FIND PEOPLE)

### Frontend Code

**File Location:** `src/pages/FindPeople.tsx`

#### Key Features:
- Search for skill exchange partners
- Advanced filtering (name, skill, trust score, hourly rate)
- Availability matching
- Match score calculation
- Skill trending insights
- Skill request modal
- Pagination support

#### Component State:
```typescript
const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);

const [personName, setPersonName] = useState("");
const [skill, setSkill] = useState("");
const [minTrustScore, setMinTrustScore] = useState("");
const [maxHourlyRate, setMaxHourlyRate] = useState("");
const [availabilityOverlap, setAvailabilityOverlap] = useState(false);
const [availableThisWeek, setAvailableThisWeek] = useState(false);
const [sortBy, setSortBy] = useState<SortBy>("match");
const [trendingSkills, setTrendingSkills] = useState<string[]>([]);

const [requestTargetUserId, setRequestTargetUserId] = useState<string | null>(null);
```

#### Search Function:
```typescript
const fetchProfiles = async (targetPage = page) => {
  const seq = ++requestSequenceRef.current;
  setLoading(true);
  setError(null);
  
  try {
    const response = await searchProfiles({
      page: targetPage,
      limit: PAGE_SIZE,
      personName: personName.trim() || undefined,
      skillOffered: skill.trim() || undefined,
      minTrustScore: minTrustScore ? Number(minTrustScore) : undefined,
      maxHourlyRate: maxHourlyRate ? Number(maxHourlyRate) : undefined,
      availabilityOverlap,
      availableThisWeek,
      sortBy,
    });
    
    if (seq !== requestSequenceRef.current) {
      return;
    }
    
    setProfiles(Array.isArray(response.data.results) ? response.data.results : []);
    setTotalPages(Math.max(Number(response.data.totalPages || 1), 1));
  } catch (err: any) {
    if (seq !== requestSequenceRef.current) {
      return;
    }
    
    const message = err?.response?.data?.message || "Failed to load profiles";
    setError(message);
    setProfiles([]);
    setTotalPages(1);
  } finally {
    if (seq === requestSequenceRef.current) {
      setLoading(false);
    }
  }
};
```

#### Trending Skills Loading:
```typescript
useEffect(() => {
  const loadTrending = async () => {
    try {
      const response = await fetchTrendingSkills();
      const items = Array.isArray(response.data?.trending) ? response.data.trending : [];
      setTrendingSkills(items.map((item) => String(item?._id || "")).filter(Boolean));
    } catch (_error) {
      setTrendingSkills([]);
    }
  };
  
  loadTrending();
}, []);
```

#### Debounced Search:
```typescript
useEffect(() => {
  const delay = setTimeout(() => {
    setPage(1);
    fetchProfiles(1);
  }, 400);
  return () => clearTimeout(delay);
}, [skill, personName]);
```

#### Filter Controls:
```typescript
type SortBy = "match" | "trust" | "rate";

const PAGE_SIZE = 10;

// Filters applied:
- personName: Filter by full name (case-insensitive)
- skill: Filter by skill offered (case-insensitive, debounced)
- minTrustScore: Minimum trust score filter
- maxHourlyRate: Maximum hourly rate filter
- availabilityOverlap: Match availability with current user
- availableThisWeek: Filter available users this week
- sortBy: Sort by match score, trust score, or hourly rate
- Pagination: 10 results per page
```

#### Profile Display:
- Match score and reasons
- User profile information (name, skills, trust score)
- Hourly rate and availability
- Action button to initiate request

#### Request Exchange Modal:
```typescript
<RequestExchangeModal
  targetUserId={requestTargetUserId}
  onClose={() => setRequestTargetUserId(null)}
  onSuccess={() => {
    fetchProfiles(page);
  }}
/>
```

---

### Backend Code

**File Location:** `backend/routes/discoveryRoutes.js`

```javascript
const express = require("express");
const router = express.Router();
const discoveryController = require("../controllers/discoveryController");
const { protect } = require("../middleware/auth");

// GET /api/discovery/search
router.get("/search", protect, discoveryController.searchProfiles);
router.get("/trending-skills", protect, discoveryController.getTrendingSkills);

module.exports = router;
```

**File Location:** `backend/controllers/discoveryController.js`

#### Search Profiles Function:
```javascript
exports.searchProfiles = async (req, res) => {
  try {
    const {
      personName,
      skillOffered,
      skillWanted,
      category,
      minTrustScore,
      maxHourlyRate,
      availabilityOverlap,
      availableThisWeek,
      page = 1,
      limit = 10,
      sortBy = "match"
    } = req.query;
    
    const currentUserId = req.user.id;
    
    // Pagination setup
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const skip = (numericPage - 1) * numericLimit;
    
    // Build query
    const query = {
      userId: { $ne: currentUserId },
      isActive: true
    };
    
    // Skill filtering
    if (skillOffered) {
      query["skillsOffered.name"] = {
        $regex: String(skillOffered),
        $options: "i"
      };
    }
    
    if (skillWanted) {
      query["skillsWanted.name"] = {
        $regex: String(skillWanted),
        $options: "i"
      };
    }
    
    if (category) {
      query["skillsOffered.category"] = String(category);
    }
    
    // Price filtering
    if (maxHourlyRate !== undefined && maxHourlyRate !== "") {
      query.hourlyRate = { $lte: toSafeNumber(maxHourlyRate, 0) };
    }
    
    // Count total results
    const totalResults = await SkillProfile.countDocuments(query);
    
    // Fetch profiles with populated user data
    let profiles = await SkillProfile.find(query)
      .populate("userId", "fullName trustScore activeExchangeCount blockedUsers lastActiveAt qualityScore completionRate responseRate activityScore riskFlags achievements completionStreak responseStreak")
      .skip(skip)
      .limit(numericLimit)
      .lean();
    
    // Filter blocked users
    const currentUser = await User.findById(currentUserId).select("blockedUsers").lean();
    const currentBlocked = currentUser?.blockedUsers || [];
    
    profiles = profiles.filter((profile) => {
      const otherUser = profile.userId;
      if (!otherUser || !otherUser._id) return false;
      
      const blockedByCurrent = hasId(currentBlocked, otherUser._id);
      const blockedByOther = hasId(otherUser.blockedUsers, currentUserId);
      return !blockedByCurrent && !blockedByOther;
    });
    
    // Apply name filter
    if (personName && String(personName).trim()) {
      const needle = String(personName).trim().toLowerCase();
      profiles = profiles.filter((profile) =>
        String(profile?.userId?.fullName || "").toLowerCase().includes(needle)
      );
    }
    
    // Apply trust score filter
    if (minTrustScore !== undefined && minTrustScore !== "") {
      const minimum = toSafeNumber(minTrustScore, 0);
      profiles = profiles.filter((profile) => 
        Number(profile?.userId?.trustScore || 0) >= minimum
      );
    }
    
    // Filter by availability overlap
    if (availabilityOverlap === "true" || availableThisWeek === "true") {
      profiles = await matchingService.filterByAvailabilityOverlap(currentUserId, profiles);
    }
    
    // Compute match scores
    profiles = await Promise.all(
      profiles.map(async (profile) => {
        try {
          const match = await matchingService.computeMatchScore(currentUserId, profile.userId._id);
          return {
            ...profile,
            matchScore: match?.score || 0,
            matchReasons: match?.reasons || [],
            availabilityOverlap: Number(match?.availabilityScore || 0)
          };
        } catch (_err) {
          return {
            ...profile,
            matchScore: 0,
            matchReasons: [],
            availabilityOverlap: 0
          };
        }
      })
    );
    
    // Filter by availability week
    if (availableThisWeek === "true") {
      profiles = profiles.filter((profile) => 
        Number(profile?.availabilityOverlap || 0) > 0
      );
    }
    
    // Compute reliability badges
    profiles = profiles.map((profile) => {
      const completionRate = Number(profile?.userId?.completionRate ?? 0);
      const responseRate = Number(profile?.userId?.responseRate ?? 1);
      const activityScore = Number(profile?.userId?.activityScore ?? 0.2);
      const quality = Number(profile?.userId?.qualityScore ?? 0);
      const achievements = Array.isArray(profile?.userId?.achievements) ? profile.userId.achievements : [];
      const completionStreak = Number(profile?.userId?.completionStreak || 0);
      
      let daysSinceActive = Number.POSITIVE_INFINITY;
      const lastActiveRaw = profile?.userId?.lastActiveAt;
      if (lastActiveRaw) {
        const lastActive = new Date(lastActiveRaw);
        if (!Number.isNaN(lastActive.getTime())) {
          daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
        }
      }
      
      const reliabilityBadges = [];
      
      if (completionRate >= 0.8) {
        reliabilityBadges.push("High Completion");
      }
      
      if (responseRate >= 0.8) {
        reliabilityBadges.push("Fast Responder");
      }
      
      // Return enriched profile
      return {
        ...profile,
        reliabilityBadges,
        daysSinceActive
      };
    });
    
    // Sort profiles
    if (sortBy === "trust") {
      profiles.sort((a, b) => (b.userId?.trustScore || 0) - (a.userId?.trustScore || 0));
    } else if (sortBy === "rate") {
      profiles.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
    } else {
      profiles.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }
    
    res.json({
      success: true,
      data: {
        results: profiles,
        page: numericPage,
        totalPages: Math.ceil(totalResults / numericLimit),
        totalResults
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

#### Trending Skills Function:
```javascript
exports.getTrendingSkills = async (req, res) => {
  try {
    // Aggregate trending skills from skill profiles
    const trending = await SkillProfile.aggregate([
      { $unwind: "$skillsOffered" },
      { $group: {
        _id: "$skillsOffered.name",
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 }},
      { $limit: 10 }
    ]);
    
    res.json({
      success: true,
      data: { trending }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

#### Helper Functions:
```javascript
const toSafeNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const hasId = (list, id) => {
  if (!Array.isArray(list) || !id) return false;
  const target = String(id);
  return list.some((entry) => String(entry) === target);
};
```

#### SkillProfile Model (Discovery Context):
```javascript
{
  userId: ObjectId,
  skillsOffered: [{
    name: String,
    category: String,
    level: String,
    yearsOfExperience: Number,
    description: String
  }],
  skillsWanted: [{
    name: String,
    category: String,
    level: String
  }],
  hourlyRate: Number,
  availability: {
    monday: [{ start: String, end: String }],
    tuesday: [{ start: String, end: String }],
    // ... other days
  },
  bio: String,
  languages: [String],
  verificationStatus: String,
  trustScore: Number,
  qualityScore: Number,
  completionRate: Number,
  responseRate: Number,
  activityScore: Number,
  achievements: [String],
  completionStreak: Number,
  responseStreak: Number,
  activeExchangeCount: Number,
  lastActiveAt: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 5. AI ASSISTANT PAGE

### Frontend Code

**File Location:** `src/components/dashboard/AIAssistantShell.tsx`

#### Key Features:
- Real-time chat interface with AI career guidance
- Streaming support with fallback to full responses
- Chat history persistence and restoration
- Image attachment support for UI cloning/design import
- Command palette for quick actions
- Multi-model support with provider routing
- Auto-resizing textarea
- Markdown rendering for AI responses

#### Component State:
```typescript
export function AIAssistantShell() {
  const STREAMING_ENABLED = false;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [recentCommand, setRecentCommand] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState("llama-3.1-8b-instant");
```

#### Starter Prompts:
```typescript
const starterPrompts = [
  {
    icon: Target,
    label: "What's my next career milestone?",
    accent: "from-sky-500/14 to-cyan-400/8 border-sky-400/20 text-sky-200",
  },
  {
    icon: BarChart3,
    label: "Explain React Server Components",
    accent: "from-amber-500/14 to-orange-400/8 border-amber-400/20 text-amber-200",
  },
  {
    icon: Cloud,
    label: "How do I become a Cloud Architect?",
    accent: "from-violet-500/14 to-fuchsia-400/8 border-violet-400/20 text-violet-200",
  },
  {
    icon: Sparkles,
    label: "Check my skill gap for Senior roles",
    accent: "from-emerald-500/14 to-green-400/8 border-emerald-400/20 text-emerald-200",
  },
];
```

#### Command Palette Suggestions:
```typescript
const commandSuggestions = [
  { icon: <ImageIcon className="h-4 w-4" />, label: "Clone UI", description: "Generate a UI from a screenshot", prefix: "/clone" },
  { icon: <Figma className="h-4 w-4" />, label: "Import Figma", description: "Import a design from Figma", prefix: "/figma" },
  { icon: <BarChart3 className="h-4 w-4" />, label: "Create Page", description: "Generate a new web page", prefix: "/page" },
  { icon: <Sparkles className="h-4 w-4" />, label: "Improve", description: "Improve existing UI design", prefix: "/improve" },
];
```

#### Load Chat History:
```typescript
const loadHistory = async (withToast = false) => {
  try {
    setIsFetching(true);
    const history = await getHistory();
    setMessages(history);
    if (withToast) toast.success(history.length ? "Chat history restored." : "No saved chat history yet.");
  } catch (error) {
    console.error("History fetch error:", error);
    toast.error("Failed to load chat history");
  } finally {
    setIsFetching(false);
  }
};
```

#### Handle Send Message:
```typescript
const handleSend = async () => {
  if (!input.trim() || isLoading || isFetching) return;
  const userMessage = input.trim();
  setMessages((prev) => [...prev, { role: "user", content: userMessage, timestamp: new Date().toISOString() }]);
  setInput("");
  const imageUrls = attachments.map((item) => item.url);
  setAttachments([]);
  adjustHeight(true);
  setIsLoading(true);
  
  try {
    const provider = imageUrls.length > 0 ? "huggingface" : "groq";
    
    if (STREAMING_ENABLED) {
      const assistantTimestamp = new Date().toISOString();
      setMessages((prev) => [...prev, { role: "assistant", content: "", timestamp: assistantTimestamp }]);
      
      try {
        await streamAI(userMessage, (text) => {
          setMessages((prev) => {
            const next = [...prev];
            const lastIndex = next.length - 1;
            if (lastIndex >= 0 && next[lastIndex].role === "assistant") {
              next[lastIndex] = {
                ...next[lastIndex],
                content: `${next[lastIndex].content}${text}`,
              };
            }
            return next;
          });
        }, { provider, imageUrls });
      } catch {
        // Fallback to non-streaming
        const response = await askAI(userMessage, { provider, imageUrls });
        setMessages((prev) => [...prev, { role: "assistant", content: response.answer, timestamp: new Date().toISOString() }]);
        toast.message("Streaming interrupted. Delivered full response instead.");
      }
    } else {
      const response = await askAI(userMessage, { provider, imageUrls });
      setMessages((prev) => [...prev, { role: "assistant", content: response.answer, timestamp: new Date().toISOString() }]);
    }
  } catch (error) {
    console.error("Send error:", error);
    toast.error("Failed to get AI response");
  } finally {
    setIsLoading(false);
  }
};
```

#### File Attachment Handling:
```typescript
const handleAttachmentSelect = async (event: ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;
  
  const imageFiles = files.filter((file) => file.type.startsWith("image/"));
  if (imageFiles.length === 0) {
    toast.error("Please choose an image file.");
    return;
  }
  
  try {
    const nextAttachments = await Promise.all(
      imageFiles.map(async (file) => ({
        name: file.name,
        url: await readFileAsDataUrl(file),
      })),
    );
    setAttachments((prev) => [...prev, ...nextAttachments]);
    toast.success(`${nextAttachments.length} image${nextAttachments.length > 1 ? "s" : ""} attached`);
  } catch (error) {
    toast.error("Failed to attach image");
  }
};
```

#### UI Components:
- Message list with user/assistant differentiation
- Auto-resizing textarea for input
- Markdown rendering for AI responses with syntax highlighting
- Copy button for message content
- Attachment preview before send
- Typing indicator animation
- Command palette overlay
- Starter prompts carousel

---

### Backend Code

**File Location:** `backend/routes/aiRoutes.js`

```javascript
const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = rateLimit;
const aiController = require("../controllers/aiController");
const { protect } = require("../middleware/auth");

const aiRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { error: "Too many AI requests. Please wait a moment." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => (req.user && req.user.id ? String(req.user.id) : ipKeyGenerator(req)),
});

router.post("/ask", protect, aiRateLimiter, aiController.askAI);
router.post("/chat/stream", protect, aiRateLimiter, aiController.streamChat);
router.get("/history", protect, aiRateLimiter, aiController.getHistory);

// TEST ROUTE — no auth needed
router.get("/test", async (req, res) => {
    try {
        const aiService = require("../services/ai/ai.service");
        const answer = await aiService.getAIResponse("Say hello and confirm you are working! Keep it short.");
        res.json({
            success: true,
            message: "AI is working! ✅",
            response: answer,
            provider: process.env.AI_PROVIDER || "groq",
        });
    } catch (error) {
        res.json({
            success: false,
            message: "AI failed ❌",
            error: error.message,
        });
    }
});

module.exports = router;
```

**File Location:** `backend/controllers/aiController.js`

#### Ask AI Function (Main Endpoint):
```javascript
exports.askAI = async (req, res) => {
  try {
    const question = req.body.question || req.body.message;
    const imageUrls = Array.isArray(req.body.imageUrls)
      ? req.body.imageUrls.map((url) => String(url || "").trim()).filter(Boolean)
      : [];
    const userId = req.user.id;
    const preferredProvider = (req.body.provider || '').toLowerCase();
    const aiStartedAt = Date.now();

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    // Fetch existing career plan for context
    let existingPlan = null;
    try {
      existingPlan = await CareerPlan.findOne({ userId }).lean();
    } catch {
      // non-critical — continue without plan context
    }

    // Save user message to chat history
    await Message.create({
      userId,
      role: 'user',
      content: question
    });

    // Fetch or cache user profile
    let userProfile = profileCache.get(req.user.id);
    if (!userProfile) {
      userProfile = await User.findById(req.user.id).lean();
      profileCache.set(req.user.id, userProfile);
    }

    if (!userProfile) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch chat history for context
    const chatHistory = await Message.find({ userId }).sort({ timestamp: 1 }).lean();
    const trimmedHistory = buildTrimmedHistory(
      chatHistory.map((message) => ({
        role: message.role,
        content: message.content,
        reasoningDetails: message.reasoningDetails || null
      }))
    );

    // Build system prompt with user context
    const systemPrompt = `You are a career guidance AI assistant. Current plan: ${buildPlanContext(existingPlan)}. Help the user refine their career strategy. Be concise and actionable.`;

    // Route to appropriate provider/model based on intent
    const { provider, model: routedModel, intent } = getProvider(question, preferredProvider);
    const effectiveProvider = imageUrls.length > 0 ? 'huggingface' : provider;
    const effectiveModel = imageUrls.length > 0
      ? (process.env.HF_VISION_MODEL || routedModel)
      : routedModel;

    // Generate AI response
    const result = await aiService.generate(prompt, {
      provider: effectiveProvider,
      model: effectiveModel,
      messages: structuredMessages
    });

    // Save AI response to history
    await Message.create({
      userId,
      role: 'assistant',
      content: result.text,
      reasoningDetails: result.reasoningDetails || null
    });

    // Log AI request metrics
    await saveAiLog({
      userId,
      endpoint: '/api/ai/ask',
      provider: effectiveProvider,
      model: effectiveModel,
      intent,
      promptLength: prompt.length,
      responseLength: result.text.length,
      status: 'success',
      httpStatus: 200,
      latencyMs: Date.now() - aiStartedAt
    });

    res.json({
      success: true,
      answer: result.text,
      modelUsed: effectiveModel,
      providerUsed: effectiveProvider,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("askAI error:", error);
    
    // Fallback to local answer if AI fails
    if (isFallbackEnabled()) {
      const fallbackAnswer = buildLocalFallbackAnswer(question, userProfile, existingPlan);
      return res.json({
        success: true,
        answer: fallbackAnswer,
        modelUsed: 'fallback',
        providerUsed: 'local',
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

#### Helper Functions:
```javascript
const buildCompactProfile = (profile) => {
  return `User: ${profile.fullName || 'Unknown'}. Role: ${profile.jobTitle || 'Not set'}. Goal: ${profile.careerGoal || 'Not set'}. Skills: ${(profile.skills || []).slice(0, 5).join(', ')}.`;
};

const buildPlanContext = (plan) => {
  if (!plan) return 'The user does not have a career plan yet.';
  return [
    `Career Goal: ${plan.careerGoal}`,
    `Milestones: ${plan.milestones?.map((milestone) => milestone.title).join(', ') || 'none'}`,
    `Skills Needed: ${plan.recommendedSkills?.slice(0, 5).join(', ') || 'none'}`,
    `Weekly Tasks: ${plan.weeklyTasks?.slice(0, 3).join(', ') || 'none'}`
  ].join(' | ');
};

const buildTrimmedHistory = (fullHistory) => {
  const MAX_HISTORY_TURNS = 6;
  if (!fullHistory || fullHistory.length === 0) return [];
  
  const recent = fullHistory.slice(-MAX_HISTORY_TURNS);
  if (fullHistory.length > MAX_HISTORY_TURNS) {
    const older = fullHistory.slice(0, -MAX_HISTORY_TURNS);
    const summary = {
      role: 'system',
      content: `Earlier in this conversation: ${older.map((m) => m.content).join(' ').slice(0, 300)}...`
    };
    return [summary, ...recent];
  }
  return recent;
};

const buildLocalFallbackAnswer = (question, profile, plan) => {
  const name = profile?.fullName || "there";
  const goal = plan?.careerGoal || profile?.careerGoal || "your next career milestone";
  const skills = profile?.skills?.slice(0, 4) || [];
  
  return [
    `Hi ${name}, the primary AI provider is temporarily unavailable.`,
    `Recommended focus:`,
    `- Primary goal: ${goal}`,
    `- Strengths to build on: ${skills.join(", ") || "your existing skills"}`,
    `- Next step: choose one task today that moves you closer to ${goal}`,
  ].join("\n");
};

const saveAiLog = async ({
  userId, endpoint, provider, model, intent, 
  promptLength, responseLength, status, httpStatus, latencyMs
}) => {
  try {
    await AIRequestLog.create({
      userId, endpoint, provider, model, intent,
      promptLength, responseLength, status, httpStatus, latencyMs
    });
  } catch (error) {
    console.error('saveAiLog failed:', error.message);
  }
};
```

#### Rate Limiting:
- 20 requests per minute per user
- IP-based fallback for unauthenticated requests
- Prevents abuse and manages API costs

#### AI Provider Routing:
- Groq: Default provider for general questions
- HuggingFace: For image/vision analysis and heavy computations
- OpenRouter: For reasoning-intensive tasks
- Fallback: Local response generation if all providers fail

#### Models Used:
- Groq: `llama-3.1-8b-instant` (default)
- HuggingFace Vision: `HF_VISION_MODEL` env variable
- Heavy computations: `HF_HEAVY_MODEL` or `HF_SKILLGAP_MODEL`

---

## 6. AI RESUME ANALYSIS PAGE

### Frontend Code

**File Location:** `src/components/dashboard/ResumeUpload.tsx`

#### Key Features:
- Drag-and-drop resume upload
- Support for PDF and Word documents
- Optional target role specification for ATS analysis
- File validation (type and size)
- Resume analysis report generation
- Success/error feedback with toasts

#### Component State:
```typescript
export function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
```

#### File Handling:
```typescript
const handleFile = (selectedFile: File) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(selectedFile.type)) {
    toast.error("Only PDF or Word documents allowed");
    return;
  }

  if (selectedFile.size > 5 * 1024 * 1024) {
    toast.error("File must be under 5MB");
    return;
  }

  setFile(selectedFile);
  setUploaded(false);
};
```

#### Upload Handler:
```typescript
const handleUpload = async () => {
  if (!file) return;

  setUploading(true);

  try {
    const formData = new FormData();
    formData.append("resume", file);
    if (targetRole.trim()) {
      formData.append("targetRole", targetRole.trim());
    }

    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        ...getAuthHeader(),
        "Content-Type": "multipart/form-data",
      },
    });

    setAnalysis(response.data?.analysis || null);
    setUploaded(true);
    toast.success("Resume uploaded and analyzed successfully!");
  } catch (error: any) {
    const message = error?.response?.data?.message || "Upload failed. Please try again.";
    toast.error(message);
  } finally {
    setUploading(false);
  }
};
```

#### Drag and Drop:
```typescript
<div
  onDragOver={(event) => {
    event.preventDefault();
    setDragging(true);
  }}
  onDragLeave={() => setDragging(false)}
  onDrop={(event) => {
    event.preventDefault();
    setDragging(false);
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }}
  className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-[2rem] border-2 border-dashed p-16 transition-all duration-300 ${
    dragging
      ? "border-primary bg-primary/10"
      : "border-border/40 hover:border-primary/50 hover:bg-muted/20"
  }`}
>
```

#### UI Components:
- Drag-and-drop zone with visual feedback
- Target role input field (optional)
- File preview card showing file name and size
- Upload button with loading state
- File removal button
- Analysis report display (ResumeAnalysisReport component)

---

**File Location:** `src/components/resume/ResumeAnalysisReport.tsx`

#### Analysis Report Features:
- ATS compatibility score
- Content strength evaluation
- Impact and achievements analysis
- Keyword optimization assessment
- Formatting clarity review
- Overall resume score with visual ring progress
- Section-by-section feedback (Summary, Experience, Projects)
- Technical skills detection and missing skills
- Job role matching analysis
- Improvement recommendations with before/after examples
- Action plan for resume enhancement
- Estimated ATS pass rate

#### Type Definitions:
```typescript
type ScoreMap = {
  atsCompatibility?: number;
  contentStrength?: number;
  impactAchievements?: number;
  keywordOptimization?: number;
  formattingClarity?: number;
  overallScore?: number;
};

type ResumeSectionFeedback = {
  quality?: string;
  issue?: string;
  whyItMatters?: string;
  howToFix?: string;
  exampleBefore?: string;
  exampleAfter?: string;
};

type ResumeAnalysis = {
  scores?: ScoreMap;
  summary?: string;
  overallEvaluation?: string;
  strengths?: string[];
  weaknesses?: string[];
  sections?: Array<{
    name?: string;
    score?: number;
    status?: string;
    issues?: string[];
    suggestions?: string[];
  }>;
  sectionFeedback?: {
    summary?: ResumeSectionFeedback;
    experience?: ResumeSectionFeedback;
    projects?: ResumeSectionFeedback;
  };
  keywords?: {
    present?: string[];
    missing?: string[];
    density?: number;
    recommendations?: string[];
  };
  impactReview?: {
    metricsUsed?: string;
    weakStatements?: string[];
    improvedExamples?: string[];
  };
  formatting?: {
    issues?: Array<{
      type?: string;
      severity?: string;
      description?: string;
      fix?: string;
    }>;
  };
  technicalSkills?: {
    detected?: string[];
    skillLevel?: string;
    missing?: string[];
    suggestions?: string[];
  };
  jobRoleMatching?: {
    bestFitRole?: string;
    matchLevel?: string;
    gaps?: string[];
    suggestions?: string[];
  };
  improvements?: Array<{
    section?: string;
    original?: string;
    improved?: string;
    reason?: string;
    priority?: string;
  }>;
  actionPlan?: string[];
  estimatedATSPassRate?: string;
  estimatedATSPassRateAfterFixes?: string;
  finalInsight?: string;
};
```

#### Report Sections:
```typescript
// Overall Score Display
const ringPercent = Math.max(0, Math.min(100, finalScore));
const ringStyle = {
  background: `conic-gradient(#16a085 0% ${ringPercent}%, rgba(255,255,255,0.08) ${ringPercent}% 100%)`,
};

// Score Breakdown Cards
- ATS Compatibility: ${atsScore}
- Content Strength: ${contentScore}
- Impact & Achievements: ${impactScore}
- Keyword Optimization: ${keywordScore}
- Formatting & Clarity: ${formattingScore}
```

#### Key Components:
- Score progress bars
- Status badges (Excellent, Good, Needs Improvement)
- Priority badges (High, Medium, Low)
- Before/After improvement examples
- Keyword density analysis
- Technical skills assessment
- Job role matching section
- Action plan with prioritized steps
- Formatting issues with severity indicators

---

### Backend Code

**File Location:** `backend/routes/resumeRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/resumeUpload');
const { uploadResume } = require('../controllers/resumeController');

router.post('/upload', protect, upload.single('resume'), uploadResume);

module.exports = router;
```

**File Location:** `backend/controllers/resumeController.js`

#### Upload Resume Function:
```javascript
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
    
    // Analyze resume file
    const analysisResult = await analyzeResumeFile(
      req.file.path,
      req.file.mimetype,
      targetRole
    );

    // Log the upload
    await ResumeUploadLog.create({
      userId: req.user.id,
      fileName: req.file.filename,
      fileUrl,
      targetRole,
      analysisProvider: analysisResult.providerUsed,
      analysisModel: analysisResult.modelUsed,
      analysis: analysisResult.analysis,
      rawAnalysis: analysisResult.analysisRaw
    });

    res.json({
      success: true,
      message: 'Resume analyzed successfully',
      analysis: analysisResult.analysis || analysisResult.analysisRaw,
      fileUrl,
      fileName: req.file.filename
    });
  } catch (error) {
    console.error('uploadResume error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Resume analysis failed'
    });
  }
};
```

#### Resume Analysis Function:
```javascript
const analyzeResumeFile = async (filePath, mimeType, targetRole = '') => {
  // Extract text from PDF/DOCX
  const extractedText = await extractResumeText(filePath, mimeType);
  
  if (!extractedText || extractedText.length < 40) {
    throw new Error('Could not read enough text from resume. Use a clear text-based PDF or DOCX.');
  }

  // Select analysis prompt based on target role
  const systemInstruction = targetRole
    ? JOB_TARGETED_ANALYSIS_PROMPT(targetRole)
    : RESUME_ANALYSIS_PROMPT;

  // Build analysis prompt
  const analysisPrompt = [
    systemInstruction,
    'Resume content starts below. Analyze it now and return JSON only.',
    `RESUME_TEXT:\n${extractedText.slice(0, 15000)}`,
  ].join('\n\n');

  // Call AI service for analysis
  let aiResult = await aiService.generate(analysisPrompt, {
    provider: 'huggingface',
    model: getResumeModel(),
    useSecondaryKey: true,
  });

  // Retry with compact prompt if needed
  if (!String(aiResult?.text || '').trim()) {
    const retryPrompt = [
      systemInstruction,
      'Return ONLY valid JSON. Do not leave response empty.',
      `RESUME_TEXT:\n${extractedText.slice(0, 12000)}`,
    ].join('\n\n');

    aiResult = await aiService.generate(retryPrompt, {
      provider: 'huggingface',
      model: getResumeModel(),
      useSecondaryKey: true,
    });
  }

  if (!String(aiResult?.text || '').trim()) {
    throw new Error('AI returned an empty analysis response.');
  }

  // Parse JSON analysis
  let analysis = null;
  try {
    analysis = parseAnalysisJson(aiResult.text);
  } catch (parseError) {
    console.warn(`Structured JSON parse failed: ${parseError.message}`);
  }

  return {
    analysis,
    analysisRaw: aiResult.text,
    providerUsed: aiResult.providerUsed,
    modelUsed: aiResult.modelUsed,
  };
};
```

#### Helper Functions:
```javascript
const getResumeModel = () =>
  process.env.HF_RESUME_MODEL ||
  process.env.HF_HEAVY_MODEL ||
  process.env.HF_MODEL;

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

const extractResumeText = async (filePath, mimeType) => {
  // Extract text from PDF or DOCX file
  // Implementation depends on file type
};
```

#### Models Used:
- HuggingFace Heavy Model for detailed resume analysis
- Support for job-targeted analysis prompts

#### Analysis Prompts:
- `RESUME_ANALYSIS_PROMPT`: General resume analysis
- `JOB_TARGETED_ANALYSIS_PROMPT(targetRole)`: Role-specific ATS analysis

#### ResumeUploadLog Model:
```javascript
{
  userId: ObjectId,
  fileName: String,
  fileUrl: String,
  targetRole: String,
  analysisProvider: String,
  analysisModel: String,
  analysis: Object,
  rawAnalysis: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Integration Summary

### Frontend Services Used:

1. **Auth API** (`src/services/authApi.ts`):
   - `login(email, password)`
   - `signup(fullName, email, password, joinSkillExchange)`
   - `logout()`

2. **Profile API** (`src/services/profileApi.ts`):
   - `getProfile()`
   - `updateProfile(data)`

3. **Dashboard API** (`src/services/dashboardApi.ts`):
   - `getOverview()`

4. **Skill Exchange API** (`src/services/skillExchangeApi.ts`):
   - `getAgreements()`
   - `getSessions(agreementId)`
   - `createSession(agreementId, data)`
   - `confirmSession(sessionId)`
   - `fileDispute(agreementId, data)`
   - `reportNoShow(sessionId, data)`
   - `submitReview(agreementId, data)`
   - `getReviews(agreementId)`

5. **Discovery API** (`src/services/discoveryApi.ts`):
   - `searchProfiles(params)`
   - `fetchTrendingSkills()`

6. **AI API** (`src/services/aiApi.ts`):
   - `askAI(message, options)`
   - `streamAI(message, onText, options)`
   - `getHistory()`

7. **Resume API** (`src/services/resumeApi.ts`):
   - `uploadResume(file, targetRole)`
   - Integrated via axios with multipart form-data
   - Response includes analysis object with scores and recommendations

---

## Database Models Structure

### User Model:
- `_id`: MongoDB ObjectId
- `fullName`: String
- `email`: String (unique)
- `password`: String (hashed with bcrypt)
- `isEmailVerified`: Boolean
- `emailVerificationToken`: String
- `emailVerificationExpires`: Date
- `passwordResetToken`: String
- `passwordResetExpires`: Date
- `jobTitle`: String
- `experienceLevel`: String
- `careerGoal`: String
- `education`: Object (college, degree, graduationYear)
- `skills`: [String]
- `trustScore`: Number
- `qualityScore`: Number
- `completionRate`: Number
- `responseRate`: Number
- `activityScore`: Number
- `achievements`: [String]
- `completionStreak`: Number
- `responseStreak`: Number
- `blockedUsers`: [ObjectId]
- `lastActiveAt`: Date
- `createdAt`: Date
- `updatedAt`: Date

### Career Plan Model:
- `_id`: MongoDB ObjectId
- `userId`: ObjectId (ref: User)
- `title`: String
- `targetRole`: String
- `timeframe`: String
- `intensity`: String
- `status`: String (active, completed, archived)
- `milestones`: [{
  - `_id`: ObjectId
  - `title`: String
  - `description`: String
  - `dueDate`: Date
  - `completed`: Boolean
  - `completedAt`: Date
  - `evidence`: String
  - `notes`: String
}]
- `recommendations`: [Object]
- `createdAt`: Date
- `updatedAt`: Date

---

## Environment Variables Required

Backend `.env`:
```
JWT_SECRET=<your-jwt-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>
MONGODB_URI=<your-mongodb-connection-string>
EMAIL_SERVICE=<email-service-provider>
EMAIL_USER=<email-address>
EMAIL_PASSWORD=<email-password>
```

---

## Summary

This documentation covers the six main pages of the Nextaro platform:

1. **Login Page**: Authentication with email/password, OTP verification, signup flow
2. **Dashboard Page**: Main user hub with navigation to different features
3. **Skill Exchange Page**: Manage active skill exchanges, sessions, disputes, and reviews
4. **Path Finder (Find People)**: Discover and search for skill exchange partners with advanced filtering
5. **AI Assistant Page**: Real-time chat with AI career guidance, streaming support, multi-model routing
6. **AI Resume Analysis Page**: Upload and analyze resumes with AI-powered feedback, ATS scoring, and improvement recommendations

Each page includes detailed frontend React/TypeScript code and backend Node.js/Express controller implementations.
