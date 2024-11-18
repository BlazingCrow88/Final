/**
 * ACME Blog Sharing App - Complete Implementation
 */

// Function 1: Create element with text
const createElemWithText = (tagName = "p", textContent = "", className) => {
    const elem = document.createElement(tagName);
    elem.textContent = textContent;
    if (className) elem.classList.add(className);
    return elem;
};

// Function 2: Create select options
const createSelectOptions = (users) => {
    if (!users) return undefined;
    return users.map(user => {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = user.name;
        return option;
    });
};

// Function 3: Toggle comment section
const toggleCommentSection = (postId) => {
    if (!postId) return;
    const section = document.querySelector(`section[data-post-id="${postId}"]`);
    if (!section) return null;
    section.classList.toggle("hide");
    return section;
};

// Function 4: Toggle comment button
const toggleCommentButton = (postId) => {
    if (!postId) return;
    const button = document.querySelector(`button[data-post-id="${postId}"]`);
    if (!button) return null;
    button.textContent = button.textContent === "Show Comments" 
        ? "Hide Comments" 
        : "Show Comments";
    return button;
};

// Function 5: Delete child elements
const deleteChildElements = (parentElement) => {
    if (!(parentElement instanceof HTMLElement)) return;
    let child = parentElement.lastElementChild;
    while (child) {
        parentElement.removeChild(child);
        child = parentElement.lastElementChild;
    }
    return parentElement;
};

// Function 6: Add button listeners
const addButtonListeners = () => {
    const buttons = document.querySelectorAll("main button");
    buttons.forEach(button => {
        if (button.dataset.id) {
            button.addEventListener("click", (event) => 
                toggleComments(event, button.dataset.id));
        }
    });
    return buttons;
};

// Function 7: Remove button listeners
const removeButtonListeners = () => {
    const buttons = document.querySelectorAll("main button");
    buttons.forEach(button => {
        if (button.dataset.id) {
            button.removeEventListener("click", (event) => 
                toggleComments(event, button.dataset.id));
        }
    });
    return buttons;
};

// Function 8: Create comments
const createComments = (comments) => {
    if (!comments) return;
    const fragment = document.createDocumentFragment();
    comments.forEach(comment => {
        const article = document.createElement("article");
        const h3 = createElemWithText("h3", comment.name);
        const bodyP = createElemWithText("p", comment.body);
        const emailP = createElemWithText("p", `From: ${comment.email}`);
        article.append(h3, bodyP, emailP);
        fragment.append(article);
    });
    return fragment;
};

// Function 9: Populate select menu
const populateSelectMenu = (users) => {
    if (!users) return;
    const selectMenu = document.querySelector("#selectMenu");
    const options = createSelectOptions(users);
    options.forEach(option => selectMenu.append(option));
    return selectMenu;
};

// Function 10: Get users
const getUsers = async () => {
    try {
        const response = await fetch("https://jsonplaceholder.typicode.com/users");
        if (!response.ok) throw new Error('Failed to fetch users');
        return await response.json();
    } catch (error) {
        console.error("Error fetching users:", error);
        return null;
    }
};

// Function 11: Get user posts
const getUserPosts = async (userId) => {
    if (!userId) return;
    try {
        const response = await fetch(
            `https://jsonplaceholder.typicode.com/posts?userId=${userId}`
        );
        if (!response.ok) throw new Error('Failed to fetch posts');
        return await response.json();
    } catch (error) {
        console.error("Error fetching posts:", error);
        return null;
    }
};

// Function 12: Get user
const getUser = async (userId) => {
    if (!userId) return;
    try {
        const response = await fetch(
            `https://jsonplaceholder.typicode.com/users/${userId}`
        );
        if (!response.ok) throw new Error('Failed to fetch user');
        return await response.json();
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
};

// Function 13: Get post comments
const getPostComments = async (postId) => {
    if (!postId) return;
    try {
        const response = await fetch(
            `https://jsonplaceholder.typicode.com/comments?postId=${postId}`
        );
        if (!response.ok) throw new Error('Failed to fetch comments');
        return await response.json();
    } catch (error) {
        console.error("Error fetching comments:", error);
        return null;
    }
};

// Function 14: Display comments
const displayComments = async (postId) => {
    if (!postId) return;
    const section = document.createElement("section");
    section.dataset.postId = postId;
    section.classList.add("comments", "hide");
    const comments = await getPostComments(postId);
    if (comments) {
        const fragment = createComments(comments);
        section.append(fragment);
    }
    return section;
};

// Function 15: Create posts
const createPosts = async (posts) => {
    if (!posts) return;
    const fragment = document.createDocumentFragment();
    for (const post of posts) {
        const article = document.createElement("article");
        const h2 = createElemWithText("h2", post.title);
        const body = createElemWithText("p", post.body);
        const postId = createElemWithText("p", `Post ID: ${post.id}`);
        const author = await getUser(post.userId);
        const authorName = createElemWithText("p", `Author: ${author.name} with ${author.company.name}`);
        const companyCatchPhrase = createElemWithText("p", author.company.catchPhrase);
        const button = createElemWithText("button", "Show Comments");
        button.dataset.postId = post.id;
        const section = await displayComments(post.id);
        article.append(h2, body, postId, authorName, companyCatchPhrase, button, section);
        fragment.append(article);
    }
    return fragment;
};

// Function 16: Display posts
const displayPosts = async (posts) => {
    const main = document.querySelector("main");
    const element = posts 
        ? await createPosts(posts)
        : createElemWithText("p", "Select an Employee to display their posts", "default-text");
    main.append(element);
    return element;
};

// Function 17: Toggle comments
const toggleComments = (event, postId) => {
    if (!event || !postId) return;
    event.target.listener = true;
    const section = toggleCommentSection(postId);
    const button = toggleCommentButton(postId);
    return [section, button];
};

// Function 18: Refresh posts
const refreshPosts = async (posts) => {
    if (!posts) return;
    const main = document.querySelector("main");
    const removeButtons = removeButtonListeners();
    const clearMain = deleteChildElements(main);
    const fragment = await displayPosts(posts);
    const addButtons = addButtonListeners();
    return [removeButtons, clearMain, fragment, addButtons];
};

// Function 19: Select menu change handler
const selectMenuChangeEventHandler = async (event) => {
    if (!event) return;
    const selectMenu = event.target;
    selectMenu.disabled = true;
    const userId = event.target.value || 1;
    const posts = await getUserPosts(userId);
    const refreshPostsArray = await refreshPosts(posts);
    selectMenu.disabled = false;
    return [userId, posts, refreshPostsArray];
};

// Function 20: Initialize page
const initPage = async () => {
    const users = await getUsers();
    const select = populateSelectMenu(users);
    return [users, select];
};

// Function 21: Initialize app
const initApp = async () => {
    await initPage();
    const selectMenu = document.querySelector("#selectMenu");
    selectMenu.addEventListener("change", selectMenuChangeEventHandler);
};

// Start the application when DOM is loaded
document.addEventListener("DOMContentLoaded", initApp);
