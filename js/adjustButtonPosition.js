document.addEventListener("DOMContentLoaded", function () {
    const topButton = document.getElementById('top-button');
    const footer = document.getElementById('footer');
    const minGap = 15; // 与页脚之间的最小间距，单位为像素

    function adjustButtonPosition() {
        const footerRect = footer.getBoundingClientRect();
        const buttonRect = topButton.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        const buttonBottomPosition = viewportHeight - footerRect.top + minGap;
        const defaultBottomPosition = `calc(2vmax + 20px)`;
        // console.log('footerRect.top', footerRect.top);
        // console.log('buttonRect.bottom',buttonRect.bottom);
        // console.log('buttonBottomPosition',buttonBottomPosition);

        if (footerRect.top - buttonRect.bottom <  minGap) {
            topButton.style.bottom = `${buttonBottomPosition}px`;
        } else {
            topButton.style.bottom = `max(${defaultBottomPosition}, ${buttonBottomPosition}px)`; // 使用自定义单位
        }
    }

    window.addEventListener('scroll', adjustButtonPosition);
    window.addEventListener('resize', adjustButtonPosition);
    adjustButtonPosition(); // 初始化位置
});