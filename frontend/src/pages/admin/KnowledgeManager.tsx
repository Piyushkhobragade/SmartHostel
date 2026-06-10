/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { knowledgeAPI } from '../../services/api';
import { BookOpen, Plus, Pencil, Trash2, Save, X, Search } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface KnowledgeDocument {
    id: string;
    title: string;
    content: string;
    category: string;
    createdAt: string;
    updatedAt: string;
}

const CATEGORIES = ['POLICY', 'RULE', 'FAQ', 'FEE', 'MAINTENANCE', 'MESS', 'EMERGENCY', 'OTHER'];

export default function KnowledgeManager() {
    const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [editDoc, setEditDoc] = useState<Partial<KnowledgeDocument> | null>(null);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        try {
            const res = await knowledgeAPI.getAll();
            setDocs(res.data);
        } catch {
            showToast('Failed to load knowledge base', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editDoc?.title || !editDoc?.content) return;
        try {
            setSaving(true);
            if (editDoc.id) {
                await knowledgeAPI.update(editDoc.id, editDoc);
                showToast('Document updated', 'success');
            } else {
                await knowledgeAPI.create(editDoc);
                showToast('Document created', 'success');
            }
            setEditDoc(null);
            await fetchDocs();
        } catch {
            showToast('Failed to save document', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete "${title}"?`)) return;
        try {
            await knowledgeAPI.delete(id);
            showToast('Document deleted', 'success');
            await fetchDocs();
        } catch {
            showToast('Failed to delete', 'error');
        }
    };

    const filtered = docs.filter(d => {
        const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
            d.content.toLowerCase().includes(search.toLowerCase());
        const matchesCat = selectedCategory === 'ALL' || d.category === selectedCategory;
        return matchesSearch && matchesCat;
    });

    const categoryColors: Record<string, string> = {
        POLICY: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        RULE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
        FAQ: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        FEE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
        MAINTENANCE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
        MESS: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
        EMERGENCY: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
        OTHER: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-indigo-500" />
                        Knowledge Base Manager
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Manage the AI's source of truth — {docs.length} documents indexed
                    </p>
                </div>
                <button
                    onClick={() => setEditDoc({ title: '', content: '', category: 'POLICY' })}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Document
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-48 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['ALL', ...CATEGORIES].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${selectedCategory === cat
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Document Grid */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No documents found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(doc => (
                        <div
                            key={doc.id}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${categoryColors[doc.category] || categoryColors.OTHER}`}>
                                    {doc.category}
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setEditDoc({ ...doc })}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(doc.id, doc.title)}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-white mb-2 line-clamp-2 text-sm leading-snug">{doc.title}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 flex-1 leading-relaxed">{doc.content}</p>
                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                                Updated {new Date(doc.updatedAt).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit / Create Modal */}
            {editDoc !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-indigo-500" />
                                {editDoc.id ? 'Edit Document' : 'New Document'}
                            </h2>
                            <button onClick={() => setEditDoc(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Title</label>
                                <input
                                    type="text"
                                    value={editDoc.title || ''}
                                    onChange={e => setEditDoc({ ...editDoc, title: e.target.value })}
                                    placeholder="Document title..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                                <select
                                    value={editDoc.category || 'POLICY'}
                                    onChange={e => setEditDoc({ ...editDoc, category: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm"
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Content</label>
                                <textarea
                                    value={editDoc.content || ''}
                                    onChange={e => setEditDoc({ ...editDoc, content: e.target.value })}
                                    placeholder="Write document content that the AI will reference to answer student and warden questions..."
                                    rows={8}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm resize-none leading-relaxed"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 pt-0">
                            <button
                                onClick={() => setEditDoc(null)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !editDoc.title || !editDoc.content}
                                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving...' : 'Save Document'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
