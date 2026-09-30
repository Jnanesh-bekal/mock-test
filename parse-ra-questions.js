const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const raDataPath = 'C:\\Users\\jnane\\Downloads\\Securities Operations & Risk Management\\Set 1\\a\\RA';
const outputPath = path.join(__dirname, 'public', 'data', 'research-analyst-questions.json');

const allQuestions = [];
let setId = 19; // Starting from set ID 19 for Research Analyst

// Define the RA test files
const raFiles = [
    { id: 19, name: 'practice set 1', description: 'Practice Questions Set No. 1' },
    { id: 20, name: 'practice set 2', description: 'Practice Questions Set No. 2' },
    { id: 21, name: 'practice set 3', description: 'Practice Questions Set No. 3' },
    { id: 22, name: 'practice set 4', description: 'Practice Questions Set No. 4' },
    { id: 23, name: 'practice set 5', description: 'Practice Questions Set No. 5' },
    { id: 24, name: 'practice set 6', description: 'Practice Questions Set No. 6' },
    { id: 25, name: 'Revision test 1', description: 'Revision Test 1' },
    { id: 26, name: 'Revision test 2', description: 'Revision Test 2' },
    { id: 27, name: 'Real feel test', description: 'Real Feel Timed Test' }
];

// Process each HTML file
for (const file of raFiles) {
    const fileName = file.name;
    const filePath = path.join(raDataPath, `${fileName}_files`, 'mocktest_attempt.html');
    
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
            
            // Skip if we've already processed this question
            if (allQuestions.some(q => q.setId === setId && q.questionId === questionId)) {
                return;
            }
            
            // Find the question text (it's in the same td as the inputs)
            const questionCell = $(element).closest('td');
            const questionText = questionCell.find('strong').first().text().trim();
            
            // Extract just the question text (remove "Q X. " prefix)
            const cleanQuestionText = questionText.replace(/^Q \d+\.\s*/, '');
            
            // Find all options for this question by extracting text after each radio button
            const options = [];
            const optionInputs = questionCell.find(`input[name="QuestOpt${questionId}"]`);
            
            optionInputs.each((optIndex, optElement) => {
                // Get the text that comes after this radio button
                const optValue = $(optElement).val();
                let optionText = '';
                
                // The option text is the text content after the input until the next <br> or input
                let nextElement = $(optElement).next();
                while (nextElement.length > 0) {
                    if (nextElement.is('br') || nextElement.is('input')) {
                        break;
                    }
                    optionText += nextElement.text();
                    nextElement = nextElement.next();
                }
                
                // Fallback: try to get from parent text and clean it
                if (!optionText.trim()) {
                    const parentText = $(optElement).parent().text();
                    // Extract text after this specific input
                    const inputHTML = $(optElement).toString();
                    const fullText = parentText;
                    const inputIndex = fullText.indexOf(inputHTML);
                    if (inputIndex !== -1) {
                        const afterInput = fullText.substring(inputIndex + inputHTML.length);
                        // Get text until next input or explanation
                        const cleanedOption = afterInput.split(/CORRECT ANSWER|WRONG ANSWER|Explanation/)[0].trim();
                        optionText = cleanedOption;
                    }
                }
                
                if (optionText.trim()) {
                    options.push(optionText.trim());
                }
            });
            
            // If still no options, try a different approach
            if (options.length === 0) {
                const cellHTML = questionCell.html();
                // Extract options by finding patterns like: <input...>text<br>
                const optionRegex = /<input[^>]*>\s*([^<]+)\s*(?:<br|$)/g;
                let match;
                while ((match = optionRegex.exec(cellHTML)) !== null) {
                    if (match[1] && match[1].trim() && !match[1].includes('CORRECT') && !match[1].includes('WRONG')) {
                        options.push(match[1].trim());
                    }
                }
            }
            
            // Find correct answer
            const correctAnsName = `CorrectAns${questionId}`;
            const correctAnswerElement = questionCell.find(`input[name="${correctAnsName}"]`);
            const correctAnswer = correctAnswerElement.length > 0 
                ? parseInt(correctAnswerElement.val()) - 1 // Convert to 0-indexed
                : 0;
            
            if (cleanQuestionText && options.length > 0) {
                allQuestions.push({
                    id: `ra-${setId}-${questionNumber}`,
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
console.log(`\nSet IDs used: 19-${setId - 1}`);
console.log(`Questions per set will vary based on actual content`);
