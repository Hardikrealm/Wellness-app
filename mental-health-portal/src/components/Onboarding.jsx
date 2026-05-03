import { useState } from 'react';
import { calculateScores } from '../utils/scoring.js';

const CLICK_QUESTIONS = [
  {
    q: 'Before we begin — what brings you here today?',
    opts: [
      '🧠 I want to understand myself better',
      '😔 I\'ve been feeling low or stressed',
      '😰 I\'m dealing with anxiety or worry',
      '💬 I just need someone to talk to',
    ],
  },
  {
    q: 'How many hours of sleep are you getting most nights?',
    opts: [
      '🌙 Less than 4 hours',
      '😴 4–6 hours',
      '😌 6–8 hours',
      '✅ 8–10 hours',
    ],
  },
  {
    q: 'How is your energy through the day?',
    opts: [
      '⚡ Full of energy',
      '🙂 Mostly okay, some dips',
      '😩 Often drained by afternoon',
      '🪫 Exhausted most of the time',
    ],
  },
  {
    q: 'How often do you feel anxious, tense, or on edge?',
    opts: [
      'Almost never',
      'A few times a week',
      'Most days',
      'Constantly — it doesn\'t go away',
    ],
  },
  {
    q: 'How connected do you feel to the people in your life?',
    opts: [
      '💛 Very connected — I have strong support',
      '🙂 Somewhat — but I keep things surface level',
      '😶 I feel a bit alone even around people',
      '💔 Very isolated — I don\'t have anyone',
    ],
  },
  {
    q: 'How well are you managing your daily responsibilities?',
    opts: [
      'Handling everything fine',
      'Managing, but it takes effort',
      'Falling behind on some things',
      'Struggling to do basic tasks',
    ],
  },
  {
    q: 'How often do you feel hopeless or like things won\'t improve?',
    opts: [
      'Never',
      'Occasionally',
      'More days than not',
      'Almost always',
    ],
  },
  {
    q: 'Have you lost interest or pleasure in things you used to enjoy?',
    opts: [
      'Not really — still enjoy most things',
      'A little less interest lately',
      'Quite a bit — things feel flat',
      'Almost completely — nothing feels enjoyable',
    ],
  },
];

const TEXT_QUESTIONS = [
  "What's been weighing on you the most lately? It can be anything — work, relationships, health, something you can't put your finger on.",
  "When things get hard, what do you usually do to cope? (Even if it's not always healthy — no judgement here)",
  "On a scale of 1–10, how urgent does your need for support feel right now? And why?",
  "Is there anything specific you'd like your companion to focus on or know about you?",
];

export default function Onboarding({ onComplete }) {
  const [phase, setPhase] = useState('click');
  const [currentQ, setCurrentQ] = useState(0);
  const [clickAnswers, setClickAnswers] = useState([]);
  const [textAnswers, setTextAnswers] = useState(['', '', '', '']);
  const [textQ, setTextQ] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [selected, setSelected] = useState(null);

  const totalQuestions = 12;
  const answeredCount = phase === 'click' ? currentQ : (8 + textQ);
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  function handleOptionClick(index) {
    if (animating) return;
    setSelected(index);
    setAnimating(true);

    setTimeout(() => {
      const newAnswers = [...clickAnswers, index];
      setClickAnswers(newAnswers);
      setSelected(null);

      if (currentQ < CLICK_QUESTIONS.length - 1) {
        setCurrentQ(prev => prev + 1);
        setAnimating(false);
      } else {
        setPhase('transition');
        setAnimating(false);
      }
    }, 300);
  }

  function handleTransitionNext() {
    setPhase('text');
  }

  function handleTextNext() {
    if (textQ < TEXT_QUESTIONS.length - 1) {
      setTextQ(prev => prev + 1);
    } else {
      const scores = calculateScores(clickAnswers);
      onComplete({ clickAnswers, textAnswers, scores });
    }
  }

  function updateTextAnswer(value) {
    const updated = [...textAnswers];
    updated[textQ] = value;
    setTextAnswers(updated);
  }

  const currentTextAnswer = textAnswers[textQ];
  const canProceedText = currentTextAnswer.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-0" style={{ background: '#F5F0DC' }}>
      {/* Progress bar — fixed 4px strip at very top */}
      {phase !== 'transition' && (
        <div className="fixed top-0 left-0 w-full z-20" style={{ height: '4px', background: '#E8E3CC' }}>
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, background: '#7CB518' }}
          />
        </div>
      )}

      {/* Header */}
      <div className="w-full max-w-lg pt-10 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: '#1A1A1A' }}
            >
              <span className="text-sm">🌿</span>
            </div>
            <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Mindfully Yours</span>
          </div>
          {phase !== 'transition' && (
            <span className="text-xs font-medium" style={{ color: '#5A5A3A' }}>
              {phase === 'click' ? currentQ + 1 : 8 + textQ + 1} of {totalQuestions}
            </span>
          )}
        </div>
      </div>

      {/* Phase: Click Questions */}
      {phase === 'click' && (
        <div key={currentQ} className="w-full max-w-lg slide-in flex-1 flex flex-col justify-center pb-10">
          <div
            className="bg-white rounded-3xl p-8"
            style={{ boxShadow: '0 8px 32px rgba(26,26,26,0.09)', border: '1px solid #E8E3CC' }}
          >
            {/* Question */}
            <div className="mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#7CB518' }}>
                Question {currentQ + 1} of {CLICK_QUESTIONS.length}
              </p>
              <h2 className="text-2xl font-semibold leading-snug" style={{ color: '#1A1A1A' }}>
                {CLICK_QUESTIONS[currentQ].q}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {CLICK_QUESTIONS[currentQ].opts.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleOptionClick(i)}
                  className="w-full text-left px-6 py-4 rounded-2xl font-medium text-base transition-all duration-200 flex items-center justify-between group"
                  style={
                    selected === i
                      ? { background: '#1A1A1A', color: '#F5F0DC', borderLeft: '4px solid #7CB518', border: '2px solid #1A1A1A', transform: 'scale(0.99)' }
                      : { background: '#FAFAF7', color: '#1A1A1A', border: '2px solid #E8E3CC' }
                  }
                  onMouseEnter={e => {
                    if (selected !== i) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.borderLeft = '4px solid #7CB518';
                      e.currentTarget.style.background = '#F5F0DC';
                    }
                  }}
                  onMouseLeave={e => {
                    if (selected !== i) {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.borderLeft = '2px solid #E8E3CC';
                      e.currentTarget.style.background = '#FAFAF7';
                    }
                  }}
                >
                  <span>{opt}</span>
                  {selected === i && (
                    <span className="text-sm font-bold" style={{ color: '#7CB518' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Phase: Transition */}
      {phase === 'transition' && (
        <div className="w-full max-w-lg fade-in flex-1 flex flex-col justify-center pb-10">
          <div
            className="bg-white rounded-3xl p-10 text-center"
            style={{ boxShadow: '0 8px 32px rgba(26,26,26,0.09)', border: '1px solid #E8E3CC' }}
          >
            <div className="text-5xl mb-6">💬</div>
            <h2 className="text-2xl font-semibold mb-3" style={{ color: '#1A1A1A' }}>You're doing great</h2>
            <p className="leading-relaxed mb-8" style={{ color: '#5A5A3A' }}>
              Just a few more questions — these help our companion understand you personally.<br />
              There are no right or wrong answers.
            </p>
            <button
              onClick={handleTransitionNext}
              className="px-8 py-3.5 font-semibold rounded-2xl transition-all duration-200 active:scale-[0.98]"
              style={{ background: '#1A1A1A', color: '#F5F0DC' }}
              onMouseEnter={e => e.currentTarget.style.background = '#2D2D2D'}
              onMouseLeave={e => e.currentTarget.style.background = '#1A1A1A'}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Phase: Text Questions */}
      {phase === 'text' && (
        <div key={`text-${textQ}`} className="w-full max-w-lg slide-in flex-1 flex flex-col justify-center pb-10">
          <div
            className="bg-white rounded-3xl p-8"
            style={{ boxShadow: '0 8px 32px rgba(26,26,26,0.09)', border: '1px solid #E8E3CC' }}
          >
            <div className="mb-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#7CB518' }}>
                Question {8 + textQ + 1} of 12
              </p>
              <h2 className="text-xl font-semibold leading-snug" style={{ color: '#1A1A1A' }}>
                {TEXT_QUESTIONS[textQ]}
              </h2>
            </div>

            <textarea
              value={currentTextAnswer}
              onChange={e => updateTextAnswer(e.target.value)}
              placeholder="Take your time... there's no rush."
              rows={5}
              className="w-full px-5 py-4 rounded-2xl outline-none resize-none text-sm leading-relaxed transition-all duration-200"
              style={{
                border: '2px solid #E8E3CC',
                background: '#FAFAF7',
                color: '#1A1A1A',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#7CB518'}
              onBlur={e => e.currentTarget.style.borderColor = '#E8E3CC'}
            />

            <div className="flex items-center justify-between mt-5">
              <button
                onClick={() => {
                  if (textQ > 0) setTextQ(prev => prev - 1);
                  else setPhase('transition');
                }}
                className="text-sm font-medium transition-colors"
                style={{ color: '#5A5A3A' }}
              >
                ← Back
              </button>
              <button
                onClick={handleTextNext}
                disabled={!canProceedText}
                className="px-7 py-3 font-semibold rounded-2xl transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#1A1A1A', color: '#F5F0DC' }}
                onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = '#2D2D2D')}
                onMouseLeave={e => (e.currentTarget.style.background = '#1A1A1A')}
              >
                {textQ === TEXT_QUESTIONS.length - 1 ? 'See My Report →' : 'Next →'}
              </button>
            </div>

            {!canProceedText && (
              <button
                onClick={handleTextNext}
                className="w-full mt-3 text-center text-xs transition-colors"
                style={{ color: '#5A5A3A' }}
              >
                Skip this question
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
