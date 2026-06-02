import { useState, useRef, useEffect } from 'react';
import { knowledgeAPI } from '../../services/api';
import { Send, Bot, User, Loader2, AlertCircle, ChevronDown } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { id: string; title: string; category: string }[];
  confidence?: string;
  isLoading?: boolean;
}

const categoryColors: Record<string, string> = {
  RULES: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  POLICY: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  FAQ: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PROCEDURE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  CONTACT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const QUICK_QUESTIONS = [
  'What are the visitor timings?',
  'When is my fee due?',
  'What are the mess timings?',
  'How do I request a room change?',
  'What is the gate curfew?',
  'How do I report a maintenance issue?',
];

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isUser
          ? 'bg-blue-600 text-white'
          : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm rounded-tl-sm'
        }`}>
          {message.isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              <span className="text-slate-400 dark:text-slate-500">Thinking...</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && !message.isLoading && (
          <div className="flex flex-wrap gap-1.5">
            {message.sources.map(source => (
              <span key={source.id} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryColors[source.category] || 'bg-slate-100 text-slate-600'}`}>
                {source.title}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function KnowledgeAI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I'm the SmartHostel X Knowledge Assistant. 🏠

I can answer questions about:
• Hostel rules and policies
• Fee payment procedures
• Mess timings and rules
• Visitor policies
• Maintenance requests
• Room change procedures
• And more!

What would you like to know?`,
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ollamaError, setOllamaError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return;

    setOllamaError('');
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question.trim(),
    };
    const loadingMsg: Message = {
      id: Date.now().toString() + '-loading',
      role: 'assistant',
      content: '',
      isLoading: true,
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await knowledgeAPI.ask(question.trim());
      const { answer, sources, confidence } = response.data;

      setMessages(prev => prev.map(m =>
        m.isLoading ? {
          id: Date.now().toString() + '-reply',
          role: 'assistant' as const,
          content: answer,
          sources,
          confidence,
          isLoading: false,
        } : m
      ));
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'Failed to get an answer. Please check if Ollama is running.';
      if (errMsg.includes('Ollama') || errMsg.includes('unavailable')) {
        setOllamaError(errMsg);
      }
      setMessages(prev => prev.map(m =>
        m.isLoading ? {
          id: Date.now().toString() + '-err',
          role: 'assistant' as const,
          content: `Sorry, I encountered an error: ${errMsg}`,
          isLoading: false,
        } : m
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Hostel Knowledge AI</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Qwen3:8b · Answers grounded in hostel policy</p>
        </div>
      </div>

      {/* Ollama Error Banner */}
      {ollamaError && (
        <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2 shrink-0">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">AI Service Unavailable</p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
              Run <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">ollama serve</code> and pull <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">ollama pull qwen3:8b</code>
            </p>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2 min-h-0">
        {messages.map(message => (
          <ChatBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 2 && (
        <div className="shrink-0 mb-3">
          <div className="flex items-center gap-1 mb-2">
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Try asking</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-3 flex items-end gap-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Ask about hostel rules, fees, timings... (Enter to send)"
          rows={1}
          className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none max-h-28 overflow-y-auto"
          style={{ height: 'auto' }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${Math.min(target.scrollHeight, 112)}px`;
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </div>
      <p className="text-center text-[10px] text-slate-300 dark:text-slate-600 mt-1.5 shrink-0">
        Answers are AI-generated based on hostel policy documents. For urgent matters, contact the warden directly.
      </p>
    </div>
  );
}
