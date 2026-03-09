import { useState, useEffect } from 'react';
import { Globe, Link2, RefreshCw, CheckCircle, Clock, AlertTriangle, Server, Copy } from 'lucide-react';import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { getFederatedPeers, getInstanceActor, KnownPeer } from '../services/api';

/**
 * Federation Page
 *
 * Shows:
 *   1. This instance's actor card — the public identity card other servers need
 *   2. Connected peer list — every server that has federated with us
 *   3. Handshake guide — step-by-step for running your own Graphene server
 */
export default function FederationPage() {
    const navigate = useNavigate();

    const [peers, setPeers] = useState<KnownPeer[]>([]);
    const [actor, setActor] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState('');

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            const [peerList, actorCard] = await Promise.all([
                getFederatedPeers(),
                getInstanceActor(),
            ]);
            setPeers(peerList);
            setActor(actorCard);
        } catch (err) {
            console.error('Failed to load federation data', err);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, key: string) => {
        // navigator.clipboard requires HTTPS; fall back to execCommand for plain HTTP
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
        } else {
            fallbackCopy(text);
        }
        setCopied(key);
        setTimeout(() => setCopied(''), 2000);
    };

    const fallbackCopy = (text: string) => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    };

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleString();

    const timeSince = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 dark:bg-black dark:from-black dark:via-black dark:to-black transition-colors duration-200">
            <Header
                onCreatePost={() => navigate('/submit')}
            />

            <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

                {/* ── Page Title ─────────────────────────────────────────────── */}
                <div className="bg-white dark:bg-black border-4 border-black dark:border-gray-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(50,50,50,1)]">
                    <div className="bg-blue-400 dark:bg-blue-700 border-b-4 border-black dark:border-gray-800 p-6">
                        <h1 className="font-black text-3xl flex items-center gap-3 text-black dark:text-white">
                            <Globe className="w-8 h-8" strokeWidth={3} />
                            Federation Network
                        </h1>
                        <p className="font-bold text-black dark:text-gray-200 mt-2">
                            Connect Graphene instances across the internet. Posts, votes, and communities flow freely between federated servers.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center font-black text-2xl text-black dark:text-white py-16">
                        <RefreshCw className="w-10 h-10 mx-auto mb-4 animate-spin" />
                        Loading federation data...
                    </div>
                ) : (
                    <>
                        {/* ── This Instance's Actor Card ──────────────────────────── */}
                        {actor && (
                            <section>
                                <h2 className="font-black text-2xl mb-4 text-black dark:text-white flex items-center gap-2">
                                    <Server className="w-6 h-6" strokeWidth={3} />
                                    This Instance
                                </h2>
                                <div className="bg-white dark:bg-black border-4 border-black dark:border-gray-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(50,50,50,1)] p-6 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="font-black text-sm text-gray-500 dark:text-gray-400 uppercase mb-1">Instance Name</p>
                                            <p className="font-bold text-black dark:text-white text-lg">{actor.name}</p>
                                        </div>
                                        <div>
                                            <p className="font-black text-sm text-gray-500 dark:text-gray-400 uppercase mb-1">Actor URL</p>
                                            <div className="flex items-center gap-2">
                                                <p className="font-mono text-sm text-black dark:text-gray-300 truncate">{actor.id}</p>
                                                <button
                                                    onClick={() => copyToClipboard(actor.id, 'actor')}
                                                    className="shrink-0 border-2 border-black dark:border-gray-700 p-1 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                                                    title="Copy actor URL"
                                                >
                                                    {copied === 'actor' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-black dark:text-white" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-black text-sm text-gray-500 dark:text-gray-400 uppercase mb-1">Inbox URL</p>
                                            <div className="flex items-center gap-2">
                                                <p className="font-mono text-sm text-black dark:text-gray-300 truncate">{actor.inbox}</p>
                                                <button
                                                    onClick={() => copyToClipboard(actor.inbox, 'inbox')}
                                                    className="shrink-0 border-2 border-black dark:border-gray-700 p-1 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                                                    title="Copy inbox URL"
                                                >
                                                    {copied === 'inbox' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-black dark:text-white" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-black text-sm text-gray-500 dark:text-gray-400 uppercase mb-1">Public Address</p>
                                            <div className="flex items-center gap-2">
                                                <p className="font-mono text-sm text-black dark:text-gray-300 truncate">{actor.public_address}</p>
                                                <button
                                                    onClick={() => copyToClipboard(actor.public_address, 'pubkey')}
                                                    className="shrink-0 border-2 border-black dark:border-gray-700 p-1 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                                                    title="Copy public address"
                                                >
                                                    {copied === 'pubkey' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-black dark:text-white" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* ── Connected Peers ─────────────────────────────────────── */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-black text-2xl text-black dark:text-white flex items-center gap-2">
                                    <Link2 className="w-6 h-6" strokeWidth={3} />
                                    Connected Peers
                                    <span className="bg-blue-400 dark:bg-blue-700 border-2 border-black dark:border-gray-700 px-2 py-0.5 text-sm font-black text-black dark:text-white">
                                        {peers.length}
                                    </span>
                                </h2>
                                <button
                                    onClick={load}
                                    className="flex items-center gap-2 bg-white dark:bg-black border-4 border-black dark:border-gray-700 px-4 py-2 font-black hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(50,50,50,1)] text-black dark:text-white"
                                >
                                    <RefreshCw className="w-4 h-4" strokeWidth={3} />
                                    Refresh
                                </button>
                            </div>

                            {peers.length === 0 ? (
                                <div className="bg-white dark:bg-black border-4 border-black dark:border-gray-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(50,50,50,1)] p-8 text-center">
                                    <Globe className="w-12 h-12 mx-auto mb-4 text-gray-400" strokeWidth={2} />
                                    <p className="font-black text-xl text-black dark:text-white mb-2">No peers yet</p>
                                    <p className="font-bold text-gray-600 dark:text-gray-400">
                                        Other Graphene servers will appear here once they send their first federated post or Announce handshake.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {peers.map(peer => (
                                        <div
                                            key={peer.domain}
                                            className="bg-white dark:bg-black border-4 border-black dark:border-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(50,50,50,1)] p-4"
                                        >
                                            <div className="flex items-start justify-between flex-wrap gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-black dark:border-gray-700" title="Active" />
                                                        <span className="font-black text-lg text-black dark:text-white">{peer.domain}</span>
                                                    </div>
                                                    <p className="font-mono text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{peer.public_address}</p>
                                                </div>
                                                <div className="text-right space-y-1 shrink-0">
                                                    <div className="flex items-center gap-1 justify-end text-green-600 dark:text-green-400">
                                                        <Clock className="w-4 h-4" strokeWidth={2} />
                                                        <span className="font-bold text-sm">Last seen {timeSince(peer.last_seen_at)}</span>
                                                    </div>
                                                    <p className="font-bold text-xs text-gray-500 dark:text-gray-400">
                                                        First seen {formatDate(peer.first_seen_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* ── How to Connect Your Own Server ──────────────────────── */}
                        <section>
                            <h2 className="font-black text-2xl mb-4 text-black dark:text-white flex items-center gap-2">
                                <AlertTriangle className="w-6 h-6" strokeWidth={3} />
                                Host Your Own Server
                            </h2>
                            <div className="bg-white dark:bg-black border-4 border-black dark:border-gray-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(50,50,50,1)] p-6 space-y-6">

                                <div className="space-y-2">
                                    <h3 className="font-black text-lg text-black dark:text-white">Option A — Use Main Server</h3>
                                    <p className="font-bold text-gray-700 dark:text-gray-300">
                                        Create communities directly on <code className="bg-gray-100 dark:bg-gray-900 px-1 border border-black dark:border-gray-700">graphene.app</code>. No setup needed.
                                    </p>
                                </div>

                                <hr className="border-2 border-black dark:border-gray-700" />

                                <div className="space-y-3">
                                    <h3 className="font-black text-lg text-black dark:text-white">Option B — Self-Host + Federate</h3>
                                    <p className="font-bold text-gray-700 dark:text-gray-300">Run these steps on your own server (any VPS/VM with Docker):</p>

                                    <div className="space-y-3">
                                        {[
                                            {
                                                step: '1',
                                                title: 'Clone & configure',
                                                code: 'git clone https://github.com/GrapFene/Graphene_Backend\ncd Graphene_Backend\ncp .env.example .env\n# Fill in your own SUPABASE_URL, JWT_SECRET, FEDERATION_PRIVATE_KEY\n# Set INSTANCE_DOMAIN to your server IP or domain',
                                            },
                                            {
                                                step: '2',
                                                title: 'Start your instance',
                                                code: 'docker compose up -d',
                                            },
                                            {
                                                step: '3',
                                                title: 'Announce yourself to the main server',
                                                code: `curl -X POST http://${actor?.inbox?.split('/federation')[0]?.split('://')[1] ?? 'MAIN_SERVER_IP'}/api/federation/inbox \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "type": "Announce",\n    "actor_domain": "YOUR_SERVER_IP",\n    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",\n    "payload": {\n      "instance_domain": "YOUR_SERVER_IP",\n      "instance_name": "My Graphene Server",\n      "community": {\n        "name": "my-community",\n        "description": "My federated community"\n      }\n    },\n    "signature": "SIGNED_WITH_YOUR_FEDERATION_PRIVATE_KEY"\n  }'`,
                                            },
                                            {
                                                step: '4',
                                                title: 'Verify you appear in the peer list',
                                                code: `curl http://${actor?.inbox?.split('/federation')[0]?.split('://')[1] ?? 'MAIN_SERVER_IP'}/api/federation/peers`,
                                            },
                                        ].map(({ step, title, code }) => (
                                            <div key={step} className="border-4 border-black dark:border-gray-700 overflow-hidden">
                                                <div className="bg-yellow-300 dark:bg-fuchsia-700 border-b-4 border-black dark:border-gray-700 px-4 py-2 flex items-center justify-between">
                                                    <span className="font-black text-black dark:text-white">Step {step} — {title}</span>
                                                    <button
                                                        onClick={() => copyToClipboard(code, `step-${step}`)}
                                                        className="flex items-center gap-1 bg-white dark:bg-black border-2 border-black dark:border-gray-700 px-2 py-1 font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors text-black dark:text-white"
                                                    >
                                                        {copied === `step-${step}` ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                                        {copied === `step-${step}` ? 'Copied!' : 'Copy'}
                                                    </button>
                                                </div>
                                                <pre className="bg-black text-green-400 p-4 text-xs overflow-x-auto font-mono whitespace-pre-wrap">{code}</pre>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}
