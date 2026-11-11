import "./styles.css";
import { formatDistanceToNow } from "date-fns";

class Todo {
  constructor(title, description, deadline, priority) {
    this.title = title;
    this.description = description;
    this.deadline = deadline;
    this.priority = priority;
  }

  getTimeLeft() {
    return formatDistanceToNow(new Date(this.deadline), { addSuffix: true });
  }

  toJSON() {
    return {
      title: this.title,
      description: this.description,
      deadline: this.deadline,
      priority: this.priority,
    };
  }

  static fromObject(todoObject) {
    return new Todo(
      todoObject.title,
      todoObject.description,
      todoObject.deadline,
      todoObject.priority,
    );
  }
}

class Project {
  todos = {};
  name;

  constructor(name) {
    this.name = name;
  }

  addTodo(todoId, todo) {
    this.todos[todoId] = todo;
  }

  removeTodo(todoId) {
    delete this.todos[todoId];
  }

  toJSON() {
    return { name: this.name, todos: this.todos };
  }

  static fromObject(projectObject) {
    const project = new Project(projectObject.name);
    const todos = projectObject.todos;
    for (const todoId in todos) {
      project.addTodo(todoId, Todo.fromObject(todos[todoId]));
    }
    return project;
  }
}

class logicHandler {
  #currProjectId;
  #projects = {};
  #storageFlag = false;

  set storageFlag(boolValue) {
    this.#storageFlag = boolValue;
    this.#saveContents();
  }

  get storageFlag() {
    return this.#storageFlag;
  }

  addProject(projectId, name) {
    this.#projects[projectId] = new Project(name);
    this.#saveContents();
  }

  removeProject(projectId) {
    delete this.#projects[projectId];
    this.#saveContents();
  }

  addTodo(projectId, todoId, todo) {
    this.#projects[projectId].addTodo(todoId, todo);
    this.#saveContents();
  }

  editTodo(projectId, todoId, title, deadline, description) {
    const todo = this.#projects[projectId].todos[todoId];
    todo.title = title;
    todo.deadline = deadline;
    todo.description = description;
    this.#saveContents();
    return todo.getTimeLeft();
  }

  removeTodo(projectId, todoId) {
    this.#projects[projectId].removeTodo(todoId);
    this.#saveContents();
  }

  changeCurrentProjectId(projectId) {
    this.#currProjectId = projectId;
    this.#saveContents();
  }

  getCurrentProjectId() {
    return this.#currProjectId;
  }

  getCurrentProjectName() {
    return this.#projects[this.#currProjectId].name;
  }

  getProjectArray() {
    return Object.entries(this.#projects);
  }

  getTodoArray(projectId) {
    return Object.entries(this.#projects[projectId].todos);
  }

  getAppropriateProjectId(projectId) {
    const keys = Object.keys(this.#projects);
    const index = keys.indexOf(projectId);
    if (index === 0) {
      return keys[1];
    } else if (index === keys.length - 1) {
      return keys.at(-2);
    }
    return keys[index + 1];
  }

  getDeadline(todoId) {
    return this.#projects[this.#currProjectId].todos[todoId].deadline;
  }

  toJSON() {
    return { currProjectId: this.#currProjectId, projects: this.#projects };
  }

  #saveContents() {
    try {
      if (this.storageFlag) {
        localStorage.setItem("appData", JSON.stringify(this));
        console.log("Saving");
      }
    } catch (e) {
      if (e.name === "QuotaExceededError") {
        console.log(e.msg);
      }
    }
  }

  static fromObject(handlerObject) {
    const handler = new logicHandler();
    handler.#currProjectId = handlerObject.currProjectId;
    const projects = handlerObject.projects;
    for (const projectId in projects) {
      handler.#projects[projectId] = Project.fromObject(projects[projectId]);
    }
    return handler;
  }
}

class uiHandler {
  #priorityDisplay = { high: "High", low: "Low", medium: "Medium" };
  constructor() {
    this.projectButton = document.querySelector(".project-button");
    this.projectDialog = document.querySelector(".project-dialog");
    this.projectForm = document.querySelector(".project-dialog > form");
    this.projectSaveButton = document.querySelector(".project-save");
    this.todoButton = document.querySelector(".todo-button");
    this.todoDialog = document.querySelector(".todo-dialog");
    this.todoForm = document.querySelector(".todo-dialog > form");
    this.validityMessage = document.querySelector(".validity-message");
    this.validityMessageDialog = document.querySelector(
      ".validity-message-dialog",
    );
    this.todoSaveButton = document.querySelector(".todo-save");
    this.sortDropDown = document.querySelector("#sorting-drop-down");
    this.sortApplyButton = document.querySelector("#sort-apply");
    this.invalidInputOk = document.querySelector(".invalid-input-ok");
    this.projectName = document.querySelector("#project-name");
    this.removeProjectDialog = document.querySelector(".remove-project-dialog");
    this.removeProjectYes = document.querySelector("#yes");
    this.removeProjectNo = document.querySelector("#no");
    this.body = document.querySelector("body");
    this.slide = document.querySelector(".slide");
    this.sideBar = document.querySelector(".sidebar");

    this.projects = document.querySelector(".projects");
    this.todos = document.querySelector(".todos");

    this.projectButton.addEventListener("click", (e) =>
      this.displayProjectDialog(e),
    );
    this.todoButton.addEventListener("click", (e) => this.displayTodoDialog(e));
    this.projectSaveButton.addEventListener("click", (e) => {
      this.saveProject(e);
      this.sideBar.scrollTop = this.sideBar.scrollHeight;
    });
    this.todoSaveButton.addEventListener("click", (e) => this.saveTodo(e));
    this.sortApplyButton.addEventListener("click", (e) => this.sortTodos(e));
    this.removeProjectYes.addEventListener("click", (e) =>
      this.removeProjectComponents(e),
    );
    this.removeProjectNo.addEventListener("click", (e) =>
      this.removeProjectDialog.close(),
    );
    this.invalidInputOk.addEventListener("click", (e) => {
      this.cleanInvalidInputMessage();
    });
    this.validityMessageDialog.addEventListener("close", (e) => {
      this.validityMessage.textContent = "";
    });
    this.slide.addEventListener("click", () => {
      document.querySelector(".sidebar").classList.add("run");
      this.sideBar.classList.toggle("sidebar-open");
      this.slide.classList.toggle("open");
    });

    document.querySelectorAll(".drop-down").forEach((dropDown) => {
      const selected = dropDown.querySelector(".selected");
      dropDown.addEventListener("click", (e) => {
        const item = e.target.closest(".item");
        if (!item) return;
        dropDown.dataset.value = item.dataset.value;
        selected.textContent = item.textContent;
      });
      dropDown.addEventListener("click", (e) => {
        dropDown.querySelector(".items").classList.toggle("disabled");
      });
    });

    try {
      localStorage.setItem("__test__", "__hello__");
      localStorage.removeItem("__test__");
      this.localStorageFlag = true;
    } catch {
      this.localStorageFlag = false;
    }
    if (this.localStorageFlag) {
      const appData = localStorage.getItem("appData");
      if (appData) {
        this.handler = logicHandler.fromObject(JSON.parse(appData));
        this.handler.storageFlag = true;
        this.displayInitially();
      } else {
        this.handler = new logicHandler();
        this.handler.storageFlag = true;
        const projectId = Math.random().toString(36).substring(2, 9);
        this.saveProjectComponents(projectId, "Default");
        this.handler.changeCurrentProjectId(projectId);
        const todo = new Todo(
          "A title",
          "A description goes here",
          "2026-08-30T14:30",
          "High",
        );
        const todoId = Math.random().toString(36).substring(2, 9);
        this.saveTodoLogic(todoId, todo);
        this.displayProject(projectId);
      }
    }
  }

  displayInitially() {
    const projectArray = this.handler.getProjectArray();
    for (const [projectId, project] of projectArray) {
      this.saveProjectCard(projectId, project.name);
    }
    const projectId = this.handler.getCurrentProjectId();
    const todoArray = this.handler.getTodoArray(projectId);
    this.displayProject(projectId);
  }

  displayProjectDialog(e) {
    this.projectDialog.showModal();
  }

  saveProject(e) {
    const projectId = Math.random().toString(36).substring(2, 9);
    const projectName = this.projectForm.elements.name.value;
    this.saveProjectComponents(projectId, projectName);
    this.handler.changeCurrentProjectId(projectId);
    this.projectDialog.close();
    this.projectForm.reset();
  }

  displayTodoDialog(e) {
    this.todoDialog.showModal();
  }

  saveTodo(e) {
    const values = this.todoForm.elements;
    const todoId = Math.random().toString(36).substring(2, 9);
    const title = values.title.value;
    const description = values.description.value;
    const deadline = values.deadline.value;
    const priority = this.todoForm
      .querySelector(".selected")
      .textContent.toLowerCase();
    if (this.invalidInputs(deadline)) return;
    if (this.todos.dataset.empty) {
      this.todos.dataset.empty = null;
      this.todos.textContent = "";
    }
    const todo = new Todo(title, description, deadline, priority);
    this.saveTodoCards(
      title,
      description,
      todo.getTimeLeft(),
      priority,
      todoId,
      deadline,
    );
    this.saveTodoLogic(todoId, todo);

    this.todoDialog.close();
    this.todoForm.reset();
  }

  saveProjectComponents(projectId, projectName) {
    this.saveProjectCard(projectId, projectName);
    this.handler.addProject(projectId, projectName);
  }

  removeProjectComponents(event) {
    const pastId = this.removeProjectComponent.dataset.id;
    const projectId = this.handler.getAppropriateProjectId(pastId);

    this.removeProjectComponent.remove();
    this.handler.removeProject(pastId);

    this.removeProjectDialog.close();
    this.displayProject(projectId);
  }

  saveTodoCards(title, description, timeLeft, priority, todoId, deadline) {
    this.todos.appendChild(
      this.produceTodoCard(
        title,
        description,
        priority,
        timeLeft,
        todoId,
        deadline,
      ),
    );
  }

  saveTodoLogic(todoId, todo) {
    this.handler.addTodo(this.handler.getCurrentProjectId(), todoId, todo);
  }

  saveProjectCard(projectId, projectName) {
    const projectCard = document.createElement("div");
    projectCard.textContent = projectName;
    projectCard.dataset.id = projectId;
    projectCard.classList.add("project-card");

    const bin = document.createElement("button");
    bin.classList.add("project-bin", "hide-project");
    bin.innerHTML = `<svg viewBox="0 0 48 48" data-name="Layer 1" id="Layer_1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><title></title><path d="M42,3H28a2,2,0,0,0-2-2H22a2,2,0,0,0-2,2H6A2,2,0,0,0,6,7H42a2,2,0,0,0,0-4Z"></path><path d="M39,9a2,2,0,0,0-2,2V43H11V11a2,2,0,0,0-4,0V45a2,2,0,0,0,2,2H39a2,2,0,0,0,2-2V11A2,2,0,0,0,39,9Z"></path><path d="M21,37V19a2,2,0,0,0-4,0V37a2,2,0,0,0,4,0Z"></path><path d="M31,37V19a2,2,0,0,0-4,0V37a2,2,0,0,0,4,0Z"></path></g></svg>`;

    projectCard.appendChild(bin);
    projectCard.addEventListener("click", (e) => this.handleProject(e));
    this.projects.appendChild(projectCard);
  }

  produceTodoCard(title, description, priority, timeLeft, todoId, deadline) {
    const todoContainer = document.createElement("div");
    todoContainer.classList.add("todo-container");
    todoContainer.dataset.id = todoId;
    const todoCard = document.createElement("div");
    const todoBottom = document.createElement("div");
    const titl = document.createElement("p");
    const titleInput = document.createElement("input");
    const desc = document.createElement("p");
    const descInput = document.createElement("textarea");
    const prt = document.createElement("p");
    const time = document.createElement("p");
    const timeInput = document.createElement("input");
    const buttons = document.createElement("div");
    const edit = document.createElement("button");
    const bin = document.createElement("button");
    const right = document.createElement("div");
    const saveButton = document.createElement("button");
    const resetButton = document.createElement("button");
    const bottomButtons = document.createElement("div");
    todoCard.classList.add("todo-card");
    todoBottom.classList.add("todo-bottom");
    todoContainer.addEventListener("click", (event) => {
      this.handleTodo(event);
    });
    titl.classList.add("title", "not-hidden", "to-be-not-hidden");
    titl.textContent = title;
    titleInput.value = title;
    titleInput.classList.add("title-input", "hidden", "to-be-hidden");
    desc.classList.add("description", "to-be-not-hidden");
    desc.textContent = description;
    descInput.value = description;
    descInput.classList.add("description-input", "hidden", "to-be-hidden");
    prt.classList.add(`${priority}-priority`);
    prt.textContent = this.#priorityDisplay[priority.toLowerCase()];
    time.classList.add("time-left", "not-hidden", "to-be-not-hidden");
    time.textContent = timeLeft;
    timeInput.setAttribute("type", "datetime-local");
    timeInput.value = deadline;
    timeInput.classList.add("time-input", "hidden", "to-be-hidden");
    buttons.classList.add("buttons");
    edit.classList.add("edit");
    edit.innerHTML = `<svg viewBox="0 0 24 24"  xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M15.8787 3.70705C17.0503 2.53547 18.9498 2.53548 20.1213 3.70705L20.2929 3.87862C21.4645 5.05019 21.4645 6.94969 20.2929 8.12126L18.5556 9.85857L8.70713 19.7071C8.57897 19.8352 8.41839 19.9261 8.24256 19.9701L4.24256 20.9701C3.90178 21.0553 3.54129 20.9554 3.29291 20.7071C3.04453 20.4587 2.94468 20.0982 3.02988 19.7574L4.02988 15.7574C4.07384 15.5816 4.16476 15.421 4.29291 15.2928L14.1989 5.38685L15.8787 3.70705ZM18.7071 5.12126C18.3166 4.73074 17.6834 4.73074 17.2929 5.12126L16.3068 6.10738L17.8622 7.72357L18.8787 6.70705C19.2692 6.31653 19.2692 5.68336 18.8787 5.29283L18.7071 5.12126ZM16.4477 9.13804L14.8923 7.52185L5.90299 16.5112L5.37439 18.6256L7.48877 18.097L16.4477 9.13804Z" ></path> </g></svg>`;
    bin.classList.add("bin");
    bin.innerHTML = `<svg viewBox="0 0 48 48" data-name="Layer 1" id="Layer_1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><title></title><path d="M42,3H28a2,2,0,0,0-2-2H22a2,2,0,0,0-2,2H6A2,2,0,0,0,6,7H42a2,2,0,0,0,0-4Z"></path><path d="M39,9a2,2,0,0,0-2,2V43H11V11a2,2,0,0,0-4,0V45a2,2,0,0,0,2,2H39a2,2,0,0,0,2-2V11A2,2,0,0,0,39,9Z"></path><path d="M21,37V19a2,2,0,0,0-4,0V37a2,2,0,0,0,4,0Z"></path><path d="M31,37V19a2,2,0,0,0-4,0V37a2,2,0,0,0,4,0Z"></path></g></svg>`;
    buttons.appendChild(edit);
    buttons.appendChild(bin);
    right.classList.add("todo-right");

    saveButton.classList.add("save-todo", "hidden", "to-be-hidden");
    resetButton.classList.add("reset-todo", "hidden", "to-be-hidden");
    saveButton.textContent = "save";
    resetButton.textContent = "reset";
    bottomButtons.classList.add("bottom-buttons");
    bottomButtons.appendChild(saveButton);
    bottomButtons.appendChild(resetButton);
    saveButton.addEventListener("click", (e) => this.editTodo(e));
    resetButton.addEventListener("click", (e) => this.resetTodo(e));

    right.appendChild(prt);
    right.appendChild(time);
    right.appendChild(timeInput);
    right.appendChild(buttons);
    todoCard.appendChild(titl);
    todoCard.appendChild(titleInput);
    todoCard.appendChild(right);
    todoContainer.appendChild(todoCard);
    todoBottom.appendChild(desc);
    todoBottom.appendChild(descInput);
    todoBottom.appendChild(bottomButtons);
    todoContainer.classList.add("hidden-description");
    todoContainer.appendChild(todoBottom);
    return todoContainer;
  }

  handleTodo(event) {
    const matchButton = event.target.closest("button");

    if (!matchButton) {
      const container = event.target.closest(".todo-container");
      if (
        !container.querySelector(".description").classList.contains("hidden")
      ) {
        container.classList.toggle("hidden-description");
      }
    } else if (matchButton.matches(".bin")) {
      const todoContainer = matchButton.closest(".todo-container");
      const todoId = todoContainer.dataset.id;
      this.handler.removeTodo(this.handler.getCurrentProjectId(), todoId);
      todoContainer.remove();
      if (this.todos.children.length === 0) {
        this.makeTodosEmpty();
      }
    } else if (matchButton.matches(".edit")) {
      const container = event.target.closest(".todo-container");
      if (container.classList.contains("hidden-description")) {
        container.classList.toggle("hidden-description");
      }
      this.switchInputs(event.target.closest(".todo-container"));
    }
  }

  handleProject(event) {
    const matchButton = event.target.closest("button");

    if (!matchButton) {
      const projectId = event.target.closest(".project-card").dataset.id;
      this.displayProject(projectId);
    } else if (matchButton.matches(".project-bin")) {
      this.removeProjectComponent = event.target.closest(".project-card");
      this.removeProjectDialog.showModal();
    }
  }

  displayProject(projectId) {
    this.handler.changeCurrentProjectId(projectId);
    this.projectName.textContent = this.handler.getCurrentProjectName();
    const todoArray = this.handler.getTodoArray(projectId);
    this.displayTodos(todoArray);
  }

  displayTodos(todoArray) {
    document.querySelector(".todos").textContent = "";
    if (todoArray.length) {
      for (const [todoId, todo] of todoArray) {
        this.saveTodoCards(
          todo.title,
          todo.description,
          todo.getTimeLeft(),
          todo.priority,
          todoId,
          todo.deadline,
        );
      }
    } else {
      this.makeTodosEmpty();
    }
  }

  editTodo(event) {
    const todoContainer = event.target.closest(".todo-container");
    const title = todoContainer.querySelector(".title-input").value;
    const deadline = todoContainer.querySelector(".time-input").value;
    const description = todoContainer.querySelector(".description-input").value;
    const todoId = todoContainer.dataset.id;
    const projectId = this.handler.getCurrentProjectId();
    if (this.invalidInputs(deadline)) return;
    const timeLeft = this.handler.editTodo(
      projectId,
      todoId,
      title,
      deadline,
      description,
    );
    todoContainer.querySelector(".title").textContent = title;
    todoContainer.querySelector(".description").textContent = description;
    todoContainer.querySelector(".time-left").textContent = timeLeft;
    this.switchInputs(todoContainer);
  }

  resetTodo(event) {
    const todoContainer = event.target.closest(".todo-container");
    todoContainer.querySelector(".title-input").value =
      todoContainer.querySelector(".title").textContent;
    todoContainer.querySelector(".description-input").value =
      todoContainer.querySelector(".description").textContent;
    todoContainer.querySelector(".time-input").value = this.handler.getDeadline(
      todoContainer.dataset.id,
    );
  }

  switchInputs(todoContainer) {
    todoContainer.querySelectorAll(".to-be-hidden").forEach((node) => {
      node.classList.toggle("hidden");
    });
    todoContainer.querySelectorAll(".to-be-not-hidden").forEach((node) => {
      node.classList.toggle("hidden");
    });
  }

  sortTodos(event) {
    const sortBy = this.sortDropDown.dataset.value;
    let todoArray = this.handler.getTodoArray(
      this.handler.getCurrentProjectId(),
    );
    let sortFunction;
    if (sortBy === "default") return;
    else if (sortBy === "priority") {
      const rank = { high: 0, medium: 1, low: 2 };
      sortFunction = (a, b) => rank[a[1].priority] - rank[b[1].priority];
    } else if (sortBy === "date") {
      sortFunction = (a, b) =>
        new Date(a[1].deadline) - new Date(b[1].deadline);
    }
    todoArray = todoArray.sort(sortFunction);
    this.displayTodos(todoArray);
  }

  invalidInputs(deadline) {
    let flag = false;
    if (deadline && new Date(deadline).getTime() < Date.now()) {
      const dateInvalid = document.createElement("div");
      dateInvalid.textContent = "The deadline should be set in future.";
      this.validityMessage.append(dateInvalid);
      flag = true;
    }
    if (!deadline) {
      const dateInvalid = document.createElement("div");
      dateInvalid.textContent = "Please enter a deadline.";
      this.validityMessage.append(dateInvalid);
      flag = true;
    }

    if (flag) {
      this.validityMessageDialog.showModal();
    }
    return flag;
  }

  cleanInvalidInputMessage() {
    this.validityMessageDialog.close();
  }

  makeTodosEmpty() {
    this.todos.dataset.empty = true;
    this.todos.innerHTML = `<div class="empty"><svg viewBox="0 0 1024 1024" class="icon" xmlns="http://www.w3.org/2000/svg" fill="#000000">
  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
  <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
  <g id="SVGRepo_iconCarrier">
    <!-- Book 1 (Top) -->
    <path d="M813.09 238.24H200.855s-35.86 11.324-35.86 79.27 35.86 81.157 35.86 81.157H813.09s-30.833-13.212-30.833-80.214 30.833-80.213 30.833-80.213z" fill="#DCE9F6"></path>
    <path d="M836.11 411.167H198.626l-2.092-0.771c-1.798-0.662-44.039-17.096-44.039-92.887 0-76.229 42.775-90.614 44.597-91.189l1.837-0.58H836.11v25H203.434c-5.723 2.987-25.938 17.064-25.938 66.77 0 49.62 20.176 65.117 26.251 68.657H836.11v25z" fill="#08101E"></path>
    <path d="M256.75 275.988h231.233v18.873H256.75zM390.334 310.933h344.649v23.043H390.334zM262.52 349.398h150.736v23.043H262.52z" fill="#78A3CE"></path>

    <!-- Book 2 (Middle) -->
    <path d="M907.017 433.246H294.782s-35.86 11.324-35.86 79.27 35.86 81.157 35.86 81.157h612.235s-30.833-13.212-30.833-80.214 30.833-80.213 30.833-80.213z" fill="#DCE9F6"></path>
    <path d="M930.037 606.173H292.553l-2.092-0.771c-1.798-0.662-44.039-17.096-44.039-92.887 0-76.229 42.775-90.614 44.597-91.189l1.837-0.58h637.182v25H297.36c-5.723 2.987-25.938 17.064-25.938 66.77 0 49.62 20.176 65.117 26.251 68.657h632.364v25z" fill="#08101E"></path>
    <path d="M354.857 541.566h431.325v23.043H354.857z" fill="#78A3CE"></path>

    <!-- Book 3 (Bottom) -->
    <path d="M792.055 627.604H179.82s-35.86 11.324-35.86 79.27 35.86 81.157 35.86 81.157h612.235s-30.833-13.212-30.833-80.214 30.833-80.213 30.833-80.213z" fill="#DCE9F6"></path>
    <path d="M815.075 800.531H177.59l-2.092-0.771c-1.799-0.663-44.038-17.097-44.038-92.887 0-76.229 42.774-90.614 44.595-91.189l1.838-0.58h637.183v25H182.397c-5.723 2.987-25.938 17.064-25.938 66.77 0 49.619 20.175 65.117 26.25 68.657h632.365v25z" fill="#08101E"></path>

    <!-- Pencil Wood Tip -->
    <path d="M265.709 708.718l-50.263 147.29 153.236-57.634z" fill="#C2D8EC"></path>

    <!-- Pencil Body (Dark & Light Facets) -->
    <path d="M314.22 744.184l54.462 54.19L697.02 470.635l-51.623-47.93z" fill="#1E5E9E"></path>
    <path d="M268.266 699.017l54.461 54.19 328.339-327.739-51.623-47.93z" fill="#38BDF8"></path>

    <!-- Eraser (Soft Rose matching the 'Apply' button accent) -->
    <path d="M645.397 329.934l58.74-57.215 41.085-3.024 52.717 53.485 3.061 42-66.183 67.658z" fill="#EBA0AA"></path>

    <!-- Pencil Outlines & Lead -->
    <path d="M362.732 805.746l-97.023-97.028a8.645 8.645 0 0 1 0-12.226l422.24-422.237c11.268-11.271 26.55-17.075 42.624-16.073 13.979 0.871 26.973 7.542 36.878 17.445l29.748 29.746c21.576 21.574 21.578 56.555 0.002 78.131L374.957 805.746a8.644 8.644 0 0 1-12.225 0z m-77.039-103.141l83.152 83.158 415.308-415.308c14.343-14.341 14.34-37.686-0.003-52.032l-31.123-31.12c-6.948-6.951-16.187-10.778-26.013-10.778s-19.065 3.827-26.016 10.778L285.693 702.605z" fill="#08101E"></path>
    <path d="M697.02 470.642l-96.201-96.201 40.744-40.745 96.201 96.201z" fill="#08101E"></path>
    <path d="M697.02 483.681L587.766 374.432l53.798-53.793 109.249 109.249-53.793 53.793z m-83.151-109.249l83.152 83.152 27.695-27.695-83.152-83.152-27.695 27.695z" fill="#08101E"></path>
    <path d="M745.703 381.239l-13.049-13.049 18.11-18.107c3.265-3.268 3.265-8.585-0.003-11.853l-8.768-8.771 13.049-13.049 8.771 8.771c10.459 10.465 10.459 27.485 0.003 37.951l-18.113 18.107zM638.998 419.4l13.05 13.048L327.27 757.224l-13.049-13.049z" fill="#08101E"></path>
    <path d="M199.742 871.713L264 699.379l17.289 6.452-50.139 134.475 134.471-50.14 6.447 17.29z" fill="#08101E"></path>
    <path d="M215.446 856.008l57.278-25.908-31.37-31.371z" fill="#08101E"></path>
    <path d="M196.954 874.501l41.489-91.736 50.242 50.241-91.731 41.495z m47.311-59.812l-10.328 22.829 22.829-10.327-12.501-12.502z" fill="#08101E"></path>
  </g>
</svg><div class="empty-text">No todos added<div><div>`;
  }
}

new uiHandler();
