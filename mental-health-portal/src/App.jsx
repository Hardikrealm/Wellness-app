import { useState } from 'react';
import Auth from './components/Auth.jsx';
import Onboarding from './components/Onboarding.jsx';
import Report from './components/Report.jsx';
import Companion from './components/Companion.jsx';

export default function App() {
  const [stage, setStage] = useState(() => {
    if (localStorage.getItem('isAuthenticated') === 'true') return 'onboard';
    return 'auth';
  });
  const [report, setReport] = useState(null);

  function handleAuth() {
    setStage('onboard');
  }

  function handleOnboardingComplete(data) {
    setReport(data);
    setStage('report');
    window.scrollTo(0, 0);
  }

  function handleContinueToChat() {
    setStage('companion');
    window.scrollTo(0, 0);
  }

  if (stage === 'auth') return <Auth onAuth={handleAuth} />;
  if (stage === 'onboard') return <Onboarding onComplete={handleOnboardingComplete} />;
  if (stage === 'report') return <Report report={report} onContinue={handleContinueToChat} />;
  if (stage === 'companion') return <Companion report={report} />;

  return null;
}
