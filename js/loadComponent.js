function loadComponent(id, url) {
    fetch(url)
        .then(response => response.text())
        .then(data => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = data;
                console.log(`Component with id "${id}" loaded successfully.`);
            } else {
                console.error(`Element with id "${id}" not found.`);
            }
        })
        .catch(error => {
            console.error('Error loading component:', error);
        });
}

document.addEventListener("DOMContentLoaded", function () {
    loadComponent('header', '../html/header.html');
    loadComponent('footer', '../html/footer.html');
    //loadComponent('top-button', '../html/top-button.html');
});