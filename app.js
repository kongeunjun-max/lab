document.addEventListener('DOMContentLoaded', () => {
  /* ==========================================================================
     State Management
     ========================================================================== */
  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  let currentFilter = 'all'; // 'all', 'active', 'completed'

  /* ==========================================================================
     DOM Elements
     ========================================================================== */
  const todoForm = document.getElementById('todo-form');
  const todoInput = document.getElementById('todo-input');
  const todoList = document.getElementById('todo-list');
  const emptyState = document.getElementById('empty-state');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const itemsLeft = document.getElementById('items-left');
  const clearCompletedBtn = document.getElementById('clear-completed-btn');
  const themeBtn = document.getElementById('theme-btn');
  const themeIcon = document.getElementById('theme-icon');
  const currentDateEl = document.getElementById('current-date');
  const filterTabs = document.querySelectorAll('.filter-tab');
  const tabIndicator = document.getElementById('tab-indicator');

  /* ==========================================================================
     Theme & Initialization Setup
     ========================================================================== */
  // Load saved theme or default to dark
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    updateThemeIcon(false);
  } else {
    updateThemeIcon(true);
  }

  // Set Current Date in Korean Format
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  const today = new Date();
  currentDateEl.textContent = today.toLocaleDateString('ko-KR', options);

  // Initialize Lucide Icons
  lucide.createIcons();

  /* ==========================================================================
     Helper Functions
     ========================================================================== */
  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  function updateThemeIcon(isDark) {
    if (isDark) {
      themeIcon.setAttribute('data-lucide', 'sun');
    } else {
      themeIcon.setAttribute('data-lucide', 'moon');
    }
    lucide.createIcons();
  }

  // Update position and size of sliding indicator on tabs
  function updateTabIndicator() {
    const activeTab = document.querySelector('.filter-tab.active');
    if (activeTab && tabIndicator) {
      const activeRect = activeTab.getBoundingClientRect();
      const parentRect = activeTab.parentElement.getBoundingClientRect();
      
      const leftOffset = activeRect.left - parentRect.left;
      tabIndicator.style.width = `${activeRect.width}px`;
      tabIndicator.style.transform = `translateX(${leftOffset}px)`;
    }
  }

  // Handle window resizing to keep the tab indicator aligned correctly
  window.addEventListener('resize', updateTabIndicator);

  /* ==========================================================================
     Render Application State
     ========================================================================== */
  function render() {
    // Clear list
    todoList.innerHTML = '';

    // Filter tasks
    const filteredTasks = tasks.filter(task => {
      if (currentFilter === 'active') return !task.completed;
      if (currentFilter === 'completed') return task.completed;
      return true; // 'all'
    });

    // Toggle Empty State Visibility
    if (filteredTasks.length === 0) {
      emptyState.classList.remove('hidden');
      todoList.style.display = 'none';
      
      // Customize empty state message depending on filter
      const emptyTitle = emptyState.querySelector('h3');
      const emptyDesc = emptyState.querySelector('p');
      if (currentFilter === 'active') {
        emptyTitle.textContent = '진행 중인 할 일이 없습니다';
        emptyDesc.textContent = '모든 할 일을 마쳤습니다! 편안한 시간 보내세요.';
      } else if (currentFilter === 'completed') {
        emptyTitle.textContent = '완료된 할 일이 없습니다';
        emptyDesc.textContent = '완료된 할 일이 아직 없네요. 힘내서 완료해 볼까요?';
      } else {
        emptyTitle.textContent = '할 일이 없습니다';
        emptyDesc.textContent = '새로운 할 일을 추가하고 오늘 하루를 알차게 시작해 보세요!';
      }
    } else {
      emptyState.classList.add('hidden');
      todoList.style.display = 'flex';

      // Programmatically build tasks list to avoid XSS issues
      filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `todo-item ${task.completed ? 'checked' : ''}`;
        li.dataset.id = task.id;

        // Content container (checkbox + text)
        const contentDiv = document.createElement('div');
        contentDiv.className = 'todo-content';
        contentDiv.addEventListener('click', () => toggleTask(task.id));

        // Custom Checkbox
        const checkbox = document.createElement('div');
        checkbox.className = 'custom-checkbox';
        
        const checkIcon = document.createElement('i');
        checkIcon.setAttribute('data-lucide', 'check');
        checkIcon.className = 'checkbox-check';
        
        checkbox.appendChild(checkIcon);

        // Todo Text
        const textSpan = document.createElement('span');
        textSpan.className = 'todo-text';
        textSpan.textContent = task.text;

        contentDiv.appendChild(checkbox);
        contentDiv.appendChild(textSpan);

        // Delete Button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.setAttribute('aria-label', '할 일 삭제');
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent toggling the task completion
          deleteTask(task.id, li);
        });

        const trashIcon = document.createElement('i');
        trashIcon.setAttribute('data-lucide', 'trash-2');
        
        deleteBtn.appendChild(trashIcon);

        li.appendChild(contentDiv);
        li.appendChild(deleteBtn);
        todoList.appendChild(li);
      });

      // Refresh Lucide Icons for new items
      lucide.createIcons();
    }

    // Update Statistics
    updateStats();
    
    // Fix slider position
    setTimeout(updateTabIndicator, 10);
  }

  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;

    // Progress Bar
    const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);
    progressBar.style.width = `${progressPercent}%`;
    progressText.textContent = `${completed} / ${total} 완료 (${progressPercent}%)`;

    // Items Left
    itemsLeft.textContent = `${active}개의 할 일 남음`;
  }

  /* ==========================================================================
     Task Actions
     ========================================================================== */
  function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newTask = {
      id: Date.now(),
      text: trimmed,
      completed: false
    };

    tasks.push(newTask);
    saveTasks();
    render();
  }

  function toggleTask(id) {
    tasks = tasks.map(task => {
      if (task.id === id) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    
    saveTasks();
    render();
  }

  function deleteTask(id, element) {
    // Add exit animation class
    element.classList.add('removing');

    // Wait for the slideOut CSS animation (250ms) to complete before updating data & DOM
    element.addEventListener('animationend', () => {
      tasks = tasks.filter(task => task.id !== id);
      saveTasks();
      render();
    }, { once: true });
  }

  /* ==========================================================================
     Event Listeners
     ========================================================================== */
  // Form submission
  todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask(todoInput.value);
    todoInput.value = '';
    todoInput.focus();
  });

  // Filter Tabs Event Listeners
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.getAttribute('data-filter');
      render();
    });
  });

  // Clear Completed
  clearCompletedBtn.addEventListener('click', () => {
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) return;

    // Grab all DOM list items that represent completed tasks to animate their exit
    const items = todoList.querySelectorAll('.todo-item.checked');
    let animatePromises = [];

    items.forEach(element => {
      element.classList.add('removing');
      const promise = new Promise((resolve) => {
        element.addEventListener('animationend', resolve, { once: true });
      });
      animatePromises.push(promise);
    });

    // Wait for animations to complete before modifying database
    if (animatePromises.length > 0) {
      Promise.all(animatePromises).then(() => {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        render();
      });
    } else {
      tasks = tasks.filter(t => !t.completed);
      saveTasks();
      render();
    }
  });

  // Theme Toggle
  themeBtn.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('light-theme');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    updateThemeIcon(!isDark);
  });

  /* ==========================================================================
     Initial Render
     ========================================================================== */
  render();
});
