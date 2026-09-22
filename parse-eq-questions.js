const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const eqDataPath = 'C:\\Users\\jnane\\Downloads\\Securities Operations & Risk Management\\Set 1\\a\\EQ';
const outputPath = path.join(__dirname, 'public', 'data', 'equity-derivatives-questions.json');

const allQuestions = [];
let setId = 10; // Starting from set ID 10 for Equity Derivatives

// Process each HTML file
for (let i = 1; i <= 9; i++) {
    const fileName = i === 0 ? 'Welcome to Pass4Sure' : `Welcome to Pass4Sure${i}`;
    const filePath = path.join(eqDataPath, `${fileName}_files`, 'mocktest_attempt.html');
    
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        continue;
    }
    
    console.log(`Processing: ${filePath}`);
    
    try {
        const html = fs.readFileSync(filePath, 'utf8');
        const $ = cheerio.load(html);
        
        let questionNumber = 1;
        
        // Find all question rows
        $('input[name^="QuestOpt"]').each((index, element) => {
            const name = $(element).attr('name');
            const questionId = parseInt(name.replace('QuestOpt', ''));
            
            // Find the question text (it's in the same td as the inputs)
            const questionCell = $(element).closest('td');
            const questionText = questionCell.find('strong').first().text().trim();
            
            // Extract just the question text (remove "Q X. " prefix)
            const cleanQuestionText = questionText.replace(/^Q \d+\.\s*/, '');
            
            // Find all options for this question
            const options = [];
            const optionInputs = questionCell.find(`input[name="QuestOpt${questionId}"]`);
            
            optionInputs.each((optIndex, optElement) => {
                const optionText = $(optElement).parent().text().trim();
                options.push(optionText);
            });
            
            // Find correct answer
            const correctAnsName = `CorrectAns${questionId}`;
            const correctAnswerElement = questionCell.find(`input[name="${correctAnsName}"]`);
            const correctAnswer = correctAnswerElement.length > 0 
                ? parseInt(correctAnswerElement.val()) - 1 // Convert to 0-indexed
                : 0;
            
            if (cleanQuestionText && options.length > 0) {
                allQuestions.push({
                    id: `eq-${setId}-${questionNumber}`,
                    questionId: questionNumber,
                    setId: setId,
                    question: cleanQuestionText,
                    options: options,
                    correctAnswer: correctAnswer
                });
                
                questionNumber++;
            }
        });
        
        console.log(`Extracted ${questionNumber - 1} questions from set ${setId}`);
        setId++;
        
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

console.log(`Total questions extracted: ${allQuestions.length}`);

// Write to file
fs.writeFileSync(outputPath, JSON.stringify(allQuestions, null, 2), 'utf8');
console.log(`Questions saved to: ${outputPath}`);

// Update config with actual counts
console.log(`\nSet IDs used: 10-${setId - 1}`);
console.log(`Questions per set will vary based on actual content`);