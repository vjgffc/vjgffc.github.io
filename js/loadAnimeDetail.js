const animeDir = 'https://vjgffc-github-io.oss-cn-shenzhen.aliyuncs.com/anime/';
const unknownProduction = "暂无信息";
const unknownRealeaseDate = "暂未播出";
const unknownName = "暂无信息";
const unknownSource = "未知";

function loadAnimeContent() {
    // 从 URL 参数中提取动画标识（文件夹名称）
    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get('id');
    if (!animeId) {
        document.title = '缺少动画标识';
        document.body.textContent = '缺少动画标识';
        return;
    }

    // 加载 msg.json 文件，获取动画详细信息
    fetch(`${animeDir}${animeId}/msg.json`)
        .then(response => response.json())
        .then(data => {
            // 设置页面标题：优先用日文原版名称，其次用中文译名；若都没有，则使用文件夹名称
            document.title = data.name || data.name_zh || animeId;

            // --------------------- 构建侧边栏内容 ---------------------
            const asideContainer = document.getElementById('main-content-aside');
            asideContainer.innerHTML = '';

            // 1. 创建视觉图区域（使用 <figure> 标签）
            const figureEl = document.createElement('figure');
            figureEl.id = 'img';
            const imageEl = document.createElement('img');
            imageEl.src = `${animeDir}${animeId}/visual.jpg`;
            imageEl.alt = data.name || '暂无视觉图';
            imageEl.title = "官方网站";
            // 如果存在 official 链接，则用 <a> 标签包裹图片
            if (data.official) {
                const linkEl = document.createElement('a');
                linkEl.href = data.official;
                linkEl.target = "_blank";
                linkEl.appendChild(imageEl);
                figureEl.appendChild(linkEl);
            } else {
                figureEl.appendChild(imageEl);
            }
            asideContainer.appendChild(figureEl);

            // 2. 创建季节标签容器并添加每个季节标签
            const seasonLabelContainer = document.createElement('div');
            seasonLabelContainer.id = 'season-label-container';
            if (Array.isArray(data.seasons)) {
                data.seasons.forEach((season, idx) => {
                    const labelEl = document.createElement('span');
                    labelEl.classList.add('season-label');
                    labelEl.id = `season-label-${idx + 1}`;
                    labelEl.textContent = season.season_name;

                    // 为标签绑定 onclick 事件
                    labelEl.onclick = function () {
                        // 清除所有标签的 active 状态
                        const allLabels = document.querySelectorAll('#season-label-container .season-label');
                        allLabels.forEach(el => el.classList.remove('active'));
                        // 当前标签添加 active 状态
                        this.classList.add('active');

                        // 根据当前标签的序号，切换显示对应的 article 内容区域
                        const allArticles = document.querySelectorAll('#main-content-main .season-content');
                        allArticles.forEach((article, index) => {
                            article.style.display = (index === idx) ? 'block' : 'none';
                        });
                    };

                    seasonLabelContainer.appendChild(labelEl);
                });

                // 默认将最后一个标签设置为 active 状态
                const lastLabel = seasonLabelContainer.querySelector('.season-label:last-child');
                if (lastLabel) {
                    lastLabel.classList.add('active');
                }
            }
            asideContainer.appendChild(seasonLabelContainer);

            // --------------------- 构建主区域内容 ---------------------
            const mainContainer = document.getElementById('main-content-main');
            mainContainer.innerHTML = '';

            if (Array.isArray(data.seasons)) {
                data.seasons.forEach((season, idx) => {
                    // 创建 article 元素作为当前季节的内容容器
                    const articleEl = document.createElement('article');
                    articleEl.classList.add('season-content');
                    articleEl.id = `season-content-${idx + 1}`;

                    // 创建显示当前季节其他信息的区域
                    const infoDiv = document.createElement('div');
                    infoDiv.classList.add('season-content-info');
                    // 加载制作公司、播出时间以及个人评分
                    let production = season.production ? season.production.join(', ') : unknownProduction;
                    let releaseDate;
                    if (season.release_date) {
                        const year = season.release_date.toString().slice(0, 4);
                        const month = season.release_date.toString().slice(4);
                        releaseDate = `${year} 年 ${month} 月`;
                    } else {
                        releaseDate = unknownRealeaseDate;
                    }
                    let score = (typeof season.score !== 'undefined') ? season.score : 0;
                    infoDiv.innerHTML = `
                    <ul class="season-info-list">
                        <li><span class="info-label">制作公司</span>${production}</li>
                        <li><span class="info-label">播出时间</span>${releaseDate}</li>
                        <li><span class="info-label">个人评分</span>${score}</li>
                    </ul>
                    `;
                    articleEl.appendChild(infoDiv);

                    // 创建用于加载 Markdown 内容的区域
                    const mainDiv = document.createElement('div');
                    mainDiv.classList.add('season-content-main');
                    articleEl.appendChild(mainDiv);

                    // 默认只有第一个 article 显示，其余隐藏
                    articleEl.style.display = (idx === 0) ? 'block' : 'none';

                    mainContainer.appendChild(articleEl);

                    // 异步加载对应 Markdown 文件（现在文件路径为 (idx+1)/com.md）
                    fetch(`${animeDir}${animeId}/${idx + 1}/com.md`)
                        .then(resp => {
                            if (!resp.ok) {
                                throw new Error(`HTTP error! status: ${resp.status}`);
                            }
                            return resp.text();
                        })
                        .then(mdText => {
                            // 使用 marked 库将 Markdown 转换为 HTML
                            mainDiv.innerHTML = marked.parse(mdText);

                            // 角色占位符替换（<char id="allen"></char>）
                            // 先异步加载角色模板文件（现在在数字文件夹内）
                            fetch(`${animeDir}${animeId}/${idx + 1}/characterTemplate.html`)
                                .then(resp => resp.text())
                                .then(templateHtml => {
                                    // 创建临时DOM解析模板
                                    const tempDiv = document.createElement('div');
                                    tempDiv.innerHTML = templateHtml;
                                    // 查找所有 <char id="xxx"></char> 占位符
                                    mainDiv.querySelectorAll('char[id]').forEach(charEl => {
                                        const charId = charEl.getAttribute('id');
                                        const tpl = tempDiv.querySelector(`template#${charId}`);
                                        if (tpl) {
                                            // 用模板内容替换占位符
                                            charEl.outerHTML = tpl.innerHTML;
                                        }
                                    });
                                    // 处理角色图片路径，添加 character/ 前缀
                                    mainDiv.querySelectorAll('.charater_major, .charater_minor').forEach(span => {
                                        const img = span.querySelector('.charater_thumb');
                                        if (img) {
                                            const src = img.getAttribute('src');
                                            if (src && !src.includes('/')) {
                                                img.src = `${animeDir}${animeId}/${idx + 1}/character/${src}`;
                                            }
                                        }
                                        if (span.classList.contains('charater_major')) {
                                            const fullPath = span.getAttribute('data-full');
                                            if (fullPath && !fullPath.includes('/')) {
                                                span.setAttribute('data-full', `${animeDir}${animeId}/${idx + 1}/character/${fullPath}`);
                                            }
                                        }
                                    });
                                    // 继续后续处理
                                    postProcessMainDiv(mainDiv, animeDir, animeId, idx + 1);
                                })
                                .catch(() => {
                                    // 模板加载失败也继续后续处理
                                    postProcessMainDiv(mainDiv, animeDir, animeId, idx + 1);
                                });
                        })
                        .catch(err => {
                            if (err.message.includes('HTTP error! status: 404')) {
                                mainDiv.innerHTML = '<h1>暂无内容！</h1>';
                            } else {
                                console.error(`加载 ${idx + 1}/com.md 出错:`, err);
                                mainDiv.innerHTML = '<h1>暂无内容！</h1>';
                            }
                        });
                });

                // 隐藏其他 article 内容
                const allArticles = mainContainer.querySelectorAll('.season-content');
                allArticles.forEach(article => {
                    article.style.display = 'none';
                });

                // 显示最后一个 article 内容
                const lastArticle = mainContainer.querySelector('.season-content:last-child');
                if (lastArticle) {
                    lastArticle.style.display = 'block';
                }
            }
        })
        .catch(error => {
            console.error('加载 msg.json 出错:', error);
            const asideContainer = document.getElementById('main-content-aside');
            asideContainer.textContent = '加载动画详情失败';
        });
}



document.addEventListener('DOMContentLoaded', loadAnimeContent);

// 新增后处理函数，便于复用
function postProcessMainDiv(mainDiv, animeDir, animeId, seasonNumber) {
    // 使所有超链接在新标签页打开
    mainDiv.querySelectorAll('a').forEach(a => {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
    });
    // 修正图片路径为相对于 animeId/seasonNumber 文件夹（跳过角色图片）
    mainDiv.querySelectorAll('img').forEach(img => {
        // 跳过角色图片，因为它们已经在模板处理时设置了正确路径
        if (img.classList.contains('charater_thumb')) {
            return;
        }
        const src = img.getAttribute('src');
        if (src && !src.match(/^https?:\/\//) && !src.startsWith('/')) {
            img.src = `${animeDir}${animeId}/${seasonNumber}/` + src.replace(/^\.\//, '');
        }
    });
    // 角色大图悬浮显示
    mainDiv.querySelectorAll('.charater_major').forEach(span => {
        // 角色图片的data-full路径已经在模板处理时设置了正确路径，这里只需要处理悬浮功能
        let full = span.getAttribute('data-full');
        // 如果data-full路径还没有完整路径，才进行处理
        if (full && !full.match(/^https?:\/\//) && !full.includes(`${animeId}/${seasonNumber}/character/`)) {
            full = `${animeDir}${animeId}/${seasonNumber}/character/` + full.replace(/^\.\//, '');
            span.setAttribute('data-full', full);
        }
        // 悬浮显示大图
        let previewImg;
        span.addEventListener('mouseenter', function(e) {
            if (!full) return;
            previewImg = document.createElement('img');
            previewImg.src = full;
            previewImg.style.position = 'fixed';
            previewImg.style.right = 'auto'; // 确保右侧位置自动调整
            previewImg.style.left = '5vw'; // 控制最左侧不能超出页面
            previewImg.style.top = '5vh';
            previewImg.style.transform = 'translateX(0) scale(0.5)'; // 初始缩小
            previewImg.style.transition = 'transform 0.4s cubic-bezier(.4,1.6,.6,1), opacity 0.22s';
            previewImg.style.opacity = '0';
            previewImg.style.height = '70vh'; // 高度为视口高度的50%
            previewImg.style.maxWidth = '90vw'; // 最大宽度不超过视口宽度
            previewImg.style.width = 'auto'; // 宽度自适应
            previewImg.style.objectFit = 'contain'; // 保持比例
            previewImg.style.border = '2px solid #bdbdbd';
            previewImg.style.borderRadius = '8px';
            previewImg.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
            previewImg.style.zIndex = '1000';
            previewImg.style.pointerEvents = 'none';
            previewImg.style.background = 'rgba(255,255,255,0.7)'; // 半透明白色背景
            previewImg.style.padding = '8px'; // 增加内边距让背景包裹图片
            span.appendChild(previewImg);
            // 强制触发重绘后再放大和显示
            requestAnimationFrame(() => {
                previewImg.style.transform = 'translateX(0) scale(1)';
                previewImg.style.opacity = '1';
            });
        });
        span.addEventListener('mouseleave', function(e) {
            if (previewImg && previewImg.parentNode) {
                previewImg.parentNode.removeChild(previewImg);
            }
        });
    });

    // 根据 date 属性填充 time.edit 标签的内容
    mainDiv.querySelectorAll('time.edit[date]').forEach(timeEl => {
        const dateStr = timeEl.getAttribute('date');
        if (dateStr && /^\d{8}$/.test(dateStr)) {
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            timeEl.textContent = `Edited on ${year}/${month}/${day}`;
        }
    });
}