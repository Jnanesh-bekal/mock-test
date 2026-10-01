// Vercel serverless function for submitting test answers
const { getQuestionById, getQuestionsBySetId } = require('../data/questionsHelper');

module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { answers = [], setId, totalQuestions } = req.body || {};
  let correct = 0;
  let wrong = 0;
  const results = [];

  const setQuestions = setId ? getQuestionsBySetId(setId) : [];
  const total = Number(totalQuestions) || (setQuestions.length > 0 ? setQuestions.length : (Array.isArray(answers) ? answers.length : 0));

  if (Array.isArray(answers)) {
    answers.forEach(answer => {
      const question = getQuestionById(answer.questionId);
      if (question) {
        const isCorrect = Number(question.correctAnswer) === Number(answer.selectedAnswer);
        if (isCorrect) correct++;
        else wrong++;
        
        results.push({
          questionId: answer.questionId,
          selectedAnswer: answer.selectedAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          questionText: question.question,
          options: question.options,
          explanation: question.explanation
        });
      }
    });
  }

  const answeredCount = correct + wrong;
  const unanswered = Math.max(0, total - answeredCount);
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  res.status(200).json({
    total,
    correct,
    wrong,
    unanswered,
    percentage,
    results
  });
};
