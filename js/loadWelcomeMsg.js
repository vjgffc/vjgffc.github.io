function loadWelcomeMessage() {
// 获取当前 HTML 文件的路径
const pathArray = window.location.pathname.split('/');
const currentFolderName = pathArray[pathArray.length - 2]; // 获取倒数第二个元素作为文件夹名称

// 构建 readme.md 文件的路径
const welcomePath = `../${currentFolderName}/readme.md`;

    // 检查 localStorage 中是否有缓存的数据
    const cachedData = localStorage.getItem(welcomePath);
    if (cachedData) {
        document.getElementById('welcome-box').innerHTML = marked.parse(cachedData);
        return;
    }

    // 如果没有缓存的数据，则从服务器加载
    fetch(welcomePath)
        .then(response => response.text())
        .then(data => {
            // 将加载的数据存储到 localStorage 中
            localStorage.setItem(welcomePath, data);
            document.getElementById('welcome-box').innerHTML = marked.parse(data);
        })
        .catch(error => console.error('Error loading welcome message:', error));
}

document.addEventListener("DOMContentLoaded", loadWelcomeMessage);