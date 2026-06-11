const http = require('http');

const HOST = '43.205.203.235';
const PORT = 80; // Nginx port

async function request(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const headers = { 'Content-Type': 'application/json' };
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { hostname: HOST, port: PORT, path, method, headers };
    const startTime = Date.now();
    
    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        const time = Date.now() - startTime;
        resolve({ status: res.statusCode, data: JSON.parse(responseBody || '{}'), time });
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log("1. Authenticating Admin...");
  const adminAuth = await request('/api/auth/login', 'POST', { username: 'admin', password: 'admin123' });
  const adminToken = adminAuth.data.token;

  console.log("2. Authenticating Student (arjun001)...");
  const studentAuth = await request('/api/auth/login', 'POST', { username: 'arjun001', password: 'password123' });
  const studentToken = studentAuth.data.token;

  const results = { copilot: [], student: [] };

  // Copilot Questions
  const copilotQuestions = [
    "What are the critical issues today?",
    "What is the policy for late fees?",
    "Who is in room A-101?"
  ];

  for (const q of copilotQuestions) {
    console.log(`Asking Copilot: ${q}`);
    const res = await request('/api/copilot/chat', 'POST', { message: q }, adminToken);
    results.copilot.push({ question: q, answer: res.data.answer, evidence: res.data.evidencePanel, time: res.time });
  }

  // Student Questions
  const studentQuestions = [
    "how much do I owe",
    "what is my attendance",
    "what room am I assigned to",
    "can i bunk hostel for no reason"
  ];

  for (const q of studentQuestions) {
    console.log(`Asking Student AI: ${q}`);
    const res = await request('/api/student/ask', 'POST', { message: q }, studentToken);
    results.student.push({ question: q, answer: res.data.answer, time: res.time });
  }

  console.log("\n==== RESULTS ====");
  console.log(JSON.stringify(results, null, 2));
}

runTests().catch(console.error);
