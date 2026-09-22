// SORM Mock Test System - Frontend Application

// Detect if running on Vercel or localhost
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000/api' 
    : '/api';

// State Management
let currentState = {
    view: 'home', // home, test, results, search
    selectedSet: null,
    currentCategory: 'SORM', // SORM, EQ, RA
    questions: [],
    currentQuestion: 0,
    answers: [],
    timeRemaining: 0,
    timerInterval: null,
    testResults: null,
    searchResults: [],
    showInstantSolution: false,
    practiceMode: false
};

// DOM Elements
const app = document.getElementById('app');

// Utility Functions
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// API Functions
async function fetchSets() {
    try {
        const response = await fetch(`${API_BASE}/sets`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching sets:', error);
        // Fallback to hardcoded sets
        return [
            { id: 1, name: 'Set 1', description: 'Practice Questions Set No. 1' },
            { id: 2, name: 'Set 2', description: 'Practice Questions Set No. 2' },
            { id: 3, name: 'Set 3', description: 'Practice Questions Set No. 3' },
            { id: 4, name: 'Set 4', description: 'Practice Questions Set No. 4' },
            { id: 5, name: 'Set 5', description: 'Practice Questions Set No. 5' },
            { id: 6, name: 'Set 6', description: 'Practice Questions Set No. 6' },
            { id: 7, name: 'Set 7 - Last Day Revision 1', description: 'Last Day Revision Set 1' },
            { id: 8, name: 'Set 8 - Last Day Revision 2', description: 'Last Day Revision Set 2' },
            { id: 9, name: 'Set 9 - Real Feel Timed', description: 'Real Feel Timed Test' }
        ];
    }
}

async function fetchQuestions(setId) {
    try {
        const response = await fetch(`${API_BASE}/questions?setId=${setId}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching questions:', error);
        // Fallback to loading from static file
        try {
            const response = await fetch('/data/questions.json');
            const allQuestions = await response.json();
            return allQuestions.filter(q => q.setId === setId);
        } catch (fallbackError) {
            console.error('Error loading fallback questions:', fallbackError);
            return [];
        }
    }
}

async function submitTest(answers, setId) {
    try {
        const response = await fetch(`${API_BASE}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers, setId })
        });
        const data = await response.json();
        
        // Map the results to include option text
        if (data.results) {
            data.results = data.results.map(result => {
                const question = currentState.questions.find(q => q.id === result.questionId);
                if (question) {
                    return {
                        ...result,
                        question: question.question,
                        selectedAnswerText: question.options[result.selectedAnswer] || 'Not answered',
                        correctAnswerText: question.options[result.correctAnswer] || 'N/A'
                    };
                }
                return result;
            });
        }
        
        return data;
    } catch (error) {
        console.error('Error submitting test:', error);
        // Fallback to client-side scoring
        let correct = 0;
        let wrong = 0;
        const results = [];

        answers.forEach(answer => {
            const question = currentState.questions.find(q => q.id === answer.questionId);
            if (question) {
                const isCorrect = question.correctAnswer === answer.selectedAnswer;
                if (isCorrect) correct++;
                else wrong++;
                
                results.push({
                    questionId: answer.questionId,
                    selectedAnswer: answer.selectedAnswer,
                    correctAnswer: question.correctAnswer,
                    isCorrect,
                    question: question.question,
                    selectedAnswerText: question.options[answer.selectedAnswer] || 'Not answered',
                    correctAnswerText: question.options[question.correctAnswer] || 'N/A'
                });
            }
        });

        const total = answers.length;
        const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

        return {
            total,
            correct,
            wrong,
            percentage,
            results
        };
    }
}

async function searchQuestions(query, setId = null) {
    try {
        let url = `${API_BASE}/questions?search=${encodeURIComponent(query)}`;
        if (setId) url += `&setId=${setId}`;
        
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('Error searching questions:', error);
        // Fallback to client-side search
        try {
            const response = await fetch('/data/questions.json');
            const allQuestions = await response.json();
            const searchTerm = query.toLowerCase();
            let filteredQuestions = allQuestions;

            if (setId) {
                filteredQuestions = allQuestions.filter(q => q.setId === parseInt(setId));
            }

            return filteredQuestions.filter(q => 
                q.question.toLowerCase().includes(searchTerm) ||
                q.options.some(opt => opt.toLowerCase().includes(searchTerm))
            );
        } catch (fallbackError) {
            console.error('Error loading fallback questions for search:', fallbackError);
            return [];
        }
    }
}

async function getQuestionWithAnswer(questionId) {
    try {
        const response = await fetch(`${API_BASE}/questions?id=${questionId}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching question:', error);
        // Fallback to loading from static file
        try {
            const response = await fetch('/data/questions.json');
            const allQuestions = await response.json();
            return allQuestions.find(q => q.id === questionId) || null;
        } catch (fallbackError) {
            console.error('Error loading fallback question:', fallbackError);
            return null;
        }
    }
}

// Render Functions
function renderHome() {
    const config = window.examConfig;
    
    const homeHtml = `
        <div class="min-h-screen hero-bg relative">
            <!-- Dark blue tint overlay at top -->
            <div class="absolute inset-0 bg-gradient-to-b from-blue-900/40 to-transparent pointer-events-none"></div>
            
            <!-- Navbar -->
            <nav class="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
                <div class="nav-pill rounded-full px-6 py-3 flex items-center gap-6 shadow-lg">
                    <div class="wordmark text-lg font-medium text-gray-800">ExamForge</div>
                    <div class="w-px h-4 bg-gray-300"></div>
                    <a onclick="handleNavClick('analytics')" class="text-gray-600 hover:text-gray-800 cursor-pointer text-sm">Analytics</a>
                    <a onclick="handleNavClick('bookmarks')" class="text-gray-600 hover:text-gray-800 cursor-pointer text-sm">Bookmarks</a>
                    <a onclick="renderSearch()" class="text-gray-600 hover:text-gray-800 cursor-pointer text-sm">Search</a>
                    <div class="w-px h-4 bg-gray-300"></div>
                    <a onclick="handleNavClick('dashboard')" class="bg-gray-800 text-white px-4 py-1.5 rounded-full text-sm cursor-pointer hover:bg-gray-700">Dashboard</a>
                </div>
            </nav>

            <!-- Main Content -->
            <div class="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <!-- Hero Section -->
                <div class="mb-12">
                    <div class="mono-label text-white/80 mb-4">PROFESSIONAL CERTIFICATION PREP</div>
                    <h1 class="wordmark text-5xl md:text-6xl font-medium text-white mb-6 leading-tight">
                        Master your <span class="text-blue-200">next certification.</span>
                    </h1>
                    <p class="text-white/90 text-lg max-w-2xl leading-relaxed">
                        Structured practice tests, adaptive learning, and deep analytics — built for financial professionals preparing for SEBI and NSE examinations.
                    </p>
                </div>

                <!-- Stat Cards -->
                <div class="flex flex-wrap gap-6 mb-12">
                    <div class="glass-card rounded-xl px-6 py-4 flex items-center gap-4 shadow-lg">
                        ${getIcon('clipboard')}
                        <div>
                            <div class="text-2xl font-semibold text-gray-800">${config.stats.totalTests}</div>
                            <div class="text-xs text-gray-600">Total Tests</div>
                        </div>
                    </div>
                    <div class="glass-card rounded-xl px-6 py-4 flex items-center gap-4 shadow-lg">
                        ${getIcon('question')}
                        <div>
                            <div class="text-2xl font-semibold text-gray-800">${config.stats.totalQuestions.toLocaleString()}</div>
                            <div class="text-xs text-gray-600">Questions</div>
                        </div>
                    </div>
                    <div class="glass-card rounded-xl px-6 py-4 flex items-center gap-4 shadow-lg">
                        ${getIcon('graduation')}
                        <div>
                            <div class="text-2xl font-semibold text-gray-800">${config.stats.totalCategories}</div>
                            <div class="text-xs text-gray-600">Exam Categories</div>
                        </div>
                    </div>
                </div>

                <!-- Floating Cards -->
                <div class="relative mb-16 h-48">
                    ${config.floatingCards.map((card, index) => `
                        <div class="floating-card absolute rounded-lg px-4 py-3 flex items-center gap-2 cursor-default"
                             style="right: ${20 + index * 20}px; bottom: ${index * 40}px; transform: rotate(${index * 2 - 2}deg);">
                            ${getFloatingIcon(card.icon, card.color)}
                            <span class="text-sm text-gray-700">${card.text}</span>
                        </div>
                    `).join('')}
                </div>

                <!-- Section Label -->
                <div class="flex items-center gap-4 mb-8">
                    <div class="mono-label text-white/80">EXAM CATEGORIES</div>
                    <div class="flex-1 h-px bg-white/30"></div>
                    <div class="text-xs text-white/70">${config.stats.totalCategories} tracks</div>
                </div>

                <!-- Category Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    ${config.categories.map(category => `
                        <div class="glass-card rounded-xl p-6 shadow-lg card-hover transition-all duration-300 cursor-pointer"
                             onclick="${category.available ? category.route + '()' : 'showComingSoon()'}"
                             ${!category.available ? 'title="Coming soon"' : ''}>
                            <div class="flex items-start justify-between mb-4">
                                <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                    ${getCategoryIcon(category.icon)}
                                </div>
                                <div class="mono-label text-blue-500">${category.level}</div>
                            </div>
                            <h3 class="text-xl font-semibold text-gray-800 mb-1">${category.title}</h3>
                            <p class="text-sm text-gray-600 mb-3">${category.subtitle}</p>
                            <p class="text-sm text-gray-600 mb-4 leading-relaxed">${category.description}</p>
                            <div class="flex flex-wrap gap-2 mb-4">
                                ${category.tags.map(tag => `
                                    <span class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">${tag}</span>
                                `).join('')}
                            </div>
                            <div class="flex items-center justify-between pt-3 border-t border-gray-200">
                                <div class="text-sm text-gray-600">
                                    <span class="font-semibold text-gray-800">${category.testCount}</span> tests · 
                                    <span class="font-semibold text-gray-800">${category.questionCount}</span> questions
                                </div>
                                ${category.available ? `
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-blue-500">
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                        <polyline points="12 5 19 12 12 19"></polyline>
                                    </svg>
                                ` : `
                                    <span class="text-xs text-gray-400">Coming soon</span>
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Footer -->
                <div class="border-t border-white/30 pt-8">
                    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div class="text-sm text-white/70">© 2026 ExamForge. All rights reserved.</div>
                        <div class="flex items-center gap-6">
                            <a href="#" class="text-sm text-white/70 hover:text-white">Privacy</a>
                            <a href="#" class="text-sm text-white/70 hover:text-white">Terms</a>
                            <a href="mailto:support@examforge.com" class="text-sm text-white/70 hover:text-white">Support</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    app.innerHTML = homeHtml;
}

// Render Equity Derivatives Sets Page
function renderEquityDerivatives() {
    const setsHtml = `
        <div class="min-h-screen gradient-bg">
            <nav class="bg-white/10 backdrop-blur-md border-b border-white/20">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center space-x-4">
                            <button onclick="renderHome()" class="text-white/80 hover:text-white transition" title="Go to Home">
                                <i class="fas fa-home text-xl"></i>
                            </button>
                            <button onclick="renderHome()" class="text-white/80 hover:text-white transition" title="Back to Home">
                                <i class="fas fa-arrow-left text-xl"></i>
                            </button>
                            <div class="w-px h-6 bg-white/30"></div>
                            <i class="fas fa-chart-line text-white text-2xl mr-3"></i>
                            <h1 class="text-white text-xl font-bold">Equity Derivatives Mock Test System</h1>
                        </div>
                        <div class="flex items-center space-x-4">
                            <button onclick="renderSearch()" class="text-white/80 hover:text-white transition">
                                <i class="fas fa-search mr-2"></i>Search Questions
                            </button>
                            <div class="text-white/80 text-sm">
                                Options, Futures & Structured Products
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div class="text-center mb-12">
                    <h2 class="text-4xl font-bold text-white mb-4">Select a Test Set</h2>
                    <p class="text-white/80 text-lg">Choose from 9 different practice test sets for Equity Derivatives</p>
                </div>

                <div id="eq-sets-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="text-white text-center">Loading test sets...</div>
                </div>
            </div>
        </div>
    `;
    
    app.innerHTML = setsHtml;
    loadEquityDerivativesSets();
}

async function loadEquityDerivativesSets() {
    const sets = [
        { id: 10, name: 'EQ Set 1', description: 'Options Pricing Models Set No. 1' },
        { id: 11, name: 'EQ Set 2', description: 'Options Pricing Models Set No. 2' },
        { id: 12, name: 'EQ Set 3', description: 'Options Pricing Models Set No. 3' },
        { id: 13, name: 'EQ Set 4', description: 'Futures & Hedging Strategies Set No. 1' },
        { id: 14, name: 'EQ Set 5', description: 'Futures & Hedging Strategies Set No. 2' },
        { id: 15, name: 'EQ Set 6', description: 'Futures & Hedging Strategies Set No. 3' },
        { id: 16, name: 'EQ Set 7 - Structured Products 1', description: 'Structured Products Set 1' },
        { id: 17, name: 'EQ Set 8 - Structured Products 2', description: 'Structured Products Set 2' },
        { id: 18, name: 'EQ Set 9 - Real Feel Timed', description: 'Real Feel Timed Test' }
    ];
    
    const container = document.getElementById('eq-sets-container');
    
    if (sets.length === 0) {
        container.innerHTML = '<div class="text-white text-center col-span-3">No test sets available</div>';
        return;
    }

    container.innerHTML = sets.map(set => `
        <div class="bg-white rounded-xl shadow-lg p-6 card-hover transition-all duration-300 cursor-pointer"
             onclick="selectEquityDerivativesSet(${set.id})">
            <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                    <i class="fas fa-chart-line text-white text-xl"></i>
                </div>
                <div class="ml-4">
                    <h3 class="text-lg font-semibold text-gray-800">${set.name}</h3>
                    <p class="text-sm text-gray-500">${set.description}</p>
                </div>
            </div>
            <div class="flex items-center justify-between mt-4">
                <span class="text-sm text-gray-600">
                    <i class="fas fa-clock mr-1"></i> Timed Test
                </span>
                <button class="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
                    Start Test
                </button>
            </div>
        </div>
    `).join('');
}

function selectEquityDerivativesSet(setId) {
    // For now, use a sample of questions from the existing questions.json
    // In a real implementation, you would have separate questions for Equity Derivatives
    currentState.selectedSet = setId;
    currentState.currentCategory = 'EQ';
    loadSampleEquityDerivativesQuestions(setId);
}

async function loadSampleEquityDerivativesQuestions(setId) {
    // Sample Equity Derivatives questions
    const sampleQuestions = [
        {
            id: `eq-${setId}-1`,
            questionId: 1,
            setId: setId,
            question: "What is the primary purpose of an options contract?",
            options: [
                "To provide the right to buy or sell an underlying asset at a predetermined price",
                "To guarantee the delivery of an asset",
                "To provide leverage without risk",
                "To eliminate all market risk"
            ],
            correctAnswer: 0
        },
        {
            id: `eq-${setId}-2`,
            questionId: 2,
            setId: setId,
            question: "Which of the following is NOT a type of option?",
            options: [
                "Call option",
                "Put option",
                "Forward option",
                "Binary option"
            ],
            correctAnswer: 2
        },
        {
            id: `eq-${setId}-3`,
            questionId: 3,
            setId: setId,
            question: "The maximum loss for a buyer of a call option is limited to:",
            options: [
                "The premium paid",
                "The strike price",
                "The underlying asset price",
                "Unlimited"
            ],
            correctAnswer: 0
        },
        {
            id: `eq-${setId}-4`,
            questionId: 4,
            setId: setId,
            question: "What is the 'Greeks' term that measures an option's sensitivity to changes in the underlying asset's price?",
            options: [
                "Theta",
                "Vega",
                "Delta",
                "Rho"
            ],
            correctAnswer: 2
        },
        {
            id: `eq-${setId}-5`,
            questionId: 5,
            setId: setId,
            question: "A futures contract differs from a forward contract primarily because:",
            options: [
                "Futures are traded on exchanges while forwards are OTC",
                "Forwards are standardized while futures are customized",
                "Futures have no margin requirements",
                "Forwards are more liquid than futures"
            ],
            correctAnswer: 0
        }
    ];

    currentState.questions = shuffleArray(sampleQuestions);
    currentState.currentQuestion = 0;
    currentState.answers = [];
    currentState.timeRemaining = 10800; // 3 hours in seconds
    currentState.view = 'test';
    currentState.practiceMode = false;
    currentState.showInstantSolution = false;

    startTimer();
    renderTest();
}

// Render Sets Page (original SORM test selection)
function renderSets() {
    const setsHtml = `
        <div class="min-h-screen gradient-bg">
            <nav class="bg-white/10 backdrop-blur-md border-b border-white/20">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center space-x-4">
                            <button onclick="renderHome()" class="text-white/80 hover:text-white transition" title="Go to Home">
                                <i class="fas fa-home text-xl"></i>
                            </button>
                            <button onclick="renderHome()" class="text-white/80 hover:text-white transition" title="Back to Home">
                                <i class="fas fa-arrow-left text-xl"></i>
                            </button>
                            <div class="w-px h-6 bg-white/30"></div>
                            <i class="fas fa-graduation-cap text-white text-2xl mr-3"></i>
                            <h1 class="text-white text-xl font-bold">SORM Mock Test System</h1>
                        </div>
                        <div class="flex items-center space-x-4">
                            <button onclick="renderSearch()" class="text-white/80 hover:text-white transition">
                                <i class="fas fa-search mr-2"></i>Search Questions
                            </button>
                            <div class="text-white/80 text-sm">
                                Securities Operations & Risk Management
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div class="text-center mb-12">
                    <h2 class="text-4xl font-bold text-white mb-4">Select a Test Set</h2>
                    <p class="text-white/80 text-lg">Choose from 9 different practice test sets</p>
                </div>

                <div id="sets-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="text-white text-center">Loading test sets...</div>
                </div>
            </div>
        </div>
    `;
    
    app.innerHTML = setsHtml;
    loadSets();
}

async function loadSets() {
    const sets = await fetchSets();
    const container = document.getElementById('sets-container');
    
    if (sets.length === 0) {
        container.innerHTML = '<div class="text-white text-center col-span-3">No test sets available</div>';
        return;
    }

    container.innerHTML = sets.map(set => `
        <div class="bg-white rounded-xl shadow-lg p-6 card-hover transition-all duration-300 cursor-pointer"
             onclick="selectSet(${set.id})">
            <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <i class="fas fa-file-alt text-white text-xl"></i>
                </div>
                <div class="ml-4">
                    <h3 class="text-lg font-semibold text-gray-800">${set.name}</h3>
                    <p class="text-sm text-gray-500">${set.description}</p>
                </div>
            </div>
            <div class="flex items-center justify-between mt-4">
                <span class="text-sm text-gray-600">
                    <i class="fas fa-clock mr-1"></i> Timed Test
                </span>
                <button class="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
                    Start Test
                </button>
            </div>
        </div>
    `).join('');
}

function selectSet(setId) {
    currentState.selectedSet = setId;
    currentState.currentCategory = 'SORM';
    startTest(setId);
}

function renderSearch() {
    currentState.view = 'search';
    
    const searchHtml = `
        <div class="min-h-screen bg-gray-50">
            <nav class="bg-white shadow-md border-b">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center space-x-4">
                            <button onclick="goHome()" class="text-gray-600 hover:text-gray-800 transition" title="Go to Home">
                                <i class="fas fa-home text-xl"></i>
                            </button>
                            <div class="w-px h-6 bg-gray-300"></div>
                            <i class="fas fa-graduation-cap text-purple-600 text-2xl mr-3"></i>
                            <h1 class="text-gray-800 text-xl font-bold">Search Questions</h1>
                        </div>
                        <button onclick="goHome()" class="text-purple-600 hover:text-purple-800 font-medium">
                            <i class="fas fa-home mr-2"></i> Back to Home
                        </button>
                    </div>
                </div>
            </nav>

            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div class="flex space-x-4">
                        <div class="flex-1">
                            <input type="text" id="searchInput" placeholder="Search questions or answers..." 
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                   onkeyup="handleSearch(event)">
                        </div>
                        <select id="setFilter" class="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="">All Sets</option>
                            <option value="1">Set 1</option>
                            <option value="2">Set 2</option>
                            <option value="3">Set 3</option>
                            <option value="4">Set 4</option>
                            <option value="5">Set 5</option>
                            <option value="6">Set 6</option>
                            <option value="7">Set 7 - Last Day Revision 1</option>
                            <option value="8">Set 8 - Last Day Revision 2</option>
                            <option value="9">Set 9 - Real Feel Timed</option>
                        </select>
                        <button onclick="performSearch()" class="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90 transition">
                            <i class="fas fa-search mr-2"></i>Search
                        </button>
                    </div>
                </div>

                <div id="searchResults" class="space-y-4">
                    <div class="text-center text-gray-500 py-8">
                        <i class="fas fa-search text-4xl mb-4"></i>
                        <p>Enter a search term to find questions</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    app.innerHTML = searchHtml;
}

function handleSearch(event) {
    if (event.key === 'Enter') {
        performSearch();
    }
}

async function performSearch() {
    const query = document.getElementById('searchInput').value;
    const setId = document.getElementById('setFilter').value;
    
    if (!query.trim()) {
        return;
    }

    const results = await searchQuestions(query, setId || null);
    currentState.searchResults = results;
    
    const resultsContainer = document.getElementById('searchResults');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-search text-4xl mb-4"></i>
                <p>No questions found matching your search</p>
            </div>
        `;
        return;
    }

    resultsContainer.innerHTML = results.map((question, index) => `
        <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center">
                    <span class="bg-purple-100 text-purple-800 text-xs font-medium px-3 py-1 rounded-full mr-3">
                        Set ${question.setId}
                    </span>
                    <span class="text-gray-500 text-sm">Question ${question.questionId}</span>
                </div>
                <button onclick="showSolution('${question.id}')" class="text-purple-600 hover:text-purple-800 font-medium text-sm">
                    <i class="fas fa-lightbulb mr-1"></i>Show Solution
                </button>
            </div>
            <h3 class="text-lg font-semibold text-gray-800 mb-4">${question.question}</h3>
            <div class="space-y-2">
                ${question.options.map((option, optIndex) => `
                    <div class="flex items-center p-3 rounded-lg ${optIndex === question.correctAnswer ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}">
                        <span class="w-6 h-6 rounded-full ${optIndex === question.correctAnswer ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'} flex items-center justify-center text-xs mr-3">
                            ${String.fromCharCode(65 + optIndex)}
                        </span>
                        <span class="${optIndex === question.correctAnswer ? 'text-green-700 font-medium' : 'text-gray-700'}">${option}</span>
                        ${optIndex === question.correctAnswer ? '<i class="fas fa-check text-green-500 ml-auto"></i>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function showSolution(questionId) {
    const question = currentState.searchResults.find(q => q.id === questionId);
    if (!question) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-bold text-gray-800">Solution</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <p class="text-gray-700 mb-6">${question.question}</p>
                <div class="space-y-3">
                    ${question.options.map((option, optIndex) => `
                        <div class="flex items-center p-3 rounded-lg ${optIndex === question.correctAnswer ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'}">
                            <span class="w-8 h-8 rounded-full ${optIndex === question.correctAnswer ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'} flex items-center justify-center text-sm mr-3">
                                ${String.fromCharCode(65 + optIndex)}
                            </span>
                            <span class="${optIndex === question.correctAnswer ? 'text-green-700 font-semibold' : 'text-gray-700'}">${option}</span>
                            ${optIndex === question.correctAnswer ? '<i class="fas fa-check-circle text-green-500 ml-auto text-xl"></i>' : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p class="text-blue-800 font-medium">
                        <i class="fas fa-info-circle mr-2"></i>Correct Answer: ${String.fromCharCode(65 + question.correctAnswer)}
                    </p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function startTest(setId) {
    const questions = await fetchQuestions(setId);
    
    if (questions.length === 0) {
        alert('No questions available for this set. Please parse the HTML files first.');
        return;
    }

    currentState.questions = shuffleArray(questions);
    currentState.currentQuestion = 0;
    currentState.answers = [];
    currentState.timeRemaining = 10800; // 3 hours in seconds
    currentState.view = 'test';
    currentState.practiceMode = false;
    currentState.showInstantSolution = false;

    startTimer();
    renderTest();
}

function togglePracticeMode() {
    currentState.practiceMode = !currentState.practiceMode;
    currentState.showInstantSolution = false;
    renderTest();
}

function toggleInstantSolution() {
    currentState.showInstantSolution = !currentState.showInstantSolution;
    renderTest();
}

function startTimer() {
    if (currentState.timerInterval) {
        clearInterval(currentState.timerInterval);
    }

    currentState.timerInterval = setInterval(() => {
        currentState.timeRemaining--;
        
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = formatTime(currentState.timeRemaining);
            
            if (currentState.timeRemaining <= 300) { // 5 minutes warning
                timerElement.classList.add('timer-warning', 'text-red-500');
            }
        }

        if (currentState.timeRemaining <= 0) {
            clearInterval(currentState.timerInterval);
            submitTestAnswers();
        }
    }, 1000);
}

function renderTest() {
    const question = currentState.questions[currentState.currentQuestion];
    const progress = ((currentState.currentQuestion + 1) / currentState.questions.length) * 100;
    const answeredCount = currentState.answers.length;
    const userAnswer = currentState.answers.find(a => a.questionId === question.id);
    const isAnswered = userAnswer !== undefined;
    const isCorrect = isAnswered && userAnswer.selectedAnswer === question.correctAnswer;

    const testHtml = `
        <div class="min-h-screen bg-gray-50">
            <nav class="bg-white shadow-md border-b">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center space-x-4">
                            <button onclick="goHome()" class="text-gray-600 hover:text-gray-800 transition" title="Go to Home">
                                <i class="fas fa-home text-xl"></i>
                            </button>
                            <button onclick="goBackToSets()" class="text-gray-600 hover:text-gray-800 transition" title="Back to Test Sets">
                                <i class="fas fa-arrow-left text-xl"></i>
                            </button>
                            <div class="w-px h-6 bg-gray-300"></div>
                            <i class="fas fa-graduation-cap text-purple-600 text-2xl mr-3"></i>
                            <h1 class="text-gray-800 text-xl font-bold">${currentState.currentCategory === 'EQ' ? 'Equity Derivatives' : 'SORM'} Mock Test</h1>
                        </div>
                        <div class="flex items-center space-x-4">
                            <button onclick="togglePracticeMode()" 
                                    class="px-4 py-2 rounded-lg font-medium transition
                                           ${currentState.practiceMode ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
                                <i class="fas fa-book-open mr-2"></i>${currentState.practiceMode ? 'Practice Mode' : 'Exam Mode'}
                            </button>
                            <div class="text-sm">
                                <span class="text-gray-500">Question:</span>
                                <span class="font-semibold text-gray-800">${currentState.currentQuestion + 1}/${currentState.questions.length}</span>
                            </div>
                            <div class="text-sm">
                                <span class="text-gray-500">Answered:</span>
                                <span class="font-semibold text-green-600">${answeredCount}</span>
                            </div>
                            <div id="timer" class="text-lg font-mono font-bold text-purple-600">
                                ${formatTime(currentState.timeRemaining)}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <!-- Progress Bar -->
                <div class="mb-8">
                    <div class="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>${Math.round(progress)}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-300" 
                             style="width: ${progress}%"></div>
                    </div>
                </div>

                <!-- Question Card -->
                <div class="bg-white rounded-xl shadow-lg p-8 mb-6">
                    <div class="flex justify-between items-start mb-6">
                        <span class="bg-purple-100 text-purple-800 text-xs font-medium px-3 py-1 rounded-full">
                            Question ${currentState.currentQuestion + 1}
                        </span>
                        ${currentState.practiceMode ? `
                            <button onclick="toggleInstantSolution()" class="text-purple-600 hover:text-purple-800 font-medium text-sm">
                                <i class="fas fa-lightbulb mr-1"></i>${currentState.showInstantSolution ? 'Hide Solution' : 'Show Solution'}
                            </button>
                        ` : ''}
                    </div>
                    <h2 class="text-xl font-semibold text-gray-800 mb-8">${question.question}</h2>

                    <div class="space-y-4">
                        ${question.options.map((option, index) => {
                            let optionClass = 'border-gray-200';
                            let bgClass = 'bg-white';
                            let icon = '';
                            
                            if (currentState.practiceMode && currentState.showInstantSolution) {
                                if (index === question.correctAnswer) {
                                    optionClass = 'border-green-500 bg-green-50';
                                    bgClass = 'bg-green-50';
                                    icon = '<i class="fas fa-check-circle text-green-500 ml-auto"></i>';
                                } else if (isAnswered && userAnswer.selectedAnswer === index) {
                                    optionClass = 'border-red-500 bg-red-50';
                                    bgClass = 'bg-red-50';
                                    icon = '<i class="fas fa-times-circle text-red-500 ml-auto"></i>';
                                }
                            } else if (isAnswered && userAnswer.selectedAnswer === index) {
                                optionClass = 'border-purple-500 bg-purple-50';
                                bgClass = 'bg-purple-50';
                            }
                            
                            return `
                                <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-purple-300 transition-colors ${optionClass} ${bgClass}">
                                    <input type="radio" name="answer" value="${index}" 
                                           class="w-5 h-5 text-purple-600"
                                           ${isAnswered && userAnswer.selectedAnswer === index ? 'checked' : ''}
                                           ${currentState.practiceMode && currentState.showInstantSolution ? 'disabled' : ''}
                                           onchange="selectAnswer(${index})">
                                    <span class="ml-3 text-gray-700">${option}</span>
                                    ${icon}
                                </label>
                            `;
                        }).join('')}
                    </div>
                    
                    ${currentState.practiceMode && currentState.showInstantSolution ? `
                        <div class="mt-6 p-4 bg-blue-50 rounded-lg">
                            <p class="text-blue-800 font-medium">
                                <i class="fas fa-info-circle mr-2"></i>Correct Answer: ${String.fromCharCode(65 + question.correctAnswer)} - ${question.options[question.correctAnswer]}
                            </p>
                        </div>
                    ` : ''}
                </div>

                <!-- Navigation Buttons -->
                <div class="flex justify-between items-center">
                    <button onclick="previousQuestion()" 
                            class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition
                                   ${currentState.currentQuestion === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
                            ${currentState.currentQuestion === 0 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-left mr-2"></i> Previous
                    </button>

                    <div class="flex flex-wrap gap-2 max-w-2xl">
                        ${currentState.questions.map((_, index) => {
                            let btnClass = 'bg-gray-200 text-gray-700 hover:bg-gray-300';
                            const qAnswer = currentState.answers.find(a => a.questionId === currentState.questions[index].id);
                            
                            if (index === currentState.currentQuestion) {
                                btnClass = 'bg-purple-600 text-white';
                            } else if (currentState.practiceMode && currentState.showInstantSolution) {
                                if (qAnswer) {
                                    btnClass = qAnswer.selectedAnswer === currentState.questions[index].correctAnswer ? 'bg-green-500 text-white' : 'bg-red-500 text-white';
                                }
                            } else if (qAnswer) {
                                btnClass = 'bg-green-500 text-white';
                            }
                            
                            return `
                                <button onclick="goToQuestion(${index})"
                                        class="w-10 h-10 rounded-lg font-medium transition ${btnClass}">
                                    ${index + 1}
                                </button>
                            `;
                        }).join('')}
                    </div>

                    <button onclick="${currentState.currentQuestion === currentState.questions.length - 1 ? 'submitTestAnswers()' : 'nextQuestion()'}"
                            class="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90 transition">
                        ${currentState.currentQuestion === currentState.questions.length - 1 ? 'Submit Test' : 'Next'}
                        <i class="fas fa-arrow-right ml-2"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    app.innerHTML = testHtml;
}

function selectAnswer(optionIndex) {
    const question = currentState.questions[currentState.currentQuestion];
    const existingAnswerIndex = currentState.answers.findIndex(a => a.questionId === question.id);
    
    if (existingAnswerIndex !== -1) {
        currentState.answers[existingAnswerIndex].selectedAnswer = optionIndex;
    } else {
        currentState.answers.push({
            questionId: question.id,
            selectedAnswer: optionIndex
        });
    }
    
    renderTest();
}

function nextQuestion() {
    if (currentState.currentQuestion < currentState.questions.length - 1) {
        currentState.currentQuestion++;
        renderTest();
    }
}

function previousQuestion() {
    if (currentState.currentQuestion > 0) {
        currentState.currentQuestion--;
        renderTest();
    }
}

function goToQuestion(index) {
    currentState.currentQuestion = index;
    renderTest();
}

// Icon Helper Functions
function getIcon(type) {
    const icons = {
        clipboard: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-blue-500"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`,
        question: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-blue-500"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
        graduation: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-blue-500"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>`
    };
    return icons[type] || '';
}

function getFloatingIcon(type, color) {
    const icons = {
        check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        up: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`,
        warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
    };
    return icons[type] || '';
}

function getCategoryIcon(type) {
    const icons = {
        shield: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
        chart: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`,
        search: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="11" y1="16" x2="11.01" y2="16"></line></svg>`
    };
    return icons[type] || '';
}

// Navigation Handlers
function handleNavClick(route) {
    const availableRoutes = {
        'analytics': false,
        'bookmarks': false,
        'dashboard': false
    };
    
    if (!availableRoutes[route]) {
        showComingSoon();
    }
}

function showComingSoon(event) {
    if (event) event.stopPropagation();
    alert('Coming soon');
}

async function submitTestAnswers() {
    if (currentState.timerInterval) {
        clearInterval(currentState.timerInterval);
    }

    if (!confirm('Are you sure you want to submit the test?')) {
        startTimer();
        return;
    }

    const results = await submitTest(currentState.answers, currentState.selectedSet);
    
    if (results) {
        currentState.testResults = results;
        currentState.view = 'results';
        renderResults();
    } else {
        alert('Error submitting test. Please try again.');
    }
}

function renderResults() {
    const results = currentState.testResults;
    const percentage = results.percentage;
    let grade, gradeColor;

    if (percentage >= 90) {
        grade = 'Excellent';
        gradeColor = 'text-green-600';
    } else if (percentage >= 70) {
        grade = 'Good';
        gradeColor = 'text-blue-600';
    } else if (percentage >= 50) {
        grade = 'Average';
        gradeColor = 'text-yellow-600';
    } else {
        grade = 'Needs Improvement';
        gradeColor = 'text-red-600';
    }

    const resultsHtml = `
        <div class="min-h-screen bg-gray-50">
            <nav class="bg-white shadow-md border-b">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center space-x-4">
                            <button onclick="goHome()" class="text-gray-600 hover:text-gray-800 transition" title="Go to Home">
                                <i class="fas fa-home text-xl"></i>
                            </button>
                            <button onclick="goBackToSets()" class="text-gray-600 hover:text-gray-800 transition" title="Back to Test Sets">
                                <i class="fas fa-arrow-left text-xl"></i>
                            </button>
                            <div class="w-px h-6 bg-gray-300"></div>
                            <i class="fas fa-graduation-cap text-purple-600 text-2xl mr-3"></i>
                            <h1 class="text-gray-800 text-xl font-bold">${currentState.currentCategory === 'EQ' ? 'Equity Derivatives' : 'SORM'} Test Results</h1>
                        </div>
                        <button onclick="goHome()" class="text-purple-600 hover:text-purple-800 font-medium">
                            <i class="fas fa-home mr-2"></i> Back to Home
                        </button>
                    </div>
                </div>
            </nav>

            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <!-- Score Card -->
                <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
                    <div class="text-center mb-8">
                        <h2 class="text-3xl font-bold text-gray-800 mb-2">Your Score</h2>
                        <div class="text-6xl font-bold ${gradeColor} mb-2">${percentage}%</div>
                        <div class="text-xl text-gray-600">${grade}</div>
                    </div>

                    <div class="grid grid-cols-3 gap-6">
                        <div class="text-center p-4 bg-green-50 rounded-lg">
                            <div class="text-3xl font-bold text-green-600">${results.correct}</div>
                            <div class="text-sm text-gray-600">Correct</div>
                        </div>
                        <div class="text-center p-4 bg-red-50 rounded-lg">
                            <div class="text-3xl font-bold text-red-600">${results.wrong}</div>
                            <div class="text-sm text-gray-600">Wrong</div>
                        </div>
                        <div class="text-center p-4 bg-blue-50 rounded-lg">
                            <div class="text-3xl font-bold text-blue-600">${results.total}</div>
                            <div class="text-sm text-gray-600">Total</div>
                        </div>
                    </div>
                </div>

                <!-- Detailed Results -->
                <div class="bg-white rounded-xl shadow-lg p-8">
                    <h3 class="text-xl font-semibold text-gray-800 mb-6">Detailed Results</h3>
                    <div class="space-y-4">
                        ${results.results.map((result, index) => `
                            <div class="p-4 rounded-lg ${result.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
                                <div class="flex items-start mb-2">
                                    <span class="flex-shrink-0 w-8 h-8 rounded-full ${result.isCorrect ? 'bg-green-500' : 'bg-red-500'} text-white flex items-center justify-center text-sm font-bold mr-3">
                                        ${index + 1}
                                    </span>
                                    <div class="flex-1">
                                        <p class="font-medium text-gray-800">${result.question}</p>
                                        <div class="mt-2 text-sm">
                                            <span class="text-gray-600">Your answer: </span>
                                            <span class="${result.isCorrect ? 'text-green-600' : 'text-red-600'} font-medium">
                                                ${result.selectedAnswerText || result.selectedAnswer}
                                            </span>
                                            ${!result.isCorrect ? `<span class="text-gray-600 ml-4">Correct answer: </span>
                                            <span class="text-green-600 font-medium">${result.correctAnswerText || result.correctAnswer}</span>` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    app.innerHTML = resultsHtml;
}

function goBackToSets() {
    if (currentState.timerInterval) {
        clearInterval(currentState.timerInterval);
    }
    
    currentState.view = 'sets';
    currentState.selectedSet = null;
    currentState.questions = [];
    currentState.currentQuestion = 0;
    currentState.answers = [];
    currentState.testResults = null;
    
    if (currentState.currentCategory === 'EQ') {
        renderEquityDerivatives();
    } else {
        renderSets();
    }
}

function goHome() {
    currentState.view = 'home';
    currentState.selectedSet = null;
    currentState.currentCategory = 'SORM';
    currentState.questions = [];
    currentState.currentQuestion = 0;
    currentState.answers = [];
    currentState.testResults = null;
    
    if (currentState.timerInterval) {
        clearInterval(currentState.timerInterval);
    }
    
    renderHome();
}

// Initialize App
renderHome();
