// SORM Mock Test System - Frontend Application

// Detect if running on Vercel or localhost
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000/api' 
    : '/api';

// State Management
let currentState = {
    view: 'home', // home, test, results, search
    selectedSet: null,
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
    const setsHtml = `
        <div class="min-h-screen gradient-bg">
            <nav class="bg-white/10 backdrop-blur-md border-b border-white/20">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center">
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
    startTest(setId);
}

function renderSearch() {
    currentState.view = 'search';
    
    const searchHtml = `
        <div class="min-h-screen bg-gray-50">
            <nav class="bg-white shadow-md border-b">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center">
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
                        <div class="flex items-center">
                            <i class="fas fa-graduation-cap text-purple-600 text-2xl mr-3"></i>
                            <h1 class="text-gray-800 text-xl font-bold">SORM Mock Test</h1>
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
                        <div class="flex items-center">
                            <i class="fas fa-graduation-cap text-purple-600 text-2xl mr-3"></i>
                            <h1 class="text-gray-800 text-xl font-bold">Test Results</h1>
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

function goHome() {
    currentState.view = 'home';
    currentState.selectedSet = null;
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
