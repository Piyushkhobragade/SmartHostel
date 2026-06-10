"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function test() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        console.log('Logging in as student...');
        const loginRes = yield fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'student', password: 'Student@123' })
        });
        if (!loginRes.ok) {
            console.error('Login failed:', yield loginRes.text());
            return;
        }
        const { token } = yield loginRes.json();
        const questions = [
            "How much do I owe?",
            "What is my attendance percentage?",
            "What room am I assigned to?",
            "What are visitor timings?",
            "How do I request maintenance?",
            "What is the attendance policy?",
            "hi",
            "hello"
        ];
        console.log('\n--- Starting AI Verification Tests ---\n');
        for (const q of questions) {
            console.log(`\nQuestion: "${q}"`);
            const start = Date.now();
            const res = yield fetch('http://localhost:3000/api/student/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ question: q })
            });
            const duration = Date.now() - start;
            if (!res.ok) {
                console.error(`Error: ${res.status} ${yield res.text()}`);
                continue;
            }
            const data = yield res.json();
            console.log(`Latency: ${duration}ms`);
            console.log(`Answer:\n${data.answer}`);
            console.log(`Sources used: ${((_a = data.evidence) === null || _a === void 0 ? void 0 : _a.length) || 0}`);
        }
    });
}
test().catch(console.error);
