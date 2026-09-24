async function testApi() {
  try {
    // 1. Get the admin token
    console.log('Logging in as admin...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@bookinghub.com',
        password: 'adminpassword'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Login success!');

    // Trigger Auto-Heal
    console.log('Fetching Profile (auto-heal trigger)...');
    await fetch('http://localhost:5000/api/experts/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });

    // 2. We use admin role, which bypasses the expert auth. Let's update profile
    console.log('Testing /experts/me ...');
    try {
      const pRes = await fetch('http://localhost:5000/api/experts/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ companyName: 'Test Server Company' })
      });
      const data = await pRes.json();
      console.log('PUT /experts/me STATUS:', pRes.status, pRes.statusText);
      console.log('DATA:', data);
    } catch(err) {
      console.error('PUT /experts/me fetch error:', err.message);
    }
    
    // 3. Test Staff Addition
    console.log('Testing /experts/me/staff ...');
    try {
      const sRes = await fetch('http://localhost:5000/api/experts/me/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: 'John Staff',
          role: 'Assistant',
          specialization: ['Help']
        })
      });
      const data = await sRes.json();
      console.log('POST /experts/me/staff STATUS:', sRes.status, sRes.statusText);
      console.log('DATA:', data);
    } catch(err) {
      console.error('POST /experts/me/staff fetch error:', err.message);
    }
  } catch (error) {
    console.error('Login Failed', error.message);
  }
}
testApi();
