// 這個應用程式用來管理待辦清單，會將資料保存在 localStorage 中
// 以便重新整理後仍然保留原本的待辦事項內容。

const STORAGE_KEY = 'todo-app-items';

const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const remainingCount = document.getElementById('remaining-count');

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

// 更新底部的未完成數量，並決定是否顯示空白提示文字。
function updateSummary() {
  const todos = loadTodos();
  const remaining = todos.filter((todo) => !todo.completed).length;

  remainingCount.textContent = String(remaining);

  if (todos.length === 0) {
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
  }
}

// 渲染待辦列表，將每筆資料轉成 DOM 節點。
function renderTodos() {
  const todos = loadTodos();

  todoList.innerHTML = '';

  todos.forEach((todo) => {
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

// 監聽表單提交事件，新增待辦事項。
todoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addTodo(todoInput.value);
  todoInput.value = '';
  todoInput.focus();
});

// 初始化頁面：先渲染列表，再顯示空白提示狀態。
renderTodos();
