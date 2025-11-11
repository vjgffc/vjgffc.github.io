const ossBaseUrl = 'https://vjgffc-github-io.oss-cn-shenzhen.aliyuncs.com/';
const localBaseUrl = '../../assets/';
let animeDir = ''; // 动态确定的动画目录路径
let novelDir = ''; // 动态确定的小说目录路径

// 检测并确定使用本地路径还是OSS路径（动画）
async function initializeAnimeDirPath() {
    try {
        // 尝试访问本地路径下的一个测试文件
        const testResponse = await fetch(`${localBaseUrl}anime/animeContentFiles.json`);
        if (testResponse.ok) {
            animeDir = `${localBaseUrl}anime/`;
            console.log('Using local path for anime:', animeDir);
            return true;
        }
    } catch (error) {
        console.warn('Local path not accessible for anime, falling back to OSS');
    }
    
    // 如果本地路径不可访问，使用OSS路径
    animeDir = `${ossBaseUrl}anime/`;
    console.log('Using OSS path for anime:', animeDir);
    return false;
}

// 检测并确定使用本地路径还是OSS路径（小说）
async function initializeNovelDirPath() {
    try {
        // 尝试访问本地路径下的一个测试文件
        const testResponse = await fetch(`${localBaseUrl}novel/novelContentFiles.json`);
        if (testResponse.ok) {
            novelDir = `${localBaseUrl}novel/`;
            console.log('Using local path for novel:', novelDir);
            return true;
        }
    } catch (error) {
        console.warn('Local path not accessible for novel, falling back to OSS');
    }
    
    // 如果本地路径不可访问，使用OSS路径
    novelDir = `${ossBaseUrl}novel/`;
    console.log('Using OSS path for novel:', novelDir);
    return false;
}

// 获取文件内容的函数
function fetchFileContents(file) {
    return fetch(file)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .catch(error => console.error('Error fetching file contents:', error));
}

// 加载最新的动画图片
async function loadLatestAnimePic() {
    // 先初始化路径
    await initializeAnimeDirPath();
    const animeLink = document.getElementById('anime-link');
    if (!animeLink) {
        console.error('Element with id "anime-link" not found.');
        return;
    }

    fetchFileContents(`${animeDir}animeContentFiles.json`)
        .then(contentFiles => {
            // 按更新时间排序文件夹
            const sortedFolders = Object.keys(contentFiles).sort((a, b) => parseInt(contentFiles[b], 10) - parseInt(contentFiles[a], 10));

            // 尝试加载文件夹中的 visual.jpg
            function tryLoadVisual(folders, index = 0) {
                if (index >= folders.length) {
                    console.error('No visual.jpg found in any folder.');
                    return;
                }

                const folderName = folders[index];
                const imgPath = `${animeDir}${folderName}/visual.jpg`;
                fetch(imgPath)
                    .then(response => {
                        if (response.ok) {
                            const imgElement = animeLink.querySelector('img');
                            if (imgElement) {
                                imgElement.src = imgPath;
                            }
                        } else {
                            // 如果当前文件夹中没有 visual.jpg，尝试下一个文件夹
                            tryLoadVisual(folders, index + 1);
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching visual.jpg:', error);
                        // 尝试下一个文件夹
                        tryLoadVisual(folders, index + 1);
                    });
            }

            // 从最新的文件夹开始尝试加载 visual.jpg
            tryLoadVisual(sortedFolders);
        })
        .catch(error => console.error('Error loading anime content files:', error));
}

// 加载最新的小说图片
async function loadLatestNovelPic() {
    // 先初始化路径
    await initializeNovelDirPath();
    const novelLink = document.getElementById('novel-link');
    if (!novelLink) {
        console.error('Element with id "novel-link" not found.');
        return;
    }

    fetchFileContents(`${novelDir}novelContentFiles.json`)
        .then(contentFiles => {
            // 按更新时间排序文件夹
            const sortedFolders = Object.keys(contentFiles).sort((a, b) => parseInt(contentFiles[b], 10) - parseInt(contentFiles[a], 10));

            // 尝试加载文件夹中的 cover.jpg
            function tryLoadCover(folders, index = 0) {
                if (index >= folders.length) {
                    console.error('No cover.jpg found in any folder.');
                    return;
                }

                const folderName = folders[index];
                const imgPath = `${novelDir}${folderName}/cover.jpg`;
                fetch(imgPath)
                    .then(response => {
                        if (response.ok) {
                            const imgElement = novelLink.querySelector('img');
                            if (imgElement) {
                                imgElement.src = imgPath;
                            }
                        } else {
                            // 如果当前文件夹中没有 cover.jpg，尝试下一个文件夹
                            tryLoadCover(folders, index + 1);
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching cover.jpg:', error);
                        // 尝试下一个文件夹
                        tryLoadCover(folders, index + 1);
                    });
            }

            // 从最新的文件夹开始尝试加载 cover.jpg
            tryLoadCover(sortedFolders);
        })
        .catch(error => console.error('Error loading novel content files:', error));
}

// 绑定到 document 动作上
document.addEventListener("DOMContentLoaded", function () {
    loadLatestAnimePic();
    loadLatestNovelPic();
});
