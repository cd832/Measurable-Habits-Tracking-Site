document.addEventListener("DOMContentLoaded", function() {
  if (document.getElementById('habitForm')) {
    document.getElementById('habitForm').addEventListener("submit", function(event) {
      event.preventDefault();
      addHabit();
    });
  }

  if (document.getElementById('frequencyType')) {
    document.getElementById('frequencyType').addEventListener('change', updateFrequencyFields);
  }

  if (document.getElementById("startTimerButton")) {
    document.getElementById("startTimerButton").addEventListener("click", startTimer);
  }

  if (document.getElementById("stopTimerButton")) {
    document.getElementById("stopTimerButton").addEventListener("click", stopTimer);
  }

  if (document.getElementById("sortProgress")) {
    document.getElementById("sortProgress").addEventListener("change", loadProgress);
  }

  if (document.getElementById("filterType")) {
    document.getElementById("filterType").addEventListener("change", loadProgress);
  }

  if (document.getElementById("clearAllButton")) {
    document.getElementById("clearAllButton").addEventListener("click", clearAllHabits);
  }

  if (document.getElementById("graphType")) {
    document.getElementById("graphType").addEventListener("change", drawGraph);
  }

  if (document.getElementById("timeInputForm")) {
    document.getElementById("timeInputForm").addEventListener("submit", function(event) {
      event.preventDefault();
      submitTimeInput();
    });
  }

  if (document.getElementById("cancelTimeInput")) {
    document.getElementById("cancelTimeInput").addEventListener("click", function() {
      hideTimeInputForm();
    });
  }

  if (document.getElementById("lineGraphType")) {
    document.getElementById("lineGraphType").addEventListener("change", drawLineGraph);
  }

  if (document.getElementById("habitSelectLineGraph")) {
    document.getElementById("habitSelectLineGraph").addEventListener("change", drawLineGraph);
  }

  if (document.getElementById('sortHabits')) {
    document.getElementById('sortHabits').addEventListener("change", loadHabits);
  }

  if (document.getElementById('filterTypeHabits')) {
    document.getElementById('filterTypeHabits').addEventListener("change", loadHabits);
  }

  loadHabits();
  loadProgress();
  populateHabitSelect();
  populateLineGraphHabitSelect();
  drawGraph();
  drawLineGraph();
  cleanupOldProgress();

  // Restore timer state if available
  restoreTimerState();
});

let currentHabitIndex = null;
let timerStartTime = 0;
let timerInterval = null;

function addHabit() {
  const habitInput = document.getElementById("habit");
  const frequencyType = document.getElementById("frequencyType").value;
  const frequencyValue = getFrequencyValue(frequencyType);

  if (habitInput.value.trim() && frequencyValue) {
    const habits = getStoredHabits();
    const newHabit = { habit: habitInput.value.trim(), frequency: frequencyValue, frequencyType, progress: [] };
    habits.push(newHabit);
    localStorage.setItem("habits", JSON.stringify(habits));
    loadHabits();
    populateHabitSelect();
    populateLineGraphHabitSelect();
  }

  habitInput.value = "";
  updateFrequencyFields();
}

function getStoredHabits() {
  const habits = localStorage.getItem("habits");
  return habits ? JSON.parse(habits) : [];
}

function loadHabits() {
  const habits = getStoredHabits();
  const habitList = document.getElementById("habitList");
  if (habitList) {
    habitList.innerHTML = "";

    const sortCriteria = document.getElementById("sortHabits")?.value || "default";
    const filterType = document.getElementById("filterTypeHabits")?.value || "show";
    const sortedHabits = sortHabitsByFrequency(habits, sortCriteria);

    sortedHabits.forEach((habit, index) => {
      const habitContainer = document.createElement("li");
      habitContainer.classList.add("habit-container");

      const habitItem = document.createElement("div");
      habitItem.classList.add("habit-item");

      const habitName = document.createElement("div");
      habitName.classList.add("habit-name");
      habitName.innerHTML = `${habit.habit}`;

      const habitButtons = document.createElement("div");
      habitButtons.classList.add("habit-buttons");

      const markProgressButton = document.createElement("button");
      markProgressButton.textContent = "Progress";
      markProgressButton.onclick = function() {
        showTimeInputForm(index);
      };

      const deleteButton = document.createElement("button");
      deleteButton.classList.add("delete-button");
      const deleteImage = document.createElement("img");
      deleteImage.src = "/png/garbage.png";
      deleteButton.appendChild(deleteImage);
      deleteButton.onclick = function() {
        deleteHabit(index);
      };

      habitButtons.appendChild(markProgressButton);
      habitButtons.appendChild(deleteButton);

      habitItem.appendChild(habitName);
      habitItem.appendChild(habitButtons);
      habitContainer.appendChild(habitItem);

      const frequencyText = document.createElement("div");
      frequencyText.classList.add("frequency-text");
      frequencyText.textContent = `Frequency: ${formatFrequency(habit)}`;
      habitContainer.appendChild(frequencyText);

      const progressText = document.createElement("div");
      progressText.classList.add("progress-text", "small-gray-text");
      progressText.textContent = `Last 3 Progress: ${habit.progress.slice(-3).join(", ")}`;
      habitContainer.appendChild(progressText);

      if (filterType === "gray" && !doesHabitMatchCriteria(habit, sortCriteria)) {
        habitContainer.classList.add("grayed-out");
      } else if (filterType === "hide" && !doesHabitMatchCriteria(habit, sortCriteria)) {
        habitContainer.classList.add("hidden");
      }

      habitList.appendChild(habitContainer);
    });
  }
}

function deleteHabit(habitIndex) {
  const habits = getStoredHabits();
  habits.splice(habitIndex, 1);
  localStorage.setItem("habits", JSON.stringify(habits));
  loadHabits();
  populateHabitSelect();
  populateLineGraphHabitSelect();
}

function showTimeInputForm(habitIndex) {
  currentHabitIndex = habitIndex;
  const timeInputFormContainer = document.getElementById("timeInputFormContainer");
  if (timeInputFormContainer) {
    timeInputFormContainer.style.display = "block";
  }
}

function hideTimeInputForm() {
  const timeInputFormContainer = document.getElementById("timeInputFormContainer");
  if (timeInputFormContainer) {
    timeInputFormContainer.style.display = "none";
  }
  currentHabitIndex = null;
}

function submitTimeInput() {
  const timeInput = document.getElementById("timeInput").value;
  if (currentHabitIndex !== null && timeInput) {
    const habits = getStoredHabits();
    const habit = habits[currentHabitIndex];
    const currentDate = new Date().toLocaleDateString('en-GB').split('/').reverse().join('.');
    habit.progress.push(`${currentDate}: Time: ${timeInput} min`);

    if (habit.progress.length > 3) {
      habit.progress.shift();
    }

    localStorage.setItem("habits", JSON.stringify(habits));
    loadHabits();
    loadProgress();
    drawGraph();
    drawLineGraph();
    hideTimeInputForm();
  }
}

function loadProgress() {
  const habits = getStoredHabits();
  const progressList = document.getElementById("progressList");
  if (progressList) {
    progressList.innerHTML = "";

    const sortCriteria = document.getElementById("sortProgress").value;
    const filterType = document.getElementById("filterType").value;
    const sortedHabits = sortHabitsByFrequency(habits, sortCriteria);

    sortedHabits.forEach((habit, index) => {
      if (habit.progress.length > 0) {
        const progressItem = document.createElement("li");
        progressItem.innerHTML = `<strong>${habit.habit}</strong>`;

        const progressContent = document.createElement("div");
        habit.progress.forEach(progress => {
          const progressEntry = document.createElement("p");
          progressEntry.textContent = progress;
          progressContent.appendChild(progressEntry);
        });

        progressItem.appendChild(progressContent);

        if (filterType === "gray" && !doesHabitMatchCriteria(habit, sortCriteria)) {
          progressItem.classList.add("grayed-out");
        } else if (filterType === "hide" && !doesHabitMatchCriteria(habit, sortCriteria)) {
          progressItem.classList.add("hidden");
        }

        progressList.appendChild(progressItem);
      }
    });
  }
}

function doesHabitMatchCriteria(habit, criteria) {
  if (criteria === "default") return true;
  if (criteria === "daily" && habit.frequencyType === "daily") return true;
  if (criteria === "weekly" && habit.frequencyType === "weekly") return true;
  if (criteria === "monthly" && habit.frequencyType === "monthly") return true;
  if (criteria === "odd" && habit.frequencyType === "monthly" && habit.frequency.some(day => day % 2 !== 0)) return true;
  if (criteria === "even" && habit.frequencyType === "monthly" && habit.frequency.some(day => day % 2 === 0)) return true;
  if (criteria === "everyXDays" && habit.frequencyType === "everyXDays") return true;
  return false;
}

function sortHabitsByFrequency(habits, criteria) {
  return habits.sort((a, b) => {
    if (criteria === "default") return 0;
    if (criteria === "daily" && a.frequencyType === "daily") return -1;
    if (criteria === "weekly" && a.frequencyType === "weekly") return -1;
    if (criteria === "monthly" && a.frequencyType === "monthly") return -1;
    if (criteria === "odd" && a.frequencyType === "monthly" && a.frequency.some(day => day % 2 !== 0)) return -1;
    if (criteria === "even" && a.frequencyType === "monthly" && a.frequency.some(day => day % 2 === 0)) return -1;
    if (criteria === "everyXDays" && a.frequencyType === "everyXDays") return -1;
    return 1;
  });
}

function clearAllHabits() {
  if (confirm("Are you sure you want to delete all habits?")) {
    localStorage.removeItem("habits");
    loadHabits();
    loadProgress();
    populateHabitSelect();
    populateLineGraphHabitSelect();
  }
}

function formatFrequency(habit) {
  if (habit.frequencyType === "daily") {
    return "Daily";
  } else if (habit.frequencyType === "weekly") {
    return `Weekly (Days: ${habit.frequency.join(", ")})`;
  } else if (habit.frequencyType === "monthly") {
    return `Monthly (Days: ${habit.frequency.join(", ")})`;
  } else if (habit.frequencyType === "everyXDays") {
    return `Every ${habit.frequency} days`;
  }
}

function getFrequencyValue(frequencyType) {
  if (frequencyType === "daily") {
    return "daily";
  } else if (frequencyType === "weekly") {
    const days = Array.from(document.querySelectorAll('input[name="weeklyDays"]:checked')).map(input => input.value);
    return days;
  } else if (frequencyType === "monthly") {
    const evenDays = document.getElementById("evenDays").checked ? getEvenDays() : [];
    const oddDays = document.getElementById("oddDays").checked ? getOddDays() : [];
    const selectedCalendarDays = getSelectedCalendarDays();

    return [...evenDays, ...oddDays, ...selectedCalendarDays];
  } else if (frequencyType === "everyXDays") {
    const everyXDays = document.getElementById("everyXDaysInput").value;
    return parseInt(everyXDays, 10);
  }
  return null;
}

function getEvenDays() {
  return [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30];
}

function getOddDays() {
  return [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29];
}

function getSelectedCalendarDays() {
  const calendarInputs = Array.from(document.querySelectorAll('input[name="calendarDays"]:checked'));
  return calendarInputs.map(input => input.value);
}

function updateFrequencyFields() {
  const frequencyType = document.getElementById("frequencyType").value;
  const frequencyInputsDiv = document.getElementById("frequencyInputs");

  if (frequencyInputsDiv) {
    frequencyInputsDiv.innerHTML = "";

    if (frequencyType === "daily") {
    } else if (frequencyType === "weekly") {
      const weeklyInput = document.createElement("div");
      weeklyInput.innerHTML = `
        <label for="weeklyDays">Select days of the week:</label><br>
        <input type="checkbox" name="weeklyDays" value="Monday"> Monday<br>
        <input type="checkbox" name="weeklyDays" value="Tuesday"> Tuesday<br>
        <input type="checkbox" name="weeklyDays" value="Wednesday"> Wednesday<br>
        <input type="checkbox" name="weeklyDays" value="Thursday"> Thursday<br>
        <input type="checkbox" name="weeklyDays" value="Friday"> Friday<br>
        <input type="checkbox" name="weeklyDays" value="Saturday"> Saturday<br>
        <input type="checkbox" name="weeklyDays" value="Sunday"> Sunday
      `;
      frequencyInputsDiv.appendChild(weeklyInput);
    } else if (frequencyType === "monthly") {
      const monthlyInput = document.createElement("div");
      monthlyInput.classList.add("frequency-option");
      monthlyInput.innerHTML = `
        <label for="evenDays">Odd days:</label>
        <input type="checkbox" id="oddDays" name="oddDays"> Odd Days<br><br>
        <label for="evenDays">Even days:</label>
        <input type="checkbox" id="evenDays" name="evenDays"> Even Days<br><br>
        <label for="calendarDays">Select calendar dates:</label><br>
        <input type="date" name="calendarDays" multiple><br>
      `;
      frequencyInputsDiv.appendChild(monthlyInput);
    } else if (frequencyType === "everyXDays") {
      const everyXDaysInput = document.createElement("div");
      everyXDaysInput.classList.add("frequency-option");
      everyXDaysInput.innerHTML = `
        <label for="everyXDaysInput">Every X days:</label>
        <input type="number" id="everyXDaysInput" name="everyXDaysInput" min="1"><br>
      `;
      frequencyInputsDiv.appendChild(everyXDaysInput);
    }
  }
}

function populateHabitSelect() {
  const habitSelect = document.getElementById("habitSelect");
  if (habitSelect) {
    habitSelect.innerHTML = "";

    const habits = getStoredHabits();
    console.log("Stored Habits:", habits); // Debug statement
    if (habits.length === 0) {
      console.log("No habits found in localStorage.");
    }
    habits.forEach((habit, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = habit.habit;
      habitSelect.appendChild(option);
    });
  }
}

function populateLineGraphHabitSelect() {
  const habitSelect = document.getElementById("habitSelectLineGraph");
  if (habitSelect) {
    habitSelect.innerHTML = "";

    const habits = getStoredHabits();
    if (habits.length === 0) {
      console.log("No habits found in localStorage.");
    }
    habits.forEach((habit, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = habit.habit;
      habitSelect.appendChild(option);
    });
  }
}

function startTimer() {
  const habitIndex = document.getElementById("habitSelect").value;
  if (habitIndex !== "") {
    timerStartTime = Date.now();
    localStorage.setItem("timerStartTime", timerStartTime);
    localStorage.setItem("currentHabitIndex", habitIndex);
    updateTimerDisplay();

    // Update the timer display every second
    if (!timerInterval) {
      timerInterval = setInterval(updateTimerDisplay, 1000);
    }
  } else {
    alert("Please select a habit to track.");
  }
}

function stopTimer() {
  const habitIndex = localStorage.getItem("currentHabitIndex");
  if (habitIndex !== null) {
    const habits = getStoredHabits();
    const habit = habits[habitIndex];
    const currentDate = new Date().toLocaleDateString('en-GB').split('/').reverse().join('.');
    const elapsedTime = Math.floor((Date.now() - timerStartTime) / 1000);
    habit.progress.push(`${currentDate}: Timer: ${formatTime(elapsedTime)}`);

    if (habit.progress.length > 3) {
      habit.progress.shift();
    }

    localStorage.setItem("habits", JSON.stringify(habits));
    
    // Clear localStorage timer data
    localStorage.removeItem("timerStartTime");
    localStorage.removeItem("currentHabitIndex");
    
    // Clear the interval to stop updating the timer display
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    // Reset timer-related variables
    timerStartTime = 0;
    currentHabitIndex = null;

    loadProgress();
    drawGraph();
    drawLineGraph();

    // Reset the timer display
    updateTimerDisplay(true);
  }
}

function updateTimerDisplay(reset = false) {
  const timerDisplay = document.getElementById("timerDisplay");
  if (timerDisplay) {
    if (reset || timerStartTime === 0) {
      timerDisplay.textContent = `Timer: 00:00`;
    } else {
      const elapsedTime = Math.floor((Date.now() - timerStartTime) / 1000);
      timerDisplay.textContent = `Timer: ${formatTime(elapsedTime)}`;
    }
  }
}

function updateElapsedTimeDisplay(habitIndex) {
  const habits = getStoredHabits();
  const habit = habits[habitIndex];
  const elapsedTimeDisplay = document.getElementById("elapsedTimeDisplay");
  if (elapsedTimeDisplay) {
    elapsedTimeDisplay.textContent = `Hobby: ${habit.habit}`;
    elapsedTimeDisplay.style.display = "block";
  }
}

function hideElapsedTimeDisplay() {
  const elapsedTimeDisplay = document.getElementById("elapsedTimeDisplay");
  if (elapsedTimeDisplay) {
    elapsedTimeDisplay.style.display = "none";
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function drawGraph() {
  const habits = getStoredHabits();
  const graphType = document.getElementById("graphType").value;
  const habitGraph = document.getElementById("habitGraph").getContext("2d");

  if (habitGraph) {
    habitGraph.clearRect(0, 0, 400, 200);

    const timeSpent = {};
    habits.forEach(habit => {
      timeSpent[habit.habit] = habit.progress.reduce((total, progress) => {
        const [, timePart] = progress.split(': Time: ');
        const [, timerPart] = progress.split(': Timer: ');
        const time = timePart ? parseInt(timePart.split(' ')[0], 10) : 0;
        const timer = timerPart ? timerPart.split(' ')[0].split(':').reduce((acc, t) => acc * 60 + parseInt(t, 10), 0) : 0;
        return total + time * 60 + timer;
      }, 0);
    });

    const totalTime = Object.values(timeSpent).reduce((total, time) => total + time, 0);

    const percentages = {};
    Object.keys(timeSpent).forEach(habit => {
      percentages[habit] = (timeSpent[habit] / totalTime) * 100 || 0;
    });

    let startAngle = 0;
    Object.keys(percentages).forEach(habit => {
      const percentage = percentages[habit];
      const endAngle = startAngle + (percentage / 100) * 2 * Math.PI;
      habitGraph.beginPath();
      habitGraph.moveTo(200, 100);
      habitGraph.arc(200, 100, 100, startAngle, endAngle);
      habitGraph.fillStyle = getRandomColor();
      habitGraph.fill();

      const labelAngle = startAngle + (endAngle - startAngle) / 2;
      const labelX = 200 + Math.cos(labelAngle) * 70;
      const labelY = 100 + Math.sin(labelAngle) * 70;
      habitGraph.fillStyle = 'black';
      habitGraph.font = '12px Arial';
      habitGraph.fillText(habit, labelX, labelY);

      startAngle = endAngle;
    });
  }
}

function drawLineGraph() {
  const habits = getStoredHabits();
  const lineGraphType = document.getElementById("lineGraphType").value;
  const selectedHabitIndex = document.getElementById("habitSelectLineGraph").value;
  const lineGraph = document.getElementById("lineGraph").getContext("2d");

  if (lineGraph) {
    lineGraph.clearRect(0, 0, 400, 200);

    if (selectedHabitIndex === "") {
      alert("Please select a habit to view its progress.");
      return;
    }

    const selectedHabit = habits[selectedHabitIndex];
    const data = {};

    selectedHabit.progress.forEach(progress => {
      const [datePart] = progress.split(':');
      const [day, month] = datePart.split('.').map(Number);
      const time = progress.includes("Timer:")
        ? progress.split(": ")[1]
        : progress.split(": ")[1].split(" ")[0];

      const dateKey = `${day}/${month}`;
      if (!data[dateKey]) {
        data[dateKey] = 0;
      }
      data[dateKey] += parseInt(time, 10);
    });

    const dates = Object.keys(data);
    const values = Object.values(data);

    let xLabels = [];
    if (lineGraphType === "daily") {
      xLabels = dates;
    } else if (lineGraphType === "weekly") {
      xLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    } else if (lineGraphType === "monthly") {
      xLabels = Array.from({ length: 31 }, (_, i) => (i + 1) % 5 === 0 ? (i + 1).toString() : '');
    }

    const maxValue = Math.max(...values);

    lineGraph.beginPath();
    lineGraph.moveTo(30, 20);
    lineGraph.lineTo(30, 180);
    lineGraph.lineTo(390, 180);
    lineGraph.strokeStyle = "white";
    lineGraph.stroke();

    xLabels.forEach((label, index) => {
      const x = 30 + (index * (360 / xLabels.length));
      lineGraph.fillText(label, x, 195);
    });

    for (let i = 0; i <= maxValue; i += Math.ceil(maxValue / 5)) {
      const y = 180 - (i / maxValue) * 160;
      lineGraph.fillText(i, 5, y + 5);
    }

    lineGraph.beginPath();
    lineGraph.moveTo(30, 180);
    dates.forEach((date, index) => {
      const x = 30 + (index * (360 / dates.length));
      const y = 180 - (values[index] / maxValue) * 160;
      lineGraph.lineTo(x, y);
    });
    lineGraph.strokeStyle = "white";
    lineGraph.stroke();
  }
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function cleanupOldProgress() {
  const habits = getStoredHabits();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  habits.forEach(habit => {
    habit.progress = habit.progress.filter(progress => {
      const [datePart] = progress.split(':');
      const [day, month] = datePart.split('.').map(Number);
      const progressDate = new Date(2000 + oneMonthAgo.getFullYear(), month - 1, day);
      return progressDate >= oneMonthAgo;
    });
  });

  localStorage.setItem("habits", JSON.stringify(habits));
}

function restoreTimerState() {
  const storedTimerStartTime = localStorage.getItem("timerStartTime");
  const currentHabitIndex = localStorage.getItem("currentHabitIndex");
  
  if (storedTimerStartTime && currentHabitIndex !== null) {
    timerStartTime = parseInt(storedTimerStartTime, 10);
    updateTimerDisplay();

    // Update the timer display every second
    if (!timerInterval) {
      timerInterval = setInterval(updateTimerDisplay, 1000);
    }
  } else {
    // Reset the timer display if no timer is running
    updateTimerDisplay(true);
  }
}
