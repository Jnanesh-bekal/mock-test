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

const questionsHelper = require('./data/questionsHelper');
let questions = questionsHelper.getAllQuestions();
console.log(`Initialized database with ${questions.length} total questions across 43 examination sets.`);

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
    { id: 9, name: 'Set 9 - Real Feel Timed', description: 'Real Feel Timed Test' },
    { id: 10, name: 'EQ Set 1', description: 'Practice Questions Set No. 1' },
    { id: 11, name: 'EQ Set 2', description: 'Practice Questions Set No. 2' },
    { id: 12, name: 'EQ Set 3', description: 'Practice Questions Set No. 3' },
    { id: 13, name: 'EQ Set 4', description: 'Practice Questions Set No. 4' },
    { id: 14, name: 'EQ Set 5', description: 'Practice Questions Set No. 5' },
    { id: 15, name: 'EQ Set 6', description: 'Practice Questions Set No. 6' },
    { id: 16, name: 'EQ Set 7 - Last Day Revision 1', description: 'Last Day Revision Set 1' },
    { id: 17, name: 'EQ Set 8 - Last Day Revision 2', description: 'Last Day Revision Set 2' },
    { id: 18, name: 'EQ Set 9 - Real Feel Timed', description: 'Real Feel Timed Test' },
    { id: 19, name: 'RA Practice Set 1', description: 'Practice Questions Set No. 1' },
    { id: 20, name: 'RA Practice Set 2', description: 'Practice Questions Set No. 2' },
    { id: 21, name: 'RA Practice Set 3', description: 'Practice Questions Set No. 3' },
    { id: 22, name: 'RA Practice Set 4', description: 'Practice Questions Set No. 4' },
    { id: 23, name: 'RA Practice Set 5', description: 'Practice Questions Set No. 5' },
    { id: 24, name: 'RA Practice Set 6', description: 'Practice Questions Set No. 6' },
    { id: 25, name: 'RA Revision Test 1', description: 'Revision Test 1' },
    { id: 26, name: 'RA Revision Test 2', description: 'Revision Test 2' },
    { id: 27, name: 'RA Real Feel Test', description: 'Real Feel Timed Test' },
    { id: 28, name: 'MB Quiz 1', description: 'Merchant Banking Quiz 1' },
    { id: 29, name: 'MB Quiz 2', description: 'Merchant Banking Quiz 2' },
    { id: 30, name: 'MB Quiz 3', description: 'Merchant Banking Quiz 3' },
    { id: 31, name: 'MB Quiz 4', description: 'Merchant Banking Quiz 4' },
    { id: 32, name: 'MB Quiz 5', description: 'Merchant Banking Quiz 5' },
    { id: 33, name: 'MB Quiz 6', description: 'Merchant Banking Quiz 6' },
    { id: 34, name: 'MB Quiz 7', description: 'Merchant Banking Quiz 7' },
    { id: 35, name: 'MFD Quiz 1', description: 'Concept and Role of a Mutual Fund' },
    { id: 36, name: 'MFD Quiz 2', description: 'Fund Structure, Constituents & Legal Framework' },
    { id: 37, name: 'MFD Quiz 3', description: 'Offer Documents & Regulatory Guidelines' },
    { id: 38, name: 'MFD Quiz 4', description: 'Fund Distribution, Practices & Channel Dynamics' },
    { id: 39, name: 'MFD Quiz 5', description: 'Net Asset Value, Total Expense Ratio & Accounting' },
    { id: 40, name: 'MFD Revision 1', description: 'Taxation, Return Measurement & Performance Evaluation' },
    { id: 41, name: 'MFD Revision 2', description: 'Scheme Selection, Investor Services & Financial Planning' },
    { id: 42, name: 'MFD Revision 3', description: 'Rapid High-Yield Operational & Compliance Drills' },
    { id: 43, name: 'MFD Real Feel Mock', description: 'Full Simulation Paper - NISM Series V-A Certification' }
  ];
  res.json(sets);
});

// Get questions by set
app.get('/api/questions/:setId', (req, res) => {
  const setId = parseInt(req.params.setId);
  const setQuestions = questionsHelper.getQuestionsBySetId(setId);
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

// Get all questions (with optional search and setId query filters)
app.get('/api/questions', (req, res) => {
  let filtered = questions;
  const { search, setId } = req.query;

  if (setId) {
    filtered = filtered.filter(q => q.setId === parseInt(setId));
  }

  if (search) {
    const qLower = search.toLowerCase();
    filtered = filtered.filter(q => {
      return (q.question && q.question.toLowerCase().includes(qLower)) ||
        (q.options && q.options.some(opt => opt && opt.toLowerCase().includes(qLower))) ||
        (q.explanation && q.explanation.toLowerCase().includes(qLower));
    });
  }

  res.json(filtered);
});

// Submit test answers
app.post('/api/submit', (req, res) => {
  const { answers = [], setId, totalQuestions } = req.body || {};
  let correct = 0;
  let wrong = 0;
  const results = [];

  const setQuestions = setId ? questionsHelper.getQuestionsBySetId(setId) : [];
  const total = Number(totalQuestions) || (setQuestions.length > 0 ? setQuestions.length : (Array.isArray(answers) ? answers.length : 0));

  if (Array.isArray(answers)) {
    answers.forEach(answer => {
      const question = questionsHelper.getQuestionById(answer.questionId);
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

  res.json({
    total,
    correct,
    wrong,
    unanswered,
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
