async function testBanCreation() {
  const payload = {
    username: 'TestUser',
    altUsername: 'TestAlt',
    type: 'permanent',
    reason: 'Roblox TOS Violation: Exploiting',
    appealStatus: 'Permanent Ban - Not Appealable',
    groupId: '35458162'
  };

  try {
    const response = await fetch('http://localhost:3000/api/admin/bans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testBanCreation();