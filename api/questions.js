// Vercel serverless function for questions API
const questions = require('../data/questions.json');

module.exports = (req, res) => {
  const { method, query } = req;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get all questions
  if (method === 'GET' && !query.setId && !query.search && !query.id) {
    res.status(200).json(questions);
    return;
  }

  // Get questions by set
  if (method === 'GET' && query.setId) {
    const setId = parseInt(query.setId);
    const setQuestions = questions.filter(q => q.setId === setId);
    res.status(200).json(setQuestions);
    return;
  }

  // Search questions
  if (method === 'GET' && query.search) {
    const searchTerm = query.search.toLowerCase();
    let filteredQuestions = questions;

    if (query.setId) {
      filteredQuestions = questions.filter(q => q.setId === parseInt(query.setId));
    }

    const results = filteredQuestions.filter(q => 
      q.question.toLowerCase().includes(searchTerm) ||
      q.options.some(opt => opt.toLowerCase().includes(searchTerm))
    );

    res.status(200).json(results);
    return;
  }

  // Get single question
  if (method === 'GET' && query.id) {
    const question = questions.find(q => q.id === query.id);
    if (question) {
      res.status(200).json(question);
    } else {
      res.status(404).json({ error: 'Question not found' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
