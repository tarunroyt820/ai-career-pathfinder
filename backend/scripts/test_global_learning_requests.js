const assert = require('assert');

const {
    normalizeGlobalLearningRequestDraft,
    validateGlobalLearningRequestDraft,
} = require('../services/globalLearningRequestService');

function testDraftNormalization() {
    const draft = normalizeGlobalLearningRequestDraft({
        skillWanted: ' React ',
        goalTitle: ' Build dashboards ',
        description: ' Need mentoring ',
        experienceLevel: 'INTERMEDIATE',
        preferredDuration: '90',
        budgetCredits: '',
    });

    assert.strictEqual(draft.skillWanted, 'React');
    assert.strictEqual(draft.goalTitle, 'Build dashboards');
    assert.strictEqual(draft.description, 'Need mentoring');
    assert.strictEqual(draft.experienceLevel, 'intermediate');
    assert.strictEqual(draft.preferredDuration, 90);
    assert.strictEqual(draft.budgetCredits, 0);
}

function testDraftValidation() {
    assert.strictEqual(validateGlobalLearningRequestDraft({}), 'Skill wanted is required');
    assert.strictEqual(
        validateGlobalLearningRequestDraft({
            skillWanted: 'React',
            goalTitle: '',
            preferredDuration: 60,
            experienceLevel: 'beginner',
        }),
        'Goal title is required'
    );
    assert.strictEqual(
        validateGlobalLearningRequestDraft({
            skillWanted: 'React',
            goalTitle: 'Learn hooks',
            preferredDuration: 10,
            experienceLevel: 'beginner',
        }),
        'Preferred duration must be at least 15 minutes'
    );
    assert.strictEqual(
        validateGlobalLearningRequestDraft({
            skillWanted: 'React',
            goalTitle: 'Learn hooks',
            preferredDuration: 60,
            experienceLevel: 'advanced',
            budgetCredits: 0,
        }),
        null
    );
}

try {
    testDraftNormalization();
    testDraftValidation();
    console.log('global-learning-request-tests: PASS');
} catch (error) {
    console.error('global-learning-request-tests: FAIL');
    console.error(error);
    process.exit(1);
}
