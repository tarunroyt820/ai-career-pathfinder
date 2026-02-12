
const axios = require('axios');

async function testLogin() {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test@example.com',
            password: 'password123'
        });
        console.log('Login Successful:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('Login Failed:', error.response.data);
        } else {
            console.error('Login Error:', error.message);
        }
    }
}

testLogin();
