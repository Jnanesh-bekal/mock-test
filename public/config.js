// ExamForge Configuration & Academic Tracks Architecture

window.examConfig = {
    brand: {
        name: 'Gipsy Forge',
        tagline: 'Professional Certification Prep',
        version: 'v4.2.0',
        standards: 'SEBI / NISM Compliant'
    },
    stats: {
        totalTests: 34,
        totalQuestions: 2300,
        totalCategories: 4
    },
    floatingCards: [
        {
            icon: 'circle-check',
            color: '#16a34a',
            badgeBg: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30',
            text: 'Test completed: Full Mock 12',
            detail: 'Score: 78% · 114m'
        },
        {
            icon: 'arrow-trend-up',
            color: '#2563eb',
            badgeBg: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
            text: 'Accuracy up 8% this week',
            detail: '+8.4% across 6 simulation papers'
        },
        {
            icon: 'triangle-exclamation',
            color: '#d97706',
            badgeBg: 'bg-amber-500/20 text-amber-700 border-amber-500/30',
            text: 'Weak topic: Probability',
            detail: 'Targeted revision drill recommended'
        }
    ],
    categories: [
        {
            code: 'SORM',
            series: 'NISM-Series-XII',
            title: 'SORM',
            subtitle: 'Securities Operations & Risk Management',
            description: 'Master risk frameworks, regulatory compliance, and operational safeguards required for securities markets.',
            level: 'XII',
            icon: 'shield-halved',
            iconGradient: 'from-blue-600 to-indigo-700',
            tags: ['Risk', 'Compliance', 'Regulations', 'T+1'],
            testCount: 9,
            questionCount: 600,
            available: true,
            route: 'renderSets',
            sets: [
                { id: 1, name: 'Full Mock 01', type: 'FULL MOCK', questions: 100, duration: '120m', description: 'Trade Life Cycle & Market Participants' },
                { id: 2, name: 'Full Mock 02', type: 'FULL MOCK', questions: 100, duration: '120m', description: 'Clearing Corporations & Settlement Agencies' },
                { id: 3, name: 'Full Mock 03', type: 'FULL MOCK', questions: 100, duration: '120m', description: 'Risk Containment, Margining & Settlement Guarantees' },
                { id: 4, name: 'Full Mock 04', type: 'FULL MOCK', questions: 100, duration: '120m', description: 'Securities Lending, Borrowing & Auction Settlement' },
                { id: 5, name: 'Full Mock 05', type: 'FULL MOCK', questions: 100, duration: '120m', description: 'Depository Operations, Dematerialization & Corporate Actions' },
                { id: 6, name: 'Full Mock 06', type: 'FULL MOCK', questions: 100, duration: '120m', description: 'Regulatory Compliances, SEBI Guidelines & Inspections' },
                { id: 7, name: 'Set 07 - Last Day Revision 1', type: 'REVISION', questions: 50, duration: '60m', description: 'High-Yield Formulae & Regulatory Limits' },
                { id: 8, name: 'Set 08 - Last Day Revision 2', type: 'REVISION', questions: 50, duration: '60m', description: 'Rapid Operational Scenario Drills' },
                { id: 9, name: 'Set 09 - Real Feel Timed', type: 'REAL FEEL', questions: 100, duration: '120m', description: 'Full Simulation with Negative Marking' }
            ]
        },
        {
            code: 'EQ',
            series: 'NISM-Series-VIII',
            title: 'Equity Derivatives',
            subtitle: 'Options, Futures & Structured Products',
            description: 'Deep-dive into pricing models, hedging strategies, and structured product mechanics across equity markets.',
            level: 'VIII',
            icon: 'chart-line',
            iconGradient: 'from-sky-500 to-blue-600',
            tags: ['Options', 'Futures', 'Pricing', 'Greeks'],
            testCount: 9,
            questionCount: 600,
            available: true,
            route: 'renderEquityDerivatives',
            sets: [
                { id: 10, name: 'EQ Set 01', type: 'FULL MOCK', questions: 100, duration: '120m', description: 'Derivatives Basics & Forward Contracts' },
                { id: 11, name: 'EQ Set 02', type: 'FULL MOCK', questions: 100, duration: '120m', description: 'Futures Contracts, Mechanism & Pricing' },
                { id: 12, name: 'EQ Set 03', type: 'FULL MOCK', questions: 100, duration: '120m', description: 'Options Terminology, Payoffs & Strategies' },
                { id: 13, name: 'EQ Set 04', type: 'FULL MOCK', questions: 100, duration: '120m', description: 'Option Greeks (Delta, Gamma, Theta, Vega)' },
                { id: 14, name: 'EQ Set 05', type: 'FULL MOCK', questions: 100, duration: '120m', description: 'SPAN Margining & Trading Systems' },
                { id: 15, name: 'EQ Set 06', type: 'FULL MOCK', questions: 100, duration: '120m', description: 'Clearing, Settlement & Accounting' },
                { id: 16, name: 'EQ Set 07 - Revision 1', type: 'REVISION', questions: 50, duration: '60m', description: 'Formulae & Put-Call Parity Drills' },
                { id: 17, name: 'EQ Set 08 - Revision 2', type: 'REVISION', questions: 50, duration: '60m', description: 'Hedging & Arbitrage Rapid Drills' },
                { id: 18, name: 'EQ Set 09 - Real Feel Timed', type: 'REAL FEEL', questions: 100, duration: '120m', description: 'Comprehensive Timed Simulation' }
            ]
        },
        {
            code: 'RA',
            series: 'NISM-Series-XV',
            title: 'Research Analyst',
            subtitle: 'Fundamental & Technical Analysis',
            description: 'Build expertise in financial modeling, valuation techniques, and report writing for equity research roles.',
            level: 'XV',
            icon: 'magnifying-glass-chart',
            iconGradient: 'from-emerald-500 to-teal-600',
            tags: ['Valuation', 'Modeling', 'Reports', 'DCF'],
            testCount: 9,
            questionCount: 600,
            available: true,
            route: 'renderResearchAnalyst',
            sets: [
                { id: 19, name: 'RA Set 01', type: 'FULL MOCK', questions: 100, duration: '120m', description: 'Macro-Economic Analysis & Indicators' },
                { id: 20, name: 'RA Set 02', type: 'FULL MOCK', questions: 100, duration: '120m', description: 'Industry Life Cycle & Porters Five Forces' },
                { id: 21, name: 'RA Set 03', type: 'FULL MOCK', questions: 100, duration: '120m', description: 'Financial Statement Analysis & Ratios' },
                { id: 22, name: 'RA Set 04', type: 'FULL MOCK', questions: 100, duration: '120m', description: 'Valuation Methodologies (DCF, Relative)' },
                { id: 23, name: 'RA Set 05', type: 'FULL MOCK', questions: 100, duration: '120m', description: 'Technical Analysis & Chart Patterns' },
                { id: 24, name: 'RA Set 06', type: 'FULL MOCK', questions: 100, duration: '120m', description: 'SEBI Research Analyst Regulations & Ethics' },
                { id: 25, name: 'RA Set 07 - Revision 1', type: 'REVISION', questions: 50, duration: '60m', description: 'Accounting & Valuation Formulae' },
                { id: 26, name: 'RA Set 08 - Revision 2', type: 'REVISION', questions: 50, duration: '60m', description: 'Code of Conduct & Compliance Drills' },
                { id: 27, name: 'RA Set 09 - Real Feel Timed', type: 'REAL FEEL', questions: 100, duration: '120m', description: 'Complete Timed Research Paper' }
            ]
        },
        {
            code: 'MB',
            series: 'NISM-Series-IX',
            title: 'Merchant Banking',
            subtitle: 'Issue Management & Underwriting',
            description: 'Master capital market operations, issue management, underwriting, and merchant banking regulations for SEBI certification.',
            level: 'IX',
            icon: 'building-columns',
            iconGradient: 'from-amber-500 to-orange-600',
            tags: ['Issue Management', 'Underwriting', 'IPO', 'Rights Issue'],
            testCount: 7,
            questionCount: 500,
            available: true,
            route: 'renderMerchantBanking',
            sets: [
                { id: 28, name: 'MB Quiz 01', type: 'QUIZ', questions: 50, duration: '60m', description: 'Merchant Banking Basics & SEBI Regulations' },
                { id: 29, name: 'MB Quiz 02', type: 'QUIZ', questions: 50, duration: '60m', description: 'Issue Management & Types of Issues' },
                { id: 30, name: 'MB Quiz 03', type: 'QUIZ', questions: 50, duration: '60m', description: 'Underwriting & Agreements' },
                { id: 31, name: 'MB Quiz 04', type: 'QUIZ', questions: 50, duration: '60m', description: 'IPO Process & Documentation' },
                { id: 32, name: 'MB Quiz 05', type: 'FULL MOCK', questions: 100, duration: '120m', description: 'Rights Issue & FPO Procedures' },
                { id: 33, name: 'MB Quiz 06', type: 'FULL MOCK', questions: 100, duration: '120m', description: 'Merchant Banking Compliance & Code of Conduct' },
                { id: 34, name: 'MB Quiz 07', type: 'FULL MOCK', questions: 100, duration: '120m', description: 'Comprehensive Merchant Banking Simulation' }
            ]
        }
    ]
};
