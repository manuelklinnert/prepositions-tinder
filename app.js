(function () {
  var STORAGE_KEY = "prep-progress";

  // --- State ---
  var exercises = [];      // active queue (unmastered, shuffled)
  var currentIndex = 0;
  var progress = {};       // { id: score }
  var correctSide = "left"; // "left" | "right" for current card

  // --- DOM refs ---
  var screenCards   = document.getElementById("screen-cards");
  var screenSummary = document.getElementById("screen-summary");
  var screenCongrats = document.getElementById("screen-congrats");
  var progressText  = document.getElementById("progress-text");
  var card          = document.getElementById("card");
  var cardSentence  = document.getElementById("card-sentence");
  var choiceLeft    = document.getElementById("choice-left");
  var choiceRight   = document.getElementById("choice-right");
  var summaryText   = document.getElementById("summary-text");
  var btnRestart    = document.getElementById("btn-restart");
  var btnReset      = document.getElementById("btn-reset");

  // Create score badge element
  var scoreBadge = document.createElement("span");
  scoreBadge.id = "score-badge";
  scoreBadge.textContent = "0";
  card.appendChild(scoreBadge);

  // --- Helpers ---
  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function countMastered() {
    var count = 0;
    for (var i = 0; i < window.EXERCISES.length; i++) {
      if ((progress[window.EXERCISES[i].id] || 0) >= 3) count++;
    }
    return count;
  }

  function updateProgressBar() {
    var mastered = countMastered();
    progressText.textContent = mastered + " / " + window.EXERCISES.length + " gemeistert";
  }

  // --- Screens ---
  function showScreen(id) {
    screenCards.classList.remove("active");
    screenSummary.classList.remove("active");
    screenCongrats.classList.remove("active");
    document.getElementById(id).classList.add("active");
  }

  // --- Card rendering ---
  function renderCard(exercise) {
    var wrongOption = pickRandom(exercise.wrong);
    correctSide = Math.random() < 0.5 ? "left" : "right";

    cardSentence.textContent = exercise.sentence;

    if (correctSide === "left") {
      choiceLeft.textContent = exercise.correct;
      choiceRight.textContent = wrongOption;
    } else {
      choiceLeft.textContent = wrongOption;
      choiceRight.textContent = exercise.correct;
    }

    // Reset card position and classes
    card.style.transform = "";
    card.classList.remove("animate-out", "snap-back", "correct", "wrong");
    scoreBadge.classList.remove("visible");
  }

  // --- Game init ---
  function startGame() {
    progress = loadProgress();
    var unmastered = window.EXERCISES.filter(function (ex) {
      return (progress[ex.id] || 0) < 3;
    });

    if (unmastered.length === 0) {
      showScreen("screen-congrats");
      return;
    }

    exercises = shuffle(unmastered);
    currentIndex = 0;
    updateProgressBar();
    showScreen("screen-cards");
    renderCard(exercises[currentIndex]);
  }

  // --- Button handlers ---
  btnRestart.addEventListener("click", function () { startGame(); });
  btnReset.addEventListener("click", function () {
    localStorage.removeItem(STORAGE_KEY);
    startGame();
  });

  // --- Boot ---
  startGame();
})();
