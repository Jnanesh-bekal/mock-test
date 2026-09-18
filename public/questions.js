// Embedded questions data for static deployment
const questionsData = [
  // This will be populated by the parser
];

// Load questions from JSON file or use embedded data
async function loadQuestions() {
  try {
    const response = await fetch('/data/questions.json');
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.log('Using embedded questions data');
  }
  return questionsData;
}
