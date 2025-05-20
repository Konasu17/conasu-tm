document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("task-form");
  const taskListAll = document.getElementById("task-list");
  const tabLists = document.querySelectorAll(".task-list[data-period]");
  const timeSummary = {
    "朝": document.getElementById("morning-summary"),
    "昼": document.getElementById("afternoon-summary"),
    "夕方": document.getElementById("evening-summary"),
    "夜": document.getElementById("night-summary"),
  };

  function getTasks() {
    return JSON.parse(localStorage.getItem("tasks") || "[]");
  }

  function saveTasks(tasks) {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  function renderTasks() {
    const tasks = getTasks();
    taskListAll.innerHTML = "";
    tabLists.forEach(tab => tab.innerHTML = "");
    const timeTotals = { "朝": 0, "昼": 0, "夕方": 0, "夜": 0 };

    tasks.forEach((task, index) => {
      if (!task.completed) {
        const mins = parseInt(task.duration);
        if (!timeTotals[task.timePeriod]) timeTotals[task.timePeriod] = 0;
        timeTotals[task.timePeriod] += mins;
      }
      const el = createTaskElement(task, index);
      taskListAll.appendChild(el);
      const tabList = document.querySelector(`.task-list[data-period='${task.timePeriod}']`);
      if (tabList) {
        const tabEl = createTaskElement(task, index);
        tabList.appendChild(tabEl);
      }
    });

    Object.entries(timeTotals).forEach(([period, total]) => {
      const badge = timeSummary[period];
      if (!badge) return;
      if (total > 0) {
        const end = new Date();
        end.setMinutes(end.getMinutes() + total);
        const hh = end.getHours().toString().padStart(2, '0');
        const mm = end.getMinutes().toString().padStart(2, '0');
        badge.textContent = `${total}分 → 🕒 ${hh}:${mm}`;
      } else {
        badge.textContent = "完了 🎉";
      }
    });

    initializeSortable();
  }

  function createTaskElement(task, index) {
    const div = document.createElement("div");
    div.className = "list-group-item d-flex justify-content-between align-items-center task small-text";
    div.setAttribute("data-index", index);

    const inner = document.createElement("div");
    inner.className = "d-flex align-items-center gap-2 flex-wrap";
    inner.style.overflow = "hidden";

    const handle = document.createElement("span");
    handle.className = "drag-handle";
    handle.textContent = "☰";
    inner.appendChild(handle);

    const icon = document.createElement("i");
    icon.className = `bi task-icon ${
      task.timePeriod === "朝" ? "bi-brightness-alt-high morning-icon"
      : task.timePeriod === "昼" ? "bi-sun afternoon-icon"
      : task.timePeriod === "夕方" ? "bi-sunset evening-icon"
      : "bi-moon night-icon"
    }`;
    inner.appendChild(icon);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "form-check-input";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      updateTask(index, task);
    });
    inner.appendChild(checkbox);

    const name = document.createElement("span");
    name.className = "task-name text-truncate";
    name.style.maxWidth = "180px";
    name.textContent = `(${task.duration}分) ${task.name}`;
    inner.appendChild(name);

    const badge = document.createElement("span");
    badge.className = `badge ${
      task.priority == 3 ? "bg-danger"
      : task.priority == 2 ? "bg-warning"
      : "bg-primary"
    } important-badge`;
    badge.textContent = task.priority == 3 ? "高" : task.priority == 2 ? "中" : "低";
    inner.appendChild(badge);

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn btn btn-outline-secondary btn-sm";
    editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
    editBtn.addEventListener("click", () => openEditModal(index));
    inner.appendChild(editBtn);

    div.appendChild(inner);
    return div;
  }

  function updateTask(index, newTask) {
    const tasks = getTasks();
    tasks[index] = newTask;
    saveTasks(tasks);
    renderTasks();
  }

  function deleteTask(index) {
    const tasks = getTasks();
    tasks.splice(index, 1);
    saveTasks(tasks);
    renderTasks();
    const modalEl = document.getElementById("editModal");
    bootstrap.Modal.getInstance(modalEl)?.hide();
  }

  function openEditModal(index) {
    const task = getTasks()[index];
    document.getElementById("edit-index").value = index;
    document.getElementById("edit-name").value = task.name;
    document.getElementById("edit-duration").value = task.duration;
    document.getElementById("edit-time-period").value = task.timePeriod;
    document.getElementById("edit-priority").value = task.priority;

    const modalEl = document.getElementById("editModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }

  function syncTimeSelectWithActiveTab() {
    const active = document
      .querySelector(".nav-tabs .active")
      .getAttribute("href")
      .replace("#", "");
    const map = { morning: "朝", afternoon: "昼", evening: "夕方", night: "夜" };
    if (map[active]) document.getElementById("task-time-period").value = map[active];
  }

  document.getElementById("edit-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const index = parseInt(document.getElementById("edit-index").value);
    const updatedTask = {
      name: document.getElementById("edit-name").value,
      duration: document.getElementById("edit-duration").value,
      timePeriod: document.getElementById("edit-time-period").value,
      priority: document.getElementById("edit-priority").value,
      completed: getTasks()[index].completed,
    };
    updateTask(index, updatedTask);
    bootstrap.Modal.getInstance(document.getElementById("editModal"))?.hide();
  });

  document.getElementById("delete-task").addEventListener("click", function () {
    const index = parseInt(document.getElementById("edit-index").value);
    if (confirm("本当に削除しますか？")) {
      deleteTask(index);
    }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("task-name").value.trim();
    const duration = document.getElementById("task-duration").value;
    const timePeriod = document.getElementById("task-time-period").value;
    const priority = document.getElementById("task-priority").value;
    if (name && duration && timePeriod) {
      const tasks = getTasks();
      tasks.push({ name, duration, timePeriod, priority, completed: false });
      saveTasks(tasks);
      form.reset();                  // ← ここで朝に戻るので
      syncTimeSelectWithActiveTab(); // ← すぐに補正
      renderTasks();
    }
  });

  /* --- ここだけ置き換え --- */
  function initializeSortable() {
    document.querySelectorAll(".task-list").forEach(list => {
      if (list.classList.contains("sortable-initialized")) return;

      new Sortable(list, {
        animation: 150,
        handle: ".drag-handle",

        /** 並べ替え終了時 **/
        onEnd: (evt) => {
          const toList      = evt.to;                    // ドロップ先リスト
          const period      = toList.dataset.period;     // undefined ⇒ “全体” タブ
          const tasks       = getTasks();                // 現在の配列
          const orderedEls  = Array.from(toList.children);
          const newIndexes  = orderedEls.map(el => +el.dataset.index);

          if (!period) {
            /* === “全体” タブ === */
            const newOrder = newIndexes.map(i => tasks[i]);
            saveTasks(newOrder);

          } else {
            /* === 朝・昼・夕方・夜タブ === */
            // ① 並べ替え後の同一時間帯タスクを抽出
            const reorderedSamePeriod = newIndexes.map(i => tasks[i]);

            // ② 元配列の当該時間帯部分だけ置き換え
            let p = 0;
            const newTasks = tasks.map(t =>
              t.timePeriod === period ? reorderedSamePeriod[p++] : t
            );

            saveTasks(newTasks);
          }

          renderTasks();       // 画面を最新化
        }
      });

      list.classList.add("sortable-initialized");
    });
  }
  /* --- ここまで --- */

  document.querySelectorAll(".nav-link").forEach(tab => {
    tab.addEventListener("shown.bs.tab", () => {
      const activeTab = tab.getAttribute("href").replace("#", "");
      document.querySelectorAll(".time-badge").forEach(badge => {
        const period = badge.getAttribute("data-period");
        badge.style.display = (activeTab === "all" || activeTab === period) ? "inline-flex" : "none";
      });
    });
  });

  // タブ切り替え時にフォームの時間帯初期値を変更
  document.querySelectorAll(".nav-link").forEach(tab => {
    tab.addEventListener("click", syncTimeSelectWithActiveTab);
  });

  renderTasks();

  /* ===== バックアップ機能 ===== */
  // --- エクスポート（ダウンロード）
  document.getElementById("export-btn").addEventListener("click", () => {
    const tasks = localStorage.getItem("tasks") || "[]";
    const blob  = new Blob([tasks], {type: "application/json"});
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement("a");
    a.href = url;
    a.download = "tasks_backup_" + new Date().toISOString().slice(0,10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
  });

  // --- インポート（選択→読込）
  document.getElementById("import-input").addEventListener("change", evt => {
    const file = evt.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        // JSON が正しいかチェック
        JSON.parse(e.target.result);
        localStorage.setItem("tasks", e.target.result);
        alert("インポート完了！画面を更新します。");
        location.reload();
      } catch(err) {
        alert("読み込んだファイルが不正です…");
      }
    };
    reader.readAsText(file);
  });
  /* =========================== */

});