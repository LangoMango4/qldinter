const fetch = global.fetch || require('node-fetch');
(async () => {
  try {
    const username = 'builderman';
    const response = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ usernames: [username] })
    });
    console.log('status', response.status);
    console.log(await response.text());
  } catch (error) {
    console.error(error);
  }
})();
