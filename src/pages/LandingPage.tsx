import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  GitBranch,
  Github,
  Ban,
  Fingerprint,
  Radio,
  Scale,
  BadgeCheck,
  Users,
  ArrowLeftRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

// Real features pulled from actual backend + frontend routes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const features: {
  icon: React.ComponentType<any>;
  title: string;
  accent: string;
  pills: string[];
  desc: string;
}[] = [
  {
    icon: GitBranch,
    title: 'Decentralized',
    accent: 'bg-pink-400',
    pills: ['Independent servers', 'No single owner', 'Interoperable'],
    desc: `Instant global communication is too important to belong to one company. Each Graphene server is completely independent, interoperable with others to form one global social network.`,
  },
  {
    icon: Github,
    title: 'Open Source',
    accent: 'bg-purple-400',
    pills: ['MIT licensed', 'Self-hostable', 'Community driven'],
    desc: `Graphene is free and open-source software. We believe in your right to use, copy, study and change it as you see fit, and we benefit from every community contribution.`,
  },
  {
    icon: Ban,
    title: 'Not for Sale',
    accent: 'bg-orange-400',
    pills: ['No ads', 'No data mining', 'No algorithm'],
    desc: `We respect your agency. Your feed is curated and created by you. We will never serve ads or push profiles. Your data and your time are yours and yours alone.`,
  },
  {
    icon: Fingerprint,
    title: 'Zero-Password Auth',
    accent: 'bg-yellow-400',
    pills: ['Mnemonic phrase', 'secp256k1 keys', 'No email needed'],
    desc: `Graphene has no passwords — ever. When you register, a 12-word mnemonic phrase is generated client-side and hashed using secp256k1. Every login issues a challenge: prove you know 3 random words from your phrase. If you lose access, trusted Guardians can approve a Social Recovery request to restore your account — fully cryptographic, no support ticket needed.`,
  },
  {
    icon: Radio,
    title: 'Live Federation',
    accent: 'bg-green-400',
    pills: ['S2S envelopes', 'Signature verified', 'Replay protected'],
    desc: `Every post, vote, and delete is wrapped in a signed FederationEnvelope and broadcast to all active peer instances in real-time. Peers verify your instance's secp256k1 signature via the /federation/actor endpoint. Envelopes older than 5 minutes are auto-rejected to prevent replay attacks. If a peer goes offline, the retry queue automatically re-attempts delivery.`,
  },
  {
    icon: Scale,
    title: 'On-Chain Governance',
    accent: 'bg-blue-400',
    pills: ['Proposals', 'Timed voting', 'Live results'],
    desc: `Any community member can raise a Proposal — rule changes, moderation policy, community direction. Members vote with their DID before the deadline. Results are tallied live with per-option counts. Moderators are elected and can be removed by the community. No admin has unilateral power.`,
  },
  {
    icon: BadgeCheck,
    title: 'Decentralized Identity (DID)',
    accent: 'bg-red-400',
    pills: ['DID:key scheme', 'Signed profiles', 'Cross-instance portable'],
    desc: `Your identity is a DID derived from your secp256k1 public key — not tied to any server. Your profile content is signed with a hash at creation time and verified on read. You can carry your DID across any Graphene instance. Votes and posts are always attributed to your DID, making impersonation cryptographically impossible.`,
  },
  {
    icon: Users,
    title: 'Communities & Moderation',
    accent: 'bg-amber-400',
    pills: ['Public & private', 'Moderator roles', 'Community rules'],
    desc: `Create communities with custom descriptions, rules, and federation settings. Set them public or private. Moderators are appointed per-community and can block users, remove posts, and manage instance-level sync. The moderation log tracks every action — fully transparent. Top communities are ranked by subscriber count in real-time.`,
  },
  {
    icon: ArrowLeftRight,
    title: 'Cross-Instance Voting',
    accent: 'bg-cyan-400',
    pills: ['Vote forwarding', 'Peer routing', 'Score sync'],
    desc: `Voting on a federated post doesn't just update locally — the vote is signed and forwarded directly to the originating peer instance over HTTPS. The post's score is kept in sync across the network. Upvote, downvote, or retract — all cryptographically signed, all federated.`,
  },
  {
    icon: ShieldCheck,
    title: 'Social Recovery',
    accent: 'bg-lime-400',
    pills: ['Guardian network', 'Threshold approval', 'No support ticket'],
    desc: `Lose your mnemonic? Set up trusted Guardians ahead of time. When you need recovery, Guardians approve your request on-chain. Once the threshold of approvals is met, finalize() restores your access. No centralized authority, no email reset link — just cryptographic trust between people you choose.`,
  },
  {
    icon: TrendingUp,
    title: 'Trending & Discovery',
    accent: 'bg-rose-400',
    pills: ['Trending score', 'Recent feed', 'Community search'],
    desc: `Posts are ranked by a trending score factoring in votes, recency, and activity. The global feed merges local posts with federated content from all active peers, sorted by timestamp. Search communities by name or topic. Your subscribed communities surface first. No black-box algorithm — just math you can read in the source.`,
  },
];

// Hook: re-triggers EVERY TIME element enters or leaves viewport (not one-shot)
function useRepeatReveal(threshold = 0.18) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        // setVisible each time — true when in, false when out
        setVisible(entry.isIntersecting);
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

// Alternating left/right feature row
function FeatureRow({ f, index }: { f: typeof features[0]; index: number }) {
  const fromLeft = index % 2 === 0;
  const { ref, visible } = useRepeatReveal(0.15);

  return (
    <div
      ref={ref}
      style={{
        transform: visible
          ? 'translateX(0) translateY(0)'
          : `translateX(${fromLeft ? '-100px' : '100px'}) translateY(24px)`,
        opacity: visible ? 1 : 0,
        transition: 'transform 0.75s cubic-bezier(0.22,1,0.36,1), opacity 0.65s ease',
      }}
      className={`flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-14 ${
        fromLeft ? '' : 'md:flex-row-reverse'
      }`}
    >
      {/* Lucide icon tile */}
      <div
        className={`flex-shrink-0 flex items-center justify-center w-28 h-28 md:w-36 md:h-36 border-4 border-black dark:border-gray-400 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.15)] ${f.accent} self-center`}
      >
        <f.icon className="w-14 h-14 md:w-16 md:h-16 text-black" strokeWidth={1.5} />
      </div>

      {/* Text */}
      <div className="flex-1">
        {/* Ghost step number */}
        <div className="text-[5rem] font-black leading-none select-none text-black/[0.07] dark:text-white/[0.07] -mb-6">
          {String(index + 1).padStart(2, '0')}
        </div>
        <h3 className="text-2xl md:text-3xl font-black uppercase text-black dark:text-white tracking-tight mb-2">
          {f.title}
        </h3>
        {/* Accent bar */}
        <div className={`w-12 h-1.5 ${f.accent} mb-4`} />
        {/* Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {f.pills.map((p) => (
            <span
              key={p}
              className="border-2 border-black dark:border-gray-400 bg-white dark:bg-gray-800 text-black dark:text-white text-xs font-black px-2 py-0.5 uppercase tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]"
            >
              {p}
            </span>
          ))}
        </div>
        <p className="text-sm md:text-base font-semibold text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">
          {f.desc}
        </p>
      </div>
    </div>
  );
}

// Generic reveal (slides up) — also repeats on scroll back
function RevealUp({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useRepeatReveal(0.15);
  return (
    <div
      ref={ref}
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(48px)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.65s cubic-bezier(0.22,1,0.36,1), opacity 0.65s ease',
      }}
      className={className}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('graphene_token');

  // Parallax: track scroll offset for hero text layer
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-200 overflow-x-hidden">

      {/* ── STICKY NAV ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b-4 border-black dark:border-gray-600 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black uppercase tracking-tight text-black dark:text-white">Graphene</span>
          <span className="bg-black dark:bg-white text-white dark:text-black text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">Beta</span>
        </div>
        <div className="flex gap-3">
          {isLoggedIn ? (
            <button
              onClick={() => navigate('/')}
              className="border-4 border-black dark:border-gray-400 bg-black dark:bg-white text-white dark:text-black font-black px-5 py-2 shadow-[4px_4px_0px_0px_rgba(251,146,60,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all text-sm uppercase"
            >
              ↗ Go to Portal
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="border-4 border-black dark:border-gray-400 bg-white dark:bg-gray-800 text-black dark:text-white font-black px-5 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all text-sm uppercase"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="border-4 border-black dark:border-gray-400 bg-black dark:bg-white text-white dark:text-black font-black px-5 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all text-sm uppercase"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── PARALLAX HERO ── */}
      {/* Fixed background layer — moves slower than scroll (parallax) */}
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{ height: '100vh', minHeight: 560 }}
      >
        {/* Background pattern — fixed, scrolls at 0.4× speed */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(251,146,60,0.25) 0%, transparent 55%),
              radial-gradient(circle at 80% 70%, rgba(192,132,252,0.2) 0%, transparent 55%),
              radial-gradient(circle at 55% 20%, rgba(244,114,182,0.18) 0%, transparent 45%)
            `,
            backgroundSize: 'cover',
            transform: `translateY(${scrollY * 0.4}px)`,
            willChange: 'transform',
          }}
        />

        {/* Grid lines — decorative, moves at 0.2× speed */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            transform: `translateY(${scrollY * 0.2}px)`,
            willChange: 'transform',
          }}
        />

        {/* Hero content — moves at 0.6× speed (faster than bg, slower than scroll) */}
        <div
          className="relative z-10 flex flex-col items-center text-center px-6"
          style={{
            transform: `translateY(${scrollY * 0.35}px)`,
            opacity: Math.max(0, 1 - scrollY / 500),
            willChange: 'transform, opacity',
          }}
        >
          <div className="bg-black dark:bg-white text-white dark:text-black text-xs font-black px-3 py-1 uppercase tracking-[0.3em] mb-6 inline-block border-4 border-black">
            Decentralized Social Platform
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase leading-[0.9] text-black dark:text-white mb-6 tracking-tight">
            The Internet's{' '}
            <span className="bg-black dark:bg-white text-white dark:text-black px-3 inline-block">
              Free
            </span>
            <br />Forum
          </h1>
          <p className="text-lg md:text-xl font-bold text-gray-700 dark:text-gray-300 max-w-xl mb-10 leading-relaxed">
            No passwords. No central authority. No bullshit.
            <br />
            A federated, cryptographically-secured Social media owned by nobody.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            {isLoggedIn ? (
              <button
                onClick={() => navigate('/')}
                className="border-4 border-black dark:border-gray-300 bg-black dark:bg-white text-white dark:text-black font-black px-10 py-4 text-lg shadow-[6px_6px_0px_0px_rgba(251,146,60,1)] hover:translate-x-1.5 hover:translate-y-1.5 hover:shadow-none transition-all uppercase"
              >
                ↗ Go to Portal
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/register')}
                  className="border-4 border-black dark:border-gray-300 bg-black dark:bg-white text-white dark:text-black font-black px-10 py-4 text-lg shadow-[6px_6px_0px_0px_rgba(251,146,60,1)] hover:translate-x-1.5 hover:translate-y-1.5 hover:shadow-none transition-all uppercase"
                >
                  Get Started — Free
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="border-4 border-black dark:border-gray-400 bg-white dark:bg-gray-800 text-black dark:text-white font-black px-10 py-4 text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)] hover:translate-x-1.5 hover:translate-y-1.5 hover:shadow-none transition-all uppercase"
                >
                  I Have an Account
                </button>
              </>
            )}
          </div>

          {/* Scroll hint */}
          <div className="mt-16 flex flex-col items-center gap-1 animate-bounce">
            <span className="text-xs font-black uppercase tracking-widest text-gray-500">Scroll</span>
            <div className="w-0.5 h-8 bg-black dark:bg-white opacity-40" />
          </div>
        </div>
      </div>

      {/* ── FEATURES SECTION ── */}
      <section className="px-6 md:px-16 py-28 bg-gradient-to-b from-orange-50 via-white to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-950">
        <div className="max-w-4xl mx-auto">

          {/* Section header — single "Why Graphene?" */}
          <RevealUp className="flex items-center gap-4 mb-16">
            <h2 className="text-4xl font-black uppercase text-black dark:text-white whitespace-nowrap">
              Why Graphene?
            </h2>
            <div className="flex-1 h-1 bg-black dark:bg-white" />
          </RevealUp>

          {/* All rows — 3 intro cards + 8 feature rows, one continuous left/right sequence */}
          <div className="flex flex-col gap-24">
            {features.map((f, i) => (
              <FeatureRow key={f.title} f={f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 md:px-12 py-24 text-center bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-black">
        <RevealUp className="max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black uppercase text-black dark:text-white mb-4 leading-tight">
            Ready to break free?
          </h2>
          <p className="text-base font-bold text-gray-600 dark:text-gray-400 mb-10">
            Join the federated network. No data mining. No algorithmic manipulation. Just people talking.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <button
                onClick={() => navigate('/')}
                className="border-4 border-black dark:border-gray-400 bg-black dark:bg-white text-white dark:text-black font-black px-14 py-5 text-xl shadow-[8px_8px_0px_0px_rgba(251,146,60,1)] hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all uppercase"
              >
                ↗ Go to Portal
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/register')}
                  className="border-4 border-black dark:border-gray-400 bg-black dark:bg-white text-white dark:text-black font-black px-14 py-5 text-xl shadow-[8px_8px_0px_0px_rgba(251,146,60,1)] hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all uppercase"
                >
                  Create Account — Free
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="border-4 border-black dark:border-gray-400 bg-white dark:bg-gray-800 text-black dark:text-white font-black px-14 py-5 text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all uppercase"
                >
                  Login
                </button>
              </>
            )}
          </div>
        </RevealUp>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t-4 border-black dark:border-gray-600 px-6 md:px-12 py-4 flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-gray-900 gap-2">
        <span className="text-xs font-black uppercase text-black dark:text-white">
          Graphene — Decentralized Social
        </span>
        <a
          href="https://github.com/GrapFene"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-black uppercase text-black dark:text-white hover:opacity-60 transition-opacity"
        >
          <Github className="w-4 h-4" />
          Graphene on GitHub
        </a>
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
          Open source · Self-hostable · Federated
        </span>
      </footer>
    </div>
  );
}