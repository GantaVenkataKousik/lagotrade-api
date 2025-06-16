const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test user data
const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test@123'
};

// Test functions
async function testRegister() {
    try {
        console.log('\n🔍 Testing Register API...');
        console.log('Request:', testUser);
        const response = await axios.post(`${API_URL}/auth/register`, testUser);
        console.log('✅ Register Success:', response.data);
        return response.data.token;
    } catch (error) {
        console.error('❌ Register Error:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            data: error.response?.data,
            error: error.response?.data?.error
        });
        return null;
    }
}

async function testLogin() {
    try {
        console.log('\n🔍 Testing Login API...');
        console.log('Request:', {
            email: testUser.email,
            password: testUser.password
        });
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('✅ Login Success:', response.data);
        return response.data.token;
    } catch (error) {
        console.error('❌ Login Error:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            data: error.response?.data,
            error: error.response?.data?.error
        });
        return null;
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting Authentication Tests...');

    // Test Register
    const registerToken = await testRegister();

    // Test Login
    const loginToken = await testLogin();

    console.log('\n📝 Test Summary:');
    console.log('Register Token:', registerToken ? '✅ Received' : '❌ Failed');
    console.log('Login Token:', loginToken ? '✅ Received' : '❌ Failed');
}

// Run the tests
runTests(); 