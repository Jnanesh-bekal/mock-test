const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const iaDataPath = path.join(__dirname, 'CERTIFICATIONS', 'Investment Advisor 1A');
const outputPublicPath = path.join(__dirname, 'public', 'data', 'investment-advisor-questions.json');
const outputDataPath = path.join(__dirname, 'data', 'investment-advisor-questions.json');

const iaSets = [
    { id: 44, name: 'T1', type: 'TEST', expectedCount: 50, duration: '60m', description: 'Investment Advisor Test 1' },
    { id: 45, name: 'T2', type: 'TEST', expectedCount: 50, duration: '60m', description: 'Investment Advisor Test 2' },
    { id: 46, name: 'T3', type: 'TEST', expectedCount: 50, duration: '60m', description: 'Investment Advisor Test 3' },
    { id: 47, name: 'T4', type: 'TEST', expectedCount: 50, duration: '60m', description: 'Investment Advisor Test 4' },
    { id: 48, name: 'T5', type: 'TEST', expectedCount: 50, duration: '60m', description: 'Investment Advisor Test 5' },
    { id: 49, name: 'T6', type: 'TEST', expectedCount: 50, duration: '60m', description: 'Investment Advisor Test 6' }
];

const allQuestions = [];

for (const setInfo of iaSets) {
    const attemptPath = path.join(iaDataPath, `${setInfo.name}_files`, 'mocktest_attempt.html');
    if (!fs.existsSync(attemptPath)) {
        console.error(`File missing: ${attemptPath}`);
        continue;
    }

    console.log(`Processing Set ${setInfo.id} (${setInfo.name})...`);
    const html = fs.readFileSync(attemptPath, 'utf8');
    const $ = cheerio.load(html);

    const processedQuestionNames = new Set();
    let qCount = 0;

    $('input[name^="QuestOpt"]').each((i, el) => {
        const inputName = $(el).attr('name');
        if (processedQuestionNames.has(inputName)) return;
        processedQuestionNames.add(inputName);

        const qNum = inputName.replace('QuestOpt', '');
        const td = $(el).closest('td');

        // Question text
        let questionText = td.find('strong').first().text().trim();
        questionText = questionText.replace(/^Q\s*\d+\.\s*/i, '').trim();

        // Extract options
        const options = [];
        const optionInputs = td.find(`input[name="${inputName}"]`);

        optionInputs.each((optIdx, optEl) => {
            let optText = '';
            let next = $(optEl)[0].nextSibling;
            while (next) {
                if (next.name === 'br' || next.name === 'input' || next.name === 'p' || next.name === 'div') break;
                if (next.type === 'text') {
                    optText += next.data;
                } else if (next.type === 'tag') {
                    optText += $(next).text();
                }
                next = next.nextSibling;
            }
            optText = optText.trim();
            if (optText) {
                options.push(optText);
            }
        });

        // Fallback for options if direct sibling parsing missed them
        if (options.length === 0) {
            const cellHTML = td.html();
            const optionRegex = /<input[^>]*>\s*([^<]+)\s*(?:<br|$)/g;
            let match;
            while ((match = optionRegex.exec(cellHTML)) !== null) {
                const text = match[1].trim();
                if (text && !text.includes('CORRECT') && !text.includes('WRONG') && !text.includes('Explanation')) {
                    options.push(text);
                }
            }
        }

        // Correct answer (stored as 1, 2, 3... in CorrectAns hidden input)
        const correctAnsVal = td.find(`input[name="CorrectAns${qNum}"]`).val();
        let correctAnswer = correctAnsVal ? parseInt(correctAnsVal, 10) - 1 : 0;
        if (correctAnswer < 0 || correctAnswer >= options.length) {
            correctAnswer = 0;
        }

        // Official Explanation
        const expDiv = td.find(`div#divAE${qNum}`);
        let explanation = '';
        if (expDiv.length > 0) {
            explanation = expDiv.text().replace(/^Explanation:\s*/i, '').trim();
        }

        if (questionText && options.length >= 2) {
            qCount++;
            allQuestions.push({
                id: `ia-${setInfo.id}-${qCount}`,
                questionId: qCount,
                setId: setInfo.id,
                question: questionText,
                options: options,
                correctAnswer: correctAnswer,
                explanation: explanation
            });
        }
    });

    console.log(`  -> Extracted ${qCount} questions for Set ${setInfo.id}`);
}

console.log(`\nTotal Investment Advisor questions extracted: ${allQuestions.length}`);

// Ensure directories exist
fs.mkdirSync(path.dirname(outputPublicPath), { recursive: true });
fs.mkdirSync(path.dirname(outputDataPath), { recursive: true });

// Write to both public/data/ and data/
fs.writeFileSync(outputPublicPath, JSON.stringify(allQuestions, null, 2), 'utf8');
fs.writeFileSync(outputDataPath, JSON.stringify(allQuestions, null, 2), 'utf8');

console.log(`Saved to ${outputPublicPath}`);
console.log(`Saved to ${outputDataPath}`);
