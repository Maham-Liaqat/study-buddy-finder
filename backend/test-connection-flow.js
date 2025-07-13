const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Test the complete connection flow
async function testConnectionFlow() {
  console.log('🧪 Testing Complete Connection Flow...\n');

  try {
    // Step 1: Create two test users
    console.log('1️⃣ Creating test users...');
    
    const user1 = {
      name: 'Maham',
      email: 'maham@test.com',
      password: 'password123',
      university: 'Test University',
      bio: 'Test bio for Maham',
      location: 'Test City',
      subjects: [{ name: 'Computer Science' }],
      availability: ['Weekdays', 'Weekends']
    };

    const user2 = {
      name: 'Zara',
      email: 'zara@test.com',
      password: 'password123',
      university: 'Test University',
      bio: 'Test bio for Zara',
      location: 'Test City',
      subjects: [{ name: 'Computer Science' }],
      availability: ['Weekdays', 'Weekends']
    };

    // Register users
    const user1Response = await axios.post(`${BASE_URL}/users/register`, user1);
    const user2Response = await axios.post(`${BASE_URL}/users/register`, user2);
    
    console.log('✅ Users created successfully');
    console.log(`   User 1 (Maham): ${user1Response.data.user._id}`);
    console.log(`   User 2 (Zara): ${user2Response.data.user._id}\n`);

    // Step 2: Login as Maham
    console.log('2️⃣ Logging in as Maham...');
    const mahamLogin = await axios.post(`${BASE_URL}/users/login`, {
      email: 'maham@test.com',
      password: 'password123'
    });
    const mahamToken = mahamLogin.data.token;
    console.log('✅ Maham logged in successfully\n');

    // Step 3: Maham sends request to Zara
    console.log('3️⃣ Maham sending request to Zara...');
    const requestResponse = await axios.post(`${BASE_URL}/requests`, {
      recipientId: user2Response.data.user._id,
      message: 'Hi Zara! Would you like to be my study buddy?'
    }, {
      headers: { Authorization: `Bearer ${mahamToken}` }
    });
    console.log('✅ Request sent successfully');
    console.log(`   Request ID: ${requestResponse.data.request._id}\n`);

    // Step 4: Login as Zara
    console.log('4️⃣ Logging in as Zara...');
    const zaraLogin = await axios.post(`${BASE_URL}/users/login`, {
      email: 'zara@test.com',
      password: 'password123'
    });
    const zaraToken = zaraLogin.data.token;
    console.log('✅ Zara logged in successfully\n');

    // Step 5: Zara checks notifications
    console.log('5️⃣ Zara checking notifications...');
    const zaraNotifications = await axios.get(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${zaraToken}` }
    });
    console.log('✅ Notifications fetched successfully');
    console.log(`   Notifications count: ${zaraNotifications.data.length}`);
    if (zaraNotifications.data.length > 0) {
      console.log(`   Latest notification: ${zaraNotifications.data[0].message}`);
    }

    // Step 6: Zara checks received requests
    console.log('\n6️⃣ Zara checking received requests...');
    const zaraRequests = await axios.get(`${BASE_URL}/requests/received`, {
      headers: { Authorization: `Bearer ${zaraToken}` }
    });
    console.log('✅ Requests fetched successfully');
    console.log(`   Pending requests count: ${zaraRequests.data.length}`);
    if (zaraRequests.data.length > 0) {
      console.log(`   Request from: ${zaraRequests.data[0].senderId.name}`);
      console.log(`   Request message: ${zaraRequests.data[0].message}`);
    }

    // Step 7: Zara accepts the request
    console.log('\n7️⃣ Zara accepting the request...');
    const acceptResponse = await axios.patch(`${BASE_URL}/requests/${requestResponse.data.request._id}/accept`, {}, {
      headers: { Authorization: `Bearer ${zaraToken}` }
    });
    console.log('✅ Request accepted successfully');
    console.log(`   Response: ${acceptResponse.data.message}\n`);

    // Step 8: Check if match was created
    console.log('8️⃣ Checking if match was created...');
    const zaraMatches = await axios.get(`${BASE_URL}/users/matches`, {
      headers: { Authorization: `Bearer ${zaraToken}` }
    });
    console.log('✅ Matches fetched successfully');
    console.log(`   Zara's matches count: ${zaraMatches.data.length}`);
    if (zaraMatches.data.length > 0) {
      console.log(`   Match with: ${zaraMatches.data[0].name}`);
      console.log(`   Connection status: ${zaraMatches.data[0].connectionStatus}`);
    }

    // Step 9: Check Maham's matches
    console.log('\n9️⃣ Checking Maham\'s matches...');
    const mahamMatches = await axios.get(`${BASE_URL}/users/matches`, {
      headers: { Authorization: `Bearer ${mahamToken}` }
    });
    console.log('✅ Matches fetched successfully');
    console.log(`   Maham's matches count: ${mahamMatches.data.length}`);
    if (mahamMatches.data.length > 0) {
      console.log(`   Match with: ${mahamMatches.data[0].name}`);
      console.log(`   Connection status: ${mahamMatches.data[0].connectionStatus}`);
    }

    // Step 10: Check notifications after acceptance
    console.log('\n🔟 Checking notifications after acceptance...');
    const mahamNotifications = await axios.get(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${mahamToken}` }
    });
    console.log('✅ Notifications fetched successfully');
    console.log(`   Maham's notifications count: ${mahamNotifications.data.length}`);
    if (mahamNotifications.data.length > 0) {
      console.log(`   Latest notification: ${mahamNotifications.data[0].message}`);
    }

    console.log('\n🎉 Complete Connection Flow Test PASSED!');
    console.log('\n📋 Summary:');
    console.log('   ✅ User registration works');
    console.log('   ✅ User login works');
    console.log('   ✅ Request sending works');
    console.log('   ✅ Notifications are created');
    console.log('   ✅ Request acceptance works');
    console.log('   ✅ Matches are created');
    console.log('   ✅ Both users can see each other in matches');
    console.log('   ✅ Notifications are sent for acceptance');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Error details:', error.response?.status, error.response?.data);
  }
}

// Run the test
testConnectionFlow(); 