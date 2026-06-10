/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useRef, useEffect } from 'react';
import { copilotAPI } from '../../services/api';
import { Send, Bot, User, Loader2, Database, AlertTriangle, ShieldCheck, Info, List, MessageSquare, Plus } from 'lucide-react';
import MarkdownMessage from '../../components/MarkdownMessage';

interface CopilotResponse {
  answer: string;
  conversationId: string;
  evidencePanel: {
    dataPointsUsed: string[];
    recommendation: string;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE';
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  evidencePanel?: CopilotResponse['evidencePanel'];
  isLoading?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: string;
}

function SeverityBadge({ severity }: { severity?: string }) {
  if (!severity || severity === 'NONE') return null;
  const configMap = {
    CRITICAL: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
    HIGH: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle },
    MEDIUM: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle },
    LOW: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Info },
  };
  const config = configMap[severity as keyof typeof configMap];
  
  if (!config) return null;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${config.color}`}>
      <Icon className="w-3 h-3" />
      {severity}
    </span>
  );
}

function EvidencePanel({ data }: { data: CopilotResponse['evidencePanel'] }) {
  if (!data) return null;
  
  return (
    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wide">
          <Database className="w-3.5 h-3.5" />
          Evidence Panel
        </div>
        <SeverityBadge severity={data.severity} />
      </div>
      
      {data.recommendation && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            AI Recommendation
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-[13px] leading-relaxed">
            {data.recommendation}
          </p>
        </div>
      )}
      
      {data.dataPointsUsed && data.dataPointsUsed.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Data Sources Analyzed</div>
          <ul className="flex flex-wrap gap-2">
            {data.dataPointsUsed.map((dp, i) => (
              <li key={i} className="text-[10px] font-medium px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {dp}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function WardenCopilot() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    loadConversations();
  }, []);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await copilotAPI.getConversations();
      setConversations(res.data);
    } catch (_error) {
      console.error('Failed to load conversations', _error);
    }
  };

  const loadConversation = async (id: string) => {
    setActiveConversation(id);
    try {
      const res = await copilotAPI.getConversation(id);
      setMessages(res.data.messages);
    } catch (_error) {
      console.error('Failed to load conversation', _error);
    }
  };

  const handleNewChat = () => {
    setActiveConversation(null);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
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
      const res = await copilotAPI.chat(userMsg.content, activeConversation || undefined);
      const data: CopilotResponse = res.data;
      
      if (!activeConversation) {
        setActiveConversation(data.conversationId);
        loadConversations();
      }

      setMessages(prev => prev.map(m => 
        m.isLoading ? {
          id: Date.now().toString() + '-reply',
          role: 'assistant',
          content: data.answer,
          evidencePanel: data.evidencePanel
        } : m
      ));
    } catch (_error) {
      setMessages(prev => prev.map(m => 
        m.isLoading ? {
          id: Date.now().toString() + '-err',
          role: 'assistant',
          content: 'Sorry, I encountered an error communicating with the AI service. Please try again.',
        } : m
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] -m-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      
      {/* Sidebar - Chat History */}
      <div className={`border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-0 overflow-hidden border-r-0'}`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Briefing
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">History</div>
          {conversations.length === 0 ? (
            <div className="text-sm text-slate-500 px-2 py-4 text-center">No recent conversations</div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`w-full text-left p-3 rounded-xl transition-colors ${
                  activeConversation === conv.id 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-medium text-sm truncate">{conv.title}</div>
                <div className="text-xs text-slate-500 truncate mt-1 flex items-center gap-2">
                  <MessageSquare className="w-3 h-3" /> {conv.messageCount} msgs
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 min-w-0">
        
        {/* Header */}
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <List className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">AI Warden Copilot</h1>
                <p className="text-[11px] font-medium text-slate-500">Qwen3:8b Operational Intelligence</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Bot className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Operational Copilot</h2>
              <p className="text-slate-500 mb-8 text-sm">
                Ask questions about current hostel operations, pending maintenance, fee dues, attendance, or request data summaries. All answers are grounded in real-time database state.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                {['Generate a morning operational briefing', 'Show me urgent maintenance issues', 'Who has the highest overdue fees?', 'Are there any visitors still on premises?'].map(q => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); sendMessage(); }}
                    className="p-3 text-sm text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all text-slate-700 dark:text-slate-300"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex gap-4 max-w-4xl mx-auto ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  message.role === 'user' 
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' 
                    : 'bg-indigo-600 text-white'
                }`}>
                  {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                
                <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                  <div className={`px-5 py-4 rounded-2xl text-[15px] shadow-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-slate-800 text-white dark:bg-slate-700 rounded-tr-sm'
                      : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                  }`}>
                    {message.isLoading ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                        <span className="text-slate-500 font-medium">Analyzing operational data...</span>
                      </div>
                    ) : (
                      <MarkdownMessage content={message.content} />
                    )}
                  </div>
                  
                  {message.evidencePanel && !message.isLoading && (
                    <EvidencePanel data={message.evidencePanel} />
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          <div className="max-w-4xl mx-auto relative flex items-end gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-shadow">
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
              }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Ask Copilot about current operations..."
              className="flex-1 bg-transparent border-0 focus:ring-0 resize-none max-h-48 py-2 px-3 text-slate-800 dark:text-slate-200"
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors disabled:opacity-50 shrink-0 mb-1"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
              AI recommendations should be verified by human staff before action.
            </span>
          </div>
        </div>
        
      </div>
    </div>
  );
}
