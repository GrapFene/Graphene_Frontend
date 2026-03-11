import React, { useEffect, useState, useRef } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { 
    getMessageThreads, 
    getConversation, 
    searchUsers,
    DirectMessage, 
    MessageThread 
} from '../services/api';
import Header from '../components/Header';
import { ArrowLeft, Search, Send, MessageSquare } from 'lucide-react';

export default function MessagesPage() {
    const { connected, lastMessage, sendMessage } = useWebSocket();
    const [threads, setThreads] = useState<MessageThread[]>([]);
    const [activeThread, setActiveThread] = useState<MessageThread | null>(null);
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [inputText, setInputText] = useState('');
    
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ did: string, username: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [showChatOnMobile, setShowChatOnMobile] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const currentUserStr = localStorage.getItem('graphene_user');
    const myDid = currentUserStr ? JSON.parse(currentUserStr).did : null;

    useEffect(() => {
        loadThreads();
    }, []);

    useEffect(() => {
        if (activeThread) {
            loadConversation(activeThread.partner_did);
        }
    }, [activeThread?.partner_did]);

    useEffect(() => {
        if (lastMessage) {
            const partnerDid = lastMessage.from_did === myDid ? lastMessage.to_did : lastMessage.from_did;
            const isFromActive = activeThread?.partner_did === partnerDid;

            // 1. Update messages list if it belongs to active chat
            if (isFromActive) {
                setMessages(prev => {
                    if (prev.find(m => m.id === lastMessage.id)) return prev;
                    return [...prev, lastMessage];
                });
                setTimeout(scrollToBottom, 100);
            }

            // 2. Update threads list state for real-time sidebar "pop"
            setThreads(prev => {
                const threadIndex = prev.findIndex(t => t.partner_did === partnerDid);
                
                if (threadIndex !== -1) {
                    const updatedThreads = [...prev];
                    const existingThread = updatedThreads[threadIndex];
                    
                    updatedThreads[threadIndex] = {
                        ...existingThread,
                        last_message: lastMessage,
                        unread_count: (isFromActive || lastMessage.from_did === myDid) 
                            ? existingThread.unread_count 
                            : (existingThread.unread_count || 0) + 1
                    };
                    
                    // Move updated thread to top
                    const [moved] = updatedThreads.splice(threadIndex, 1);
                    return [moved, ...updatedThreads];
                } else {
                    // If new thread, reload all to get usernames etc correctly
                    loadThreads();
                    return prev;
                }
            });
        }
    }, [lastMessage, activeThread?.partner_did, myDid]);

    const loadThreads = async () => {
        try {
            const data = await getMessageThreads();
            setThreads(data.threads);
        } catch (err) {
            console.error('Failed to load threads', err);
        }
    };

    const loadConversation = async (did: string) => {
        setLoading(true);
        try {
            const data = await getConversation(did);
            setMessages(data.messages);
            setThreads(prev => prev.map(t => t.partner_did === did ? { ...t, unread_count: 0 } : t));
            setTimeout(scrollToBottom, 100);
        } catch (err) {
            console.error('Failed to load conversation', err);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !activeThread) return;

        const success = sendMessage(activeThread.partner_did, inputText);
        if (success) {
            const newMsg: DirectMessage = {
                id: Math.random().toString(),
                from_did: myDid,
                to_did: activeThread.partner_did,
                content: inputText,
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, newMsg]);
            setInputText('');
            loadThreads();
            setTimeout(scrollToBottom, 100);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        try {
            const data = await searchUsers(searchQuery);
            setSearchResults(data.users || []);
        } catch (err) {
            console.error('Search failed', err);
        } finally {
            setIsSearching(false);
        }
    };

    const startChat = (user: { did: string, username?: string }) => {
        const existing = threads.find(t => t.partner_did === user.did);
        
        let partner_username = user.username || existing?.partner_username;
        if (!partner_username || partner_username === user.did) {
            const parts = user.did.split(':');
            partner_username = parts[parts.length - 1];
        }

        if (existing) {
            setActiveThread({
                ...existing,
                partner_username
            });
        } else {
            setActiveThread({
                partner_did: user.did,
                partner_username,
                unread_count: 0,
                last_message: { content: '' } as any
            });
            setMessages([]);
        }
        setSearchResults([]);
        setSearchQuery('');
        setShowChatOnMobile(true);
    };

    return (
        <div className="min-h-screen bg-[#F0F2F5] dark:bg-black font-sans selection:bg-pink-300 selection:text-black">
            <Header />
            
            <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden max-w-[1600px] mx-auto w-full bg-white dark:bg-gray-900 border-x-4 border-black dark:border-gray-800 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
                
                {/* Conversations Sidebar */}
                <div className={`
                    ${showChatOnMobile ? 'hidden' : 'flex'} 
                    md:flex flex-col w-full md:w-[380px] border-r-4 border-black dark:border-gray-800 bg-white dark:bg-gray-900
                `}>
                    <div className="p-6 border-b-4 border-black dark:border-gray-800 bg-pink-300 dark:bg-fuchsia-700 flex justify-between items-center">
                        <h1 className="text-2xl font-black uppercase tracking-tighter">Messages</h1>
                        <div 
                            className={`w-4 h-4 rounded-none border-2 border-black ${connected ? 'bg-lime-400' : 'bg-red-500 animate-pulse'}`} 
                            title={connected ? 'Connected' : 'Disconnected'} 
                        />
                    </div>

                    {/* Search / User Discovery */}
                    <div className="p-4 border-b-4 border-black dark:border-gray-800 bg-yellow-200 dark:bg-gray-800">
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                placeholder="Search usernames..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full border-4 border-black dark:border-gray-700 p-2 font-bold focus:outline-none focus:bg-white dark:focus:bg-gray-700 pr-10"
                            />
                            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">
                                <Search className="w-5 h-5" />
                            </button>
                        </form>
                        
                        {searchResults.length > 0 && (
                            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto bg-white dark:bg-gray-900 border-4 border-black dark:border-gray-800 p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                {searchResults.map(u => (
                                    <button
                                        key={u.did}
                                        onClick={() => startChat(u)}
                                        className="w-full flex items-center gap-3 p-2 hover:bg-lime-200 dark:hover:bg-emerald-900 border-2 border-transparent hover:border-black dark:hover:border-gray-700 transition-all text-left"
                                    >
                                        <div className="w-8 h-8 bg-purple-400 border-2 border-black flex items-center justify-center font-black">
                                            {u.username[0].toUpperCase()}
                                        </div>
                                        <span className="font-bold">{u.username}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {isSearching && <div className="mt-2 text-center font-black animate-bounce text-xs uppercase">Searching...</div>}
                    </div>

                    {/* Thread List */}
                    <div className="flex-1 overflow-y-auto bg-[#F0F2F5] dark:bg-gray-950">
                        {threads.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-10 text-center opacity-40">
                                <MessageSquare className="w-12 h-12 mb-4" />
                                <p className="font-black uppercase text-sm">No chats yet</p>
                            </div>
                        ) : (
                            threads.map(t => {
                                const isActive = activeThread?.partner_did === t.partner_did;
                                return (
                                    <button
                                        key={t.partner_did}
                                        onClick={() => {
                                            setActiveThread(t);
                                            setShowChatOnMobile(true);
                                        }}
                                        className={`
                                            w-full flex items-center gap-4 p-5 border-b-4 border-black dark:border-gray-800
                                            transition-all hover:translate-x-1 hover:bg-white dark:hover:bg-gray-900
                                            ${isActive ? 'bg-white dark:bg-gray-900 translate-x-1 shadow-[-4px_0px_0px_0px_#A78BFA]' : 'bg-transparent'}
                                        `}
                                    >
                                        <div className="relative shrink-0">
                                            <div className="w-14 h-14 bg-cyan-300 dark:bg-cyan-600 border-4 border-black dark:border-gray-800 flex items-center justify-center text-xl font-black">
                                                {(t.partner_username || 'U')[0].toUpperCase()}
                                            </div>
                                            {t.unread_count > 0 && (
                                                <div className="absolute -top-2 -right-2 bg-lime-400 text-black text-[10px] font-black w-6 h-6 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                    {t.unread_count}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className="font-black truncate text-lg tracking-tight">
                                                    {t.partner_username || 'Unknown User'}
                                                </h3>
                                                <span className="text-[10px] font-bold opacity-40 uppercase">
                                                    {new Date(t.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 truncate">
                                                {t.last_message.from_did === myDid ? 'You: ' : ''}{t.last_message.content}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className={`
                    ${showChatOnMobile ? 'flex' : 'hidden'} 
                    md:flex flex-col flex-1 bg-white dark:bg-gray-900 relative
                `}>
                    {activeThread ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 md:p-6 border-b-4 border-black dark:border-gray-800 bg-purple-300 dark:bg-purple-900 flex items-center gap-4">
                                <button 
                                    onClick={() => setShowChatOnMobile(false)}
                                    className="md:hidden bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-700 p-2 hover:bg-gray-100 transition-transform active:scale-95"
                                >
                                    <ArrowLeft className="w-6 h-6" />
                                </button>
                                
                                <div className="w-12 h-12 bg-lime-300 dark:bg-emerald-600 border-4 border-black dark:border-gray-800 flex items-center justify-center font-black shrink-0">
                                    {(activeThread.partner_username || 'U')[0].toUpperCase()}
                                </div>
                                
                                <div className="min-w-0">
                                    <h2 className="text-xl font-black truncate">{activeThread.partner_username || 'Unknown User'}</h2>
                                    <p className="text-[10px] font-bold opacity-50 truncate font-mono uppercase">{activeThread.partner_did}</p>
                                </div>

                                {loading && <div className="ml-auto animate-spin h-5 w-5 border-4 border-black border-t-transparent rounded-full" />}
                            </div>

                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAF9F6] dark:bg-gray-950">
                                {messages.map((m, i) => {
                                    const isMine = m.from_did === myDid;
                                    return (
                                        <div key={m.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`
                                                max-w-[85%] md:max-w-[70%] group relative
                                                ${isMine ? 'items-end' : 'items-start'}
                                            `}>
                                                <div className={`
                                                    p-4 border-4 border-black dark:border-gray-800 font-bold leading-relaxed
                                                    shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                                                    ${isMine ? 'bg-lime-200 dark:bg-emerald-800' : 'bg-white dark:bg-gray-800'}
                                                `}>
                                                    <div className="break-words whitespace-pre-wrap">{m.content}</div>
                                                </div>
                                                <div className={`
                                                    mt-2 flex items-center gap-2 text-[10px] font-black uppercase opacity-40
                                                    ${isMine ? 'justify-end' : 'justify-start'}
                                                `}>
                                                    <span>{new Date(m.created_at).toLocaleTimeString()}</span>
                                                    {isMine && m.read_at && <span className="text-blue-600">✓✓</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="p-6 border-t-4 border-black dark:border-gray-800 bg-white dark:bg-gray-900">
                                <form onSubmit={handleSend} className="flex gap-4 items-center">
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={e => setInputText(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 border-4 border-black dark:border-gray-700 p-4 font-bold focus:outline-none focus:ring-4 focus:ring-pink-300 dark:bg-gray-800"
                                        disabled={!connected}
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!connected || !inputText.trim()}
                                        className="bg-black dark:bg-fuchsia-700 text-white p-4 font-black hover:bg-gray-800 transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none border-4 border-black dark:border-gray-800 disabled:opacity-50"
                                    >
                                        <Send className="w-6 h-6" />
                                    </button>
                                </form>
                                {!connected && (
                                    <div className="mt-3 text-[10px] font-black text-red-500 uppercase text-center tracking-widest animate-pulse">
                                        Reconnecting to federation network...
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 bg-[#FAF9F6] dark:bg-gray-950 text-center">
                            <div className="w-32 h-32 bg-yellow-200 dark:bg-gray-800 border-8 border-black dark:border-gray-700 flex items-center justify-center text-7xl mb-8 transform -rotate-3 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                                📬
                            </div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Messages</h2>
                            <p className="font-extrabold text-gray-500 dark:text-gray-400 max-w-sm leading-tight">
                                Select a conversation from the list or search for a user to start a new chat.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
