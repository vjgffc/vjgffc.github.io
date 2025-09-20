const animeContentFilesPath = '../content/anime/animeContentFiles.json';
const animeDir = '../content/anime/';

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
function loadLatestAnimePic() {
    const animeLink = document.getElementById('anime-link');
    if (!animeLink) {
        console.error('Element with id "anime-link" not found.');
        return;
    }

    fetchFileContents(animeContentFilesPath)
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
                                imgElement.src = imgPath;;
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

// 绑定到 document 动作上
document.addEventListener("DOMContentLoaded", function () {
    loadLatestAnimePic();
});