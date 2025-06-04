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

  //! Check if the due date is valid!
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


//* Sort Tasks by Date 
function sortTasks(tasks) {
  return tasks.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
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
  const tasks = document.querySelectorAll("#task-list li:not(.hidden)");
  const message = document.getElementById("empty-message");
  const allChecked = [...tasks].every(li => li.querySelector("input").checked);
  if (tasks.length === 0 || allChecked) {
    message.classList.remove("hidden");
  } else {
    message.classList.add("hidden");
  }
}


//*  Render Tasks on Page (Main Function to display tasks)
function renderTasks() {
  taskList.innerHTML = '';
  const filteredTasks = filterTasks(tasks, currentFilter);
  filteredTasks.forEach(task => {
    const li = document.createElement("li");
    li.className = task.completed ? "completed" : "";
    li.innerHTML = `
      <div class="task-content">
        <span class="task-text">${task.text}</span>
        <span class="task-date">Due: ${formatDate(task.date)}</span>
      </div>
      <div class="task-actions">
        <input type="checkbox" class="complete-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''} aria-label="Mark task as completed">
        <button class="delete-btn" data-id="${task.id}" aria-label="Delete task">🗑️</button>
      </div>
    `;
    taskList.appendChild(li);
  });

  //* Checkbox Event 
  document.querySelectorAll(".complete-checkbox").forEach(checkbox => {
    checkbox.addEventListener("change", e => {
      const id = Number(e.target.dataset.id);
      const task = tasks.find(t => t.id === id);
      if (task) {
        task.completed = e.target.checked;
        reorderTasks(); 
        saveTasks(tasks);
        renderTasks();
      }
    });
  });

  //* Delete Event 
  document.querySelectorAll(".delete-btn").forEach(button => {
    button.addEventListener("click", e => {
      const id = Number(e.target.dataset.id);
      tasks = tasks.filter(t => t.id !== id);
      saveTasks(tasks);
      renderTasks();
    });
  });

  updateActiveFilterButton(); // Highlight the correct filter button
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

//* Fetch Initial Tasks from API (Only if localStorage is empty or all tasks are completed) 
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
      date: new Date().toISOString().split('T')[0], //* today's date
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

//* Event Listeners for Buttons
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
if (getTasks().length === 0 || getTasks().every(task => task.completed)) 
  {  
    tasks = []; 
    renderTasks(); 
    updateActiveFilterButton(); 
    updateTaskCounts(); 
    console.log("No tasks found in localStorage. Fetching sample tasks from API...");
    fetchInitialTasks(); 
  }
else //* So Load tasks from localStorage
  {
    tasks = getTasks();  
    renderTasks();
  }
