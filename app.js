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
  var progressFill  = document.getElementById("progress-fill");
  var card          = document.getElementById("card");
  var cardSentence  = document.getElementById("card-sentence");
  var choiceLeft    = document.getElementById("choice-left");
  var choiceRight   = document.getElementById("choice-right");
  var summaryText   = document.getElementById("summary-text");
  var btnRestart    = document.getElementById("btn-restart");
  var btnReset      = document.getElementById("btn-reset");
  var resultPopup   = document.getElementById("result-popup");

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
    var total = window.EXERCISES.length;
    progressText.textContent = mastered + " / " + total + " gemeistert";
    progressFill.style.width = (mastered / total * 100) + "%";
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
    justSwiped = false;
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

  // --- Answer logic ---
  function handleAnswer(swipedLeft) {
    var exercise = exercises[currentIndex];
    var choseCorrect = (swipedLeft && correctSide === "left") ||
                       (!swipedLeft && correctSide === "right");

    // Apply color feedback + popup
    card.classList.add(choseCorrect ? "correct" : "wrong");
    resultPopup.textContent = choseCorrect ? "✓" : "✗";
    resultPopup.className = choseCorrect ? "show-correct" : "show-wrong";
    setTimeout(function () { resultPopup.className = ""; }, 450);

    // Update score
    var current = progress[exercise.id] || 0;
    if (choseCorrect) {
      progress[exercise.id] = Math.min(current + 1, 3);
    } else {
      progress[exercise.id] = 0;
      scoreBadge.classList.add("visible");
    }
    saveProgress();
    updateProgressBar();

    // Fly card off screen
    var flyX = swipedLeft ? "-150%" : "150%";
    var rot  = swipedLeft ? "-20deg" : "20deg";
    card.classList.add("animate-out");
    card.offsetWidth; // force reflow so transition is active before transform changes
    card.style.transform = "translateX(" + flyX + ") rotate(" + rot + ")";

    setTimeout(function () {
      currentIndex++;
      if (currentIndex >= exercises.length) {
        var totalMastered = countMastered();
        if (totalMastered >= window.EXERCISES.length) {
          showScreen("screen-congrats");
        } else {
          summaryText.textContent =
            totalMastered + " von " + window.EXERCISES.length + " gemeistert.";
          showScreen("screen-summary");
        }
      } else {
        renderCard(exercises[currentIndex]);
      }
    }, 380);
  }

  // --- Touch / swipe ---
  var touchStartX = 0;
  var touchCurrentX = 0;
  var isDragging = false;
  var justSwiped = false;
  var SWIPE_THRESHOLD = 60;

  card.addEventListener("touchstart", function (e) {
    touchStartX = e.touches[0].clientX;
    touchCurrentX = touchStartX;
    isDragging = true;
    justSwiped = false;
    card.classList.remove("snap-back", "animate-out");
    card.style.transition = "none";
  }, { passive: true });

  card.addEventListener("touchmove", function (e) {
    if (!isDragging) return;
    touchCurrentX = e.touches[0].clientX;
    var delta = touchCurrentX - touchStartX;
    var rot = delta * 0.08;
    card.style.transform = "translateX(" + delta + "px) rotate(" + rot + "deg)";
  }, { passive: true });

  card.addEventListener("touchend", function () {
    if (!isDragging) return;
    isDragging = false;
    var delta = touchCurrentX - touchStartX;

    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      justSwiped = true;
      handleAnswer(delta < 0);
    } else {
      card.classList.add("snap-back");
      card.style.transform = "";
    }
  });

  // --- Click fallback (tap left/right half) ---
  card.addEventListener("click", function (e) {
    if (justSwiped) { justSwiped = false; return; }
    var rect = card.getBoundingClientRect();
    var clickedLeft = e.clientX < rect.left + rect.width / 2;
    handleAnswer(clickedLeft);
  });

  // --- Boot ---
  startGame();
})();
