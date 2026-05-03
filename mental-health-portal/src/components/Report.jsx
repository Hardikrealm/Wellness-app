import {
  getDepressionInterpretation,
  getAnxietyInterpretation,
  getSleepInterpretation,
  getSocialInterpretation,
  getFunctioningInterpretation,
  getSuggestedNextStep,
} from '../utils/scoring.js';

const SEVERITY_PALETTE = {
  Minimal:             { bar: '#7CB518', badge: { bg: '#F0F7E0', text: '#4A7A0A', border: '#C6E07A' } },
  Mild:                { bar: '#D4A017', badge: { bg: '#FDF3D0', text: '#7A5A00', border: '#F0D070' } },
  Moderate:            { bar: '#D97706', badge: { bg: '#FEF0D0', text: '#7A4A00', border: '#FDBA74' } },
  Severe:              { bar: '#DC2626', badge: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' } },
  Good:                { bar: '#7CB518', badge: { bg: '#F0F7E0', text: '#4A7A0A', border: '#C6E07A' } },
  Fair:                { bar: '#D4A017', badge: { bg: '#FDF3D0', text: '#7A5A00', border: '#F0D070' } },
  Poor:                { bar: '#DC2626', badge: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' } },
  'Very Connected':    { bar: '#7CB518', badge: { bg: '#F0F7E0', text: '#4A7A0A', border: '#C6E07A' } },
  'Somewhat Connected':{ bar: '#4A90D9', badge: { bg: '#EBF5FF', text: '#1D4ED8', border: '#93C5FD' } },
  'A Bit Isolated':    { bar: '#D97706', badge: { bg: '#FEF0D0', text: '#7A4A00', border: '#FDBA74' } },
  'Very Alone':        { bar: '#DC2626', badge: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' } },
  'Functioning Well':  { bar: '#7CB518', badge: { bg: '#F0F7E0', text: '#4A7A0A', border: '#C6E07A' } },
  'Mostly Managing':   { bar: '#4A90D9', badge: { bg: '#EBF5FF', text: '#1D4ED8', border: '#93C5FD' } },
  Struggling:          { bar: '#D97706', badge: { bg: '#FEF0D0', text: '#7A4A00', border: '#FDBA74' } },
  'Significantly Behind': { bar: '#DC2626', badge: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' } },
};

function WellnessGauge({ score }) {
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (score / 100) * circumference;

  const color = score >= 75 ? '#7CB518'
    : score >= 50 ? '#D4A017'
    : score >= 25 ? '#D97706' : '#DC2626';

  const label = score >= 75 ? 'Thriving'
    : score >= 50 ? 'Coping'
    : score >= 25 ? 'Struggling' : 'Crisis';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#1A1A1A" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color: '#1A1A1A' }}>{score}</span>
          <span className="text-xs font-medium" style={{ color: '#5A5A3A' }}>/100</span>
        </div>
      </div>
      <span className="mt-3 text-lg font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

function ScoreBar({ score, max, label }) {
  const pct = Math.round((score / max) * 100);
  const p = SEVERITY_PALETTE[label] || SEVERITY_PALETTE.Mild;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={{
            background: p.badge.bg,
            color: p.badge.text,
            border: `1px solid ${p.badge.border}`,
          }}
        >
          {label}
        </span>
        <span className="text-xs font-medium" style={{ color: '#5A5A3A' }}>{score}/{max}</span>
      </div>
      <div className="w-full rounded-full overflow-hidden" style={{ height: '8px', background: '#E8E3CC' }}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, background: p.bar }}
        />
      </div>
    </div>
  );
}

function Card({ children, className = '', style = {} }) {
  return (
    <div
      className={`bg-white rounded-2xl p-6 ${className}`}
      style={{ border: '1px solid #E8E3CC', boxShadow: '0 2px 12px rgba(26,26,26,0.07)', ...style }}
    >
      {children}
    </div>
  );
}

const TEXT_QUESTIONS_SHORT = [
  'What\'s been weighing on you',
  'How you cope',
  'Urgency of support',
  'What you want from this',
];

export default function Report({ report, onContinue }) {
  const { scores, textAnswers } = report;
  const nextStep = getSuggestedNextStep(scores.wellnessScore);
  const isSerious = scores.wellnessScore < 50;

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: '#F5F0DC' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 fade-in">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style={{ background: '#1A1A1A' }}
          >
            <span className="text-xl">🌿</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: '#1A1A1A' }}>Your Wellness Snapshot</h1>
          <p className="text-sm mt-2 max-w-md mx-auto leading-relaxed" style={{ color: '#5A5A3A' }}>
            This is not a clinical diagnosis. It's a starting point — a mirror for where you are right now.
          </p>
        </div>

        <div className="space-y-4 fade-in">
          {/* Overall Wellness */}
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-5" style={{ color: '#7CB518' }}>
              Overall Wellness
            </h3>
            <div className="flex flex-col items-center">
              <WellnessGauge score={scores.wellnessScore} />
              <p className="text-center text-sm mt-4 max-w-xs leading-relaxed" style={{ color: '#5A5A3A' }}>
                {nextStep}
              </p>
            </div>
          </Card>

          {/* Depression */}
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#7CB518' }}>
              Depression Indicators
            </h3>
            <ScoreBar score={scores.depressionScore} max={12} label={scores.depressionLabel} />
            <p className="text-sm mt-3 leading-relaxed" style={{ color: '#5A5A3A' }}>
              {getDepressionInterpretation(scores.depressionLabel)}
            </p>
          </Card>

          {/* Anxiety */}
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#7CB518' }}>
              Anxiety Indicators
            </h3>
            <ScoreBar score={scores.anxietyScore} max={9} label={scores.anxietyLabel} />
            <p className="text-sm mt-3 leading-relaxed" style={{ color: '#5A5A3A' }}>
              {getAnxietyInterpretation(scores.anxietyLabel)}
            </p>
          </Card>

          {/* 2-col grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#7CB518' }}>
                Sleep Quality
              </h3>
              <ScoreBar score={scores.sleepScore} max={3} label={scores.sleepLabel} />
              <p className="text-sm mt-3 leading-relaxed" style={{ color: '#5A5A3A' }}>
                {getSleepInterpretation(scores.sleepLabel)}
              </p>
            </Card>

            <Card>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#7CB518' }}>
                Social Connection
              </h3>
              <ScoreBar score={scores.socialScore} max={3} label={scores.socialLabel} />
              <p className="text-sm mt-3 leading-relaxed" style={{ color: '#5A5A3A' }}>
                {getSocialInterpretation(scores.socialLabel)}
              </p>
            </Card>
          </div>

          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#7CB518' }}>
              Daily Functioning
            </h3>
            <ScoreBar score={scores.functioningScore} max={6} label={scores.functioningLabel} />
            <p className="text-sm mt-3 leading-relaxed" style={{ color: '#5A5A3A' }}>
              {getFunctioningInterpretation(scores.functioningLabel)}
            </p>
          </Card>

          {/* In your own words */}
          <Card style={{ background: '#FFFEF8' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#7CB518' }}>
              In Your Own Words
            </h3>
            <div className="space-y-4">
              {textAnswers.map((ans, i) => (
                ans.trim() && (
                  <div key={i}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#5A5A3A' }}>
                      {TEXT_QUESTIONS_SHORT[i]}
                    </p>
                    <p className="text-sm italic leading-relaxed" style={{ color: '#1A1A1A' }}>"{ans}"</p>
                  </div>
                )
              ))}
            </div>
          </Card>

          {/* Gentle note for serious scores */}
          {isSerious && (
            <div
              className="rounded-2xl p-5 flex items-start gap-3"
              style={{ background: '#FEF9ED', border: '1px solid #F0D070' }}
            >
              <span className="text-xl mt-0.5">⚠️</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#7A5A00' }}>A gentle note</p>
                <p className="text-sm mt-1 leading-relaxed" style={{ color: '#7A5A00' }}>
                  Your responses suggest you may be going through a difficult time. While our AI companion is here to listen,
                  please also consider speaking with a mental health professional.
                </p>
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={onContinue}
            className="w-full py-4 font-semibold rounded-2xl transition-all duration-200 active:scale-[0.99] text-base mt-2"
            style={{ background: '#1A1A1A', color: '#F5F0DC', boxShadow: '0 4px 16px rgba(26,26,26,0.25)' }}
            onMouseEnter={e => e.currentTarget.style.background = '#2D2D2D'}
            onMouseLeave={e => e.currentTarget.style.background = '#1A1A1A'}
          >
            Talk to Your AI Companion →
          </button>
        </div>
      </div>
    </div>
  );
}
