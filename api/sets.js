// Vercel serverless function for getting test sets
module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const sets = [
    // SORM Sets (1 - 9)
    { id: 1, name: 'Full Mock 01', type: 'FULL MOCK', category: 'SORM', questions: 50, duration: '120m', description: 'Trade Life Cycle & Market Participants' },
    { id: 2, name: 'Full Mock 02', type: 'FULL MOCK', category: 'SORM', questions: 50, duration: '120m', description: 'Clearing Corporations & Settlement Agencies' },
    { id: 3, name: 'Full Mock 03', type: 'FULL MOCK', category: 'SORM', questions: 50, duration: '120m', description: 'Risk Containment, Margining & Settlement Guarantees' },
    { id: 4, name: 'Full Mock 04', type: 'FULL MOCK', category: 'SORM', questions: 50, duration: '120m', description: 'Securities Lending, Borrowing & Auction Settlement' },
    { id: 5, name: 'Full Mock 05', type: 'FULL MOCK', category: 'SORM', questions: 50, duration: '120m', description: 'Depository Operations, Dematerialization & Corporate Actions' },
    { id: 6, name: 'Full Mock 06', type: 'FULL MOCK', category: 'SORM', questions: 50, duration: '120m', description: 'Regulatory Compliances, SEBI Guidelines & Inspections' },
    { id: 7, name: 'Set 07 - Last Day Revision 1', type: 'REVISION', category: 'SORM', questions: 100, duration: '60m', description: 'High-Yield Formulae & Regulatory Limits' },
    { id: 8, name: 'Set 08 - Last Day Revision 2', type: 'REVISION', category: 'SORM', questions: 100, duration: '60m', description: 'Rapid Operational Scenario Drills' },
    { id: 9, name: 'Set 09 - Real Feel Timed', type: 'REAL FEEL', category: 'SORM', questions: 100, duration: '120m', description: 'Full Simulation with Negative Marking' },

    // Equity Derivatives Sets (10 - 18)
    { id: 10, name: 'EQ Set 01', type: 'FULL MOCK', category: 'EQ', questions: 50, duration: '120m', description: 'Derivatives Basics & Forward Contracts' },
    { id: 11, name: 'EQ Set 02', type: 'FULL MOCK', category: 'EQ', questions: 50, duration: '120m', description: 'Futures Contracts, Mechanism & Pricing' },
    { id: 12, name: 'EQ Set 03', type: 'FULL MOCK', category: 'EQ', questions: 50, duration: '120m', description: 'Options Terminology, Payoffs & Strategies' },
    { id: 13, name: 'EQ Set 04', type: 'FULL MOCK', category: 'EQ', questions: 50, duration: '120m', description: 'Option Greeks (Delta, Gamma, Theta, Vega)' },
    { id: 14, name: 'EQ Set 05', type: 'FULL MOCK', category: 'EQ', questions: 50, duration: '120m', description: 'SPAN Margining & Trading Systems' },
    { id: 15, name: 'EQ Set 06', type: 'FULL MOCK', category: 'EQ', questions: 50, duration: '120m', description: 'Clearing, Settlement & Accounting' },
    { id: 16, name: 'EQ Set 07 - Revision 1', type: 'REVISION', category: 'EQ', questions: 100, duration: '60m', description: 'Formulae & Put-Call Parity Drills' },
    { id: 17, name: 'EQ Set 08 - Revision 2', type: 'REVISION', category: 'EQ', questions: 100, duration: '60m', description: 'Hedging & Arbitrage Rapid Drills' },
    { id: 18, name: 'EQ Set 09 - Real Feel Timed', type: 'REAL FEEL', category: 'EQ', questions: 100, duration: '120m', description: 'Comprehensive Timed Simulation' },

    // Research Analyst Sets (19 - 27)
    { id: 19, name: 'RA Set 01', type: 'FULL MOCK', category: 'RA', questions: 50, duration: '120m', description: 'Macro-Economic Analysis & Indicators' },
    { id: 20, name: 'RA Set 02', type: 'FULL MOCK', category: 'RA', questions: 50, duration: '120m', description: 'Industry Life Cycle & Porters Five Forces' },
    { id: 21, name: 'RA Set 03', type: 'FULL MOCK', category: 'RA', questions: 50, duration: '120m', description: 'Financial Statement Analysis & Ratios' },
    { id: 22, name: 'RA Set 04', type: 'FULL MOCK', category: 'RA', questions: 50, duration: '120m', description: 'Valuation Methodologies (DCF, Relative)' },
    { id: 23, name: 'RA Set 05', type: 'FULL MOCK', category: 'RA', questions: 50, duration: '120m', description: 'Technical Analysis & Chart Patterns' },
    { id: 24, name: 'RA Set 06', type: 'FULL MOCK', category: 'RA', questions: 50, duration: '120m', description: 'SEBI Research Analyst Regulations & Ethics' },
    { id: 25, name: 'RA Set 07 - Revision 1', type: 'REVISION', category: 'RA', questions: 100, duration: '60m', description: 'Accounting & Valuation Formulae' },
    { id: 26, name: 'RA Set 08 - Revision 2', type: 'REVISION', category: 'RA', questions: 100, duration: '60m', description: 'Code of Conduct & Compliance Drills' },
    { id: 27, name: 'RA Set 09 - Real Feel Timed', type: 'REAL FEEL', category: 'RA', questions: 100, duration: '120m', description: 'Complete Timed Research Paper' },

    // Merchant Banking Sets (28 - 34)
    { id: 28, name: 'MB Quiz 01', type: 'QUIZ', category: 'MB', questions: 50, duration: '60m', description: 'Merchant Banking Basics & SEBI Regulations' },
    { id: 29, name: 'MB Quiz 02', type: 'QUIZ', category: 'MB', questions: 50, duration: '60m', description: 'Issue Management & Types of Issues' },
    { id: 30, name: 'MB Quiz 03', type: 'QUIZ', category: 'MB', questions: 50, duration: '60m', description: 'Underwriting & Agreements' },
    { id: 31, name: 'MB Quiz 04', type: 'QUIZ', category: 'MB', questions: 50, duration: '60m', description: 'IPO Process & Documentation' },
    { id: 32, name: 'MB Quiz 05', type: 'FULL MOCK', category: 'MB', questions: 100, duration: '120m', description: 'Rights Issue & FPO Procedures' },
    { id: 33, name: 'MB Quiz 06', type: 'FULL MOCK', category: 'MB', questions: 100, duration: '120m', description: 'Merchant Banking Compliance & Code of Conduct' },
    { id: 34, name: 'MB Quiz 07', type: 'FULL MOCK', category: 'MB', questions: 100, duration: '120m', description: 'Comprehensive Merchant Banking Simulation' }
  ];
  
  res.status(200).json(sets);
};
