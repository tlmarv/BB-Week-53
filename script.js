// Quiz Data
let quizData = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;
let incorrectAnswers = 0;
let answeredQuestions;
let explanationsShown;
let selectedAnswers;

// DOM Elements
const questionText = document.getElementById("question-text");
const choicesContainer = document.getElementById("choices-container");
const explanationBox = document.getElementById("explanation");
const progressText = document.getElementById("progress");
const correctText = document.getElementById("correct");
const incorrectText = document.getElementById("incorrect");
const questionList = document.getElementById("question-list");
const quizContainer = document.querySelector(".quiz-content");
const resultsContainer = document.getElementById("results-container");
const questionNav = document.querySelector(".question-nav");

fetch('questions.json')
    .then(response => response.json())
    .then(data => {
        quizData = data;
        initializeQuizState();
        renderSidebar();
        loadQuestion(0);
    })
    .catch(error => console.error('Error loading quiz data:', error));

function initializeQuizState() {
    answeredQuestions = JSON.parse(sessionStorage.getItem("answeredQuestions")) || new Array(quizData.length).fill(false);
    explanationsShown = JSON.parse(sessionStorage.getItem("explanationsShown")) || new Array(quizData.length).fill(false);
    selectedAnswers = JSON.parse(sessionStorage.getItem("selectedAnswers")) || new Array(quizData.length).fill(null);
    
    // Recalculate score from session storage on reload
    correctAnswers = 0;
    incorrectAnswers = 0;
    answeredQuestions.forEach((answered, index) => {
        if (answered && selectedAnswers[index] !== null) {
            if (selectedAnswers[index] === quizData[index].correctAnswer) {
                correctAnswers++;
            } else {
                incorrectAnswers++;
            }
        }
    });
}

function renderSidebar() {
    questionList.innerHTML = ""; // Clear existing list
    quizData.forEach((_, index) => {
        const listItem = document.createElement("li");
        listItem.textContent = index + 1;
        listItem.classList.add("question-bubble");
        if (answeredQuestions[index]) {
            listItem.style.backgroundColor = selectedAnswers[index] === quizData[index].correctAnswer ? "green" : "red";
        }
        listItem.onclick = () => loadQuestion(index);
        listItem.setAttribute("data-index", index);
        questionList.appendChild(listItem);
    });
}

// Display Hotkey Info Popup
window.onload = function() {
    alert("Welcome to the quiz!\n\nHotkeys Available:\n- Space: Next Question\n- B: Previous Question\n- 1-5: Select Answer Choices\n Anki remotes should be compatible! \n\nGood luck!");
};

// Load Question
function loadQuestion(index) {
    if (index >= quizData.length) {
        showResultsPopup();
        return;
    }

    currentQuestionIndex = index;
    const q = quizData[index];
    
    questionText.textContent = q.question;
    choicesContainer.innerHTML = "";
    
    q.choices.forEach((choice, i) => {
        const button = document.createElement("button");
        button.textContent = choice;
        button.onclick = () => checkAnswer(i, button);
        button.classList.add("choice-btn");
        
        if (selectedAnswers[currentQuestionIndex] !== null) {
            if (i === selectedAnswers[currentQuestionIndex]) {
                button.style.backgroundColor = selectedAnswers[currentQuestionIndex] === q.correctAnswer ? "green" : "red";
            }
            if (i === q.correctAnswer) {
                button.style.backgroundColor = "green";
            }
        }
        
        choicesContainer.appendChild(button);
    });

    if (explanationsShown[currentQuestionIndex]) {
        explanationBox.textContent = q.explanation;
        explanationBox.classList.remove("hidden");
    } else {
        explanationBox.textContent = "";
        explanationBox.classList.add("hidden");
    }

    updateProgress();
}

// Check Answer
function checkAnswer(selectedIndex, button) {
    if (answeredQuestions[currentQuestionIndex]) return;

    const q = quizData[currentQuestionIndex];
    explanationBox.textContent = q.explanation;
    explanationBox.classList.remove("hidden");

    const questionBubble = document.querySelector(`.question-bubble[data-index="${currentQuestionIndex}"]`);

    if (selectedIndex === q.correctAnswer) {
        button.style.backgroundColor = "green";
        questionBubble.style.backgroundColor = "green";
        correctAnswers++;
    } else {
        button.style.backgroundColor = "red";
        questionBubble.style.backgroundColor = "red";
        incorrectAnswers++;
        
        const correctButton = choicesContainer.children[q.correctAnswer];
        correctButton.style.backgroundColor = "green";
    }

    answeredQuestions[currentQuestionIndex] = true;
    explanationsShown[currentQuestionIndex] = true;
    selectedAnswers[currentQuestionIndex] = selectedIndex;
    
    sessionStorage.setItem("answeredQuestions", JSON.stringify(answeredQuestions));
    sessionStorage.setItem("explanationsShown", JSON.stringify(explanationsShown));
    sessionStorage.setItem("selectedAnswers", JSON.stringify(selectedAnswers));
    
    updateProgress();
}

// Update Progress
function updateProgress() {
    const totalAnswered = answeredQuestions.filter(Boolean).length;
    progressText.textContent = `${totalAnswered}/${quizData.length}`;
    correctText.textContent = correctAnswers;
    incorrectText.textContent = incorrectAnswers;
}

// Show Final Results Popup
function showResultsPopup() {
    quizContainer.classList.add("hidden");
    questionNav.classList.add("hidden");

    const scorePercentage = ((correctAnswers / quizData.length) * 100).toFixed(2);
    const finalScoreText = document.getElementById("final-score");
    finalScoreText.textContent = `You scored ${correctAnswers} out of ${quizData.length} (${scorePercentage}%)!`;
    
    resultsContainer.classList.remove("hidden");
}

// --- Functions for the new buttons ---
function restartQuiz() {
    sessionStorage.clear(); // This clears all saved data
    window.location.reload(); // This reloads the page for a fresh start
}

function reviewQuiz() {
    resultsContainer.classList.add("hidden"); // Hide the results screen
    quizContainer.classList.remove("hidden"); // Show the quiz
    questionNav.classList.remove("hidden"); // Show the question navigation
    loadQuestion(0); // Load the first question to start the review
}

// Navigation Controls
document.getElementById("next-btn").onclick = () => {
    if (currentQuestionIndex + 1 >= quizData.length) {
        showResultsPopup();
    } else {
        loadQuestion(currentQuestionIndex + 1);
    }
};
document.getElementById("prev-btn").onclick = () => loadQuestion(Math.max(currentQuestionIndex - 1, 0));

// Hotkey Navigation & Answer Selection
document.addEventListener("keydown", function(event) {
    if (event.code === "Space") {
        document.getElementById("next-btn").click();
    } else if (event.code === "KeyB") {
        document.getElementById("prev-btn").click();
    } else if (event.key >= "1" && event.key <= "5") {
        const answerIndex = parseInt(event.key) - 1;
        if (answerIndex < quizData[currentQuestionIndex].choices.length) {
            const buttons = choicesContainer.getElementsByTagName("button");
            if (buttons[answerIndex]) {
                buttons[answerIndex].click();
            }
        }
    }
});
