async function test() {
  const res = await fetch('https://asaan-taqreeb-backend.onrender.com/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'mirzazain269@gmail.com', password: '12345678' })
  });
  const data = await res.json();
  console.log('Login Client:', data.success ? 'Success' : data.message);
  
  if (data.success) {
    const chatRes = await fetch('https://asaan-taqreeb-backend.onrender.com/api/v1/messages/chats', {
      headers: { 'Authorization': `Bearer ${data.token}` }
    });
    const chatData = await chatRes.json();
    console.log('Client Chats:', JSON.stringify(chatData, null, 2));
  }
}
test();
