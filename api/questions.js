// Vercel serverless function for questions API
const { getAllQuestions, getQuestionById, getQuestionsBySetId } = require('../data/questionsHelper');

module.exports = (req, res) => {
  const { method, query = {} } = req;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const allQuestions = getAllQuestions();

  // Get single question by ID
  if (query.id) {
    const question = getQuestionById(query.id);
    if (question) {
      res.status(200).json(question);
    } else {
      res.status(404).json({ error: 'Question not found' });
    }
    return;
  }

  // Search questions
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    let filteredQuestions = allQuestions;

    if (query.setId) {
      filteredQuestions = getQuestionsBySetId(query.setId);
    }

    const results = filteredQuestions.filter(q => 
      (q.question && q.question.toLowerCase().includes(searchTerm)) ||
      (q.options && q.options.some(opt => opt && opt.toLowerCase().includes(searchTerm))) ||
      (q.explanation && q.explanation.toLowerCase().includes(searchTerm))
    );

    res.status(200).json(results);
    return;
  }

  // Get questions by set
  if (query.setId) {
    const setQuestions = getQuestionsBySetId(query.setId);
    res.status(200).json(setQuestions);
    return;
  }

  // Get all questions
  res.status(200).json(allQuestions);
};
