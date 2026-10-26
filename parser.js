const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Configuration
const BASE_DIR = path.join(__dirname, '..');
const OUTPUT_FILE = path.join(__dirname, 'data', 'questions.json');

// Test sets configuration
const TEST_SETS = [
  { id: 1, path: 'Welcome to Pass4Sure_files/Securities Operations & Risk Management/Set 1/Welcome to Pass4Sure_files/mocktest_attempt.html' },
  { id: 2, path: 'Welcome to Pass4Sure_files/Securities Operations & Risk Management/Set 2/Welcome to Pass4Sure_files/mocktest_attempt.html' },
  { id: 3, path: 'Welcome to Pass4Sure_files/Securities Operations & Risk Management/Set 3/Welcome to Pass4Sure_files/mocktest_attempt.html' },
  { id: 4, path: 'Welcome to Pass4Sure_files/Securities Operations & Risk Management/Set 4/Welcome to Pass4Sure_files/mocktest_attempt.html' },
  { id: 5, path: 'Welcome to Pass4Sure_files/Securities Operations & Risk Management/Set 5/Welcome to Pass4Sure_files/mocktest_attempt.html' },
  { id: 6, path: 'Welcome to Pass4Sure_files/Securities Operations & Risk Management/Set 6/Welcome to Pass4Sure_files/mocktest_attempt.html' },
  { id: 7, path: 'Welcome to Pass4Sure_files/Securities Operations & Risk Management/Set 7 - Last Day Revision 1/Welcome to Pass4Sure_files/mocktest_attempt.html' },
  { id: 8, path: 'Welcome to Pass4Sure_files/Securities Operations & Risk Management/Set 8 - Last Day Revision 2/Welcome to Pass4Sure_files/mocktest_attempt.html' },
  { id: 9, path: 'Welcome to Pass4Sure_files/Securities Operations & Risk Management/Set 9 - Real Feel Timed/Welcome to Pass4Sure_files/mocktest_attempt.html' }
];

function parseHtmlFile(filePath, setId) {
  try {
    const fullPath = path.join(BASE_DIR, filePath);
    console.log(`Parsing: ${filePath}`);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`  File not found: ${fullPath}`);
      return [];
    }

    const html = fs.readFileSync(fullPath, 'utf8');
    const $ = cheerio.load(html);
    
    const questions = [];
    const processedQuestions = new Set();

    // Find all radio buttons with QuestOpt names - these indicate questions
    $('input[name^="QuestOpt"]').each((index, element) => {
      const name = $(element).attr('name');
      const questionId = parseInt(name.replace('QuestOpt', ''));
      
      // Skip if already processed this question
      if (processedQuestions.has(questionId)) return;
      processedQuestions.add(questionId);

      // Find the table cell containing this radio button
      const cell = $(element).closest('td');
      
      // Get question text - it's in a <strong> tag before the radio buttons
      const questionText = cell.find('strong').first().text().trim();
      
      if (!questionText || questionText.length < 10) {
        return;
      }

      // Extract all options for this question from the same cell
      const options = [];
      cell.find(`input[name="QuestOpt${questionId}"]`).each((optIndex, optElement) => {
        const $optElement = $(optElement);
        // Get the text immediately following the radio button
        const nextSibling = $optElement[0].nextSibling;
        if (nextSibling && nextSibling.nodeType === 3) { // Text node
          const optionText = nextSibling.nodeValue.trim();
          if (optionText) {
            options.push(optionText);
          }
        }
      });

      // Find correct answer from hidden input in the same cell
      const correctAnsInput = cell.find(`input[name="CorrectAns${questionId}"]`);
      let correctAnswer = null;

      if (correctAnsInput.length > 0) {
        correctAnswer = parseInt(correctAnsInput.val()) - 1; // Convert to 0-based index
      }

      // Extract explanation from div with id divAE{questionId}
      const expDiv = cell.find(`div#divAE${questionId}`);
      let explanation = '';
      if (expDiv.length > 0) {
        explanation = expDiv.text().replace(/^Explanation:\s*/i, '').trim();
      }

      // Only add if we have meaningful data
      if (questionText && options.length > 0 && correctAnswer !== null && correctAnswer >= 0 && correctAnswer < options.length) {
        questions.push({
          id: `${setId}-${questionId}`,
          questionId: questionId,
          setId: setId,
          question: questionText,
          options: options,
          correctAnswer: correctAnswer,
          explanation: explanation
        });
      }
    });

    console.log(`  Extracted ${questions.length} questions`);
    return questions;
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    return [];
  }
}

function main() {
  console.log('Starting SORM Question Parser...\n');

  // Create data directory if it doesn't exist
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  let allQuestions = [];

  // Parse each test set
  TEST_SETS.forEach(set => {
    const questions = parseHtmlFile(set.path, set.id);
    allQuestions = [...allQuestions, ...questions];
  });

  // Save to JSON file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allQuestions, null, 2));

  console.log(`\n✓ Total questions extracted: ${allQuestions.length}`);
  console.log(`✓ Saved to: ${OUTPUT_FILE}`);

  // Print summary by set
  console.log('\n--- Summary by Set ---');
  const summary = {};
  allQuestions.forEach(q => {
    summary[q.setId] = (summary[q.setId] || 0) + 1;
  });
  
  Object.keys(summary).sort((a, b) => a - b).forEach(setId => {
    console.log(`Set ${setId}: ${summary[setId]} questions`);
  });
}

// Run the parser
main();
