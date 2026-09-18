// Vercel serverless function for submitting test answers
const questions = require('../data/questions.json');

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

  const { answers, setId } = req.body;
  let correct = 0;
  let wrong = 0;
  const results = [];

  answers.forEach(answer => {
    const question = questions.find(q => q.id === answer.questionId);
    if (question) {
      const isCorrect = question.correctAnswer === answer.selectedAnswer;
      if (isCorrect) correct++;
      else wrong++;
      
      results.push({
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect
      });
    }
  });

  const total = answers.length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  res.status(200).json({
    total,
    correct,
    wrong,
    percentage,
    results
  });
};
