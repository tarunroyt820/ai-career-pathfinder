
const axios = require('axios');

async function testFlow() {
    const signupData = {
        fullName: 'Test Login Flow User',
        email: `test_${Date.now()}@example.com`,
        password: 'password123'
    };

    try {
        console.log('--- Testing Signup ---');
        const signupRes = await axios.post('http://localhost:5000/api/auth/signup', signupData);
        console.log('Signup Result:', signupRes.data.message); // Should be "User created successfully"

        console.log('\n--- Testing Login ---');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: signupData.email,
            password: signupData.password
        });
        console.log('Login Result:', loginRes.data.message); // Should be "Login successful"
        console.log('Token Received:', !!loginRes.data.token);

    } catch (error) {
        if (error.response) {
            console.error('Testing Failed:', error.response.data);
        } else {
            console.error('Testing Error:', error.message);
        }
    }
}

testFlow();
