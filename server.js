const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Data storage
const DATA_DIR = path.join(__dirname, 'data');
const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json');

// Initialize data directory
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Load questions from file
let questions = [];
if (fs.existsSync(QUESTIONS_FILE)) {
  questions = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf8'));
}

// API Routes

// Get all test sets
app.get('/api/sets', (req, res) => {
  const sets = [
    { id: 1, name: 'Set 1', description: 'Practice Questions Set No. 1' },
    { id: 2, name: 'Set 2', description: 'Practice Questions Set No. 2' },
    { id: 3, name: 'Set 3', description: 'Practice Questions Set No. 3' },
    { id: 4, name: 'Set 4', description: 'Practice Questions Set No. 4' },
    { id: 5, name: 'Set 5', description: 'Practice Questions Set No. 5' },
    { id: 6, name: 'Set 6', description: 'Practice Questions Set No. 6' },
    { id: 7, name: 'Set 7 - Last Day Revision 1', description: 'Last Day Revision Set 1' },
    { id: 8, name: 'Set 8 - Last Day Revision 2', description: 'Last Day Revision Set 2' },
    { id: 9, name: 'Set 9 - Real Feel Timed', description: 'Real Feel Timed Test' }
  ];
  res.json(sets);
});

// Get questions by set
app.get('/api/questions/:setId', (req, res) => {
  const setId = parseInt(req.params.setId);
  const setQuestions = questions.filter(q => q.setId === setId);
  res.json(setQuestions);
});

// Search questions
app.get('/api/search', (req, res) => {
  const { query, setId } = req.query;
  
  if (!query) {
    return res.json([]);
  }

  const searchTerm = query.toLowerCase();
  let filteredQuestions = questions;

  if (setId) {
    filteredQuestions = questions.filter(q => q.setId === parseInt(setId));
  }

  const results = filteredQuestions.filter(q => 
    q.question.toLowerCase().includes(searchTerm) ||
    q.options.some(opt => opt.toLowerCase().includes(searchTerm))
  );

  res.json(results);
});

// Get single question with answer
app.get('/api/question/:id', (req, res) => {
  const questionId = req.params.id;
  const question = questions.find(q => q.id === questionId);
  
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  res.json(question);
});

// Get all questions
app.get('/api/questions', (req, res) => {
  res.json(questions);
});

// Submit test answers
app.post('/api/submit', (req, res) => {
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

  res.json({
    total,
    correct,
    wrong,
    percentage,
    results
  });
});

// Parse HTML files and extract questions
app.post('/api/parse', async (req, res) => {
  const { htmlPath } = req.body;
  
  try {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const $ = cheerio.load(html);
    
    const extractedQuestions = [];
    
    // Extract questions based on the HTML structure
    $('input[name^="QuestOpt"]').each((index, element) => {
      const name = $(element).attr('name');
      const questionId = parseInt(name.replace('QuestOpt', ''));
      const value = $(element).attr('value');
      
      // Find the question text
      const questionText = $(element).closest('tr').prev().text().trim();
      
      // Find correct answer
      const correctAnsName = `CorrectAns${questionId}`;
      const correctAnswer = $(`input[name="${correctAnsName}"]`).val();
      
      if (questionText && correctAnswer) {
        extractedQuestions.push({
          id: questionId,
          question: questionText,
          options: [],
          correctAnswer: parseInt(correctAnswer),
          setId: 1 // Default set ID
        });
      }
    });
    
    res.json({ success: true, questions: extractedQuestions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save parsed questions
app.post('/api/questions/save', (req, res) => {
  const { newQuestions } = req.body;
  questions = [...questions, ...newQuestions];
  fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(questions, null, 2));
  res.json({ success: true, count: newQuestions.length });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', questionCount: questions.length });
});

app.listen(PORT, () => {
  console.log(`SORM Mock Test Server running on http://localhost:${PORT}`);
  console.log(`Total questions loaded: ${questions.length}`);
});
