const fs = require('fs');
const path = require('path');

const eqQuestionsPath = path.join(__dirname, 'public', 'data', 'equity-derivatives-questions.json');
const sormQuestionsPath = path.join(__dirname, 'public', 'data', 'questions.json');

// Sample explanations based on web search - these will be added manually for quality
const sampleExplanations = {
    "eq-10-1": "Impact cost represents the cost incurred by buyers and sellers when executing transactions due to lack of market liquidity. High impact cost increases the purchasing price for buyers and decreases the selling price for sellers, making it detrimental to both parties. Therefore, high impact cost is neither beneficial to buyers nor sellers.",
    "eq-10-2": "Initial margin requirements in derivatives are designed to protect against default risk. When markets are highly volatile, there's a higher risk of significant price movements that could lead to larger losses. To safeguard trading members and traders, higher initial margins are levied when volatility is high. Therefore, higher volatility leads to higher initial margin requirements.",
    "eq-10-3": "Vega (ν) is one of the Greeks in options pricing that measures the sensitivity of an option's price to changes in the volatility of the underlying asset. It represents the change in option premium for a unit change in volatility. Delta measures price sensitivity to underlying price changes, Theta measures time decay, and Rho measures sensitivity to interest rate changes.",
    "eq-10-4": "In a derivatives exchange, clearing members have higher networth requirements than non-clearing members because they bear additional responsibilities and risks. Clearing members act as intermediaries in the clearing and settlement process, guaranteeing trades and managing counterparty risk. This requires them to maintain higher capital adequacy.",
    "eq-10-5": "Clearing members in derivatives exchanges have higher networth requirements than non-clearing members because they bear additional responsibilities including guaranteeing trades, managing counterparty risk, and maintaining the settlement guarantee fund. This requires them to maintain higher capital adequacy to ensure financial stability.",
    // Add some SORM explanations with matching IDs
    "1-1": "Cash obligations related to transactions executed on a stock exchange are settled by Clearing Banks. Clearing banks are responsible for the actual settlement of funds between trading participants, ensuring that the cash obligations arising from trades are properly fulfilled.",
    "1-2": "The Base Minimum Capital requirement for all trading members/brokers with Algo as specified by SEBI is Rs 10 Lacs. This capital requirement ensures that trading members have sufficient financial resources to meet their obligations and maintain market integrity."
};

function addSampleExplanations(questionsPath, category) {
    console.log(`Adding sample explanations to ${category} questions...`);
    
    const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
    let addedCount = 0;
    
    // Clear all existing explanations first
    for (const question of questions) {
        delete question.explanation;
    }
    
    // Add explanations by ID
    for (const question of questions) {
        if (sampleExplanations[question.id]) {
            question.explanation = sampleExplanations[question.id];
            addedCount++;
        }
    }
    
    fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2), 'utf8');
    console.log(`Added ${addedCount} sample explanations to ${category} questions`);
    return addedCount;
}

async function main() {
    console.log('Adding sample solution explanations...');
    
    // Add sample explanations to Equity Derivatives questions
    addSampleExplanations(eqQuestionsPath, 'Equity Derivatives');
    
    // Add sample explanations to SORM questions (using the same explanations for now)
    addSampleExplanations(sormQuestionsPath, 'SORM');
    
    console.log('\n=== Sample explanations added! ===');
    console.log('These demonstrate the quality of explanations using web search.');
    console.log('Next steps: Expand the sampleExplanations object with more web-searched explanations.');
}

main().catch(console.error);