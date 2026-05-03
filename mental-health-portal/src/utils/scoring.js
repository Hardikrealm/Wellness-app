export function calculateScores(answers) {
  const q = answers;

  // Q2 (index 1) sleep is inverted: <4hrs=3, 4-6=2, 6-8=1, 8-10=0
  const q2score = 3 - q[1];

  const depressionScore = q[0] + q[2] + q[6] + q[7];
  const anxietyScore = q[3] + q[0] + q[5];
  const sleepScore = q2score;
  const socialScore = q[4];
  const functioningScore = q[5] + q[2];

  const totalRaw = q[0] + q2score + q[2] + q[3] + q[4] + q[5] + q[6] + q[7];
  const wellnessScore = Math.round(100 - (totalRaw / 24) * 100);

  const depressionLabel = depressionScore <= 3 ? 'Minimal'
    : depressionScore <= 6 ? 'Mild'
    : depressionScore <= 9 ? 'Moderate' : 'Severe';

  const anxietyLabel = anxietyScore <= 2 ? 'Minimal'
    : anxietyScore <= 5 ? 'Mild'
    : anxietyScore <= 7 ? 'Moderate' : 'Severe';

  const sleepLabel = sleepScore === 0 ? 'Good'
    : sleepScore === 1 ? 'Fair' : 'Poor';

  const socialLabel = socialScore === 0 ? 'Very Connected'
    : socialScore === 1 ? 'Somewhat Connected'
    : socialScore === 2 ? 'A Bit Isolated' : 'Very Alone';

  const functioningLabel = functioningScore <= 1 ? 'Functioning Well'
    : functioningScore <= 3 ? 'Mostly Managing'
    : functioningScore <= 5 ? 'Struggling' : 'Significantly Behind';

  const wellnessLabel = wellnessScore >= 75 ? 'Thriving'
    : wellnessScore >= 50 ? 'Coping'
    : wellnessScore >= 25 ? 'Struggling' : 'Crisis';

  return {
    depressionScore, depressionLabel,
    anxietyScore, anxietyLabel,
    sleepScore, sleepLabel,
    socialScore, socialLabel,
    functioningScore, functioningLabel,
    wellnessScore, wellnessLabel,
  };
}

export function getDepressionInterpretation(label) {
  const map = {
    Minimal: "Your mood indicators look healthy right now. Keep nurturing what's working for you.",
    Mild: "You may be experiencing some low mood or loss of motivation. This is worth paying attention to.",
    Moderate: "There are signs of low mood that may be affecting your daily life. Talking to someone could help.",
    Severe: "Your responses suggest significant low mood. Reaching out for support is a courageous and important step.",
  };
  return map[label];
}

export function getAnxietyInterpretation(label) {
  const map = {
    Minimal: "You seem to be managing stress and worry relatively well at this time.",
    Mild: "Some tension or worry is showing up. Small mindfulness habits can make a real difference.",
    Moderate: "You seem to be carrying significant worry or tension. This can feel exhausting over time.",
    Severe: "High levels of anxiety are showing up. Please consider speaking with a professional — support is available.",
  };
  return map[label];
}

export function getSleepInterpretation(label) {
  const map = {
    Good: "Your sleep seems to be supporting you well. Rest is a cornerstone of mental health.",
    Fair: "Some sleep disruption is present. Small routines before bed can help improve your rest.",
    Poor: "Sleep challenges are showing up clearly. Poor sleep can amplify all other difficulties — it's worth addressing.",
  };
  return map[label];
}

export function getSocialInterpretation(label) {
  const map = {
    'Very Connected': "You feel connected to people around you — that's a powerful protective factor for wellbeing.",
    'Somewhat Connected': "You have some social connection, though there may be moments of loneliness.",
    'A Bit Isolated': "You may be feeling somewhat alone lately. Gentle social contact, even brief, can help.",
    'Very Alone': "Feeling deeply alone is painful. You deserve connection — and you've taken a step toward it by being here.",
  };
  return map[label];
}

export function getFunctioningInterpretation(label) {
  const map = {
    'Functioning Well': "You're managing your responsibilities well, which reflects real resilience.",
    'Mostly Managing': "You're keeping up for the most part, even if it takes more effort than usual.",
    Struggling: "Daily tasks are feeling harder than normal. This often signals that you need more support.",
    'Significantly Behind': "Staying on top of things feels very difficult right now. That's okay — getting support is a valid next step.",
  };
  return map[label];
}

export function getSuggestedNextStep(wellnessScore) {
  if (wellnessScore >= 75) return "You're doing well. Our AI companion can help you maintain this.";
  if (wellnessScore >= 50) return "Some areas could use attention. Let's talk through it with our AI companion.";
  if (wellnessScore >= 25) return "You're going through a difficult time. We strongly recommend speaking with a professional.";
  return "You may be in significant distress. Please consider connecting with a therapist today.";
}
