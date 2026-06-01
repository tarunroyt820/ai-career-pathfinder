require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });
const { generateResponse, getApiKeys } = require('../backend/services/ai/groq.service');

(async () => {
  try {
    console.log('Using GROQ keys:', getApiKeys());
    const res = await generateResponse('Hello, please respond with a short confirmation that the API key works.', { model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant' });
    console.log('GROQ response:', res);
  } catch (err) {
    console.error('GROQ test failed:', err && err.message, '\nDetails:', err && err.details ? err.details : err);
    process.exit(1);
  }
})();
