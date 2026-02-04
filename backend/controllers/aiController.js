exports.askAI = (req, res) => {
    const { message } = req.body;

    console.log(`Mock AI User Message: ${message}`);

    // Skeleton response
    const mockResponses = [
        "Based on your profile, I recommend focusing on Node.js for backend development.",
        "Your progress in React is impressive! Combining that with MongoDB would make you a strong Full-Stack candidate.",
        "The current market has high demand for AI-integrated applications. How can I help you build one?",
        "To achieve your goal of becoming a Full-Stack Developer, you should start with basic API design."
    ];

    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];

    res.json({
        answer: randomResponse,
        timestamp: new Date().toISOString(),
        model: "mock-ai-engine"
    });
};
