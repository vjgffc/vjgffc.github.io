const ossBaseUrl = 'https://vjgffc-github-io.oss-cn-shenzhen.aliyuncs.com/';
const localBaseUrl = '../../assets/';
let novelDir = ''; // 动态确定的小说目录路径
const unknownAuthor = "暂无信息";
const unknownName = "暂无信息";

// 初始化 Mermaid
mermaid.initialize({ 
    startOnLoad: false,
    theme: 'base',  // 使用 base 主题便于自定义
    themeVariables: {
        // 通用颜色
        primaryColor: '#faf8f5',           // 主色调 - 米白色
        primaryTextColor: '#2d1a00',       // 主文字颜色 - 深棕色
        primaryBorderColor: '#820000',     // 主边框颜色 - 深红色
        lineColor: '#700000',              // 线条颜色 - 深红色
        secondaryColor: '#fffbe8',         // 次要颜色 - 浅黄色
        tertiaryColor: '#f6f2e8',          // 第三颜色 - 米色
        
        // Gantt 图表专用颜色
        gridColor: '#700000',              // 网格颜色 - 深红色
        todayLineColor: '#820000',         // 今日线颜色
        
        // Section 背景颜色（4种循环）
        cScale0: '#e8f4f3',                // 第1组背景 - 浅青色
        cScale1: '#f0e8f4',                // 第2组背景 - 浅紫色
        cScale2: '#f4f0e8',                // 第3组背景 - 浅黄色
        cScale3: '#e8f0f4',                // 第4组背景 - 浅蓝色
        
        // Section 文字颜色
        cScaleLabel0: '#2d1a00',
        cScaleLabel1: '#2d1a00',
        cScaleLabel2: '#2d1a00',
        cScaleLabel3: '#2d1a00',
        
        // 任务条颜色
        taskBorderColor: '#820000',        // 任务边框
        taskBkgColor: '#06c7b7',          // 任务背景
        // activeTaskBorderColor: '#700000',  // 激活任务边框
        // activeTaskBkgColor: '#f8b229',     // 激活任务背景
        
        // // 关键任务
        // critBkgColor: '#ff6b6b',          // 关键任务背景 - 红色
        // critBorderColor: '#820000',        // 关键任务边框
        
        // // Done 任务
        // doneTaskBkgColor: '#a8d5ba',      // 完成任务背景 - 绿色
        // doneTaskBorderColor: '#006100',    // 完成任务边框
        
        // Section 标题
        sectionBkgColor: '#faf8f5',       // Section 背景
        altSectionBkgColor: '#ecab04ff',     // 交替 Section 背景
        sectionBorderColor: '#ff0000'      // Section 边框
    },
    gantt: {
        titleTopMargin: 25,              // 标题顶部边距
        barHeight: 25,                   // 任务条高度（增加到25px保证足够空间）
        barGap: 8,                       // 任务条之间的间距（增加间距）
        topPadding: 50,                  // 图表顶部内边距
        leftPadding: 150,                // 左侧人物名称区域宽度（增加到150px）
        gridLineStartPadding: 35,        // 网格线起始位置
        fontSize: 10,                    // 字体大小
        sectionFontSize: 12,             // Section 标题字体大小
        numberSectionStyles: 4,          // Section 样式数量（循环4种颜色）
        axisFormat: '%d日%H:%M',         // 坐标轴时间格式
        useMaxWidth: true,               // 使用最大宽度
        topAxis: false                   // 不显示顶部坐标轴（避免重复）
    }
});

// 检测并确定使用本地路径还是OSS路径
async function initializeNovelDirPath() {
    try {
        // 尝试访问本地路径下的一个测试文件
        const testResponse = await fetch(`${localBaseUrl}novel/novelContentFiles.json`);
        if (testResponse.ok) {
            novelDir = `${localBaseUrl}novel/`;
            console.log('Using local path:', novelDir);
            return true;
        }
    } catch (error) {
        console.warn('Local path not accessible, falling back to OSS');
    }
    
    // 如果本地路径不可访问，使用OSS路径
    novelDir = `${ossBaseUrl}novel/`;
    console.log('Using OSS path:', novelDir);
    return false;
}

async function loadNovelContent() {
    // 先初始化路径
    await initializeNovelDirPath();
    
    // 从 URL 参数中提取小说标识（文件夹名称）
    const urlParams = new URLSearchParams(window.location.search);
    const novelId = urlParams.get('id');
    if (!novelId) {
        document.title = '缺少小说标识';
        document.body.textContent = '缺少小说标识';
        return;
    }

    // 加载 msg.json 文件，获取小说详细信息
    fetch(`${novelDir}${novelId}/msg.json`)
        .then(response => response.json())
        .then(data => {
            // 设置页面标题：优先用日文原版名称，其次用中文译名；若都没有，则使用文件夹名称
            document.title = data.name || data.name_zh || novelId;

            // --------------------- 构建主区域内容 ---------------------
            const mainContainer = document.getElementById('novel-content-main');
            mainContainer.innerHTML = '';

            // 创建信息栏容器
            const infoContainer = document.createElement('div');
            infoContainer.classList.add('novel-content-info');

            // 创建封面图
            const coverDiv = document.createElement('div');
            coverDiv.classList.add('novel-cover');
            const coverImg = document.createElement('img');
            coverImg.src = `${novelDir}${novelId}/cover.jpg`;
            coverImg.alt = data.name || '暂无封面';
            coverDiv.appendChild(coverImg);
            infoContainer.appendChild(coverDiv);

            // 创建信息列表
            const infoListDiv = document.createElement('div');
            infoListDiv.classList.add('novel-info-list');
            
            let author = data.author || unknownAuthor;
            let score = (typeof data.score !== 'undefined') ? data.score : 0;
            
            infoListDiv.innerHTML = `
                <ul>
                    <li><span class="info-label">作者</span>${author}</li>
                    <li><span class="info-label">个人评分</span>${score}</li>
                </ul>
            `;
            infoContainer.appendChild(infoListDiv);
            
            mainContainer.appendChild(infoContainer);

            // 创建用于加载 Markdown 内容的区域
            const contentDiv = document.createElement('div');
            contentDiv.classList.add('novel-content-main');
            mainContainer.appendChild(contentDiv);

            // 异步加载 Markdown 文件
            fetch(`${novelDir}${novelId}/com.md`)
                .then(resp => {
                    if (!resp.ok) {
                        throw new Error(`HTTP error! status: ${resp.status}`);
                    }
                    return resp.text();
                })
                .then(mdText => {
                    // 使用 marked 库将 Markdown 转换为 HTML
                    contentDiv.innerHTML = marked.parse(mdText);

                    // 角色占位符替换（<char id="xxx"></char>）
                    // 先异步加载角色模板文件
                    fetch(`${novelDir}${novelId}/characterTemplate.html`)
                        .then(resp => resp.text())
                        .then(templateHtml => {
                            // 创建临时DOM解析模板
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = templateHtml;
                            // 查找所有 <char id="xxx"></char> 占位符
                            contentDiv.querySelectorAll('char[id]').forEach(charEl => {
                                const charId = charEl.getAttribute('id');
                                const tpl = tempDiv.querySelector(`template#${charId}`);
                                if (tpl) {
                                    // 用模板内容替换占位符
                                    charEl.outerHTML = tpl.innerHTML;
                                }
                            });
                            // 继续后续处理
                            postProcessContentDiv(contentDiv, novelDir, novelId);
                        })
                        .catch(() => {
                            // 模板加载失败也继续后续处理
                            postProcessContentDiv(contentDiv, novelDir, novelId);
                        });
                })
                .catch(err => {
                    if (err.message.includes('HTTP error! status: 404')) {
                        contentDiv.innerHTML = '<h1>暂无内容！</h1>';
                    } else {
                        console.error(`加载 com.md 出错:`, err);
                        contentDiv.innerHTML = '<h1>暂无内容！</h1>';
                    }
                });
        })
        .catch(error => {
            console.error('加载 msg.json 出错:', error);
            const mainContainer = document.getElementById('novel-content-main');
            mainContainer.textContent = '加载小说详情失败';
        });
}

document.addEventListener('DOMContentLoaded', loadNovelContent);

// 后处理函数
async function postProcessContentDiv(contentDiv, novelDir, novelId) {
    // 使所有超链接在新标签页打开
    contentDiv.querySelectorAll('a').forEach(a => {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
    });

    // 根据 date 属性填充 time.edit 标签的内容
    contentDiv.querySelectorAll('time.edit[date]').forEach(timeEl => {
        const dateStr = timeEl.getAttribute('date');
        if (dateStr && /^\d{8}$/.test(dateStr)) {
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            timeEl.textContent = `Edited on ${year}/${month}/${day}`;
        }
    });

    // 加载外部 .mmd 文件
    const mmdContainers = contentDiv.querySelectorAll('.mermaid-gantt[data-file]');
    for (const container of mmdContainers) {
        const mmdFile = container.getAttribute('data-file');
        if (mmdFile) {
            try {
                // 构建完整路径
                const mmdPath = `${novelDir}${novelId}/${mmdFile}`;
                const response = await fetch(mmdPath);
                if (response.ok) {
                    const mmdContent = await response.text();
                    // 创建 pre > code 结构用于 Mermaid 渲染
                    const pre = document.createElement('pre');
                    const code = document.createElement('code');
                    code.className = 'language-mermaid';
                    code.textContent = mmdContent;
                    pre.appendChild(code);
                    // 替换容器内容
                    container.innerHTML = '';
                    container.appendChild(pre);
                } else {
                    console.warn(`Failed to load .mmd file: ${mmdPath}`);
                    container.innerHTML = '<p style="color: #820000;">⚠️ 时间线文件加载失败</p>';
                }
            } catch (err) {
                console.error(`Error loading .mmd file:`, err);
                container.innerHTML = '<p style="color: #820000;">⚠️ 时间线加载出错</p>';
            }
        }
    }

    // 渲染 Mermaid 图表
    mermaid.run({
        querySelector: '.novel-content-main .language-mermaid'
    }).then(() => {
        console.log('Mermaid charts rendered successfully');
        
        // 为甘特图添加特定 class
        contentDiv.querySelectorAll('.mermaid').forEach(mermaidEl => {
            // 检查是否包含 gantt 图表
            const svgContent = mermaidEl.innerHTML.toLowerCase();
            if (svgContent.includes('gantt') || svgContent.includes('class="grid"')) {
                mermaidEl.classList.add('gantt-chart');
            }
        });
    }).catch(err => {
        console.error('Mermaid rendering error:', err);
    });
}
