const WebSocket = require('ws');
const { spawn } = require('child_process');

const wss = new WebSocket.Server({ port: 5050 }, () => {
  console.log('✅ WebSocket server running on ws://localhost:5050');
});

function truncateResponse(text, maxLength = 200) {
  return text.length > maxLength ? text.slice(0, maxLength).trim() + '...' : text.trim();
}

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    const userMessage = message.toString().trim();
    console.log(`🧑 User: ${userMessage}`);

    const ollama = spawn('ollama', ['run', 'mistral']);

    let response = '';
    let errorOutput = '';

    ollama.stdin.write(userMessage + '\n');
    ollama.stdin.end();

    ollama.stdout.on('data', (data) => {
      response += data.toString();
    });

    ollama.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ollama.on('close', (code) => {
      if (errorOutput || !response.trim()) {
        console.error(`❌ Ollama error:\n${errorOutput}`);
        ws.send(`Bot: Sorry, I'm having trouble responding right now.`);
        return;
      }

      const reply = truncateResponse(response);
      console.log(`🤖 Bot: ${reply}`);
      ws.send(`Bot: ${reply}`);
    });
  });
});
