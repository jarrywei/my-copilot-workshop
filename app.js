// 這個應用程式用來管理待辦清單，並將資料保存在 localStorage。
// 同時也會記錄使用者的主題偏好與目前篩選狀態，讓畫面在重新整理後維持一致。

const STORAGE_KEY = 'todo-app-items';
const THEME_STORAGE_KEY = 'todo-theme-preference';

const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const remainingCount = document.getElementById('remaining-count');
const themeToggle = document.getElementById('theme-toggle');
const themeToggleIcon = document.querySelector('.theme-toggle__icon');
const themeToggleText = document.querySelector('.theme-toggle__text');
const filterButtons = document.querySelectorAll('.filter-btn');

let currentFilter = 'all';

// 讀取 localStorage 中的待辦資料，若不存在則回傳空陣列。
function loadTodos() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('讀取待辦資料失敗，已使用空清單。', error);
    return [];
  }
}

// 儲存待辦資料到 localStorage。
function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// 取得系統的深淺色設定。
function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// 取得目前要套用的主題：
// 若使用者曾手動選擇，就用使用者設定；否則跟隨作業系統設定。
function getThemePreference() {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return getSystemTheme();
}

// 設定 body 上的資料屬性，並同步更新切換按鈕文字與圖示。
function applyTheme(theme, shouldPersist = false) {
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light';
  document.body.dataset.theme = resolvedTheme;

  if (shouldPersist) {
    localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
  }

  if (resolvedTheme === 'dark') {
    themeToggleIcon.textContent = '☀️';
    themeToggleText.textContent = '淺色模式';
    themeToggle.setAttribute('aria-label', '切換為淺色模式');
  } else {
    themeToggleIcon.textContent = '🌙';
    themeToggleText.textContent = '深色模式';
    themeToggle.setAttribute('aria-label', '切換為深色模式');
  }
}

// 初始化主題設定，並依照使用者偏好或系統設定來顯示。
function initTheme() {
  applyTheme(getThemePreference(), false);
}

// 切換主題模式，並記錄為使用者偏好。
function toggleTheme() {
  const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme, true);
}

// 依照目前篩選狀態回傳要顯示的待辦資料。
function getFilteredTodos(todos) {
  if (currentFilter === 'active') {
    return todos.filter((todo) => !todo.completed);
  }

  if (currentFilter === 'completed') {
    return todos.filter((todo) => todo.completed);
  }

  return todos;
}

// 更新底部的未完成數量，這個數字永遠以全部待辦計算，不受篩選影響。
function updateSummary() {
  const todos = loadTodos();
  const remaining = todos.filter((todo) => !todo.completed).length;
  remainingCount.textContent = String(remaining);
}

// 決定當前篩選條件下，清單為空時顯示哪一種提示文字。
function updateEmptyState(filteredTodos, totalTodos) {
  if (filteredTodos.length > 0) {
    emptyState.hidden = true;
    return;
  }

  emptyState.hidden = false;

  if (currentFilter === 'all') {
    emptyState.textContent = '還沒有任何待辦事項,新增一個吧!';
    return;
  }

  if (currentFilter === 'active') {
    if (totalTodos === 0) {
      emptyState.textContent = '還沒有任何待辦事項,新增一個吧!';
      return;
    }

    emptyState.textContent = '目前沒有未完成的待辦事項';
    return;
  }

  if (totalTodos === 0) {
    emptyState.textContent = '還沒有任何待辦事項,新增一個吧!';
    return;
  }

  emptyState.textContent = '目前沒有已完成的待辦事項';
}

// 渲染待辦列表，依照目前篩選狀態顯示對應項目。
function renderTodos() {
  const todos = loadTodos();
  const filteredTodos = getFilteredTodos(todos);

  todoList.innerHTML = '';

  filteredTodos.forEach((todo) => {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', `完成待辦: ${todo.text}`);
    checkbox.addEventListener('change', () => {
      toggleTodo(todo.id);
    });

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '刪除';
    deleteBtn.setAttribute('aria-label', `刪除待辦: ${todo.text}`);
    deleteBtn.addEventListener('click', () => {
      deleteTodo(todo.id);
    });

    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(deleteBtn);
    todoList.appendChild(li);
  });

  updateSummary();
  updateEmptyState(filteredTodos, todos.length);
}

// 新增待辦事項，若輸入內容為空白則忽略。
function addTodo(text) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return;
  }

  const todos = loadTodos();
  const newTodo = {
    id: Date.now() + Math.random(),
    text: trimmedText,
    completed: false,
  };

  todos.push(newTodo);
  saveTodos(todos);
  renderTodos();
}

// 切換待辦完成狀態。
function toggleTodo(id) {
  const todos = loadTodos();
  const updatedTodos = todos.map((todo) => {
    if (todo.id === id) {
      return { ...todo, completed: !todo.completed };
    }

    return todo;
  });

  saveTodos(updatedTodos);
  renderTodos();
}

// 刪除指定待辦事項。
function deleteTodo(id) {
  const todos = loadTodos().filter((todo) => todo.id !== id);
  saveTodos(todos);
  renderTodos();
}

// 更新目前選中的篩選按鈕樣式與狀態。
function setFilter(nextFilter) {
  currentFilter = nextFilter;

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  renderTodos();
}

// 監聽表單提交事件，新增待辦事項。
todoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addTodo(todoInput.value);
  todoInput.value = '';
  todoInput.focus();
});

// 監聽深色模式切換按鈕，切換主題。
themeToggle.addEventListener('click', toggleTheme);

// 監聽篩選按鈕點擊事件。
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setFilter(button.dataset.filter);
  });
});

// 監聽系統深淺色設定變更，只有在使用者沒有手動設定時才跟隨系統。
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
const handleSystemThemeChange = (event) => {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === 'light' || storedTheme === 'dark') {
    return;
  }

  applyTheme(event.matches ? 'dark' : 'light', false);
};

if (typeof prefersDarkScheme.addEventListener === 'function') {
  prefersDarkScheme.addEventListener('change', handleSystemThemeChange);
} else if (typeof prefersDarkScheme.addListener === 'function') {
  prefersDarkScheme.addListener(handleSystemThemeChange);
}

// 初始化頁面，先套用主題，再渲染待辦清單。
initTheme();
renderTodos();
