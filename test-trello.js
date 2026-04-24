const TRELLO_API_KEY = process.env.TRELLO_API_KEY || "";
const TRELLO_API_TOKEN = process.env.TRELLO_API_TOKEN || "";
const TRELLO_BANS_LIST_ID = process.env.TRELLO_BANS_LIST_ID || "";

console.log("Trello Configuration:");
console.log("API Key set:", !!TRELLO_API_KEY);
console.log("API Token set:", !!TRELLO_API_TOKEN);
console.log("Bans List ID set:", !!TRELLO_BANS_LIST_ID);

if (!TRELLO_API_KEY || !TRELLO_API_TOKEN || !TRELLO_BANS_LIST_ID) {
  console.log("❌ Trello is not configured. Please set the following environment variables:");
  console.log("- TRELLO_API_KEY");
  console.log("- TRELLO_API_TOKEN");
  console.log("- TRELLO_BANS_LIST_ID");
  process.exit(1);
}

console.log("✅ Trello is configured. Testing API connection...");

// Test Trello API connection
async function testTrelloAPI() {
  try {
    const params = new URLSearchParams({
      key: TRELLO_API_KEY,
      token: TRELLO_API_TOKEN,
      idList: TRELLO_BANS_LIST_ID,
      name: "Test Ban Card - Please Delete",
      desc: "This is a test card to verify Trello integration works.",
      pos: "top"
    });

    const response = await fetch(`https://api.trello.com/1/cards?${params.toString()}`, {
      method: "POST"
    });

    if (response.ok) {
      const card = await response.json();
      console.log("✅ Trello API test successful!");
      console.log("Created test card:", card.shortUrl);

      // Delete the test card
      const deleteResponse = await fetch(`https://api.trello.com/1/cards/${card.id}?key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}`, {
        method: "DELETE"
      });

      if (deleteResponse.ok) {
        console.log("✅ Test card deleted successfully");
      } else {
        console.log("⚠️ Test card created but could not be deleted. Please delete it manually:", card.shortUrl);
      }
    } else {
      const errorText = await response.text();
      console.log("❌ Trello API test failed:", response.status, errorText);
    }
  } catch (error) {
    console.log("❌ Trello API test error:", error.message);
  }
}

testTrelloAPI();