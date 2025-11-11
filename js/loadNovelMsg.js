let novelInfoArray = [];
let filteredNovelInfoArray = [];
let novelAuthorArray = [];
const ossBaseUrl = 'https://vjgffc-github-io.oss-cn-shenzhen.aliyuncs.com/';
const localBaseUrl = '../../assets/';
let novelContentFilesPath = ''; // 动态确定的配置文件路径
let novelDir = ''; // 动态确定的小说目录路径
const unknownAuthor = "暂无信息";
const unknownName = "暂无信息";
const itemsPerPage = 12;
let totalPages = 1;

// 检测并确定使用本地路径还是OSS路径
async function initializeNovelPaths() {
    try {
        // 尝试访问本地路径下的配置文件
        const testResponse = await fetch(`${localBaseUrl}novel/novelContentFiles.json`);
        if (testResponse.ok) {
            novelContentFilesPath = `${localBaseUrl}novel/novelContentFiles.json`;
            novelDir = `${localBaseUrl}novel/`;
            console.log('Using local paths:', { novelContentFilesPath, novelDir });
            return true;
        }
    } catch (error) {
        console.warn('Local path not accessible, falling back to OSS');
    }

    // 如果本地路径不可访问，使用OSS路径
    novelContentFilesPath = `${ossBaseUrl}novel/novelContentFiles.json`;
    novelDir = `${ossBaseUrl}novel/`;
    console.log('Using OSS paths:', { novelContentFilesPath, novelDir });
    return false;
}

/*----------------------------------信息加载---开始------------------------------------------------ */
async function loadNovelMsg() {
    // 先初始化路径
    await initializeNovelPaths();

    // 检查 sessionStorage 中是否有缓存的全部数据
    const cachedData = sessionStorage.getItem('novelInfoArray');
    if (cachedData) {
        novelInfoArray = JSON.parse(cachedData);
        console.log('Novel information loaded successfully from sessionStorage:', novelInfoArray);
        return;
    }

    // 如果没有缓存的数据，则从服务器加载
    try {
        const response = await fetch(novelContentFilesPath);
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        const novelContentFiles = await response.json();

        const promises = Object.keys(novelContentFiles).map(async folderName => {
            try {
                const msgResponse = await fetch(`${novelDir}${folderName}/msg.json`);
                if (!msgResponse.ok) {
                    throw new Error('Network response was not ok ' + msgResponse.statusText);
                }
                const msgData = await msgResponse.json();

                // 提取信息
                const novelInfo = {
                    id: folderName,
                    name: msgData.name || unknownName,
                    name_zh: msgData.name_zh || '',
                    author: msgData.author || unknownAuthor,
                    score: msgData.score || 0,
                    updateTime: novelContentFiles[folderName]
                };

                novelInfoArray.push(novelInfo);
            } catch (error) {
                console.error(`Error loading msg.json for ${folderName}:`, error);
            }
        });

        await Promise.all(promises);
        sessionStorage.setItem('novelInfoArray', JSON.stringify(novelInfoArray));
        console.log('Novel information loaded successfully:', novelInfoArray);
    } catch (error) {
        console.error('Error loading novel information:', error);
    }
}//加载全部信息

function extractAndStoreAuthors() {
    // 检查 sessionStorage 中是否有缓存的 author 数组
    const cachedAuthors = sessionStorage.getItem('novelAuthorArray');
    if (cachedAuthors) {
        novelAuthorArray = JSON.parse(cachedAuthors);
        console.log('Novel authors loaded successfully from sessionStorage:', novelAuthorArray);
    } else {
        // 提取不重复的 author 值
        novelAuthorArray = Array.from(new Set(novelInfoArray.map(novel => novel.author)));
        // 按字符串排序
        novelAuthorArray.sort((a, b) => {
            if (a === unknownAuthor) return 1;
            if (b === unknownAuthor) return -1;
            return a.localeCompare(b, 'ja');
        });
        // 存储到 sessionStorage
        sessionStorage.setItem('novelAuthorArray', JSON.stringify(novelAuthorArray));
        console.log('Novel authors loaded successfully:', novelAuthorArray);
    }
}
/*----------------------------------信息加载---结束------------------------------------------------ */








/*----------------------------------显示相关---开始------------------------------------------------ */
function getFilteredNovelInfoArray(params = {}) {
    // 获取筛选参数（都是索引字符串，如 "0,2"）
    const query = params.query || '';
    const authorParam = params.author || '';

    // 获取排序参数
    const sortKey = params.sortKey || 'updateTime';
    const sortOrder = params.sortOrder || 'desc';

    // 将索引映射为实际的筛选值
    let selectedAuthors = [];
    if (authorParam) {
        const indexes = authorParam.split(',');
        selectedAuthors = indexes.map(idx => novelAuthorArray[parseInt(idx)]).filter(val => val !== undefined);
    }

    // 过滤数据
    filteredNovelInfoArray = novelInfoArray.filter(novel => {
        // 搜索过滤：匹配 novel.name 或 novel.name_zh
        if (query) {
            const lowerQuery = query.toLowerCase();
            const nameMatch = novel.name && novel.name.toLowerCase().includes(lowerQuery);
            const nameZhMatch = novel.name_zh && novel.name_zh.toLowerCase().includes(lowerQuery);
            if (!nameMatch && !nameZhMatch) {
                return false;
            }
        }

        // author 过滤
        if (selectedAuthors.length > 0) {
            if (!selectedAuthors.includes(novel.author)) {
                return false;
            }
        }

        return true;
    });

    // 排序数据
    sortNovelInfoArray(sortKey, sortOrder);
    totalPages = Math.ceil(filteredNovelInfoArray.length / itemsPerPage);
    console.log('Filtered novel information initialized successfully:');
    console.log(filteredNovelInfoArray);
}//加载筛选后的信息

function applyFilters() {
    const { page, query, author, sortKey, sortOrder } = getURLFilterParams();
    // 这里调用筛选函数，内部会自动将索引映射为实际值进行过滤
    getFilteredNovelInfoArray({
        query: query,
        author: author,
        sortKey: sortKey,
        sortOrder: sortOrder
    });
    // 过滤条件变化后默认跳转到第一页
    goToPage(1);
}//从 URL 参数中获取筛选条件，执行筛选并跳转到第一页

function updateURLParam(paramName, value) {
    const url = new URL(window.location);
    if (!value) {
        url.searchParams.delete(paramName);
    } else {
        url.searchParams.set(paramName, value);
    }
    window.history.pushState({}, '', url);
}// 用于更新URL参数

function getURLFilterParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        page: parseInt(urlParams.get('page')) || 1,
        query: urlParams.get('query') || '',
        author: urlParams.get('author') || '',
        sortKey: urlParams.get('sortKey') || 'updateTime',
        sortOrder: urlParams.get('sortOrder') || 'desc'
    };
}//获取URL参数
/*----------------------------------显示相关---结束------------------------------------------------ */










/*----------------------------------搜索相关---开始------------------------------------------------ */
function performSearch(query) {
    // 更新 URL 参数以包含当前搜索查询
    const url = new URL(window.location);
    url.searchParams.set('query', query);
    window.history.pushState({}, '', url);
    console.log('Performing search:', query);
    applyFilters();
}

function handleSearchButtonClick() {
    const searchInput = document.getElementById('search-input').value;
    performSearch(searchInput);
}

function handleSearchInput(event) {
    if (event.key === 'Enter') {
        performSearch(event.target.value);
    }
}
/*----------------------------------搜索相关---结束------------------------------------------------ */










/*----------------------------------筛选相关---开始------------------------------------------------ */
function toggleFilterOptions() {
    const filterBox = document.getElementById('filter-box');
    if (filterBox.classList.contains('open')) {
        filterBox.classList.remove('open');
        // 在动画结束后，重置滚动位置为0
        setTimeout(() => {
            const containers = filterBox.querySelectorAll('.filter-category-content');
            containers.forEach(container => {
                container.scrollTop = 0;
            });
        }, 500);
    } else {
        filterBox.classList.add('open');
        // 每次打开时恢复之前保存的滚动位置
        const containers = filterBox.querySelectorAll('.filter-category-content');
        containers.forEach(container => {
            const savedScrollTop = sessionStorage.getItem(`${container.id}-scrollTop`);
            if (savedScrollTop) {
                container.scrollTop = parseInt(savedScrollTop, 10);
            }
        });
        // 监听滚动事件，保存滚动位置
        containers.forEach(container => {
            container.addEventListener('scroll', () => {
                sessionStorage.setItem(`${container.id}-scrollTop`, container.scrollTop);
            });
        });
    }
}

function renderFilterOptions(containerId, options) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id ${containerId} not found.`);
        return;
    }

    container.innerHTML = '';

    // 根据containerId获取对应的URL参数名称
    const urlParamName = containerId.replace('filter-category-content-', '');

    // 新增"全部"选项
    const allOption = document.createElement('div');
    allOption.className = 'filter-category-option filter-all-option selected'; // 默认选中
    allOption.textContent = '全部';
    allOption.dataset.value = 'all';
    allOption.addEventListener('click', function () {
        // 清除所有选中状态
        const allOptions = container.querySelectorAll('.filter-category-option');
        allOptions.forEach(opt => opt.classList.remove('selected'));
        // 选中"全部"
        this.classList.add('selected');
        // 清除URL参数
        updateURLParam(urlParamName, '');
        applyFilters();
    });
    container.appendChild(allOption);

    // 原有选项循环
    options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'filter-category-option';
        optionDiv.textContent = option;
        optionDiv.dataset.index = index;

        optionDiv.addEventListener('click', function () {
            const allOpt = container.querySelector('.filter-all-option');
            // 判断当前选项是否已选中
            const isSelected = this.classList.contains('selected');

            if (isSelected) {
                // 取消当前选中
                this.classList.remove('selected');
            } else {
                // 添加选中
                this.classList.add('selected');
            }

            // 取消"全部"的选中状态
            allOpt.classList.remove('selected');

            // 收集所有选中的索引
            const selectedOptions = container.querySelectorAll('.filter-category-option.selected:not(.filter-all-option)');
            if (selectedOptions.length === 0) {
                // 如果没有选中任何选项，则选中"全部"
                allOpt.classList.add('selected');
                updateURLParam(urlParamName, '');
            } else {
                const selectedIndexes = Array.from(selectedOptions).map(opt => opt.dataset.index);
                updateURLParam(urlParamName, selectedIndexes.join(','));
            }

            applyFilters();
        });

        container.appendChild(optionDiv);
    });

    console.log(`已加载 ${options.length + 1} 个选项到 ${containerId}`);
}

function restoreFilterOptions() {
    // 获取 URL 参数（使用之前封装的 getURLFilterParams 函数）
    const urlParams = getURLFilterParams();
    // 查找页面中所有的筛选容器，格式为 filter-category-content-xxx
    const containers = document.querySelectorAll('[id^="filter-category-content-"]');

    containers.forEach(container => {
        const paramName = container.id.replace('filter-category-content-', '');
        const paramValue = urlParams[paramName];

        if (paramValue) {
            // 有筛选参数，解析索引并选中对应选项
            const indexes = paramValue.split(',');
            indexes.forEach(idx => {
                const option = container.querySelector(`.filter-category-option[data-index="${idx}"]`);
                if (option) {
                    option.classList.add('selected');
                }
            });
            // 取消"全部"的选中状态
            const allOption = container.querySelector('.filter-all-option');
            if (allOption) {
                allOption.classList.remove('selected');
            }
        } else {
            // 没有筛选参数，选中"全部"
            const allOption = container.querySelector('.filter-all-option');
            if (allOption && !allOption.classList.contains('selected')) {
                allOption.classList.add('selected');
            }
        }
    });
}

/*----------------------------------筛选相关---结束-------------------------------------------------*/









/*----------------------------------排序相关---开始-------------------------------------------------*/
function toggleSortOrder(buttonId, key) {
    const button = document.getElementById(buttonId);

    // 移除所有按钮的排序状态类
    const sortButtons = document.querySelectorAll('#novel-sort-box > .novel-sort-button');
    sortButtons.forEach(btn => {
        btn.classList.remove('sort-asc');
        btn.classList.remove('sort-desc');
    });

    // 切换当前按钮的排序状态
    if (button.classList.contains('sort-desc')) {
        button.classList.remove('sort-desc');
        button.classList.add('sort-asc');
    } else {
        button.classList.remove('sort-asc');
        button.classList.add('sort-desc');
    }

    // 存储排序状态到 sessionStorage
    const url = new URL(window.location);
    url.searchParams.set('sortKey', key);
    url.searchParams.set('sortOrder', button.classList.contains('sort-asc') ? 'asc' : 'desc');
    window.history.pushState({}, '', url);

    // 刷新页面
    goToPage(1);
}//排序按钮事件

function sortNovelInfoArray(key, order = 'asc') {
    filteredNovelInfoArray.sort((a, b) => {
        let valA, valB;

        switch (key) {
            case 'updateTime':
                valA = a.updateTime;
                valB = b.updateTime;
                break;
            case 'score':
                valA = a.score;
                valB = b.score;
                break;
            default:
                return 0;
        }

        // 处理 undefined 或 null 值
        if (valA === undefined || valA === null) valA = 0;
        if (valB === undefined || valB === null) valB = 0;

        if (order === 'asc') {
            return valA > valB ? 1 : valA < valB ? -1 : 0;
        } else {
            return valA < valB ? 1 : valA > valB ? -1 : 0;
        }
    });

    // 将排序后的数据存储到 sessionStorage 中
    sessionStorage.setItem('filteredNovelInfoArray', JSON.stringify(filteredNovelInfoArray));
}//排序函数

function restoreSortState() {
    const urlParams = new URLSearchParams(window.location.search);
    const sortKey = urlParams.get('sortKey') || 'updateTime';
    const sortOrder = urlParams.get('sortOrder') || 'desc';

    if (sortKey && sortOrder) {
        const buttonId = `novel-sort-${sortKey}`;
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.add(sortOrder === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    }
}//加载排序按钮状态

/*----------------------------------排序相关---结束------------------------------------------------ */











/*----------------------------------翻页相关---开始-------------------------------------------------*/

function displayPagination(currentPage) {
    const totalPagesSpan = document.getElementById('total-pages');
    totalPagesSpan.textContent = totalPages;

    document.getElementById('current-page').value = currentPage;
}//显示页码

function goToPage(page) {
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    const url = new URL(window.location);
    url.searchParams.set('page', page);
    window.history.pushState({}, '', url);
    scrollToId('novel-box');
    displayNovelInfo(page);
}//跳转到指定页

function changePage(delta) {
    const currentPage = parseInt(document.getElementById('current-page').value);
    goToPage(currentPage + delta);
}//翻页

function handlePageInput(event) {
    if (event.key === 'Enter') {
        jumpToPage();
    }
}//输入页码后按回车跳转

function jumpToPage() {
    const input = document.getElementById('current-page').value;
    const page = parseInt(input);
    if (isNaN(page)) {
        alert('请输入有效的页码');
        document.getElementById('current-page').value = parseInt(new URLSearchParams(window.location.search).get('page')) || 1;
        return;
    }
    goToPage(page);
}//处理输入页码

function scrollToId(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}//滚动到指定id

function displayNovelInfo(page = 1) {
    console.log('Displaying page', page);
    const novelsLinkDiv = document.getElementById('novels-link');
    novelsLinkDiv.innerHTML = ''; // 清空之前的内容

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filteredNovelInfoArray.slice(start, end);
    console.log('Displaying items:', pageItems);

    // 如果当前页没有内容，则显示"暂无内容"的提示
    if (pageItems.length === 0) {
        const noContentDiv = document.createElement('div');
        noContentDiv.className = 'no-content-warning';
        noContentDiv.textContent = '暂无内容';
        novelsLinkDiv.appendChild(noContentDiv);
    } else {
        pageItems.forEach(novel => {
            const novelDiv = document.createElement('div');
            novelDiv.className = 'novels-link-item';

            const img = document.createElement('img');
            img.src = `${novelDir}${novel.id}/cover.jpg`;
            img.alt = novel.name || novel.name_zh || '暂无封面';
            img.addEventListener('click', function () {
                window.location.href = `novel-detail.html?id=${novel.id}`;
            });

            const nameDiv = document.createElement('div');
            nameDiv.className = 'novel-name';

            const nameJp = document.createElement('div');
            nameJp.className = 'novel-name-jp';
            nameJp.textContent = novel.name || unknownName;
            nameJp.addEventListener('click', function () {
                window.location.href = `novel-detail.html?id=${novel.id}`;
            });

            const nameZh = document.createElement('div');
            nameZh.className = 'novel-name-zh';
            nameZh.textContent = novel.name_zh || '';
            nameZh.addEventListener('click', function () {
                window.location.href = `novel-detail.html?id=${novel.id}`;
            });

            nameDiv.appendChild(nameJp);
            if (novel.name_zh) {
                nameDiv.appendChild(nameZh);
            }

            novelDiv.appendChild(img);
            novelDiv.appendChild(nameDiv);
            novelsLinkDiv.appendChild(novelDiv);
        });
    }

    restoreSortState();
    document.getElementById('current-page').addEventListener('blur', function () {
        this.value = parseInt(new URLSearchParams(window.location.search).get('page')) || 1;
    });
    displayPagination(page);
}//显示指定页的内容
/*----------------------------------翻页相关---结束-------------------------------------------------*/







// 绑定到 document 动作上
document.addEventListener("DOMContentLoaded", async function () {
    try {
        await loadNovelMsg();
        extractAndStoreAuthors();

        // 初始化筛选功能
        renderFilterOptions('filter-category-content-author', novelAuthorArray);
        restoreFilterOptions();

        const { page, query, author, sortKey, sortOrder } = getURLFilterParams();
        getFilteredNovelInfoArray({
            query: query,
            author: author,
            sortKey: sortKey,
            sortOrder: sortOrder
        });
        goToPage(page);
    } catch (error) {
        console.error('Error initializing page:', error);
    }
});
