// ExamForge Home Page Configuration

window.examConfig = {
    stats: {
        totalTests: 18,
        totalQuestions: 1200,
        totalCategories: 3
    },
    categories: [
        {
            code: 'SORM',
            title: 'SORM',
            subtitle: 'Securities Operations & Risk Management',
            description: 'Master risk frameworks, regulatory compliance, and operational safeguards required for securities markets.',
            level: 'ADVANCED',
            icon: 'shield',
            tags: ['Risk', 'Compliance', 'Regulations'],
            testCount: 9,
            questionCount: 600,
            available: true,
            route: 'renderSets'
        },
        {
            code: 'EQ',
            title: 'Equity Derivatives',
            subtitle: 'Options, Futures & Structured Products',
            description: 'Deep-dive into pricing models, hedging strategies, and structured product mechanics across equity markets.',
            level: 'EXPERT',
            icon: 'chart',
            tags: ['Options', 'Futures', 'Pricing'],
            testCount: 9,
            questionCount: 600,
            available: true,
            route: 'renderEquityDerivatives'
        },
        {
            code: 'RA',
            title: 'Research Analyst',
            subtitle: 'Fundamental & Technical Analysis',
            description: 'Build expertise in financial modeling, valuation techniques, and report writing for equity research roles.',
            level: 'INTERMEDIATE',
            icon: 'search',
            tags: ['Valuation', 'Modeling', 'Reports'],
            testCount: 0,
            questionCount: 0,
            available: false,
            route: null
        }
    ],
    floatingCards: [
        {
            icon: 'check',
            color: '#22C55E',
            text: 'Test completed: Full Mock 12'
        },
        {
            icon: 'up',
            color: '#22C55E',
            text: 'Accuracy up 8% this week'
        },
        {
            icon: 'warning',
            color: '#F59E0B',
            text: 'Weak topic: Probability'
        }
    ]
};
