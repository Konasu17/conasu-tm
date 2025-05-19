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
            const el = createTaskElement(task, index);
            taskListAll.appendChild(el.cloneNode(true));
            const tabList = document.querySelector(`.task-list[data-period='${task.timePeriod}']`);
            if (tabList) tabList.appendChild(el.cloneNode(true));
            if (!task.completed) timeTotals[task.timePeriod] += parseInt(task.duration);
        });

        Object.entries(timeTotals).forEach(([period, total]) => {
            timeSummary[period].textContent = total > 0 ? `${total}分` : "完了 🎉";
        });

        initializeSortable();
    }

    function createTaskElement(task, index) {
        const div = document.createElement("div");
        div.className = "list-group-item d-flex justify-content-between align-items-center task small-text";
        div.setAttribute("data-index", index);

        const inner = document.createElement("div");
        inner.className = "d-flex align-items-center gap-2";

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
        name.className = "task-name";
        name.textContent = `${task.name} (${task.duration}分)`;
        inner.appendChild(name);

        const badge = document.createElement("span");
        badge.className = `badge ${
            task.priority == 3 ? "bg-danger"
            : task.priority == 2 ? "bg-warning"
            : "bg-primary"
        } important-badge`;
        badge.textContent = task.priority == 3 ? "高" : task.priority == 2 ? "中" : "低";
        inner.appendChild(badge);

        div.appendChild(inner);
        return div;
    }

    function updateTask(index, newTask) {
        const tasks = getTasks();
        tasks[index] = newTask;
        saveTasks(tasks);
        renderTasks();
    }

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
            form.reset();
            renderTasks();
        }
    });

    function initializeSortable() {
        document.querySelectorAll(".task-list").forEach(list => {
            if (!list.classList.contains("sortable-initialized")) {
                new Sortable(list, {
                    animation: 150,
                    handle: ".drag-handle",
                    onEnd: () => {
                        const allTasks = [];
                        document.querySelectorAll("#task-list .task").forEach(el => {
                            const idx = parseInt(el.getAttribute("data-index"));
                            allTasks.push(getTasks()[idx]);
                        });
                        saveTasks(allTasks);
                        renderTasks();
                    }
                });
                list.classList.add("sortable-initialized");
            }
        });
    }

    // タブ切り替えで時間帯サマリー切り替え
    document.querySelectorAll(".nav-link").forEach(tab => {
        tab.addEventListener("shown.bs.tab", () => {
            const activeTab = tab.getAttribute("href").replace("#", "");
            document.querySelectorAll(".time-badge").forEach(badge => {
                const period = badge.getAttribute("data-period");
                badge.style.display = (activeTab === "all" || activeTab === period) ? "inline-flex" : "none";
            });
        });
    });

    renderTasks();
});