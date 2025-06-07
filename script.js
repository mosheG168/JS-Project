//* Task Manager Application Script:
const taskList = document.getElementById("task-list");
const addTaskBtn = document.getElementById("add-task");
const taskTextInput = document.getElementById("task-text");
const taskDateInput = document.getElementById("task-date");
const filterAllBtn = document.getElementById("filter-all");
const filterActiveBtn = document.getElementById("filter-active");
const filterCompletedBtn = document.getElementById("filter-completed");
const sortDateBtn = document.getElementById("sort-date");
//* Global Variables 
let tasks = [];                //* placeholder for all task objects
let currentFilter = "all";     //* default is set to "All".

//* Flatpickr for the date input
flatpickr("#task-date", {
  dateFormat: "d-m-Y",      
  allowInput: true,        
  disableMobile: true      
});

//* Function to get today's date in the correct format 
function getTodayFormatted() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  return `${day}-${month}-${year}`;
}

//* Save tasks to localStorage
function saveTasks(tasks) {
  const jsonString = JSON.stringify(tasks);
  localStorage.setItem("tasks", jsonString);
}

//* Pull tasks from localStorage
function getTasks() {
  const data = localStorage.getItem("tasks");
  return data ? JSON.parse(data) : [];
}

//* Add Task to list 
function addTask() {
  const text = taskTextInput.value.trim();
  const dueDate = taskDateInput.value;
  if (text === '' || dueDate === '') //* Simple validation to check if inputs are empty..
    {
      alert("Please fill in both the task description and due date.");
      return;
    }
  //* Check if the due date is valid!
  const today = new Date();
  today.setHours(0, 0, 0, 0); //* Standart to ignore time.
  const selectedDate = new Date(dueDate);
  if (selectedDate < today) 
    {
      alert("Stop thinking about the past!! Set a due-date for the future 🤘🏽");
      taskDateInput.value = '';
      return;
    }
  const newTask = {
    id: Date.now(),         
    text,                   
    date: dueDate,         
    completed: false        
  };
  tasks.push(newTask);
  saveTasks(tasks);
  renderTasks();    
  taskTextInput.value = ''; //* Clear the input field after adding a task.
  taskDateInput.value = '';
}


//* Filter Tasks 
function filterTasks(tasks, filter) {
  switch (filter) {
    case "completed":
      return tasks.filter(task => task.completed);
    case "active":
      return tasks.filter(task => !task.completed);
    case "all":
    default:
      return tasks;
  }
}

//* Parse Date from D-M-Y format to Date object
function parseDMY(dateStr) {
  const [day, month, year] = dateStr.split("-");
  return new Date(`${year}-${month}-${day}`);
}

//* Sort Tasks by Date 
function sortTasks(tasks) {
  return tasks.slice().sort((a, b) => parseDMY(a.date) - parseDMY(b.date));
}

function updateTaskCounts() {
  const counts = {
    all: tasks.length,
    active: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length
  };
  document.querySelectorAll(".task-count").forEach(span => {
    const filter = span.dataset.filter;
    span.textContent = counts[filter];
  });
}

//*  Format Date for Display 
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = String(date.getFullYear()).slice(-2); // Get last two digits
  return `${day}/${month}/${year}`;
}

//* Check if the task list is empty or all tasks are completed (Helper function before fething tasks from API)
function checkEmptyState() {
  const message = document.getElementById("empty-message");
  const total = tasks.length;
  const activeCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;
  let shouldShowMessage = false;

  if (currentFilter === "active" && activeCount === 0) 
    {
      shouldShowMessage = true;
    } 
  else if (currentFilter === "completed" && completedCount === total && total > 0) 
    {
      shouldShowMessage = true;
    } 
  else if (currentFilter === "all" && (total === 0 || completedCount === total)) 
    {
      shouldShowMessage = true;
    }

  if (shouldShowMessage)  //* If no tasks are available or all tasks are completed so...
    {
      message.classList.remove("hidden");
    } 
  else 
    {
      message.classList.add("hidden");
    }
}

//*  Render Tasks on Page (Main Function of the program to display tasks)
function renderTasks() {
  taskList.innerHTML = '';
  const filteredTasks = filterTasks(tasks, currentFilter);
  filteredTasks.forEach(task => {
      const li = document.createElement("li");
      li.className = task.completed ? "completed" : "";
      li.innerHTML = `
        <div class="task-content">
          <span class="task-text" contenteditable="false" data-id="${task.id}">${task.text}</span>
          <div class="task-info">
            <button class="edit-btn" data-id="${task.id}" aria-label="Edit task">✏️</button>
            <span class="due-label">Due By -</span>
            <input type="text" class="date-picker" value="${task.date}" data-id="${task.id}">
          </div>
        </div>
        <div class="task-actions">
          <input type="checkbox" class="complete-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
          <button class="delete-btn" data-id="${task.id}">🗑️</button>
        </div>
      `;
    taskList.appendChild(li);
    flatpickr(".date-picker", {
      dateFormat: "d-m-Y",  
      allowInput: true,
      defaultDate: null,
      disableMobile: true,
      onClose: function(selectedDates, dateStr, instance) {
        const input = instance._input;
        const id = Number(input.dataset.id);
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        const selected = selectedDates[0];
        const isoDate = selected.toISOString().split("T")[0]; 
        if (task.date !== isoDate) 
          {
            task.date = isoDate;
            saveTasks(tasks);
            renderTasks();
          }
      }
  });
});

  //* Checkbox Event 
  document.querySelectorAll(".complete-checkbox").forEach(checkbox => {
    checkbox.addEventListener("change", e => {
      const id = Number(e.target.dataset.id);
      const task = tasks.find(t => t.id === id);
      if (task) 
        {
          task.completed = e.target.checked;
          reorderTasks();
          saveTasks(tasks);
          renderTasks();
        }
    });
  });

  //* Delete Button for Tasks
  document.querySelectorAll(".delete-btn").forEach(button => {
    button.addEventListener("click", e => {
      const id = Number(e.target.dataset.id);
      tasks = tasks.filter(t => t.id !== id);
      saveTasks(tasks);
      renderTasks();
    });
  });

  //*  Edit Text Button inline 
  document.querySelectorAll(".edit-btn").forEach(button => {
    button.addEventListener("click", e => {
      const id = Number(e.target.dataset.id);
      const li = e.target.closest("li");
      const textSpan = li.querySelector(".task-text");
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      textSpan.contentEditable = "true";
      textSpan.focus();

      textSpan.addEventListener("blur", () => {
        textSpan.contentEditable = "false";
        task.text = textSpan.textContent.trim();
        saveTasks(tasks);
      });
    });
  });

  //* Click on Date to Edit
  document.querySelectorAll(".task-date").forEach(span => {
    span.addEventListener("click", e => {
      const id = Number(e.target.dataset.id);
      const li = e.target.closest("li");
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      const dateInput = li.querySelector(".editable-date");
      const dateSpan = li.querySelector(".task-date");
      dateSpan.classList.add("hidden");
      dateInput.classList.remove("hidden");
      dateInput.focus();
      dateInput.addEventListener("blur", () => {
        const newDate = dateInput.value;
        if(newDate !== task.date) 
          {
            task.date = newDate;
            saveTasks(tasks);
          }
        renderTasks();  
      });
    });
  });
  updateActiveFilterButton();
  updateTaskCounts();
  checkEmptyState();
}

//* Reorder Tasks (Helper function to keep unchecked tasks at the top and checked tasks at the bottom)
function reorderTasks() {
  //* Keep the original order for unchecked tasks (based on creation time)
  const unchecked = tasks.filter(t => !t.completed).sort((a, b) => a.id - b.id);
  const checked = tasks.filter(t => t.completed).sort((a, b) => a.id - b.id);
  tasks = [...unchecked, ...checked];
}

//* Highlight Active Buttons
function updateActiveFilterButton() {
  document.querySelectorAll(".filters button").forEach(btn => {
    btn.classList.remove("active");
  });

  if(currentFilter === "all")
    {
      filterAllBtn.classList.add("active");
    }
  else if(currentFilter === "active") 
    {
      filterActiveBtn.classList.add("active");
    } 
  else if (currentFilter === "completed")
    {
      filterCompletedBtn.classList.add("active");
    } 
}

//* Fetch Initial Tasks from API (Only if localStorage is empty or all tasks are completed!!) 
async function fetchInitialTasks() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5');

    if (!response.ok) 
      {
        throw new Error(`Failed to fetch tasks. Status: ${response.status}`);
      }

    const data = await response.json();
    const convertedTasks = data.map(item => ({
      id: item.id,
      text: item.title,
      date: getTodayFormatted(),
      completed: false
    }));

    tasks = [...convertedTasks];
    saveTasks(tasks);
    renderTasks();
  } 
  catch (error) {
    console.error("API Load Error:", error);

    alert("⚠️ Unable to load tasks from the server. Please check your connection or try again later.");

    const errorMsg = document.createElement('div');
    errorMsg.textContent = "Error loading tasks from the server.";
    errorMsg.style.color = "red";
    errorMsg.style.padding = "10px";
    errorMsg.style.backgroundColor = "#ffe6e6";
    errorMsg.style.marginTop = "10px";
    document.querySelector("main").prepend(errorMsg);
  }
}

//* Event Listeners for Buttons:
addTaskBtn.addEventListener("click", addTask);

filterAllBtn.addEventListener("click", () => {
  currentFilter = "all";
  renderTasks();
});

filterActiveBtn.addEventListener("click", () => {
  currentFilter = "active";
  renderTasks();
});

filterCompletedBtn.addEventListener("click", () => {
  currentFilter = "completed";
  renderTasks();
});

sortDateBtn.addEventListener("click", () => {
  tasks = sortTasks(tasks);
  saveTasks(tasks);
  renderTasks();
});

//* Initial Load of Tasks
//* Check if there are tasks in localStorage or if all tasks are completed so fetch from api:
const storedTasks = getTasks();
const activeTasks = storedTasks.filter(task => !task.completed);
const completedTasks = storedTasks.filter(task => task.completed);

if (activeTasks.length === 0 || completedTasks.length === storedTasks.length) {
  tasks = [];
  renderTasks();
  updateActiveFilterButton();
  updateTaskCounts();
  console.log("No active tasks or all tasks completed. Fetching sample tasks from API...");
  fetchInitialTasks();
} else {
  tasks = storedTasks;
  renderTasks();
}
