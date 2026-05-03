import { useState, useRef, useEffect } from 'react';
import { buildSystemPrompt } from '../utils/prompts.js';
import TherapistCard from './TherapistCard.jsx';

const OPENING_MESSAGE = {
  role: 'assistant',
  content: "Hi there. I've read through what you shared, and I want you to know — I'm really glad you're here. It takes courage to take a step like this. I'm here to listen, not to judge. How are you feeling right now, in this moment?",
  isOpening: true,
};

const IMMEDIATE_CONNECT_TRIGGERS = [
  "i'm depressed", "im depressed", "i think i'm depressed", "i think im depressed",
  "i am depressed", "i'm anxious", "im anxious", "i am anxious",
  "i feel anxious", "so anxious", "really anxious",
  "i can't cope", "i cant cope", "i can't do this", "i cant do this",
  "i need help", "i need a therapist", "connect me", "talk to someone",
  "i feel hopeless", "everything is pointless", "i don't want to go on",
  "i'm not okay", "im not okay", "i'm struggling", "im struggling",
  "want to hurt", "hurt myself", "end it", "don't want to be here",
];

function shouldImmediateConnect(text) {
  const lower = text.toLowerCase();
  return IMMEDIATE_CONNECT_TRIGGERS.some(trigger => lower.includes(trigger));
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-4 msg-in">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
        style={{ background: '#1A1A1A' }}
      >
        🌿
      </div>
      <div
        className="rounded-2xl rounded-bl-md px-5 py-3.5"
        style={{
          background: '#FFFFFF',
          borderLeft: '3px solid #7CB518',
          border: '1px solid #E8E3CC',
          borderLeftWidth: '3px',
          borderLeftColor: '#7CB518',
          boxShadow: '0 1px 6px rgba(26,26,26,0.07)',
        }}
      >
        <div className="flex gap-1.5 items-center h-4">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ msg, isUser }) {
  if (isUser) {
    return (
      <div className="flex items-end justify-end gap-3 mb-4 msg-in">
        <div
          className="rounded-2xl rounded-br-md px-5 py-3.5 max-w-[75%] text-sm leading-relaxed"
          style={{ background: '#1A1A1A', color: '#F5F0DC', boxShadow: '0 2px 8px rgba(26,26,26,0.15)' }}
        >
          {msg.content}
        </div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 font-semibold"
          style={{ background: '#E8E3CC', color: '#1A1A1A' }}
        >
          U
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-3 mb-4 msg-in">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
        style={{ background: '#1A1A1A' }}
      >
        🌿
      </div>
      <div className="flex flex-col gap-2" style={{ maxWidth: '80%' }}>
        <div
          className="rounded-2xl rounded-bl-md px-5 py-3.5 text-sm leading-relaxed"
          style={{
            background: '#FFFFFF',
            color: '#1A1A1A',
            borderLeft: '3px solid #7CB518',
            border: '1px solid #E8E3CC',
            borderLeftWidth: '3px',
            borderLeftColor: '#7CB518',
            boxShadow: '0 1px 6px rgba(26,26,26,0.07)',
          }}
        >
          {msg.content}
        </div>
        {msg.showTherapist && <TherapistCard />}
      </div>
    </div>
  );
}

export default function Companion({ report }) {
  const [messages, setMessages] = useState([OPENING_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const systemPrompt = buildSystemPrompt(report);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  async function sendMessage(userText) {
    if (!userText.trim() || isTyping) return;
    setError('');

    const userMsg = { role: 'user', content: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    // Client-side immediate connect check — no API call needed
    if (shouldImmediateConnect(userText)) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I hear you, and I'm really glad you told me that. You don't have to carry this alone. Let me connect you with someone who can genuinely help right now. 💛",
        showTherapist: true,
      }]);
      return;
    }

    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...newMessages.map(m => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) throw new Error('OpenAI key rejected. Check OPENAI_API_KEY in your Vercel environment.');
        if (response.status === 429) throw new Error('API quota exceeded. Please check your OpenAI account.');
        throw new Error(data?.error?.message || 'Something went wrong. Please try again.');
      }

      const data = await response.json();
      let assistantText = data.choices[0]?.message?.content || "I'm here with you. Can you tell me more?";

      // Detect and strip [CONNECT_THERAPIST] token
      const showTherapist = assistantText.includes('[CONNECT_THERAPIST]');
      assistantText = assistantText.replace('[CONNECT_THERAPIST]', '').trim();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: assistantText,
        showTherapist,
      }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleNewChat() {
    setMessages([OPENING_MESSAGE]);
    setError('');
    setInput('');
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F0DC' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #E8E3CC', boxShadow: '0 1px 8px rgba(26,26,26,0.06)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#1A1A1A' }}
            >
              <span className="text-base">🌿</span>
            </div>
            <div>
              <p className="font-semibold text-sm leading-none" style={{ color: '#1A1A1A' }}>Aura</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#7CB518' }} />
                <p className="text-xs" style={{ color: '#5A5A3A' }}>Here for you</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleNewChat}
            className="text-xs font-medium px-3 py-1.5 rounded-xl transition-all duration-150"
            style={{ border: '1px solid #E8E3CC', color: '#5A5A3A', background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1A1A1A'; e.currentTarget.style.color = '#1A1A1A'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E3CC'; e.currentTarget.style.color = '#5A5A3A'; }}
          >
            New Chat
          </button>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Context banner */}
          <div
            className="rounded-2xl px-4 py-3 mb-6 flex items-center gap-3"
            style={{ background: '#FFFFFF', border: '1px solid #E8E3CC' }}
          >
            <span className="text-lg">💛</span>
            <p className="text-xs leading-relaxed" style={{ color: '#5A5A3A' }}>
              <span className="font-semibold" style={{ color: '#1A1A1A' }}>
                Wellness: {report.scores.wellnessScore}/100 ({report.scores.wellnessLabel})
              </span>
              {' · '}Aura has read your onboarding report and is here to listen.
            </p>
          </div>

          {messages.map((msg, i) => (
            <ChatMessage key={i} msg={msg} isUser={msg.role === 'user'} />
          ))}

          {isTyping && <TypingIndicator />}

          {error && (
            <div className="flex justify-center mb-4">
              <div
                className="rounded-2xl px-5 py-3 max-w-sm"
                style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}
              >
                <p className="text-sm text-center" style={{ color: '#991B1B' }}>{error}</p>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input */}
      <div
        className="sticky bottom-0"
        style={{ background: '#FFFFFF', borderTop: '1px solid #E8E3CC' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <div
              className="flex-1 rounded-2xl overflow-hidden transition-all duration-200"
              style={{ border: '2px solid #E8E3CC', background: '#FAFAF7' }}
              onFocus={e => e.currentTarget.style.borderColor = '#7CB518'}
              onBlur={e => e.currentTarget.style.borderColor = '#E8E3CC'}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share how you're feeling..."
                rows={1}
                className="w-full px-4 py-3.5 text-sm outline-none resize-none bg-transparent"
                style={{ color: '#1A1A1A', maxHeight: '120px', overflowY: 'auto' }}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              style={{ background: '#1A1A1A', color: '#F5F0DC' }}
              onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = '#2D2D2D')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1A1A1A')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
          <p className="text-center text-xs mt-2" style={{ color: '#5A5A3A' }}>
            Not a substitute for professional mental health care · If in crisis, call <strong>iCall: 9152987821</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
