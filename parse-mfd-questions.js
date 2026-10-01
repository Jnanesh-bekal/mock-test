const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const mfdDataPath = path.join(__dirname, 'CERTIFICATIONS', 'Mutual Fund Series V', 'MFD V A');
const outputPublicPath = path.join(__dirname, 'public', 'data', 'mutual-funds-questions.json');
const outputDataPath = path.join(__dirname, 'data', 'mutual-funds-questions.json');

const mfdSets = [
    { id: 35, name: 'QUIZ 1', type: 'QUIZ', expectedCount: 50, duration: '60m', description: 'Concept and Role of a Mutual Fund' },
    { id: 36, name: 'QUIZ 2', type: 'QUIZ', expectedCount: 50, duration: '60m', description: 'Fund Structure, Constituents & Legal Framework' },
    { id: 37, name: 'QUIZ 3', type: 'QUIZ', expectedCount: 50, duration: '60m', description: 'Offer Documents & Regulatory Guidelines' },
    { id: 38, name: 'QUIZ 4', type: 'QUIZ', expectedCount: 50, duration: '60m', description: 'Fund Distribution, Practices & Channel Dynamics' },
    { id: 39, name: 'QUIZ 5', type: 'QUIZ', expectedCount: 50, duration: '60m', description: 'Net Asset Value, Total Expense Ratio & Accounting' },
    { id: 40, name: 'LAST DAY REVISION 1', type: 'REVISION', expectedCount: 100, duration: '120m', description: 'Taxation, Return Measurement & Performance Evaluation' },
    { id: 41, name: 'LAST DAY REVISION 2', type: 'REVISION', expectedCount: 100, duration: '120m', description: 'Scheme Selection, Investor Services & Financial Planning' },
    { id: 42, name: 'LAST DAY REVISION 3', type: 'REVISION', expectedCount: 100, duration: '120m', description: 'Rapid High-Yield Operational & Compliance Drills' },
    { id: 43, name: 'FULL MOCK TEST', type: 'REAL FEEL', expectedCount: 100, duration: '120m', description: 'Full Simulation Paper - NISM Series V-A Certification' }
];

const allQuestions = [];

for (const setInfo of mfdSets) {
    const attemptPath = path.join(mfdDataPath, `${setInfo.name}_files`, 'mocktest_attempt.html');
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
                id: `mfd-${setInfo.id}-${qCount}`,
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

console.log(`\nTotal Mutual Fund questions extracted: ${allQuestions.length}`);

// Ensure directories exist
fs.mkdirSync(path.dirname(outputPublicPath), { recursive: true });
fs.mkdirSync(path.dirname(outputDataPath), { recursive: true });

// Write to both public/data/ and data/
fs.writeFileSync(outputPublicPath, JSON.stringify(allQuestions, null, 2), 'utf8');
fs.writeFileSync(outputDataPath, JSON.stringify(allQuestions, null, 2), 'utf8');

console.log(`Saved to ${outputPublicPath}`);
console.log(`Saved to ${outputDataPath}`);
