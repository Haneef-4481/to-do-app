import "./styles.css";
import { formatDistanceToNow } from "date-fns";

class Todo {


    constructor (title, description, deadline, priority) {
        this.title = title;
        this.description = description;
        this.deadline = deadline;
        this.priority = priority;
    }

    getTimeLeft () {
        return formatDistanceToNow(new Date(this.deadline), {"addSuffix" : true});
    }

    toJSON () {
        return {
        title: this.title,
        description: this.description,
        deadline: this.deadline,
        priority: this.priority
        };
    }

    static fromObject (todoObject) {
        return new Todo(todoObject.title, todoObject.description, todoObject.deadline, todoObject.priority);
    }
}

class Project {
    todos = {}
    name;

    constructor (name) {
        this.name = name;
    }

    addTodo (todoId, todo) {
        this.todos[todoId] = todo;
    }

    removeTodo (todoId) {
        delete this.todos[todoId];
    }

    toJSON () {
        return {name: this.name, todos:this.todos};
    }

    static fromObject (projectObject) {
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
    #projects = {}
    #storageFlag = false;


    set storageFlag (boolValue) {
        this.#storageFlag = boolValue;
        this.#saveContents()
    }

    get storageFlag () {
        return this.#storageFlag;
    }

    addProject(projectId, name) {
        this.#projects[projectId] = new Project(name);
        this.#saveContents()
    }

    removeProject (projectId) {
        delete this.#projects[projectId];
        this.#saveContents()
    }

    addTodo ( projectId, todoId, todo) {
        this.#projects[projectId].addTodo(todoId, todo);
        this.#saveContents()
    }

    editTodo (projectId, todoId, title, deadline, description) {
        const todo = this.#projects[projectId].todos[todoId];
        todo.title = title;
        todo.deadline = deadline;
        todo.description = description;
        this.#saveContents()
        return todo.getTimeLeft();
    }

    removeTodo ( projectId, todoId) {
        this.#projects[projectId].removeTodo(todoId);
        this.#saveContents()
    } 

    changeCurrentProjectId ( projectId ) {
        this.#currProjectId = projectId;
        this.#saveContents()
    }

    getCurrentProjectId () {
        return this.#currProjectId;
    }

    getProjectArray () {
        return Object.entries(this.#projects);
    }

    getTodoArray ( projectId ) {
        return Object.entries(this.#projects[projectId].todos);
    }
    
    removeCurrentProject () {
        this.removeProject(this.#currProjectId);
        this.#saveContents();
    }

    toJSON () {
        return {currProjectId: this.#currProjectId, projects: this.#projects};
    }

    #saveContents () {
        try {
            if (this.storageFlag) {
                localStorage.setItem("appData", JSON.stringify(this));
                console.log("Saving");
            }
        }
        catch (e) {
            if (e.name === 'QuotaExceededError') {
            }
        }
    }

    static fromObject (handlerObject) {
        const handler = new logicHandler();
        handler.#currProjectId = handlerObject.currProjectId;
        const projects = handlerObject.projects;
        for ( const projectId in projects) {
            handler.#projects[projectId] = Project.fromObject(projects[projectId]);
        }
        return handler;
    }
}

class uiHandler {

    constructor () {
        this.projectButton = document.querySelector(".project-button");
        this.projectDialog = document.querySelector(".project-dialog");
        this.projectForm = document.querySelector(".project-dialog > form");
        this.projectSaveButton = document.querySelector(".project-save");
        this.todoButton = document.querySelector(".todo-button");
        this.todoDialog = document.querySelector(".todo-dialog");
        this.todoForm = document.querySelector(".todo-dialog > form");
        this.todoSaveButton = document.querySelector(".todo-save");
        this.sortDropDown = document.querySelector("#sorting");
        this.sortApplyButton = document.querySelector("#sort-apply");

        this.projects = document.querySelector(".projects");
        this.todos = document.querySelector(".todos");

        this.projectButton.addEventListener( "click", (e) => this.displayProjectDialog(e) );
        this.todoButton.addEventListener( "click", (e) => this.displayTodoDialog(e) );
        this.projectSaveButton.addEventListener( "click", (e) => this.saveProject(e) );
        this.todoSaveButton.addEventListener( "click", (e) => this.saveTodo(e) );
        this.sortApplyButton.addEventListener( "click", (e) => this.sortTodos(e) );
        try {
            localStorage.setItem("__test__", "__hello__");
            localStorage.removeItem("__test__");
            this.localStorageFlag = true;
        }
        catch {
            this.localStorageFlag = false;
        }
        if (this.localStorageFlag){
            const appData = localStorage.getItem("appData");
            if (appData){
                this.handler = logicHandler.fromObject(JSON.parse(appData));
                this.handler.storageFlag = true;
                this.displayInitially();
            }
            else {
                this.handler = new logicHandler();
                this.handler.storageFlag = true;
                const projectId = Math.random().toString(36).substring(2, 9);
                this.saveProjectComponents( projectId, "Default");
                this.handler.changeCurrentProjectId(projectId);
                const todo = new Todo("A title", "A description goes here", "2026-08-30T14:30", "High");
                const todoId = Math.random().toString(36).substring(2, 9);
                this.saveTodoCards("title", "description", todo.getTimeLeft(), "High", todoId);
                this.saveTodoLogic(todoId, todo);
            }
        }
    }

    displayInitially () {
        const projectArray = this.handler.getProjectArray();
        for (const [projectId, project] of projectArray) {
            this.saveProjectCard(projectId, project.name);
        }
        const projectId = this.handler.getCurrentProjectId();
        const todoArray = this.handler.getTodoArray( projectId );
        this.displayTodos(todoArray);
    }

    displayProjectDialog (e) {
        this.projectDialog.showModal();
    }

    saveProject (e) {
        const projectId = Math.random().toString(36).substring(2, 9);
        const projectName = this.projectForm.elements.name.value;
        this.saveProjectComponents(projectId, projectName);
        this.handler.changeCurrentProjectId(projectId);
        this.projectDialog.close();
        this.projectForm.reset()
    }

    displayTodoDialog (e) {
        this.todoDialog.showModal();
    }

    saveTodo (e) {
        const values = this.todoForm.elements;
        const todoId = Math.random().toString(36).substring(2, 9);
        const title = values.title.value;
        const description = values.description.value;
        const deadline = values.deadline.value;
        const priority = values.priority.value;

        const todo = new Todo(title, description, deadline, priority);
        this.saveTodoCards(title, description, todo.getTimeLeft(), priority, todoId);
        this.saveTodoLogic(todoId, todo);

        this.todoDialog.close();
        this.todoForm.reset();
    }

    saveProjectComponents (projectId, projectName ) {
        this.saveProjectCard( projectId, projectName );
        this.handler.addProject( projectId, projectName );
    }

    saveTodoCards ( title, description, timeLeft, priority, todoId ) {
        this.todos.appendChild(this.produceTodoCard( title, description, priority, timeLeft , todoId));
    }

    saveTodoLogic (todoId, todo) {
        this.handler.addTodo(this.handler.getCurrentProjectId(), todoId, todo);
    }

    saveProjectCard ( projectId, projectName ) {
        const projectCard = document.createElement("div");
        projectCard.textContent = projectName;
        projectCard.dataset.id = projectId;
        projectCard.classList.add("project-card");
        projectCard.addEventListener("click", (e) => this.displayProject(e));
        this.projects.appendChild(projectCard);
    }

    produceTodoCard ( title, description, priority, timeLeft, todoId) { 
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
        todoContainer.addEventListener("click", (event) => { this.handleTodo(event) });
        titl.classList.add("title", "not-hidden", "to-be-not-hidden");
        titl.textContent = title;
        titleInput.value = title;
        titleInput.classList.add("title-input", "hidden", "to-be-hidden");
        desc.classList.add("description", "hidden-description", "to-be-not-hidden");
        desc.textContent = description;
        descInput.value = description;
        descInput.classList.add("description-input", "hidden", "to-be-hidden");
        prt.textContent = priority;
        time.classList.add("time-left", "not-hidden", "to-be-not-hidden");
        time.textContent = timeLeft;
        timeInput.setAttribute("type", "datetime-local");
        timeInput.value = new Date();
        timeInput.classList.add("time-input", "hidden", "to-be-hidden");
        buttons.classList.add("buttons");
        edit.classList.add("edit");
        edit.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M15.8787 3.70705C17.0503 2.53547 18.9498 2.53548 20.1213 3.70705L20.2929 3.87862C21.4645 5.05019 21.4645 6.94969 20.2929 8.12126L18.5556 9.85857L8.70713 19.7071C8.57897 19.8352 8.41839 19.9261 8.24256 19.9701L4.24256 20.9701C3.90178 21.0553 3.54129 20.9554 3.29291 20.7071C3.04453 20.4587 2.94468 20.0982 3.02988 19.7574L4.02988 15.7574C4.07384 15.5816 4.16476 15.421 4.29291 15.2928L14.1989 5.38685L15.8787 3.70705ZM18.7071 5.12126C18.3166 4.73074 17.6834 4.73074 17.2929 5.12126L16.3068 6.10738L17.8622 7.72357L18.8787 6.70705C19.2692 6.31653 19.2692 5.68336 18.8787 5.29283L18.7071 5.12126ZM16.4477 9.13804L14.8923 7.52185L5.90299 16.5112L5.37439 18.6256L7.48877 18.097L16.4477 9.13804Z" fill="#000000"></path> </g></svg>`;
        bin.classList.add("bin");
        bin.innerHTML = `<svg fill="#000000" viewBox="0 0 48 48" data-name="Layer 1" id="Layer_1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><title></title><path d="M42,3H28a2,2,0,0,0-2-2H22a2,2,0,0,0-2,2H6A2,2,0,0,0,6,7H42a2,2,0,0,0,0-4Z"></path><path d="M39,9a2,2,0,0,0-2,2V43H11V11a2,2,0,0,0-4,0V45a2,2,0,0,0,2,2H39a2,2,0,0,0,2-2V11A2,2,0,0,0,39,9Z"></path><path d="M21,37V19a2,2,0,0,0-4,0V37a2,2,0,0,0,4,0Z"></path><path d="M31,37V19a2,2,0,0,0-4,0V37a2,2,0,0,0,4,0Z"></path></g></svg>`;
        buttons.appendChild(edit);
        buttons.appendChild(bin);
        right.classList.add("todo-right");

        saveButton.classList.add("save-todo", "hidden", "to-be-hidden");
        resetButton.classList.add("reset-todo", "hidden", "to-be-hidden");
        saveButton.textContent = "save";
        resetButton.textContent = "reset";
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
        todoContainer.appendChild(todoCard)
        todoBottom.appendChild(desc);
        todoBottom.appendChild(descInput);
        todoBottom.appendChild(bottomButtons);
        todoContainer.appendChild(todoBottom);
        return todoContainer;
    }

    handleTodo(event) {
        const matchButton = event.target.closest("button");

        if(!matchButton) {
            const desc = event.target.closest(".todo-container").querySelector(".description");
            if (!desc.classList.contains("hidden")){
                desc.classList.toggle("hidden-description");
            }
        }
        
        else if (matchButton.matches(".bin")){
            const todoContainer = matchButton.closest(".todo-container")
            const todoId = todoContainer.dataset.id;
            this.handler.removeTodo(this.handler.getCurrentProjectId(), todoId);
            todoContainer.remove();
        }

        else if (matchButton.matches(".edit")){
            this.switchInputs(matchButton.closest(".todo-container"));
        }
    }

    displayProject ( event ) {
        const projectId = event.target.dataset.id;
        this.handler.changeCurrentProjectId(projectId);
        const todoArray = this.handler.getTodoArray( projectId );
        this.displayTodos(todoArray);
    }

    displayTodos ( todoArray ) {
        document.querySelector(".todos").textContent = "";
        for (const [todoId, todo] of todoArray) {
            this.saveTodoCards( todo.title, todo.description, todo.getTimeLeft(), todo.priority, todoId );
        }
    }

    editTodo (event) {
        const todoContainer = event.target.closest(".todo-container");
        const title = todoContainer.querySelector(".title-input").value;
        const deadline = todoContainer.querySelector(".time-input").value;
        const description = todoContainer.querySelector(".description-input").value;
        const todoId = todoContainer.dataset.id;
        const projectId = this.handler.getCurrentProjectId();
        const timeLeft = this.handler.editTodo(projectId, todoId, title, deadline, description);
        todoContainer.querySelector(".title").textContent = title;
        todoContainer.querySelector(".description").textContent = description;
        todoContainer.querySelector(".time-left").textContent = timeLeft;
        this.switchInputs(todoContainer);
    }

    resetTodo (event) {
        const todoContainer = event.target.closest(".todo-container");
        todoContainer.querySelector(".title-input").value = todoContainer.querySelector(".title").textContent;
        todoContainer.querySelector(".description-input").value = todoContainer.querySelector(".description").textContent;
        todoContainer.querySelector(".time-input").value = todoContainer.querySelector(".time-left").textContent;
    }

    switchInputs (todoContainer) {
            todoContainer.querySelectorAll(".to-be-hidden").forEach( (node) => {
                node.classList.toggle("hidden");
            });
            todoContainer.querySelectorAll(".to-be-not-hidden").forEach((node) => {
                node.classList.toggle("hidden");
            });
    }

    sortTodos ( event ) {
        const sortBy = this.sortDropDown.value;
        let todoArray = this.handler.getTodoArray( this.handler.getCurrentProjectId() );
        let sortFunction;
        if ( sortBy === "default" ) return;
        else if ( sortBy === "priority" ) { 
            const rank = { High: 0, Medium: 1, Low: 2 };
            sortFunction = (a, b) => rank[a[1].priority] - rank[b[1].priority];
        }
        else if ( sortBy === "date" ) { sortFunction = (a, b) => new Date(a[1].deadline) - new Date(b[1].deadline) }
        todoArray = todoArray.sort(sortFunction);
        this.displayTodos( todoArray );
    }


}

new uiHandler();