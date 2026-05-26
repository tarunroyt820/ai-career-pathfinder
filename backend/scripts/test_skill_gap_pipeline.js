const assert = require('assert');

const aiController = require('../controllers/aiController');
const User = require('../models/User');
const Message = require('../models/Message');
const CareerPlan = require('../models/CareerPlan');
const aiService = require('../services/ai/ai.service');
const profileCache = require('../utils/profileCache');

async function testSkillGapPipelineIsolation() {
    const originalProfileCacheGet = profileCache.get;
    const originalProfileCacheSet = profileCache.set;
    const originalUserFindById = User.findById;
    const originalMessageCreate = Message.create;
    const originalCareerPlanFindOne = CareerPlan.findOne;
    const originalAiGenerate = aiService.generate;

    let messageCreateCalls = 0;
    let planSaveCalls = 0;

    const mockPlan = {
        recommendedSkills: ['React', 'Node.js', 'System Design'],
        skillGapAnalysis: [],
        skillGapReport: '',
        async save() {
            planSaveCalls += 1;
            return this;
        },
    };

    try {
        profileCache.get = () => null;
        profileCache.set = () => {};
        User.findById = () => ({
            lean: async () => ({
                _id: 'user-1',
                fullName: 'Test User',
                jobTitle: 'Frontend Developer',
                careerGoal: 'Become a Senior Frontend Engineer',
                skills: ['HTML', 'CSS', 'JavaScript'],
            }),
        });
        Message.create = async () => {
            messageCreateCalls += 1;
            return {};
        };
        CareerPlan.findOne = async () => mockPlan;
        aiService.generate = async () => ({
            providerUsed: 'huggingface',
            modelUsed: 'test-model',
            text: JSON.stringify({
                summary: 'You have strong frontend fundamentals but need deeper framework and backend exposure.',
                existingSkills: ['HTML', 'CSS', 'JavaScript'],
                missingSkills: ['React', 'Node.js'],
                learningPlan: [
                    'Build one React dashboard project',
                    'Create a small Node.js API with authentication',
                ],
                nextStep: 'Start with React and complete one portfolio-quality project this week.',
            }),
        });

        let statusCode = 200;
        let responseBody = null;
        const res = {
            status(code) {
                statusCode = code;
                return this;
            },
            json(payload) {
                responseBody = payload;
                return payload;
            },
        };

        await aiController.generateSkillGap(
            {
                user: { id: 'user-1' },
                body: { role: 'Senior Frontend Engineer' },
            },
            res
        );

        assert.strictEqual(statusCode, 200, 'Expected 200 response from skill-gap endpoint');
        assert.strictEqual(responseBody.success, true, 'Expected success=true');
        assert(responseBody.analysis.includes('Skill Gap Report'), 'Expected formatted report output');
        assert.deepStrictEqual(responseBody.missingSkills, ['React', 'Node.js']);
        assert.strictEqual(messageCreateCalls, 0, 'Skill gap endpoint must not write to assistant Message history');
        assert.strictEqual(planSaveCalls, 1, 'Expected skill gap result to persist to CareerPlan');
        assert.deepStrictEqual(mockPlan.skillGapAnalysis, ['React', 'Node.js']);
        assert(mockPlan.skillGapReport.includes('Recommended Learning Plan'), 'Expected saved markdown report');
    } finally {
        profileCache.get = originalProfileCacheGet;
        profileCache.set = originalProfileCacheSet;
        User.findById = originalUserFindById;
        Message.create = originalMessageCreate;
        CareerPlan.findOne = originalCareerPlanFindOne;
        aiService.generate = originalAiGenerate;
    }
}

async function run() {
    await testSkillGapPipelineIsolation();
    console.log('skill-gap-pipeline-tests: PASS');
}

run().catch((error) => {
    console.error('skill-gap-pipeline-tests: FAIL');
    console.error(error);
    process.exit(1);
});
