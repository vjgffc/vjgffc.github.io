let animeInfoArray = [];
let filteredAnimeInfoArray = [];
let animeSourceArray = [];
let animeProductionArray = [];
let animeReleaseArray = [];
const ossBaseUrl = 'https://vjgffc-github-io.oss-cn-shenzhen.aliyuncs.com/';
const unknownProduction = "暂无信息";
const unknownRealeaseDate = "暂未播出";
const unknownName="暂无信息";
const unknownSource="未知";
const itemsPerPage = 12;
let totalPages = 1;

const animeContentFilesPath = `${ossBaseUrl}anime/animeContentFiles.json`;
const animeDir = `${ossBaseUrl}anime/`;

/*----------------------------------信息加载---开始------------------------------------------------ */
function loadAnimeMsg() {
    // 检查 sessionStorage 中是否有缓存的全部数据
    const cachedData = sessionStorage.getItem('animeInfoArray');
    if (cachedData) {
        animeInfoArray = JSON.parse(cachedData);
        return Promise.resolve().then(() => {
            console.log('Anime information loaded successfully from sessionStorage:', animeInfoArray);
        });
    }

    // 如果没有缓存的数据，则从服务器加载
    return fetch(animeContentFilesPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch animeContentFiles.json: ${response.statusText}`);
            }
            return response.json();
        })
        .then(animeContentFiles => {
            const promises = Object.keys(animeContentFiles).map(folderName => {
                const folderPath = `${animeDir}${folderName}`;
                const msgFilePath = `${folderPath}/msg.json`;
                return fetch(msgFilePath)
                    .then(response => {
                        if (!response.ok) {
                            console.warn(`Failed to fetch ${msgFilePath}: ${response.statusText}`);
                            return null; // 返回 null 以跳过此动画
                        }
                        return response.json();
                    })
                    .then(msg => {
                        if (!msg) return; // 如果 msg 为 null，跳过

                        const animeInfo = {
                            name: msg.name || unknownName,
                            name_zh: msg.name_zh,
                            source: msg.source || unknownSource,
                            updateTime: parseInt(animeContentFiles[folderName], 10) || 0,
                            release_date: (msg.seasons && msg.seasons.length > 0) ? msg.seasons.map(season => parseInt(season.release_date, 10) || 0) : [0],
                            production: (msg.seasons && msg.seasons.length > 0) ? Array.from(new Set(msg.seasons.flatMap(season => season.production || [unknownProduction]))) : [unknownProduction],
                            score: (msg.seasons && msg.seasons.length > 0) ? msg.seasons.map(season => season.score) : [0],

                            url: folderPath // 添加文件夹路径
                        };
                        animeInfoArray.push(animeInfo);
                    })
                    .catch(error => {
                        console.error(`Error processing ${msgFilePath}:`, error);
                    });
            });

            return Promise.all(promises);
        })
        .then(() => {
            sessionStorage.setItem('animeInfoArray', JSON.stringify(animeInfoArray));
            console.log('Anime information loaded successfully:', animeInfoArray);
        })
        .catch(error => {
            console.error('Error loading anime information:', error);
        });
}//加载全部信息
function extractAndStoreSources() {
    // 检查 sessionStorage 中是否有缓存的 source 数组
    const cachedSources = sessionStorage.getItem('animeSourceArray');
    if (cachedSources) {
        animeSourceArray = JSON.parse(cachedSources);
        console.log('Anime sources loaded successfully from sessionStorage:', animeSourceArray);
    } else {
        // 提取不重复的 source 值
        animeSourceArray = Array.from(new Set(animeInfoArray.map(anime => anime.source)));
        // 存储到 sessionStorage
        sessionStorage.setItem('animeSourceArray', JSON.stringify(animeSourceArray));
        console.log('Anime sources loaded successfully:', animeSourceArray);
    }
}

function extractAndStoreProductions() {
    // 检查 sessionStorage 中是否有缓存的 production 数组
    const cachedProductions = sessionStorage.getItem('animeProductionArray');
    if (cachedProductions) {
        animeProductionArray = JSON.parse(cachedProductions);
        console.log('Anime productions loaded successfully from sessionStorage:', animeProductionArray);
    } else {
        // 提取不重复的 production 值
        animeProductionArray = Array.from(new Set(animeInfoArray.flatMap(anime => anime.production)));
        // 按字符串排序
        animeProductionArray.sort((a, b) => {
            // 处理"未知"特殊排序
            if (a === unknownProduction&& b !== unknownProduction) return 1;  // 把unknownProduction排到最后
            if (b === unknownProduction && a !== unknownProduction) return -1;
            return a.localeCompare(b); // 其他正常按字母排序

        });
        // 存储到 sessionStorage
        sessionStorage.setItem('animeProductionArray', JSON.stringify(animeProductionArray));
        console.log('Anime productions loaded successfully:', animeProductionArray);
    }
}

function extractAndStoreReleases() {
    // 检查 sessionStorage 中是否有缓存的 release_date 数组
    const cachedReleases = sessionStorage.getItem('animeReleaseArray');
    if (cachedReleases) {
        animeReleaseArray = JSON.parse(cachedReleases);
        console.log('Anime releases loaded successfully from sessionStorage:', animeReleaseArray);
    } else {
        // 提取不重复的 release_date 值
        animeReleaseArray = Array.from(new Set(animeInfoArray.flatMap(anime => anime.release_date)));
        // 按数值从大到小排序
        animeReleaseArray.sort((a, b) => b - a);
        // 存储到 sessionStorage
        sessionStorage.setItem('animeReleaseArray', JSON.stringify(animeReleaseArray));
        console.log('Anime releases loaded successfully:', animeReleaseArray);
    }
}
/*----------------------------------信息加载---结束------------------------------------------------ */








/*----------------------------------视图切换---开始------------------------------------------------ */
function toggleView(buttonId) {
    // 获取所有布局按钮
    const layoutButtons = document.querySelectorAll('#layout-button > span');

    // 遍历所有布局按钮
    layoutButtons.forEach(button => {
        if (button.id === buttonId) {
            // 如果是当前按下的按钮，背景颜色变为透明
            button.style.backgroundColor = 'transparent';
            button.style.color = 'rgb(0, 0, 0)';
        } else {
            // 其他按钮背景颜色恢复为原来的颜色
            button.style.backgroundColor = 'rgba(150, 107, 0, 0.8)';
            button.style.color = 'rgba(97, 97, 97, 0.64)';
        }
    });

    // 保存当前布局状态到 URL 参数中
    const layoutId = buttonId.replace('layout-button-', '');
    const url = new URL(window.location);
    url.searchParams.set('layout', layoutId);
    window.history.pushState({}, '', url);

    // 获取页面中已嵌入的 article 元素
    const defaultArticle = document.getElementById('anime-layout-default');
    const comparisonArticle = document.getElementById('anime-layout-comparison');

    if (buttonId === 'layout-button-default') {
        // 显示默认布局，隐藏对比布局
        if (defaultArticle) defaultArticle.style.display = 'block';
        if (comparisonArticle) comparisonArticle.style.display = 'none';

        // 初始化默认布局中的筛选功能
        renderFilterOptions('filter-category-content-source', animeSourceArray);
        renderFilterOptions('filter-category-content-release_date', animeReleaseArray.map(String));
        renderFilterOptions('filter-category-content-production', animeProductionArray);
        restoreFilterOptions();

        const { page, query, source, release_date, production, sortKey, sortOrder } = getURLFilterParams();
        getFilteredAnimeInfoArray({
            query: query,
            source: source,
            release_date: release_date,
            production: production,
            sortKey: sortKey,
            sortOrder: sortOrder
        });
        goToPage(page);
    } else if (buttonId === 'layout-button-comparison') {
        // 显示对比布局，隐藏默认布局
        if (defaultArticle) defaultArticle.style.display = 'none';
        if (comparisonArticle) comparisonArticle.style.display = 'block';

        // 此处可添加对比布局的初始化代码（例如加载对比数据等）
    }
}//视图切换按钮事件

function restoreLayoutState() {
    const urlParams = new URLSearchParams(window.location.search);
    const layoutId = urlParams.get('layout');
    if (layoutId) {
        const buttonId = `layout-button-${layoutId}`;
        toggleView(buttonId);
    } else {
        // 默认设置为 'layout-button-default'
        toggleView('layout-button-default');
    }
}//加载视图状态
/*----------------------------------试图切换---结束------------------------------------------------ */










/*----------------------------------显示相关---开始------------------------------------------------ */
function getFilteredAnimeInfoArray(params = {}) {
    // 获取筛选参数（都是索引字符串，如 "0,2"）
    const query = params.query || '';
    const sourceParam = params.source || '';
    const releaseDateParam = params.release_date || '';
    const productionParam = params.production || '';

    // 获取排序参数
    const sortKey = params.sortKey || 'updateTime';
    const sortOrder = params.sortOrder || 'desc';

    // 将索引映射为实际的筛选值
    let selectedSources = [];
    if (sourceParam) {
        const indexes = sourceParam.split(',');
        selectedSources = indexes.map(idx => animeSourceArray[parseInt(idx)]).filter(val => val !== undefined);
    }
    let selectedReleaseDates = [];
    if (releaseDateParam) {
        const indexes = releaseDateParam.split(',');
        // 映射后转换为字符串，便于后续比较（anime.release_date 内部先转换为字符串来比较）
        selectedReleaseDates = indexes.map(idx => String(animeReleaseArray[parseInt(idx)]))
            .filter(val => val !== 'undefined');
    }
    let selectedProductions = [];
    if (productionParam) {
        const indexes = productionParam.split(',');
        selectedProductions = indexes.map(idx => animeProductionArray[parseInt(idx)]).filter(val => val !== undefined);
    }

    // 过滤数据
    filteredAnimeInfoArray = animeInfoArray.filter(anime => {
            // 搜索过滤：匹配 anime.name 或 anime.name_zh
            if (query) {
                const nameMatch = anime.name && anime.name.toLowerCase().includes(query.toLowerCase());
                const nameZhMatch = anime.name_zh && anime.name_zh.toLowerCase().includes(query.toLowerCase());
                if (!nameMatch && !nameZhMatch) {
                    return false;
                }
            }
        
            // ... 其他过滤代码保持不变 ...
        // source 过滤
        if (selectedSources.length) {
            if (!selectedSources.includes(anime.source)) {
                return false;
            }
        }

        // release_date 过滤
        if (selectedReleaseDates.length) {
            // 将 anime.release_date 数字数组转换为字符串数组以进行比较
            const releaseDates = anime.release_date.map(date => date.toString());
            // 如果 anime.release_date 的任一值与 selectedReleaseDates 中的一个匹配，则认为满足条件
            if (!selectedReleaseDates.some(val => releaseDates.includes(val))) {
                return false;
            }
        }

        // production 过滤
        if (selectedProductions.length) {
            // 如果 anime.production 数组中没有任何一个选中的 production，则过滤掉
            if (!selectedProductions.some(val => anime.production.includes(val))) {
                return false;
            }
        }

        return true;
    });

    // 排序数据
    sortAnimeInfoArray(sortKey, sortOrder);
    totalPages = Math.ceil(filteredAnimeInfoArray.length / itemsPerPage);
    console.log('Filtered anime information initialized successfully:');
    console.log(filteredAnimeInfoArray);
}//加载筛选后的信息

function applyFilters() {
    const { page, query, source, release_date, production, sortKey, sortOrder } = getURLFilterParams();
    // 这里调用筛选函数，内部会自动将索引映射为实际值进行过滤
    getFilteredAnimeInfoArray({
        query: query,
        source: source,
        release_date: release_date,
        production: production,
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
        source: urlParams.get('source') || '',
        release_date: urlParams.get('release_date') || '',
        production: urlParams.get('production') || '',
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
        handleSearchButtonClick()
    }
}
/*----------------------------------搜索相关---结束------------------------------------------------ */










/*----------------------------------筛选相关---开始------------------------------------------------ */
function toggleFilterOptions() {
    const filterBox = document.getElementById('filter-box');
    if (filterBox.classList.contains('open')) {
        // 关闭筛选框
        filterBox.classList.remove('open');
        // setTimeout(() => {
        //     // filterBox.innerHTML = '';
        // }, 500); // 等待动画完成后再移除内容
    } else {
        // 打开筛选框
        filterBox.classList.add('open');
        // setTimeout(() => {
        //     // 动态加载筛选内容
        //     // fetch('../html/anime-filter-box.html')
        //     //     .then(response => response.text())
        //     //     .then(data => {
        //     //         // 将整个文件内容插入到 filterBox 中
        //     //         filterBox.innerHTML = data;
        //     //         renderFilterOptions('filter-category-content-source', animeSourceArray);
        //     //         renderFilterOptions('filter-category-content-release_date', animeReleaseArray.map(String));
        //     //         renderFilterOptions('filter-category-content-production', animeProductionArray);
        //     //     })
        //     //     .catch(error => {
        //     //         console.error('Error loading filter content:', error);
        //     //     });
        // }, 10); // 确保动画开始后再加载内容
    }
}

function renderFilterOptions(containerId, options) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`找不到容器：${containerId}`);
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
        container.querySelectorAll('.filter-category-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        this.classList.add('selected');
        // 点击"全部"，清空对应URL参数
        updateURLParam(urlParamName, '');
        // 立即执行筛选功能
        applyFilters();
    });
    container.appendChild(allOption);

    // 原有选项循环
    options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'filter-category-option';
        optionElement.textContent = option === "0" ? unknownRealeaseDate: option;
        optionElement.dataset.value = option;
        // 保存索引用于URL参数映射
        optionElement.dataset.index = index;

        // 基础交互效果并更新URL参数
        optionElement.addEventListener('click', function () {
            // 先移除"全部"的选中状态
            const allOpt = container.querySelector('.filter-all-option');
            if (allOpt) {
                allOpt.classList.remove('selected');
            }

            // 切换当前选项状态
            this.classList.toggle('selected');

            // 如果没有选中任何选项，自动恢复"全部"选中状态
            const selected = container.querySelectorAll('.filter-category-option.selected:not(.filter-all-option)');
            if (selected.length === 0) {
                allOpt.classList.add('selected');
            }

            // 更新对应的URL参数
            const selectedOptions = container.querySelectorAll('.filter-category-option.selected:not(.filter-all-option)');
            if (selectedOptions.length === 0) {
                updateURLParam(urlParamName, '');
            } else {
                const selectedIndexes = Array.from(selectedOptions).map(opt => opt.dataset.index);
                updateURLParam(urlParamName, selectedIndexes.join(','));
            }
            
            // 立即执行筛选功能
            applyFilters();
        });

        container.appendChild(optionElement);
    });

    console.log(`已加载 ${options.length + 1} 个选项到 ${containerId}`);
}

function restoreFilterOptions() {
    // 获取 URL 参数（使用之前封装的 getURLFilterParams 函数）
    const urlParams = getURLFilterParams();
    // 查找页面中所有的筛选容器，格式为 filter-category-content-xxx
    const containers = document.querySelectorAll('[id^="filter-category-content-"]');
    
    containers.forEach(container => {
        // 根据容器ID获取对应的 URL 参数名，例如 "filter-category-content-production" 对应 production
        const paramName = container.id.replace('filter-category-content-', '');
        const paramValue = urlParams[paramName] || '';
        
        // 清除该容器中所有选项的选中状态
        container.querySelectorAll('.filter-category-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        if (!paramValue) {
            // 如果对应参数为空，则恢复"全部"按钮选中状态
            const allOption = container.querySelector('.filter-all-option');
            if (allOption) {
                allOption.classList.add('selected');
            }
        } else {
            // 如果存在参数，则解析逗号分隔的索引
            const selectedIndexes = paramValue.split(',');
            selectedIndexes.forEach(index => {
                const option = container.querySelector(`.filter-category-option[data-index="${index}"]`);
                if (option) {
                    option.classList.add('selected');
                }
            });
        }
    });
}

/*----------------------------------筛选相关---结束-------------------------------------------------*/









/*----------------------------------排序相关---开始-------------------------------------------------*/
function toggleSortOrder(buttonId, key) {
    const button = document.getElementById(buttonId);

    // 移除所有按钮的排序状态类
    const sortButtons = document.querySelectorAll('#anime-sort-box > .anime-sort-button');
    sortButtons.forEach(btn => {
        if (btn.id !== buttonId) {
            btn.classList.remove('sort-asc', 'sort-desc');
        }
    });

    // 切换当前按钮的排序状态
    if (button.classList.contains('sort-desc')) {
        button.classList.remove('sort-desc');
        button.classList.add('sort-asc');
        sortAnimeInfoArray(key, 'asc');
    } else {
        button.classList.remove('sort-asc');
        button.classList.add('sort-desc');
        sortAnimeInfoArray(key, 'desc');
    }

    // 存储排序状态到 sessionStorage
    const url = new URL(window.location);
    url.searchParams.set('sortKey', key);
    url.searchParams.set('sortOrder', button.classList.contains('sort-asc') ? 'asc' : 'desc');
    window.history.pushState({}, '', url);

    // 刷新页面
    goToPage(1);
}//排序按钮事件

function sortAnimeInfoArray(key, order = 'asc') {
    filteredAnimeInfoArray.sort((a, b) => {
        const aValue = a[key];
        const bValue = b[key];

        // 默认值处理
        const aIsDefault = (aValue === "暂无" || aValue === 0);
        const bIsDefault = (bValue === "暂无" || bValue === 0);

        if (aIsDefault && !bIsDefault) return 1;
        if (!aIsDefault && bIsDefault) return -1;
        if (aIsDefault && bIsDefault) return 0;

        if (key === 'release_date') {
            const aMax = Math.max(...aValue);
            const bMax = Math.max(...bValue);
            if (aMax !== bMax) return order === 'asc' ? aMax - bMax : bMax - aMax;
            if (a.updateTime !== b.updateTime) return b.updateTime - a.updateTime;
            return a.name.localeCompare(b.name);
        }

        if (key === 'updateTime') {
            if (aValue !== bValue) return order === 'asc' ? aValue - bValue : bValue - aValue;
            return a.name.localeCompare(b.name);
        }

        if (key === 'score') {
            const aMax = Math.max(...aValue);
            const bMax = Math.max(...bValue);

            const aIsFirstType = (aMax >= 2 && aMax <= 59);
            const bIsFirstType = (bMax >= 2 && bMax <= 59);

            if (aIsFirstType && !bIsFirstType) {
                return order === 'asc' ? 1 : -1;
            }
            if (!aIsFirstType && bIsFirstType) {
                return order === 'asc' ? -1 : 1;
            }
            if (aIsFirstType && bIsFirstType) {
                return order === 'asc' ? aMax - bMax : bMax - aMax;
            }
            if (aMax === bMax) {
                if (a.updateTime !== b.updateTime) return b.updateTime - a.updateTime;
                return a.name.localeCompare(b.name);
            }
            return order === 'asc' ? aMax - bMax : bMax - aMax;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }

        return order === 'asc' ? aValue - bValue : bValue - aValue;
    });

    // 将排序后的数据存储到 sessionStorage 中
    sessionStorage.setItem('filteredAnimeInfoArray', JSON.stringify(filteredAnimeInfoArray));
}//排序函数

function restoreSortState() {
    const urlParams = new URLSearchParams(window.location.search);
    const sortKey = urlParams.get('sortKey')||'updateTime';
    const sortOrder = urlParams.get('sortOrder')||'desc';

    // if (!sortKey || !sortOrder) {
    //     sortKey = 'updateTime';
    //     sortOrder = 'desc';
    // }
    

    if (sortKey && sortOrder) {
        const buttonId = `anime-sort-${sortKey}`;
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.add(sortOrder === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    }
}//加载排序按钮状态

/*----------------------------------排序相关---结束------------------------------------------------ */











/*----------------------------------翻页相关---开始-------------------------------------------------*/

function displayPagination(currentPage) {
    //const paginationDiv = document.getElementById('pagination');
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
    scrollToId('anime-box');
    displayAnimeInfo(page);
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
        // 恢复输入框中的内容为当前页码
        const currentPage = parseInt(new URLSearchParams(window.location.search).get('page')) || 1;
        document.getElementById('current-page').value = currentPage;
        return;
    }
    goToPage(page);
}//处理输入页码

function scrollToId(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
}//滚动到指定id

function displayAnimeInfo(page = 1) {
    console.log('Displaying page', page);
    const animesLinkDiv = document.getElementById('animes-link');
    animesLinkDiv.innerHTML = ''; // 清空之前的内容

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filteredAnimeInfoArray.slice(start, end);
    console.log('Displaying items:', pageItems);

    // 如果当前页没有内容，则显示"暂无内容"的提示
    if (pageItems.length === 0) {
        const noContentDiv = document.createElement('div');
        noContentDiv.classList.add('no-content-warning');
        noContentDiv.textContent = '暂无内容，请改变搜索或筛选条件！';
        animesLinkDiv.appendChild(noContentDiv);
    } else {
        pageItems.forEach(anime => {
            const animeItemDiv = document.createElement('div');
            animeItemDiv.classList.add('animes-link-item');

            // 提取文件夹名称作为 id
            const folderName = anime.url.split('/').pop();
            const detailUrl = `anime-detail.html?id=${folderName}`;

            // 创建图片元素，并使其具备点击跳转功能
            const img = document.createElement('img');
            img.src = `${anime.url}/visual.jpg`;
            img.alt = '暂无图片'; // 设置默认文字

            img.addEventListener('click', function () {
                window.open(detailUrl, "_blank");
            });
            animeItemDiv.appendChild(img);

            // 创建用于显示动画名称的容器
            const animeNameDiv = document.createElement('div');
            animeNameDiv.classList.add('anime-name');

            // 日文名称元素，直接绑定点击事件
            const nameJp = document.createElement('div');
            nameJp.classList.add('anime-name-jp');
            nameJp.textContent = anime.name;
            nameJp.addEventListener('click', function () {
                window.open(detailUrl, "_blank");
            });
            animeNameDiv.appendChild(nameJp);

            // 中文名称元素，直接绑定点击事件
            const nameZh = document.createElement('div');
            nameZh.classList.add('anime-name-zh');
            nameZh.textContent = anime.name_zh;
            nameZh.addEventListener('click', function () {
                window.open(detailUrl, "_blank");
            });
            animeNameDiv.appendChild(nameZh);

            animeItemDiv.appendChild(animeNameDiv);
            animesLinkDiv.appendChild(animeItemDiv);
        });
    }
    
    restoreSortState();
    document.getElementById('current-page').addEventListener('blur', function () {
        const currentPage = parseInt(new URLSearchParams(window.location.search).get('page')) || 1;
        document.getElementById('current-page').value = currentPage;
    });
    displayPagination(page);
}//显示指定页的内容
/*----------------------------------翻页相关---结束-------------------------------------------------*/







// 绑定到 document 动作上
document.addEventListener("DOMContentLoaded", async function () {
    try {
        // 确保按顺序加载数据
        await loadAnimeMsg();
        extractAndStoreSources();
        extractAndStoreProductions();
        extractAndStoreReleases();

        // 初始化筛选后的数据
        const { page, query, source, release_date, production, sortKey, sortOrder } = getURLFilterParams();
        getFilteredAnimeInfoArray({
            query: query,
            source: source,
            release_date: release_date,
            production: production,
            sortKey: sortKey,
            sortOrder: sortOrder
        });

        // 显示第一页内容
        console.log('Filtered Anime Info Array:', filteredAnimeInfoArray); // 调试信息
        goToPage(page);

        restoreLayoutState();
    } catch (error) {
        console.error('Error during page initialization:', error);
    }
});

// function filterByReleaseDate(releaseDate) {
//     const filteredAnime = animeInfoArray.filter(anime => {
//         return anime.production.includes(releaseDate);
//     });
//     console.log(`Anime with release date ${releaseDate}:`, filteredAnime);
//     return filteredAnime;
// }




