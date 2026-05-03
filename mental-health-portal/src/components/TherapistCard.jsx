import { useState } from 'react';

const THERAPISTS = [
  {
    id: 1,
    name: 'Dr. Meera Kapoor',
    title: 'Clinical Psychologist',
    exp: '8 yrs exp',
    available: 'Available today',
    price: '₹799/session',
    rating: '4.9',
    langs: 'Hindi, English',
    avatar: '👩‍⚕️',
    specialty: 'Anxiety & Depression',
  },
  {
    id: 2,
    name: 'Dr. Arjun Sharma',
    title: 'Counselling Psychologist',
    exp: '5 yrs exp',
    available: 'Available tomorrow',
    price: '₹599/session',
    rating: '4.8',
    langs: 'English, Marathi',
    avatar: '👨‍⚕️',
    specialty: 'Stress & Burnout',
  },
  {
    id: 3,
    name: 'Dr. Priya Nair',
    title: 'Psychotherapist',
    exp: '11 yrs exp',
    available: 'Available today',
    price: '₹999/session',
    rating: '5.0',
    langs: 'English, Malayalam',
    avatar: '👩‍⚕️',
    specialty: 'Trauma & Relationships',
  },
];

function Toast({ message, onClose }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in">
      <div
        className="px-6 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-3"
        style={{ background: '#1A1A1A', color: '#F5F0DC' }}
      >
        <span style={{ color: '#7CB518' }}>✓</span>
        {message}
        <button onClick={onClose} className="ml-2 text-xs opacity-60 hover:opacity-100">✕</button>
      </div>
    </div>
  );
}

export default function TherapistCard() {
  const [toast, setToast] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const displayed = showAll ? THERAPISTS : THERAPISTS.slice(0, 1);

  function handleBook(name) {
    setToast(`Booking request sent! ${name} will confirm within 30 minutes.`);
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="fade-in mt-1 w-full max-w-[340px]">
      <div className="space-y-2">
        {displayed.map(t => (
          <div
            key={t.id}
            className="bg-white rounded-2xl p-4"
            style={{
              borderLeft: '4px solid #7CB518',
              border: '1px solid #E8E3CC',
              borderLeftWidth: '4px',
              borderLeftColor: '#7CB518',
              boxShadow: '0 2px 12px rgba(26,26,26,0.08)',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: '#F5F0DC' }}
              >
                {t.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: '#5A5A3A' }}>{t.title} · {t.exp}</p>
                  </div>
                  <span className="text-xs font-semibold flex-shrink-0" style={{ color: '#D4A017' }}>⭐ {t.rating}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: '#F0F7E0', color: '#4A7A0A', border: '1px solid #C6E07A' }}
                  >
                    {t.available}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: '#F5F0DC', color: '#1A1A1A' }}
                  >
                    {t.price}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: '#F5F5F5', color: '#5A5A3A' }}
                  >
                    {t.langs}
                  </span>
                </div>
                <p className="text-xs mt-1 italic" style={{ color: '#5A5A3A' }}>{t.specialty}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleBook(t.name)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-150 active:scale-[0.98]"
                style={{ background: '#1A1A1A', color: '#F5F0DC' }}
                onMouseEnter={e => e.currentTarget.style.background = '#2D2D2D'}
                onMouseLeave={e => e.currentTarget.style.background = '#1A1A1A'}
              >
                Book a Session
              </button>
              <button
                onClick={() => setShowAll(true)}
                className="px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 active:scale-[0.98]"
                style={{ border: '2px solid #7CB518', color: '#7CB518', background: 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F0F7E0'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                See More
              </button>
            </div>
          </div>
        ))}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
