/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import { Send, Bot, User, Loader2, AlertCircle, ChevronDown, Database, FileText } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface KnowledgeSource {
    id: string;
    title: string;
    category: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    dataSources?: string[];
    knowledgeSources?: KnowledgeSource[];
    isLoading?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, [string, string]> = {
    RULES:     ['var(--color-danger)',  'var(--color-danger)'],
    POLICY:    ['var(--color-primary)', 'var(--color-primary)'],
    FAQ:       ['var(--color-success)', 'var(--color-success)'],
    PROCEDURE: ['var(--color-info)',    'var(--color-info)'],
    CONTACT:   ['var(--color-warning)', 'var(--color-warning)'],
};

function policyBadgeStyle(category: string): React.CSSProperties {
    const [bg, txt] = CATEGORY_COLORS[category] || ['var(--border-color)', 'var(--text-muted)'];
    return {
        background: `rgba(${bg}, 0.12)`,
        color: `rgb(${txt})`,
        border: `1px solid rgba(${bg}, 0.25)`,
        borderRadius: '9999px',
        padding: '2px 8px',
        fontSize: '10px',
        fontWeight: 600,
        whiteSpace: 'nowrap' as const,
    };
}

function dataBadgeStyle(): React.CSSProperties {
    return {
        background: 'rgba(var(--color-success), 0.12)',
        color: 'rgb(var(--color-success))',
        border: '1px solid rgba(var(--color-success), 0.25)',
        borderRadius: '9999px',
        padding: '2px 8px',
        fontSize: '10px',
        fontWeight: 600,
        whiteSpace: 'nowrap' as const,
    };
}

// Quick questions covering both personal data and policy categories
const QUICK_QUESTIONS = [
    { label: 'My fees due?',           text: 'How much do I owe and when is my next fee due?' },
    { label: 'My attendance?',         text: 'What is my attendance percentage this month?' },
    { label: 'Visitor timings?',       text: 'What are the visitor timings and rules?' },
    { label: 'Mess timings?',          text: 'What are the mess timings and rules?' },
    { label: 'My open issues?',        text: 'Do I have any open maintenance requests?' },
    { label: 'Report issue?',          text: 'How do I report a maintenance issue?' },
    { label: 'Gate curfew?',           text: 'What is the gate curfew timing?' },
    { label: 'Apply for leave?',       text: 'How do I apply for leave?' },
];

// ─── Chat Bubble ─────────────────────────────────────────────────────────────

function ChatBubble({ message }: { message: Message }) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={
                    isUser
                        ? { background: 'rgb(var(--color-primary))', color: '#fff' }
                        : { background: 'linear-gradient(135deg, rgb(99 102 241), rgb(139 92 246))', color: '#fff' }
                }
            >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble content */}
            <div className={`max-w-[82%] flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                    className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                    style={
                        isUser
                            ? {
                                background: 'rgb(var(--color-primary))',
                                color: '#fff',
                                borderTopRightRadius: '4px',
                            }
                            : {
                                background: 'rgb(var(--bg-panel))',
                                border: '1px solid rgb(var(--border-color))',
                                color: 'rgb(var(--text-primary))',
                                borderTopLeftRadius: '4px',
                            }
                    }
                >
                    {message.isLoading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'rgb(var(--text-muted))' }} />
                            <span style={{ color: 'rgb(var(--text-muted))' }}>Thinking…</span>
                        </div>
                    ) : (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                </div>

                {/* Evidence badges — only on assistant messages */}
                {!isUser && !message.isLoading && (
                    <div className="flex flex-wrap gap-1.5">
                        {/* Personal data sources */}
                        {(message.dataSources ?? []).map(src => (
                            <span key={src} style={dataBadgeStyle()} className="flex items-center gap-1">
                                <Database className="w-2.5 h-2.5" />
                                {src}
                            </span>
                        ))}
                        {/* Policy document sources */}
                        {(message.knowledgeSources ?? []).map(src => (
                            <span key={src.id} style={policyBadgeStyle(src.category)} className="flex items-center gap-1">
                                <FileText className="w-2.5 h-2.5" />
                                {src.title}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentAssistant() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content:
                `Hi there! 👋 I'm your SmartHostel X AI Assistant.\n\n` +
                `I can help you with:\n` +
                `• Your fees and payment status\n` +
                `• Your attendance record and percentage\n` +
                `• Your room details and open maintenance requests\n` +
                `• Hostel rules, policies, and procedures\n` +
                `• Visitor timings and pre-registration\n` +
                `• Mess timings, leave procedures, contacts, and more\n\n` +
                `What would you like to know?`,
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiError, setAiError] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (question: string) => {
        const trimmed = question.trim();
        if (!trimmed || loading) return;

        setAiError('');

        const userMsg: Message = {
            id: `u-${Date.now()}`,
            role: 'user',
            content: trimmed,
        };
        const loadingMsg: Message = {
            id: `l-${Date.now()}`,
            role: 'assistant',
            content: '',
            isLoading: true,
        };

        setMessages(prev => [...prev, userMsg, loadingMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await studentAPI.ask(trimmed);
            const { answer, dataSources, knowledgeSources } = response.data;

            setMessages(prev =>
                prev.map(m =>
                    m.isLoading
                        ? {
                            id: `a-${Date.now()}`,
                            role: 'assistant' as const,
                            content: answer,
                            dataSources: dataSources ?? [],
                            knowledgeSources: knowledgeSources ?? [],
                            isLoading: false,
                        }
                        : m
                )
            );
        } catch (error: any) {
            const status = error.response?.status;
            const errMsg = error.response?.data?.error ?? 'Failed to get an answer. Please try again.';

            if (status === 503 || errMsg.toLowerCase().includes('ollama')) {
                setAiError('AI service is currently unavailable. Your personal data questions will be answered once Ollama is running.');
            }

            setMessages(prev =>
                prev.map(m =>
                    m.isLoading
                        ? {
                            id: `e-${Date.now()}`,
                            role: 'assistant' as const,
                            content:
                                status === 400
                                    ? `⚠️ ${errMsg}`
                                    : status === 503
                                    ? "I'm temporarily unavailable. Please try again in a moment or contact the warden's office directly."
                                    : `Sorry, I encountered an error. Please try again or contact the hostel office.`,
                            isLoading: false,
                        }
                        : m
                )
            );
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const showQuickQuestions = messages.length <= 2;

    return (
        <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 6rem)' }}>

            {/* ── Header ── */}
            <div className="flex items-center gap-3 mb-4 shrink-0">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ background: 'linear-gradient(135deg, rgb(99 102 241), rgb(139 92 246))' }}
                >
                    <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
                        AI Assistant
                    </h1>
                    <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                        Powered by qwen3:8b · Your personal hostel guide
                    </p>
                </div>
            </div>

            {/* ── Ollama error banner ── */}
            {aiError && (
                <div
                    className="mb-3 p-3 rounded-xl flex items-start gap-2 shrink-0"
                    style={{
                        background: 'rgba(var(--color-warning), 0.08)',
                        border: '1px solid rgba(var(--color-warning), 0.30)',
                    }}
                >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'rgb(var(--color-warning))' }} />
                    <p className="text-xs" style={{ color: 'rgb(var(--color-warning))' }}>{aiError}</p>
                </div>
            )}

            {/* ── Chat area ── */}
            <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1 min-h-0">
                {messages.map(msg => (
                    <ChatBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* ── Quick questions ── */}
            {showQuickQuestions && (
                <div className="shrink-0 mb-3">
                    <div className="flex items-center gap-1 mb-2">
                        <ChevronDown className="w-3.5 h-3.5" style={{ color: 'rgb(var(--text-muted))' }} />
                        <span className="text-xs font-medium" style={{ color: 'rgb(var(--text-muted))' }}>
                            Try asking
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {QUICK_QUESTIONS.map(q => (
                            <button
                                key={q.label}
                                onClick={() => sendMessage(q.text)}
                                disabled={loading}
                                className="text-xs px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
                                style={{
                                    border: '1px solid rgb(var(--border-color))',
                                    background: 'rgb(var(--bg-panel))',
                                    color: 'rgb(var(--text-secondary))',
                                }}
                            >
                                {q.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Input area ── */}
            <div
                className="shrink-0 rounded-2xl p-3 flex items-end gap-3"
                style={{
                    background: 'rgb(var(--bg-panel))',
                    border: '1px solid rgb(var(--border-color))',
                }}
            >
                <textarea
                    ref={inputRef}
                    id="student-ai-input"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    placeholder="Ask about your fees, attendance, room, rules… (Enter to send)"
                    rows={1}
                    className="flex-1 bg-transparent text-sm resize-none focus:outline-none max-h-28 overflow-y-auto"
                    style={{ color: 'rgb(var(--text-primary))' }}
                    onInput={e => {
                        const t = e.target as HTMLTextAreaElement;
                        t.style.height = 'auto';
                        t.style.height = `${Math.min(t.scrollHeight, 112)}px`;
                    }}
                />
                <button
                    id="student-ai-send"
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    style={{ background: 'linear-gradient(135deg, rgb(99 102 241), rgb(139 92 246))' }}
                    aria-label="Send message"
                >
                    {loading
                        ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                        : <Send className="w-4 h-4 text-white" />
                    }
                </button>
            </div>

            {/* ── Disclaimer ── */}
            <p
                className="text-center shrink-0 mt-1.5"
                style={{ color: 'rgb(var(--text-muted))', fontSize: '10px' }}
            >
                Answers are grounded in your personal data and hostel policy documents.
                For urgent matters, contact the warden directly.
            </p>
        </div>
    );
}
