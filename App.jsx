import { useEffect, useMemo, useRef, useState } from "react";

// localStorage hook
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // noop
    }
  }, [key, value]);
  return [value, setValue];
}

// Toolbar
function Toolbar({ filter, setFilter, left, onClearCompleted }) {
  const tabs = ["all", "active", "completed"];
  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <span className="counter">
          {left} item{left !== 1 ? "s" : ""} left
        </span>

        <div className="pills">
          {tabs.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`pill ${filter === f ? "pill-active" : ""}`}
              aria-pressed={filter === f}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <button className="link-clear" onClick={onClearCompleted}>
          Clear completed
        </button>
      </div>
    </div>
  );
}

// Single Todo item
function TodoItem({ todo, onToggle, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  function commit() {
    const t = draft.trim();
    if (t && t !== todo.text) onEdit(todo.id, t);
    setEditing(false);
  }
  function cancel() {
    setDraft(todo.text);
    setEditing(false);
  }

  return (
    <li className="item">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        className="checkbox"
        aria-label={todo.completed ? "Mark as active" : "Mark as completed"}
      />

      {!editing ? (
        <button
          className={`item-text ${todo.completed ? "completed" : ""}`}
          onClick={() => onToggle(todo.id)}
          onDoubleClick={() => setEditing(true)}
          title="Click to toggle • Double-click to edit"
        >
          {todo.text}
        </button>
      ) : (
        <input
          ref={inputRef}
          className="edit-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
        />
      )}

      <div className="actions">
        <button className="btn btn-outline" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button className="btn btn-danger" onClick={() => onDelete(todo.id)}>
          Delete
        </button>
      </div>
    </li>
  );
}

// App
export default function App() {
  const [todos, setTodos] = useLocalStorage("todos-v1", []);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' | 'active' | 'completed'

  function addTodo(text) {
    const t = text.trim();
    if (!t) return;
    const newTodo = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      text: t,
      completed: false,
    };
    setTodos((prev) => [newTodo, ...prev]);
    setInput("");
  }

  function toggle(id) {
    setTodos((prev) =>
      prev.map((x) => (x.id === id ? { ...x, completed: !x.completed } : x))
    );
  }

  function del(id) {
    setTodos((prev) => prev.filter((x) => x.id !== id));
  }

  function edit(id, text) {
    setTodos((prev) => prev.map((x) => (x.id === id ? { ...x, text } : x)));
  }

  function clearCompleted() {
    setTodos((prev) => prev.filter((x) => !x.completed));
  }

  const filtered = useMemo(() => {
    switch (filter) {
      case "active":
        return todos.filter((t) => !t.completed);
      case "completed":
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  const left = useMemo(() => todos.filter((t) => !t.completed).length, [todos]);

  return (
    <div className="app">
      <div className="wrap">
        <header className="header">
          <h1 className="header-title">To-Do List</h1>
          
        </header>

        <div className="card">
          <div className="input-row">
            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTodo(input);
              }}
              placeholder="What needs to be done?"
              aria-label="New task"
            />
            <button className="btn" onClick={() => addTodo(input)}>
              Add
            </button>
          </div>

          <ul className="list">
            {filtered.length === 0 ? (
              <li className="item" style={{ justifyContent: "center" }}>
                No items. Add your first task!
              </li>
            ) : (
              filtered.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={toggle}
                  onDelete={del}
                  onEdit={edit}
                />
              ))
            )}
          </ul>

          <Toolbar
            filter={filter}
            setFilter={setFilter}
            left={left}
            onClearCompleted={clearCompleted}
          />
        </div>

        <footer className="footer-note">
          Double-click a task to edit • Press Enter to save, Esc to cancel
        </footer>
      </div>
    </div>
  );
}
