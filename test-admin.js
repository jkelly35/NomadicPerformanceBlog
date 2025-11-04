const fetch = require('node-fetch');

async function testAdminSetup() {
  try {
    console.log('Testing admin setup endpoint...');
    const response = await fetch('http://localhost:3000/api/admin/setup');
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testAdminSetup();
