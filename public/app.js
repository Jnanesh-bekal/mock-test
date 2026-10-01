// ExamForge — Core Application Engine
// Original Blue Theme + Premium Glassmorphic Architecture

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api';

// Progress & User State Storage
const STORAGE_KEY = 'examforge_user_state_v2';

function getUserStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.warn('Storage read failed', e);
    }
    return {
        completedSets: {
            1: { score: 78, correct: 78, wrong: 22, total: 100, date: '2026-09-24' }
        },
        bookmarks: [],
        telemetry: {
            accuracy: 72,
            testsCompleted: 6,
            weakTopic: 'Probability & Distributions',
            weeklyGain: 8.4
        }
    };
}

function saveUserStorage(storage) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    } catch (e) {
        console.warn('Storage write failed', e);
    }
}

// Global Application State
const currentState = {
    view: 'home',
    currentCategory: 'SORM',
    selectedSet: null,
    activeFilter: 'all',
    questions: [],
    currentQuestion: 0,
    answers: [],
    timeRemaining: 7200,
    timerInterval: null,
    practiceMode: false,
    showInstantSolution: false,
    testResults: null,
    resultFilter: 'all',
    modalOpen: null,
    userStorage: getUserStorage(),
    searchResults: []
};

// Utilities
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Data Fetching
async function fetchQuestions(setId) {
    try {
        let response = await fetch(`${API_BASE}/questions?setId=${setId}`);
        if (!response.ok) {
            response = await fetch(`${API_BASE}/questions/${setId}`);
        }
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) return data;
        }
    } catch (e) {
        console.warn('API fetchQuestions error, falling back to static files', e);
    }

    // Static fallback
    let file = '/data/questions.json';
    if (currentState.currentCategory === 'EQ' || (setId >= 10 && setId <= 18)) {
        file = '/data/equity-derivatives-questions.json';
    } else if (currentState.currentCategory === 'RA' || (setId >= 19 && setId <= 27)) {
        file = '/data/research-analyst-questions.json';
    } else if (currentState.currentCategory === 'MB' || (setId >= 28 && setId <= 34)) {
        file = '/data/merchant-banking-questions.json';
    } else if (currentState.currentCategory === 'MFD' || (setId >= 35 && setId <= 43)) {
        file = '/data/mutual-funds-questions.json';
    }

    try {
        const response = await fetch(file);
        const allQuestions = await response.json();
        const filtered = allQuestions.filter(q => q.setId === setId);
        return filtered.length > 0 ? filtered : allQuestions.slice(0, 100);
    } catch (fallbackError) {
        console.error('Error loading fallback questions:', fallbackError);
        return [];
    }
}

// Comprehensive test evaluation engine
function buildTestResults(answers, totalCount, apiData = null) {
    const total = Number(totalCount) || (currentState.questions && currentState.questions.length) || (answers ? answers.length : 1);
    const answerMap = new Map();
    (answers || []).forEach(a => {
        if (a && a.questionId !== undefined) {
            answerMap.set(String(a.questionId), a.selectedAnswer);
        }
    });

    let correct = 0;
    let wrong = 0;

    // Use currentState.questions to maintain the candidate's exact examination sequence
    const questionsList = (currentState.questions && currentState.questions.length > 0)
        ? currentState.questions
        : (apiData && apiData.results ? apiData.results : []);

    const detailedResults = questionsList.map((q, idx) => {
        const qId = String(q.id || q.questionId);
        const hasAnswered = answerMap.has(qId);
        const selected = hasAnswered ? answerMap.get(qId) : null;
        const isCorrect = hasAnswered && Number(selected) === Number(q.correctAnswer);
        const isUnanswered = !hasAnswered;

        if (hasAnswered) {
            if (isCorrect) correct++;
            else wrong++;
        }

        return {
            index: idx,
            questionId: qId,
            selectedAnswer: selected,
            correctAnswer: q.correctAnswer,
            isCorrect,
            isUnanswered,
            questionText: q.question || q.questionText || `Question ${idx + 1}`,
            options: q.options || [],
            explanation: q.explanation || ''
        };
    });

    const unanswered = Math.max(0, total - (correct + wrong));
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
        total,
        correct,
        wrong,
        unanswered,
        percentage,
        results: detailedResults
    };
}

async function submitTest(answers, setId) {
    const totalQuestions = (currentState.questions && currentState.questions.length) || (answers ? answers.length : 0);
    
    // Build direct baseline results using active examination session
    const clientResults = buildTestResults(answers, totalQuestions);

    try {
        const response = await fetch(`${API_BASE}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers, setId, totalQuestions })
        });
        if (response.ok) {
            const data = await response.json();
            // Validate API returned valid evaluation results
            if (data && typeof data.correct === 'number' && (answers.length === 0 || (data.results && data.results.length > 0))) {
                return buildTestResults(answers, totalQuestions, data);
            }
        }
    } catch (e) {
        console.warn('API submission failed or offline, using robust client evaluation:', e);
    }

    return clientResults;
}

async function searchQuestions(query, setId = null) {
    try {
        let url = `${API_BASE}/questions?search=${encodeURIComponent(query)}`;
        if (setId) url += `&setId=${setId}`;
        const response = await fetch(url);
        if (response.ok) return await response.json();
    } catch (e) {
        console.warn('Backend search unavailable, running client search:', e);
    }

    let allQuestions = [];
    const files = [
        '/data/questions.json',
        '/data/equity-derivatives-questions.json',
        '/data/research-analyst-questions.json',
        '/data/merchant-banking-questions.json',
        '/data/mutual-funds-questions.json'
    ];
    for (const f of files) {
        try {
            const res = await fetch(f);
            const data = await res.json();
            allQuestions = allQuestions.concat(data);
        } catch (err) {}
    }

    const qLower = query.toLowerCase();
    return allQuestions.filter(q => {
        const matchesQuery = (q.question && q.question.toLowerCase().includes(qLower)) ||
            (q.options && q.options.some(opt => opt && opt.toLowerCase().includes(qLower))) ||
            (q.explanation && q.explanation.toLowerCase().includes(qLower));
        return matchesQuery && (!setId || q.setId === setId);
    });
}

// -------------------------------------------------------------
// Floating Navigation Pill Component
// -------------------------------------------------------------
function renderNavigation() {
    return `
        <nav class="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 w-[94%] max-w-4xl">
            <div class="nav-pill-glass rounded-full px-5 sm:px-7 py-2.5 sm:py-3 flex items-center justify-between transition-all">
                <!-- Brandmark -->
                <div class="flex items-center gap-2.5 sm:gap-3 cursor-pointer" onclick="renderHome()">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-serif font-bold text-sm shadow-md">
                        GF
                    </div>
                    <span class="font-serif text-lg sm:text-xl font-bold tracking-tight text-slate-800">Gipsy Forge</span>
                </div>

                <!-- Navigation Links (Desktop) -->
                <div class="hidden md:flex items-center gap-6 font-sans text-sm font-medium text-slate-600">
                    <button onclick="openModal('analytics')" class="hover:text-blue-600 transition-colors">
                        Analytics
                    </button>
                    <button onclick="openModal('bookmarks')" class="hover:text-blue-600 transition-colors">
                        Bookmarks
                    </button>
                    <button onclick="renderSearch()" class="hover:text-blue-600 transition-colors flex items-center gap-1.5">
                        <i class="fas fa-search text-xs text-blue-500"></i>
                        <span>Search</span>
                    </button>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2 sm:gap-3">
                    <button onclick="openModal('dashboard')" 
                            class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-medium shadow-md transition-all">
                        Dashboard
                    </button>

                    <!-- Mobile Menu Quick Button -->
                    <button onclick="openModal('mobileMenu')" 
                            title="Menu"
                            class="md:hidden w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors">
                        <i class="fas fa-bars text-xs"></i>
                    </button>
                </div>
            </div>
        </nav>
    `;
}

// -------------------------------------------------------------
// Original Home Page with Glassmorphic Floating Islands
// -------------------------------------------------------------
function renderHome() {
    currentState.view = 'home';
    const config = window.examConfig;

    const homeHtml = `
        <div class="min-h-screen hero-bg relative overflow-x-hidden">
            <!-- Subtle atmospheric gradient to enhance top readability while keeping artwork vibrant -->
            <div class="absolute inset-0 bg-gradient-to-b from-blue-950/35 via-blue-900/10 to-transparent pointer-events-none"></div>

            <!-- Floating Navigation -->
            ${renderNavigation()}

            <!-- Main Content Container -->
            <div class="relative z-10 pt-28 sm:pt-36 lg:pt-40 pb-20 px-6 sm:px-10 max-w-7xl mx-auto">
                
                <!-- Hero & Floating Notifications Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-16 sm:mb-20">
                    
                    <!-- Left Hero Text & Stats -->
                    <div class="lg:col-span-7">
                        <!-- Eyebrow Badge -->
                        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/35 text-white font-mono text-[11px] font-semibold tracking-wider uppercase mb-6 shadow-sm">
                            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>PROFESSIONAL CERTIFICATION PREP</span>
                        </div>

                        <!-- Oversized Serif Headline -->
                        <h1 class="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.08] tracking-tight drop-shadow-md">
                            Master your <br class="hidden sm:inline" />
                            <span class="text-blue-100 italic font-normal drop-shadow-sm">next certification.</span>
                        </h1>

                        <!-- Supporting Description -->
                        <p class="text-white/95 text-base sm:text-lg max-w-xl font-normal leading-relaxed mb-10 drop-shadow-sm">
                            Structured practice tests, adaptive learning, and deep analytics — built for financial professionals preparing for NISM certification exams.
                        </p>

                        <!-- Statistics (Lightly Frosted Glass Capsules) -->
                        <div class="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-xl">
                            <div class="glass-stat-card rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3.5 text-center sm:text-left">
                                <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/25 border border-white/40 flex items-center justify-center text-blue-950 text-sm sm:text-base shrink-0">
                                    <i class="fas fa-clipboard-list"></i>
                                </div>
                                <div>
                                    <div class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none mb-0.5">${config.stats.totalTests}</div>
                                    <div class="text-[10px] sm:text-[11px] font-semibold text-slate-700 uppercase tracking-wide">Total Tests</div>
                                </div>
                            </div>

                            <div class="glass-stat-card rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3.5 text-center sm:text-left">
                                <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/25 border border-white/40 flex items-center justify-center text-indigo-950 text-sm sm:text-base shrink-0">
                                    <i class="fas fa-circle-question"></i>
                                </div>
                                <div>
                                    <div class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none mb-0.5">${config.stats.totalQuestions.toLocaleString()}</div>
                                    <div class="text-[10px] sm:text-[11px] font-semibold text-slate-700 uppercase tracking-wide">Questions</div>
                                </div>
                            </div>

                            <div class="glass-stat-card rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3.5 text-center sm:text-left">
                                <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/25 border border-white/40 flex items-center justify-center text-cyan-950 text-sm sm:text-base shrink-0">
                                    <i class="fas fa-graduation-cap"></i>
                                </div>
                                <div>
                                    <div class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none mb-0.5">${config.stats.totalCategories}</div>
                                    <div class="text-[10px] sm:text-[11px] font-semibold text-slate-700 uppercase tracking-wide">Categories</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Side: Translucent Glass Floating Badges Over the Illustrated Laptop -->
                    <div class="hidden lg:flex lg:col-span-5 flex-col items-end justify-end pt-8 lg:pt-52 pr-2 xl:pr-6 pointer-events-auto">
                        <!-- Badge 1: Weak Topic -->
                        <div class="w-72 glass-float-badge rounded-2xl px-4 py-3 flex items-center gap-3.5 shadow-lg relative z-30 transition-all hover:-translate-y-1">
                            <div class="w-8 h-8 rounded-xl bg-amber-500/25 border border-amber-500/40 flex items-center justify-center text-amber-800 text-sm shrink-0">
                                <i class="fas fa-triangle-exclamation"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-xs font-semibold text-slate-900 truncate">Weak topic: Probability</div>
                                <div class="text-[11px] text-slate-700 font-medium">Targeted 15m review drill ready</div>
                            </div>
                        </div>

                        <!-- Badge 2: Accuracy Trending (Slightly Overlapped & Shifted) -->
                        <div class="w-72 glass-float-badge rounded-2xl px-4 py-3 flex items-center gap-3.5 shadow-lg relative z-20 -mt-2.5 translate-x-3 transition-all hover:-translate-y-1">
                            <div class="w-8 h-8 rounded-xl bg-blue-500/25 border border-blue-500/40 flex items-center justify-center text-blue-800 text-sm shrink-0">
                                <i class="fas fa-arrow-trend-up"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-xs font-semibold text-slate-900 truncate">Accuracy up 8% this week</div>
                                <div class="text-[11px] text-slate-700 font-medium">+8.4% across 6 simulation papers</div>
                            </div>
                        </div>

                        <!-- Badge 3: Completed Mock (Slightly Overlapped & Shifted) -->
                        <div class="w-72 glass-float-badge rounded-2xl px-4 py-3 flex items-center gap-3.5 shadow-lg relative z-10 -mt-2.5 translate-x-6 transition-all hover:-translate-y-1">
                            <div class="w-8 h-8 rounded-xl bg-emerald-500/25 border border-emerald-500/40 flex items-center justify-center text-emerald-800 text-sm shrink-0">
                                <i class="fas fa-check"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-xs font-semibold text-slate-900 truncate">Test completed: Full Mock 12</div>
                                <div class="text-[11px] text-slate-700 font-medium">Score: 78% · Completed in 114m</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section Divider -->
                <div class="flex items-center gap-4 mb-8 sm:mb-10">
                    <div class="font-mono text-xs font-semibold tracking-widest uppercase text-white/90 drop-shadow-sm">
                        EXAM CATEGORIES
                    </div>
                    <div class="flex-1 h-px bg-white/40"></div>
                    <div class="font-mono text-xs text-white/90 drop-shadow-sm font-medium">
                        ${config.categories.length} Certification Tracks
                    </div>
                </div>

                <!-- Exam Category Glassmorphic Floating Islands -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                    ${config.categories.map(category => `
                        <div class="glass-panel rounded-3xl p-6 sm:p-7 flex flex-col justify-between cursor-pointer relative overflow-hidden group"
                             onclick="${category.route}()">
                            <!-- Subtle Top Edge Highlight -->
                            <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>

                            <div>
                                <!-- Top Bar: Icon + Level Badge -->
                                <div class="flex items-center justify-between mb-6">
                                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-br ${category.iconGradient || 'from-blue-600 to-indigo-700'} text-white flex items-center justify-center text-xl shadow-md group-hover:scale-105 transition-transform">
                                        <i class="fas fa-${category.icon}"></i>
                                    </div>
                                    <span class="px-3 py-1 rounded-full bg-white/35 backdrop-blur-md border border-white/50 text-[10px] font-mono font-bold text-slate-800 uppercase tracking-widest shadow-sm">
                                        ${category.level}
                                    </span>
                                </div>

                                <!-- Title & Subtitle -->
                                <h3 class="font-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1.5 group-hover:text-blue-900 transition-colors">
                                    ${category.title}
                                </h3>
                                <div class="text-xs font-semibold text-blue-950/80 mb-3">
                                    ${category.subtitle}
                                </div>

                                <!-- Description -->
                                <p class="text-sm text-slate-800/90 leading-relaxed font-normal mb-6">
                                    ${category.description}
                                </p>

                                <!-- Tag Pills -->
                                <div class="flex flex-wrap gap-2 mb-6">
                                    ${category.tags.map(tag => `
                                        <span class="text-xs px-2.5 py-1 rounded-full bg-white/40 backdrop-blur-sm border border-white/50 text-slate-800 font-medium">
                                            ${tag}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Bottom Bar: Question Stats + Action Button -->
                            <div class="pt-4 border-t border-white/40 flex items-center justify-between">
                                <div class="text-xs sm:text-sm font-semibold text-slate-900">
                                    <span>${category.testCount} tests</span>
                                    <span class="mx-1 text-slate-400">·</span>
                                    <span>${category.questionCount} questions</span>
                                </div>
                                <div class="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center group-hover:bg-blue-700 group-hover:translate-x-1 transition-all shadow-md">
                                    <i class="fas fa-arrow-right text-xs"></i>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Footer -->
                <footer class="border-t border-white/35 pt-8 pb-10">
                    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div class="text-sm text-white/90 drop-shadow-sm font-medium">
                            © 2026 Gipsy Forge. Built for Indian Capital Market Certification Preparation.
                        </div>
                        <div class="flex items-center gap-6 text-sm font-medium text-white/90">
                            <button onclick="openModal('syllabus')" class="hover:text-white transition-colors">Curriculum</button>
                            <button onclick="openModal('analytics')" class="hover:text-white transition-colors">Analytics</button>
                            <button onclick="renderSearch()" class="hover:text-white transition-colors">Search Pool</button>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
        ${renderModalContent()}
    `;

    document.getElementById('app').innerHTML = homeHtml;
}

// -------------------------------------------------------------
// Category Sets Page Template (SORM, EQ, RA)
// -------------------------------------------------------------
function renderCategorySetsView(categoryCode) {
    currentState.view = 'sets';
    currentState.currentCategory = categoryCode;
    const cat = window.examConfig.categories.find(c => c.code === categoryCode) || window.examConfig.categories[0];
    const sets = cat.sets || [];

    // Filter sets
    let displayedSets = sets;
    if (currentState.activeFilter === 'full') {
        displayedSets = sets.filter(s => s.type === 'FULL MOCK');
    } else if (currentState.activeFilter === 'revision') {
        displayedSets = sets.filter(s => s.type === 'REVISION');
    } else if (currentState.activeFilter === 'realfeel') {
        displayedSets = sets.filter(s => s.type === 'REAL FEEL');
    } else if (currentState.activeFilter === 'quiz') {
        displayedSets = sets.filter(s => s.type === 'QUIZ');
    }

    const html = `
        <div class="min-h-screen gradient-subpage-bg text-white pb-20 selection:bg-blue-500 selection:text-white">
            <!-- Top Navigation Bar -->
            <nav class="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
                <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <button onclick="renderHome()" 
                                class="text-white/80 hover:text-white transition-colors flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
                            <i class="fas fa-arrow-left"></i>
                            <span>Return to Home</span>
                        </button>
                        <div class="w-px h-5 bg-white/20"></div>
                        <div class="flex items-center gap-2.5">
                            <div class="w-7 h-7 rounded-lg bg-blue-500/30 border border-white/20 flex items-center justify-center text-white text-xs">
                                <i class="fas fa-${cat.icon}"></i>
                            </div>
                            <span class="font-serif text-lg font-bold text-white">${cat.title} Mock Examination System</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <button onclick="renderSearch()" class="hidden sm:flex items-center gap-2 text-xs text-white/80 hover:text-white bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15 transition-all">
                            <i class="fas fa-search text-[11px] text-blue-300"></i>
                            <span>Search Questions</span>
                        </button>
                        <div class="text-xs font-mono text-blue-200 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
                            ${cat.series}
                        </div>
                    </div>
                </div>
            </nav>

            <!-- Main Stage -->
            <div class="max-w-7xl mx-auto px-6 pt-12">
                <!-- Header -->
                <div class="max-w-3xl mb-10">
                    <div class="font-mono text-xs uppercase tracking-widest text-blue-300 mb-2 font-semibold">
                        OFFICIAL SIMULATION PAPERS
                    </div>
                    <h2 class="font-serif text-4xl sm:text-5xl font-bold text-white mb-4">
                        Select an Examination Set
                    </h2>
                    <p class="text-white/85 text-base sm:text-lg leading-relaxed">
                        ${cat.description} All papers incorporate official NISM weighting, negative marking criteria (0.25), and detailed solution rationales.
                    </p>
                </div>

                <!-- Filter Pills -->
                <div class="flex flex-wrap items-center gap-2.5 mb-8">
                    <button onclick="setCategoryFilter('all')" 
                            class="px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${currentState.activeFilter === 'all' ? 'bg-white text-slate-900 shadow-md font-bold' : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/15'}">
                        All Tests (${sets.length})
                    </button>
                    ${sets.some(s => s.type === 'FULL MOCK') ? `
                    <button onclick="setCategoryFilter('full')" 
                            class="px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${currentState.activeFilter === 'full' ? 'bg-white text-slate-900 shadow-md font-bold' : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/15'}">
                        Full Mocks (${sets.filter(s => s.type === 'FULL MOCK').length})
                    </button>
                    ` : ''}
                    ${sets.some(s => s.type === 'QUIZ') ? `
                    <button onclick="setCategoryFilter('quiz')" 
                            class="px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${currentState.activeFilter === 'quiz' ? 'bg-white text-slate-900 shadow-md font-bold' : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/15'}">
                        Topic Quizzes (${sets.filter(s => s.type === 'QUIZ').length})
                    </button>
                    ` : ''}
                    ${sets.some(s => s.type === 'REVISION') ? `
                    <button onclick="setCategoryFilter('revision')" 
                            class="px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${currentState.activeFilter === 'revision' ? 'bg-white text-slate-900 shadow-md font-bold' : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/15'}">
                        Revision (${sets.filter(s => s.type === 'REVISION').length})
                    </button>
                    ` : ''}
                    ${sets.some(s => s.type === 'REAL FEEL') ? `
                    <button onclick="setCategoryFilter('realfeel')" 
                            class="px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${currentState.activeFilter === 'realfeel' ? 'bg-white text-slate-900 shadow-md font-bold' : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/15'}">
                        Real-Feel (${sets.filter(s => s.type === 'REAL FEEL').length})
                    </button>
                    ` : ''}
                </div>

                <!-- Test Cards Grid (Premium Glassmorphic Panels) -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${displayedSets.map(set => {
                        const completedInfo = (currentState.userStorage.completedSets || {})[set.id];
                        return `
                            <div class="glass-panel rounded-2xl p-6 flex flex-col justify-between transition-all group">
                                <div>
                                    <div class="flex items-center justify-between mb-4">
                                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase font-bold ${set.type === 'REVISION' ? 'bg-amber-400/20 text-amber-900 border border-amber-500/30' : 'bg-blue-600/20 text-blue-900 border border-blue-600/30'}">
                                            ${set.type}
                                        </span>
                                        ${completedInfo ? `
                                            <span class="text-xs font-mono font-bold text-emerald-800 bg-emerald-400/25 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                                                Scored ${completedInfo.score}%
                                            </span>
                                        ` : `
                                            <span class="text-xs font-mono text-slate-700">120 Minutes</span>
                                        `}
                                    </div>

                                    <h3 class="font-serif text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-900 transition-colors">
                                        ${set.name}
                                    </h3>
                                    <p class="text-xs text-slate-700 leading-relaxed mb-6 font-medium">
                                        ${set.description}
                                    </p>
                                </div>

                                <div class="pt-4 border-t border-slate-300/40">
                                    <div class="flex items-center justify-between text-xs text-slate-700 font-mono mb-4">
                                        <span><i class="fas fa-file-lines mr-1.5 text-blue-700"></i>${set.questions || 100} Qs</span>
                                        <span><i class="fas fa-clock mr-1.5 text-blue-700"></i>${set.duration || '120m'}</span>
                                        <span><i class="fas fa-bullseye mr-1.5 text-blue-700"></i>60% Pass</span>
                                    </div>
                                    <div class="grid grid-cols-2 gap-2.5">
                                        <button onclick="startPracticeMode(${set.id})" 
                                                class="px-3 py-2 rounded-xl text-xs font-medium text-slate-800 bg-white/50 hover:bg-white/80 border border-slate-300/60 transition-all text-center">
                                            Practice Mode
                                        </button>
                                        <button onclick="selectSet(${set.id})" 
                                                class="px-3 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all text-center">
                                            Begin Test →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
        ${renderModalContent()}
    `;

    document.getElementById('app').innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setCategoryFilter(filter) {
    currentState.activeFilter = filter;
    renderCategorySetsView(currentState.currentCategory);
}

// Category Route Callbacks
function renderSets() {
    renderCategorySetsView('SORM');
}

function renderEquityDerivatives() {
    renderCategorySetsView('EQ');
}

function renderResearchAnalyst() {
    renderCategorySetsView('RA');
}

function renderMerchantBanking() {
    renderCategorySetsView('MB');
}

function renderMutualFunds() {
    renderCategorySetsView('MFD');
}

function selectEquityDerivativesSet(setId) {
    selectSet(setId);
}

function selectResearchAnalystSet(setId) {
    selectSet(setId);
}

function selectMerchantBankingSet(setId) {
    selectSet(setId);
}

function selectMutualFundsSet(setId) {
    selectSet(setId);
}

function loadEquityDerivativesSets() {
    renderCategorySetsView('EQ');
}

function loadSets() {
    renderCategorySetsView('SORM');
}

// -------------------------------------------------------------
// Test Execution Engine (Simulation & Practice Mode)
// -------------------------------------------------------------
function selectSet(setId) {
    currentState.selectedSet = setId;
    currentState.practiceMode = false;
    startTest(setId);
}

function startPracticeMode(setId) {
    currentState.selectedSet = setId;
    currentState.practiceMode = true;
    startTest(setId);
}

async function startTest(setId) {
    currentState.selectedSet = setId;
    const loadingScreen = `
        <div class="min-h-screen gradient-subpage-bg flex flex-col items-center justify-center text-center p-6 text-white">
            <div class="w-12 h-12 rounded-full border-3 border-white border-t-transparent animate-spin mb-4"></div>
            <h3 class="font-serif text-2xl font-bold">Preparing Examination Paper</h3>
            <p class="font-mono text-xs text-white/70 mt-1">Retrieving official questions & initializing timer...</p>
        </div>
    `;
    document.getElementById('app').innerHTML = loadingScreen;

    const questions = await fetchQuestions(setId);
    if (!questions || questions.length === 0) {
        alert('Questions could not be loaded for this test set.');
        renderHome();
        return;
    }

    currentState.questions = shuffleArray(questions);
    currentState.currentQuestion = 0;
    currentState.answers = [];
    currentState.timeRemaining = 7200; // 120 minutes
    currentState.view = 'test';
    currentState.showInstantSolution = false;

    startTimer();
    renderTest();
}

function startTimer() {
    if (currentState.timerInterval) {
        clearInterval(currentState.timerInterval);
    }

    currentState.timerInterval = setInterval(() => {
        currentState.timeRemaining--;
        const timerEl = document.getElementById('timer');
        if (timerEl) {
            timerEl.innerText = formatTime(currentState.timeRemaining);
            if (currentState.timeRemaining < 300) {
                timerEl.classList.add('text-red-400');
            }
        }

        if (currentState.timeRemaining <= 0) {
            clearInterval(currentState.timerInterval);
            alert('Time has expired. Submitting examination paper automatically.');
            submitTestAnswers();
        }
    }, 1000);
}

function togglePracticeMode() {
    currentState.practiceMode = !currentState.practiceMode;
    renderTest();
}

function toggleInstantSolution() {
    currentState.showInstantSolution = !currentState.showInstantSolution;
    renderTest();
}

function toggleBookmark(questionId) {
    if (!currentState.userStorage.bookmarks) currentState.userStorage.bookmarks = [];
    const idx = currentState.userStorage.bookmarks.indexOf(questionId);
    if (idx > -1) {
        currentState.userStorage.bookmarks.splice(idx, 1);
    } else {
        currentState.userStorage.bookmarks.push(questionId);
    }
    saveUserStorage(currentState.userStorage);
    renderTest();
}

function renderTest() {
    if (!currentState.questions || currentState.questions.length === 0) return;

    const question = currentState.questions[currentState.currentQuestion];
    const totalQ = currentState.questions.length;
    const progress = Math.round(((currentState.currentQuestion + 1) / totalQ) * 100);
    const userAnswer = currentState.answers.find(a => a.questionId === question.id);
    const isAnswered = userAnswer !== undefined;
    const isBookmarked = (currentState.userStorage.bookmarks || []).includes(question.id);
    const cat = window.examConfig.categories.find(c => c.code === currentState.currentCategory) || window.examConfig.categories[0];

    const testHtml = `
        <div class="min-h-screen gradient-subpage-bg text-white flex flex-col selection:bg-blue-500 selection:text-white">
            
            <!-- Sticky Test Control Header -->
            <header class="border-b border-white/20 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-3.5">
                <div class="max-w-6xl mx-auto flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <button onclick="confirmExitTest()" 
                                class="text-white/80 hover:text-white transition-colors flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
                            <i class="fas fa-arrow-left"></i>
                            <span class="hidden sm:inline">Exit Test</span>
                        </button>
                        <div class="w-px h-4 bg-white/20"></div>
                        <div>
                            <span class="font-serif text-base sm:text-lg text-white font-bold">Set ${currentState.selectedSet < 10 ? '0' : ''}${currentState.selectedSet}</span>
                            <span class="font-mono text-[10px] text-blue-300 ml-2 uppercase font-semibold">${cat.title}</span>
                        </div>
                    </div>

                    <!-- Right Controls: Mode Switcher & Timer -->
                    <div class="flex items-center gap-3 sm:gap-6">
                        <!-- Mode Toggle -->
                        <button onclick="togglePracticeMode()" 
                                class="px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all border ${currentState.practiceMode ? 'bg-amber-500/25 text-amber-200 border-amber-400/40 font-bold' : 'bg-white/10 text-white/80 border-white/15 hover:text-white'}">
                            <i class="fas ${currentState.practiceMode ? 'fa-lightbulb text-amber-300' : 'fa-stopwatch'} mr-1.5"></i>
                            <span>${currentState.practiceMode ? 'Practice Mode' : 'Exam Mode'}</span>
                        </button>

                        <!-- Live Timer -->
                        <div class="flex items-center gap-2 font-mono text-sm sm:text-base font-bold text-white bg-black/40 px-3.5 py-1.5 rounded-xl border border-white/15">
                            <i class="fas fa-clock text-blue-400 text-xs"></i>
                            <span id="timer">${formatTime(currentState.timeRemaining)}</span>
                        </div>
                    </div>
                </div>

                <!-- Thin Progress Bar -->
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                    <div class="h-1 bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 transition-all duration-300" 
                         style="width: ${progress}%;"></div>
                </div>
            </header>

            <!-- Main Question Stage -->
            <main class="flex-1 max-w-4xl w-full mx-auto px-6 py-8 sm:py-12">
                <div class="bg-white/95 text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-white/40 mb-8 backdrop-blur-md">
                    
                    <!-- Question Top Bar -->
                    <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                        <div class="flex items-center gap-3">
                            <span class="font-mono text-xs tracking-wider text-blue-600 font-bold">
                                QUESTION ${currentState.currentQuestion + 1} OF ${totalQ}
                            </span>
                            <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            <span class="font-mono text-xs text-slate-500 font-medium">1 Mark</span>
                        </div>

                        <div class="flex items-center gap-3">
                            <button onclick="toggleBookmark('${question.id}')" 
                                    class="text-xs font-mono flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors ${isBookmarked ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'text-slate-600 hover:text-slate-900 bg-slate-100 border border-slate-200'}">
                                <i class="fas fa-bookmark text-[10px]"></i>
                                <span>${isBookmarked ? 'Saved' : 'Bookmark'}</span>
                            </button>

                            ${currentState.practiceMode ? `
                                <button onclick="toggleInstantSolution()" 
                                        class="text-xs font-mono flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors ${currentState.showInstantSolution ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'text-slate-600 hover:text-slate-900 bg-slate-100 border border-slate-200'}">
                                    <i class="fas fa-lightbulb text-[10px]"></i>
                                    <span>${currentState.showInstantSolution ? 'Hide Solution' : 'Show Solution'}</span>
                                </button>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Question Text -->
                    <h2 class="font-serif text-xl sm:text-2xl text-slate-900 font-bold leading-relaxed mb-8">
                        ${question.question}
                    </h2>

                    <!-- Options List -->
                    <div class="space-y-3.5 mb-8">
                        ${question.options.map((option, index) => {
                            const isSelected = userAnswer && userAnswer.selectedAnswer === index;
                            let optionClass = 'border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/50';
                            let circleClass = 'border-slate-300 text-slate-500 bg-slate-50';

                            if (isSelected) {
                                optionClass = 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm';
                                circleClass = 'border-blue-600 bg-blue-600 text-white font-bold';
                            }

                            // In practice mode with solution revealed
                            if (currentState.practiceMode && currentState.showInstantSolution) {
                                if (index === question.correctAnswer) {
                                    optionClass = 'border-emerald-600 bg-emerald-50 text-emerald-950 font-medium';
                                    circleClass = 'border-emerald-600 bg-emerald-600 text-white font-bold';
                                } else if (isSelected && index !== question.correctAnswer) {
                                    optionClass = 'border-red-500 bg-red-50 text-red-950';
                                    circleClass = 'border-red-500 bg-red-500 text-white font-bold';
                                }
                            }

                            return `
                                <div class="option-card p-4 sm:p-4.5 rounded-2xl border-2 ${optionClass} cursor-pointer flex items-center gap-4 transition-all"
                                     onclick="selectAnswer(${index})">
                                    <div class="w-7 h-7 rounded-full border-2 ${circleClass} flex items-center justify-center font-mono text-xs shrink-0 transition-colors">
                                        ${String.fromCharCode(65 + index)}
                                    </div>
                                    <div class="text-sm sm:text-base leading-snug flex-1 font-medium">
                                        ${option}
                                    </div>
                                    ${isSelected ? '<i class="fas fa-check text-blue-600 text-sm"></i>' : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <!-- Instant Explanation Panel (Practice Mode) -->
                    ${currentState.practiceMode && currentState.showInstantSolution ? `
                        <div class="p-6 rounded-2xl bg-blue-50 border border-blue-200 text-slate-800 text-sm leading-relaxed mb-6">
                            <div class="font-mono text-xs uppercase tracking-wider text-blue-800 font-bold mb-2 flex items-center gap-2">
                                <i class="fas fa-circle-info"></i>
                                <span>Official Explanation & Rationale</span>
                            </div>
                            <p>${question.explanation || 'The correct option is derived directly from the certified regulatory curriculum framework.'}</p>
                        </div>
                    ` : ''}

                    <!-- Question Bottom Stage Controls -->
                    <div class="flex items-center justify-between pt-6 border-t border-slate-200">
                        <button onclick="previousQuestion()" 
                                ${currentState.currentQuestion === 0 ? 'disabled' : ''}
                                class="px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${currentState.currentQuestion === 0 ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}">
                            <i class="fas fa-arrow-left mr-2"></i> Previous
                        </button>

                        <div class="flex items-center gap-3">
                            <button onclick="confirmSubmitTest()" 
                                    class="px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all">
                                Submit Paper
                            </button>

                            ${currentState.currentQuestion < totalQ - 1 ? `
                                <button onclick="nextQuestion()" 
                                        class="px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all">
                                    Next <i class="fas fa-arrow-right ml-2"></i>
                                </button>
                            ` : `
                                <button onclick="confirmSubmitTest()" 
                                        class="px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all">
                                    Finish & Submit
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;

    document.getElementById('app').innerHTML = testHtml;
}

function selectAnswer(answerIndex) {
    const question = currentState.questions[currentState.currentQuestion];
    const existingIndex = currentState.answers.findIndex(a => a.questionId === question.id);

    if (existingIndex > -1) {
        currentState.answers[existingIndex].selectedAnswer = answerIndex;
    } else {
        currentState.answers.push({
            questionId: question.id,
            selectedAnswer: answerIndex
        });
    }

    renderTest();
}

function nextQuestion() {
    if (currentState.currentQuestion < currentState.questions.length - 1) {
        currentState.currentQuestion++;
        renderTest();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function previousQuestion() {
    if (currentState.currentQuestion > 0) {
        currentState.currentQuestion--;
        renderTest();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function confirmExitTest() {
    if (confirm('Are you sure you want to exit? Your examination progress for this set will not be saved.')) {
        if (currentState.timerInterval) clearInterval(currentState.timerInterval);
        renderCategorySetsView(currentState.currentCategory);
    }
}

function confirmSubmitTest() {
    const answeredCount = currentState.answers.length;
    const totalCount = currentState.questions.length;
    const unanswered = totalCount - answeredCount;

    let msg = `You have answered ${answeredCount} of ${totalCount} questions.`;
    if (unanswered > 0) {
        msg += `\nWarning: ${unanswered} question(s) remain unanswered!`;
    }
    msg += '\n\nAre you sure you wish to submit?';

    if (confirm(msg)) {
        submitTestAnswers();
    }
}

async function submitTestAnswers() {
    if (currentState.timerInterval) clearInterval(currentState.timerInterval);

    const loadingHtml = `
        <div class="min-h-screen gradient-subpage-bg flex flex-col items-center justify-center text-center p-6 text-white">
            <div class="w-12 h-12 rounded-full border-3 border-white border-t-transparent animate-spin mb-4"></div>
            <h3 class="font-serif text-2xl font-bold">Evaluating Examination Answers</h3>
            <p class="font-mono text-xs text-white/70 mt-1">Calculating percentage benchmark & updating user telemetry...</p>
        </div>
    `;
    document.getElementById('app').innerHTML = loadingHtml;

    const results = await submitTest(currentState.answers, currentState.selectedSet);
    currentState.testResults = results;
    currentState.resultFilter = 'all';

    // Save completed set in localStorage
    if (!currentState.userStorage.completedSets) currentState.userStorage.completedSets = {};
    currentState.userStorage.completedSets[currentState.selectedSet] = {
        score: results.percentage,
        correct: results.correct,
        wrong: results.wrong,
        unanswered: results.unanswered,
        total: results.total,
        date: new Date().toISOString().split('T')[0]
    };
    saveUserStorage(currentState.userStorage);

    renderResults();
}

function setResultFilter(filter) {
    currentState.resultFilter = filter;
    renderResults();
}

// -------------------------------------------------------------
// Examination Results View
// -------------------------------------------------------------
function renderResults() {
    const results = currentState.testResults;
    if (!results) {
        renderHome();
        return;
    }

    const percentage = results.percentage;
    const isPassed = percentage >= 60;
    const cat = window.examConfig.categories.find(c => c.code === currentState.currentCategory) || window.examConfig.categories[0];
    const currentFilter = currentState.resultFilter || 'all';

    const unansweredCount = typeof results.unanswered === 'number'
        ? results.unanswered
        : Math.max(0, results.total - results.correct - results.wrong);

    const allItems = results.results || [];
    const filteredItems = allItems.filter(item => {
        if (currentFilter === 'correct') return item.isCorrect;
        if (currentFilter === 'wrong') return !item.isCorrect && !item.isUnanswered;
        if (currentFilter === 'unanswered') return item.isUnanswered;
        return true;
    });

    const resultsHtml = `
        <div class="min-h-screen gradient-subpage-bg text-white pb-20 selection:bg-blue-500 selection:text-white">
            <!-- Nav Bar -->
            <nav class="border-b border-white/20 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
                <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <button onclick="renderCategorySetsView(currentState.currentCategory)" 
                                class="text-white/80 hover:text-white transition-colors flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
                            <i class="fas fa-arrow-left"></i>
                            <span>Return to Exam Suite</span>
                        </button>
                        <div class="w-px h-5 bg-white/20"></div>
                        <span class="font-serif text-lg font-bold text-white">Examination Results</span>
                    </div>

                    <button onclick="renderHome()" 
                            class="bg-white hover:bg-slate-100 text-slate-900 px-5 py-2 rounded-full text-xs font-bold uppercase shadow-md transition-all">
                        Back to Home
                    </button>
                </div>
            </nav>

            <div class="max-w-4xl mx-auto px-6 pt-12">
                <!-- Score Card -->
                <div class="bg-white/95 text-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl border border-white/40 mb-10 text-center relative overflow-hidden backdrop-blur-md">
                    <div class="font-mono text-xs uppercase tracking-widest text-blue-600 font-bold mb-3">
                        ${cat.series} · SET ${currentState.selectedSet < 10 ? '0' : ''}${currentState.selectedSet}
                    </div>

                    <h1 class="font-serif text-3xl sm:text-5xl font-bold mb-4 ${isPassed ? 'text-emerald-700' : 'text-amber-700'}">
                        ${isPassed ? 'Benchmark Passed' : 'Revision Required'}
                    </h1>

                    <div class="font-serif text-7xl sm:text-8xl font-black mb-4 ${isPassed ? 'text-emerald-600' : 'text-amber-600'}">
                        ${percentage}%
                    </div>

                    <p class="text-sm sm:text-base text-slate-700 max-w-md mx-auto mb-8 font-normal leading-relaxed">
                        ${isPassed 
                            ? 'Congratulations. Your score surpasses the official 60% passing benchmark mandated for regulatory certification.' 
                            : 'You did not achieve the 60% threshold. Focus on weak area drills and review the detailed answer rationales below.'}
                    </p>

                    <!-- Breakdown Row -->
                    <div class="grid grid-cols-3 gap-4 max-w-xl mx-auto pt-6 border-t border-slate-200 text-xs font-mono">
                        <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                            <span class="text-emerald-700 text-2xl font-bold block mb-1">${results.correct}</span>
                            <span class="text-slate-600 uppercase font-semibold">Correct</span>
                        </div>
                        <div class="p-4 rounded-2xl bg-red-50 border border-red-200">
                            <span class="text-red-700 text-2xl font-bold block mb-1">${results.wrong}</span>
                            <span class="text-slate-600 uppercase font-semibold">Incorrect</span>
                        </div>
                        <div class="p-4 rounded-2xl bg-slate-100 border border-slate-200">
                            <span class="text-slate-800 text-2xl font-bold block mb-1">${unansweredCount}</span>
                            <span class="text-slate-600 uppercase font-semibold">Unanswered</span>
                        </div>
                    </div>
                </div>

                <!-- Detailed Question Review Section -->
                <div class="space-y-6">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
                        <h3 class="font-serif text-2xl font-bold text-white">Detailed Answer Rationale Review</h3>
                        <div class="flex flex-wrap items-center gap-2 font-mono text-xs">
                            <button onclick="setResultFilter('all')" class="px-3 py-1.5 rounded-xl border transition-all ${currentFilter === 'all' ? 'bg-white text-slate-900 font-bold border-white shadow-md' : 'bg-white/10 text-white hover:bg-white/20 border-white/20'}">
                                All (${results.total})
                            </button>
                            <button onclick="setResultFilter('correct')" class="px-3 py-1.5 rounded-xl border transition-all ${currentFilter === 'correct' ? 'bg-emerald-500 text-white font-bold border-emerald-400 shadow-md' : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 border-emerald-500/30'}">
                                Correct (${results.correct})
                            </button>
                            <button onclick="setResultFilter('wrong')" class="px-3 py-1.5 rounded-xl border transition-all ${currentFilter === 'wrong' ? 'bg-red-500 text-white font-bold border-red-400 shadow-md' : 'bg-red-950/40 text-red-300 hover:bg-red-900/50 border-red-500/30'}">
                                Incorrect (${results.wrong})
                            </button>
                            <button onclick="setResultFilter('unanswered')" class="px-3 py-1.5 rounded-xl border transition-all ${currentFilter === 'unanswered' ? 'bg-slate-300 text-slate-900 font-bold border-white shadow-md' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 border-slate-600/40'}">
                                Unanswered (${unansweredCount})
                            </button>
                        </div>
                    </div>
                    
                    ${filteredItems.length > 0 ? filteredItems.map((item) => {
                        const qNumber = (item.index !== undefined ? item.index : 0) + 1;
                        let badgeClass = 'bg-red-100 text-red-800';
                        let badgeText = 'MISSED';
                        let headerText = `Question ${qNumber} · Incorrect (-0.25)`;
                        let cardBorder = 'border-red-300';

                        if (item.isCorrect) {
                            badgeClass = 'bg-emerald-100 text-emerald-800';
                            badgeText = 'PASSED';
                            headerText = `Question ${qNumber} · Correct (+1.0)`;
                            cardBorder = 'border-emerald-300';
                        } else if (item.isUnanswered) {
                            badgeClass = 'bg-slate-100 text-slate-700';
                            badgeText = 'SKIPPED';
                            headerText = `Question ${qNumber} · Skipped (0.0)`;
                            cardBorder = 'border-slate-300';
                        }

                        return `
                            <div class="bg-white/95 text-slate-900 rounded-2xl p-6 shadow-md border ${cardBorder}">
                                <div class="flex items-center justify-between mb-3">
                                    <span class="font-mono text-xs font-bold ${item.isCorrect ? 'text-emerald-700' : item.isUnanswered ? 'text-slate-600' : 'text-red-600'}">
                                        ${headerText}
                                    </span>
                                    <span class="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${badgeClass}">
                                        ${badgeText}
                                    </span>
                                </div>

                                <h4 class="font-serif text-lg font-bold text-slate-900 mb-4">${item.questionText || 'Question item'}</h4>

                                <div class="space-y-2 mb-4 text-xs font-mono">
                                    ${item.options ? item.options.map((opt, optIdx) => {
                                        let cls = 'bg-slate-50 border-slate-200 text-slate-700';
                                        if (optIdx === item.correctAnswer) cls = 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold';
                                        else if (optIdx === item.selectedAnswer && !item.isCorrect) cls = 'bg-red-100 border-red-400 text-red-950';
                                        return `
                                            <div class="p-3 rounded-xl border ${cls} flex items-center justify-between">
                                                <span>${String.fromCharCode(65 + optIdx)}. ${opt}</span>
                                                ${optIdx === item.correctAnswer ? '<span class="text-[10px] uppercase font-bold text-emerald-800">Correct Answer</span>' : ''}
                                                ${optIdx === item.selectedAnswer && !item.isCorrect ? '<span class="text-[10px] uppercase font-bold text-red-800">Your Selection</span>' : ''}
                                            </div>
                                        `;
                                    }).join('') : ''}
                                </div>

                                ${item.explanation ? `
                                    <div class="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-800 leading-relaxed">
                                        <span class="font-bold text-blue-900 block mb-1">Official Explanation:</span>
                                        ${item.explanation}
                                    </div>
                                ` : `
                                    <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                                        <span class="font-bold text-slate-700 block mb-1">Official Explanation:</span>
                                        The correct option is derived directly from the certified regulatory curriculum framework.
                                    </div>
                                `}
                            </div>
                        `;
                    }).join('') : `
                        <div class="bg-white/10 rounded-2xl p-10 text-center border border-white/20">
                            <i class="fas fa-filter text-2xl text-white/50 mb-2 block"></i>
                            <p class="font-mono text-xs text-white/80 uppercase tracking-wider">No questions found matching the selected filter.</p>
                            <button onclick="setResultFilter('all')" class="mt-4 px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs font-mono uppercase">
                                View All Questions
                            </button>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;

    document.getElementById('app').innerHTML = resultsHtml;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// -------------------------------------------------------------
// Question Repository Search View
// -------------------------------------------------------------
function renderSearch() {
    currentState.view = 'search';

    const searchHtml = `
        <div class="min-h-screen gradient-subpage-bg text-white pb-20 selection:bg-blue-500 selection:text-white">
            <nav class="border-b border-white/20 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
                <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <button onclick="renderHome()" 
                                class="text-white/80 hover:text-white transition-colors flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
                            <i class="fas fa-arrow-left"></i>
                            <span>Return to Gipsy Forge</span>
                        </button>
                        <div class="w-px h-5 bg-white/20"></div>
                        <span class="font-serif text-lg font-bold text-white">Repository Search Engine</span>
                    </div>
                    <div class="font-mono text-xs text-blue-300 font-semibold">
                        Pool: ${(window.examConfig?.stats?.totalQuestions || 1200).toLocaleString()} Verified Questions
                    </div>
                </div>
            </nav>

            <div class="max-w-4xl mx-auto px-6 pt-12">
                <!-- Search Box -->
                <div class="bg-white/95 text-slate-900 rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl border border-white/40">
                    <div class="font-mono text-xs uppercase tracking-widest text-blue-600 font-bold mb-2">QUERY FILTER</div>
                    <h2 class="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Instant Concept & Keyword Lookup</h2>
                    
                    <div class="flex gap-3">
                        <div class="relative flex-1">
                            <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm"></i>
                            <input type="text" id="searchInput" 
                                   onkeypress="handleSearch(event)"
                                   placeholder="Search by topic, e.g. 'settlement', 'VaR', 'margin', 'options', 'clearing'..." 
                                   class="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 transition-colors" />
                        </div>
                        <button onclick="performSearch()" 
                                class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md transition-all">
                            Search
                        </button>
                    </div>
                </div>

                <!-- Results Container -->
                <div id="searchResults" class="space-y-4">
                    <div class="p-12 text-center text-white/70 font-mono text-xs">
                        Enter a keyword above to search through all ${(window.examConfig?.stats?.totalQuestions || 1200).toLocaleString()} certification questions and explanations.
                    </div>
                </div>
            </div>
        </div>
        ${renderModalContent()}
    `;

    document.getElementById('app').innerHTML = searchHtml;
}

function handleSearch(event) {
    if (event.key === 'Enter') {
        performSearch();
    }
}

async function performSearch() {
    const input = document.getElementById('searchInput');
    const query = input.value.trim();
    if (!query) return;

    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '<div class="p-8 text-center text-blue-200 font-mono text-xs">Indexing repository questions...</div>';

    const results = await searchQuestions(query);
    currentState.searchResults = results;

    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="bg-white/95 text-slate-900 rounded-3xl p-8 text-center shadow-xl border border-white/40">
                <i class="fas fa-circle-question text-3xl text-slate-300 mb-3"></i>
                <p class="font-serif text-xl font-bold text-slate-800">No matching questions found</p>
                <p class="text-xs text-slate-500 font-mono mt-1">Try searching for broader terms like "margin", "clearing", or "settlement".</p>
            </div>
        `;
        return;
    }

    resultsContainer.innerHTML = results.map(q => `
        <div class="bg-white/95 text-slate-900 rounded-2xl p-6 shadow-lg border border-white/40 hover:border-blue-500 transition-all">
            <div class="flex items-center justify-between mb-4">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                    Set ${q.setId < 10 ? '0' : ''}${q.setId} · Question ${q.questionId || q.id}
                </span>
                <button onclick="showSolution('${q.id}')" 
                        class="text-xs font-mono text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1.5">
                    <i class="fas fa-lightbulb text-[11px]"></i>
                    <span>Show Solution</span>
                </button>
            </div>
            <h3 class="font-serif text-lg font-bold text-slate-900 leading-relaxed mb-4">
                ${q.question}
            </h3>
            <div class="space-y-2">
                ${q.options.map((opt, i) => `
                    <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-center gap-3">
                        <span class="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center font-mono text-[10px] font-bold text-slate-700">
                            ${String.fromCharCode(65 + i)}
                        </span>
                        <span>${opt}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function showSolution(questionId) {
    const q = currentState.searchResults.find(item => item.id === questionId);
    if (!q) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md';
    modal.innerHTML = `
        <div class="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-white/40">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                <span class="font-mono text-xs font-bold text-blue-600">Question ${q.questionId || q.id} Solution</span>
                <button onclick="this.closest('.fixed').remove()" class="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>
            <p class="font-serif text-base font-bold text-slate-900 mb-4">${q.question}</p>
            <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono font-bold text-emerald-800 mb-4">
                Correct Answer: ${String.fromCharCode(65 + q.correctAnswer)}. ${q.options[q.correctAnswer]}
            </div>
            <div class="text-xs text-slate-700 leading-relaxed mb-6 font-medium">
                ${q.explanation || 'Official curriculum rationale.'}
            </div>
            <button onclick="this.closest('.fixed').remove()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider">
                Close Solution
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

// -------------------------------------------------------------
// Modals Component
// -------------------------------------------------------------
function openModal(modalName) {
    currentState.modalOpen = modalName;
    if (currentState.view === 'home') renderHome();
    else if (currentState.view === 'sets') renderCategorySetsView(currentState.currentCategory);
    else if (currentState.view === 'search') renderSearch();
}

function closeModal() {
    currentState.modalOpen = null;
    if (currentState.view === 'home') renderHome();
    else if (currentState.view === 'sets') renderCategorySetsView(currentState.currentCategory);
    else if (currentState.view === 'search') renderSearch();
}

function handleNavClick(type) {
    openModal(type);
}

function renderModalContent() {
    if (!currentState.modalOpen) return '';

    const cat = window.examConfig.categories.find(c => c.code === currentState.currentCategory) || window.examConfig.categories[0];
    const userStorage = currentState.userStorage;

    if (currentState.modalOpen === 'mobileMenu') {
        return `
            <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md" onclick="if(event.target === this) closeModal()">
                <div class="bg-white text-slate-900 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-white/40">
                    <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-blue-600 text-white font-serif font-bold text-xs flex items-center justify-center">GF</div>
                            <h3 class="font-serif text-xl font-bold text-slate-900">Gipsy Forge Navigation</h3>
                        </div>
                        <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900">
                            <i class="fas fa-times text-xs"></i>
                        </button>
                    </div>

                    <div class="space-y-2 mb-6 font-sans text-sm font-medium">
                        <button onclick="closeModal(); renderHome()" class="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-blue-50 text-slate-800 transition-colors text-left">
                            <span class="flex items-center gap-3"><i class="fas fa-home text-blue-600"></i> Home / Categories</span>
                            <i class="fas fa-chevron-right text-slate-400 text-xs"></i>
                        </button>
                        <button onclick="closeModal(); openModal('syllabus')" class="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-blue-50 text-slate-800 transition-colors text-left">
                            <span class="flex items-center gap-3"><i class="fas fa-book-open text-blue-600"></i> Curriculum & Syllabus</span>
                            <i class="fas fa-chevron-right text-slate-400 text-xs"></i>
                        </button>
                        <button onclick="closeModal(); openModal('analytics')" class="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-blue-50 text-slate-800 transition-colors text-left">
                            <span class="flex items-center gap-3"><i class="fas fa-chart-line text-blue-600"></i> Telemetry & Analytics</span>
                            <i class="fas fa-chevron-right text-slate-400 text-xs"></i>
                        </button>
                        <button onclick="closeModal(); openModal('bookmarks')" class="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-blue-50 text-slate-800 transition-colors text-left">
                            <span class="flex items-center gap-3"><i class="fas fa-bookmark text-blue-600"></i> Bookmarked Questions (${(currentState.userStorage.bookmarks || []).length})</span>
                            <i class="fas fa-chevron-right text-slate-400 text-xs"></i>
                        </button>
                        <button onclick="closeModal(); renderSearch()" class="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-blue-50 text-slate-800 transition-colors text-left">
                            <span class="flex items-center gap-3"><i class="fas fa-search text-blue-600"></i> Search Question Bank</span>
                            <i class="fas fa-chevron-right text-slate-400 text-xs"></i>
                        </button>
                    </div>

                    <div class="pt-4 border-t border-slate-200">
                        <button onclick="closeModal(); openModal('dashboard')" 
                                class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md transition-all">
                            Open Candidate Dashboard
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    if (currentState.modalOpen === 'syllabus') {
        return `
            <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md">
                <div class="bg-white text-slate-900 rounded-3xl max-w-3xl w-full max-h-[88vh] overflow-y-auto p-6 sm:p-10 shadow-2xl border border-white/40">
                    <div class="flex items-start justify-between mb-8 pb-4 border-b border-slate-200">
                        <div>
                            <div class="font-mono text-xs uppercase tracking-widest text-blue-600 font-bold mb-1">OFFICIAL SYLLABUS DOMAINS</div>
                            <h3 class="font-serif text-2xl sm:text-3xl font-bold text-slate-900">${cat.title} Curriculum</h3>
                        </div>
                        <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900">
                            <i class="fas fa-times text-xs"></i>
                        </button>
                    </div>

                    <div class="space-y-4 mb-8">
                        <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-bold text-slate-900">Unit 1: Introduction to Securities & Derivatives Markets</span>
                                <span class="text-xs font-mono font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">Weight: 10%</span>
                            </div>
                            <p class="text-xs text-slate-600 leading-relaxed">Regulatory framework, primary vs secondary markets, exchange architecture, and investor protection mechanisms.</p>
                        </div>

                        <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-bold text-slate-900">Unit 2: Trade Execution, Matching & Clearing Corporations</span>
                                <span class="text-xs font-mono font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">Weight: 25%</span>
                            </div>
                            <p class="text-xs text-slate-600 leading-relaxed">Order life cycle, NEAT/BOLT matching engines, Clearing Corporations (NSCCL/ICCL), netting algorithms, and custodial confirmations.</p>
                        </div>

                        <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-bold text-slate-900">Unit 3: Settlement Life Cycle & Shortage Handling</span>
                                <span class="text-xs font-mono font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">Weight: 25%</span>
                            </div>
                            <p class="text-xs text-slate-600 leading-relaxed">T+1 rolling settlement cycle, pay-in/pay-out of funds and securities, delivery shortages, internal auctions, and penalty structures.</p>
                        </div>

                        <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-bold text-slate-900">Unit 4: Risk Containment & Margining Infrastructure</span>
                                <span class="text-xs font-mono font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">Weight: 25%</span>
                            </div>
                            <p class="text-xs text-slate-600 leading-relaxed">Value-at-Risk (VaR), Extreme Loss Margins (ELM), Mark-to-Market (MTM), Core Settlement Guarantee Fund (SGF), and member collateral.</p>
                        </div>

                        <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-bold text-slate-900">Unit 5: Regulatory Compliance, Inspections & Investor Redressal</span>
                                <span class="text-xs font-mono font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">Weight: 15%</span>
                            </div>
                            <p class="text-xs text-slate-600 leading-relaxed">SEBI Act, SCRA, Depository Act, SCORES redressal system, internal audits, and anti-money laundering (PMLA) compliances.</p>
                        </div>
                    </div>

                    <button onclick="closeModal()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md">
                        Done Reading
                    </button>
                </div>
            </div>
        `;
    }

    if (currentState.modalOpen === 'analytics') {
        const completedCount = Object.keys(userStorage.completedSets || {}).length;
        const totalTests = (window.examConfig && window.examConfig.stats && window.examConfig.stats.totalTests) || 43;
        const avgAccuracy = userStorage.telemetry?.accuracy || 72;

        return `
            <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md">
                <div class="bg-white text-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-10 shadow-2xl border border-white/40">
                    <div class="flex items-start justify-between mb-8 pb-4 border-b border-slate-200">
                        <div>
                            <div class="font-mono text-xs uppercase tracking-widest text-blue-600 font-bold mb-1">CANDIDATE TELEMETRY</div>
                            <h3 class="font-serif text-2xl sm:text-3xl font-bold text-slate-900">Performance Metrics</h3>
                        </div>
                        <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900">
                            <i class="fas fa-times text-xs"></i>
                        </button>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="p-5 rounded-2xl bg-blue-50 border border-blue-200">
                            <div class="text-3xl font-serif font-black text-blue-900 mb-1">${avgAccuracy}%</div>
                            <div class="text-xs font-mono font-bold text-slate-600 uppercase">Average Accuracy</div>
                        </div>
                        <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                            <div class="text-3xl font-serif font-black text-slate-900 mb-1">${completedCount} of ${totalTests}</div>
                            <div class="text-xs font-mono font-bold text-slate-600 uppercase">Completed Papers</div>
                        </div>
                    </div>

                    <div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed mb-6 font-medium">
                        <span class="font-bold block mb-1">Weak Area Recommendation:</span>
                        Historical simulation data suggests focusing on <strong>Settlement Margins & T+1 Defaults</strong>. Score improvement rate is currently +8.4% this week.
                    </div>

                    <button onclick="closeModal()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md">
                        Close Metrics
                    </button>
                </div>
            </div>
        `;
    }

    if (currentState.modalOpen === 'bookmarks') {
        const bookmarks = userStorage.bookmarks || [];

        return `
            <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md">
                <div class="bg-white text-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-10 shadow-2xl border border-white/40">
                    <div class="flex items-start justify-between mb-8 pb-4 border-b border-slate-200">
                        <div>
                            <div class="font-mono text-xs uppercase tracking-widest text-blue-600 font-bold mb-1">REVISION TRAY</div>
                            <h3 class="font-serif text-2xl sm:text-3xl font-bold text-slate-900">Bookmarked Questions (${bookmarks.length})</h3>
                        </div>
                        <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900">
                            <i class="fas fa-times text-xs"></i>
                        </button>
                    </div>

                    ${bookmarks.length === 0 ? `
                        <div class="p-12 text-center text-slate-500 font-mono text-xs">
                            <i class="fas fa-bookmark text-3xl text-slate-300 mb-3 block"></i>
                            No bookmarked questions yet. Click the bookmark icon during test simulation to review difficult questions here.
                        </div>
                    ` : `
                        <div class="space-y-4 mb-6">
                            ${bookmarks.map((bId, idx) => `
                                <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <div class="font-mono text-xs font-bold text-blue-700">Question ${bId}</div>
                                        <div class="text-xs text-slate-600">Saved for targeted revision</div>
                                    </div>
                                    <button onclick="toggleBookmark('${bId}')" class="text-xs text-red-500 hover:text-red-700 font-mono">Remove</button>
                                </div>
                            `).join('')}
                        </div>
                    `}

                    <button onclick="closeModal()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md">
                        Close Bookmarks
                    </button>
                </div>
            </div>
        `;
    }

    if (currentState.modalOpen === 'dashboard') {
        return `
            <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md">
                <div class="bg-white text-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-10 shadow-2xl border border-white/40">
                    <div class="flex items-start justify-between mb-8 pb-4 border-b border-slate-200">
                        <div>
                            <div class="font-mono text-xs uppercase tracking-widest text-blue-600 font-bold mb-1">CANDIDATE PORTAL</div>
                            <h3 class="font-serif text-2xl sm:text-3xl font-bold text-slate-900">Dashboard Overview</h3>
                        </div>
                        <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900">
                            <i class="fas fa-times text-xs"></i>
                        </button>
                    </div>

                    <div class="space-y-4 mb-8">
                        <div class="p-5 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                            <div>
                                <div class="font-bold text-slate-900">Active Curriculum: ${cat.title}</div>
                                <div class="text-xs text-slate-600">${cat.series} Regulatory Certification</div>
                            </div>
                            <span class="text-xs font-mono font-bold text-blue-800 bg-blue-200 px-3 py-1 rounded-full">ACTIVE</span>
                        </div>

                        <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-bold text-slate-900">Certification Readiness Level</span>
                                <span class="font-mono font-bold text-emerald-700">74% Proficient</span>
                            </div>
                            <div class="w-full bg-slate-200 rounded-full h-2">
                                <div class="bg-emerald-500 h-2 rounded-full" style="width: 74%;"></div>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="closeModal(); renderCategorySetsView(currentState.currentCategory)" class="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md">
                            Continue Tests
                        </button>
                        <button onclick="closeModal()" class="bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    return '';
}

// Global Initialization
window.addEventListener('DOMContentLoaded', () => {
    renderHome();
});
renderHome();
