// Question Data Helper
// Statically bundles and indexes all certification questions (SORM, EQ, RA, MB, MFD)

const sormQuestions = require('./questions.json');
const eqQuestions = require('./equity-derivatives-questions.json');
const raQuestions = require('./research-analyst-questions.json');
const mbQuestions = require('./merchant-banking-questions.json');
const mfdQuestions = require('./mutual-funds-questions.json');

const allQuestions = [...sormQuestions, ...eqQuestions, ...raQuestions, ...mbQuestions, ...mfdQuestions];

// Fast O(1) ID lookup map
const questionMap = new Map();
allQuestions.forEach(q => {
  if (q && q.id) {
    questionMap.set(String(q.id), q);
  }
});

function getAllQuestions() {
  return allQuestions;
}

function getQuestionById(id) {
  return questionMap.get(String(id));
}

function getQuestionsBySetId(setId) {
  const numericSetId = parseInt(setId, 10);
  return allQuestions.filter(q => q.setId === numericSetId);
}

module.exports = {
  getAllQuestions,
  getQuestionById,
  getQuestionsBySetId,
  allQuestions
};
