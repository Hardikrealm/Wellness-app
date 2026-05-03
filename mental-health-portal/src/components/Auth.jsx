import { useState, useRef, useEffect } from 'react';

const DUMMY_OTP = '123456';

export default function Auth({ onAuth }) {
  const [stage, setStage] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const otpRefs = useRef([]);

  useEffect(() => {
    if (stage === 'otp' && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [stage]);

  function handlePhoneSubmit(e) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setPhoneError('');
    setStage('otp');
  }

  function handleOtpChange(index, value) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  }

  function handleOtpSubmit(e) {
    e.preventDefault();
    const entered = otp.join('');
    if (entered === DUMMY_OTP) {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userPhone', '+91' + phone.replace(/\D/g, ''));
      onAuth();
    } else {
      setShaking(true);
      setError('Incorrect OTP. Try 123456.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => {
        setShaking(false);
        otpRefs.current[0]?.focus();
      }, 600);
    }
  }

  const otpComplete = otp.every(d => d !== '');

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F5F0DC' }}>
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-10 fade-in">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
            style={{ background: '#1A1A1A' }}
          >
            <span className="text-2xl">🌿</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: '#1A1A1A' }}>Mindfully Yours</h1>
          <p className="mt-2 text-sm" style={{ color: '#5A5A3A' }}>Your personal mental wellness companion</p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-3xl p-8 fade-in"
          style={{ boxShadow: '0 8px 32px rgba(26,26,26,0.10)', border: '1px solid #E8E3CC' }}
        >
          {stage === 'phone' ? (
            <>
              <h2 className="text-xl font-semibold mb-1" style={{ color: '#1A1A1A' }}>Welcome</h2>
              <p className="text-sm mb-8" style={{ color: '#5A5A3A' }}>Enter your mobile number to get started</p>

              <form onSubmit={handlePhoneSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5A5A3A' }}>Mobile Number</label>
                  <div
                    className="flex items-center rounded-2xl overflow-hidden transition-all duration-200"
                    style={{ border: '2px solid #1A1A1A' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#7CB518'}
                    onBlur={e => e.currentTarget.style.borderColor = '#1A1A1A'}
                  >
                    <span
                      className="px-4 py-3.5 font-medium text-sm whitespace-nowrap"
                      style={{ background: '#F5F0DC', color: '#1A1A1A', borderRight: '2px solid #1A1A1A' }}
                    >
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => { setPhone(e.target.value); setPhoneError(''); }}
                      placeholder="98765 43210"
                      maxLength={10}
                      className="flex-1 px-4 py-3.5 outline-none text-sm bg-white"
                      style={{ color: '#1A1A1A' }}
                    />
                  </div>
                  {phoneError && <p className="mt-2 text-xs" style={{ color: '#dc2626' }}>{phoneError}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 font-semibold rounded-2xl transition-all duration-200 active:scale-[0.98]"
                  style={{ background: '#1A1A1A', color: '#F5F0DC' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#2D2D2D'}
                  onMouseLeave={e => e.currentTarget.style.background = '#1A1A1A'}
                >
                  Send OTP
                </button>
              </form>

              <p className="text-center text-xs mt-6" style={{ color: '#5A5A3A' }}>
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStage('phone'); setOtp(['', '', '', '', '', '']); setError(''); }}
                className="flex items-center text-sm font-medium mb-6 transition-colors"
                style={{ color: '#7CB518' }}
              >
                <span className="mr-1">←</span> Back
              </button>

              <h2 className="text-xl font-semibold mb-1" style={{ color: '#1A1A1A' }}>Verify OTP</h2>
              <p className="text-sm mb-8" style={{ color: '#5A5A3A' }}>
                Enter the 6-digit OTP sent to{' '}
                <span className="font-semibold" style={{ color: '#1A1A1A' }}>+91 {phone}</span>
              </p>

              <form onSubmit={handleOtpSubmit}>
                <div className={`flex gap-3 justify-center mb-6 ${shaking ? 'shake' : ''}`} onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-semibold rounded-xl outline-none transition-all duration-200"
                      style={{
                        border: `2px solid ${digit ? '#7CB518' : '#1A1A1A'}`,
                        background: digit ? '#F5F0DC' : '#FFFFFF',
                        color: '#1A1A1A',
                        boxShadow: digit ? '0 0 0 3px rgba(124,181,24,0.15)' : 'none',
                      }}
                    />
                  ))}
                </div>

                {error && (
                  <div
                    className="rounded-xl px-4 py-3 mb-5 text-center"
                    style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
                  >
                    <p className="text-sm font-medium" style={{ color: '#dc2626' }}>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!otpComplete}
                  className="w-full py-3.5 font-semibold rounded-2xl transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: '#1A1A1A', color: '#F5F0DC' }}
                  onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = '#2D2D2D')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#1A1A1A')}
                >
                  Verify & Continue
                </button>
              </form>

              <p className="text-center text-xs mt-6" style={{ color: '#5A5A3A' }}>
                Didn't receive?{' '}
                <button className="font-semibold" style={{ color: '#7CB518' }}>Resend OTP</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
