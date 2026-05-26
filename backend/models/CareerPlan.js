const mongoose = require('mongoose');
const { Schema } = mongoose;

const MilestoneSchema = new Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['skill', 'project', 'certification', 'other'], default: 'skill' },
  estimateHours: { type: Number, default: 0 },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  dueDate: { type: Date },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  evidence: [{ type: String }],
  notes: { type: String },
});

const RecommendationSchema = new Schema({
  source: { type: String, enum: ['AI', 'RULE', 'USER'], default: 'AI' },
  type: { type: String },
  payload: { type: Schema.Types.Mixed },
  confidence: { type: Number },
  accepted: { type: Boolean, default: null },
  modelVersion: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const RoadmapNodeSchema = new Schema(
  {
    nodeId: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ['start', 'milestone', 'specialization', 'destination'],
      default: 'milestone',
    },
    description: { type: String },
    estimateHours: { type: Number, default: 0 },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    order: { type: Number, default: 0 },
    milestoneId: { type: String, default: null },
  },
  { _id: false }
);

const RoadmapEdgeSchema = new Schema(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    label: { type: String, default: '' },
  },
  { _id: false }
);

const RoadmapSchema = new Schema(
  {
    title: { type: String, default: '' },
    startNodeId: { type: String, default: '' },
    endNodeId: { type: String, default: '' },
    nodes: [RoadmapNodeSchema],
    edges: [RoadmapEdgeSchema],
  },
  { _id: false }
);

const CareerPlanSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    targetRole: { type: String, required: true, index: true },
    status: { type: String, enum: ['ACTIVE', 'PAUSED', 'COMPLETED'], default: 'ACTIVE' },
    overallProgress: { type: Number, default: 0, min: 0, max: 100 },
    aiReady: { type: Boolean, default: false },
    aiGeneratedAt: { type: Date, default: null },
    aiLastRefreshAt: { type: Date, default: null },
    // Job tracking for async AI work (BullMQ job ids or similar)
    aiJobId: { type: String, default: null },
    aiLastRefreshJobId: { type: String, default: null },
    milestones: [MilestoneSchema],
    roadmap: { type: RoadmapSchema, default: null },
    recommendations: [RecommendationSchema],
    skillGapAnalysis: [{ type: String }],
    skillGapReport: { type: String, default: '' },
    notes: { type: String },
  },
  { timestamps: true, versionKey: '__v' }
);

module.exports = mongoose.model('CareerPlan', CareerPlanSchema);
