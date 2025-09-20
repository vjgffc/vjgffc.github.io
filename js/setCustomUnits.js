function setCustomUnits() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    document.documentElement.style.setProperty('--vw', `${width / 100}px`);
    document.documentElement.style.setProperty('--vh', `${height / 100}px`);
    document.documentElement.style.setProperty('--vmin', `${Math.min(width, height) / 100}px`);
    document.documentElement.style.setProperty('--vmax', `${Math.max(width, height) / 100}px`);
}

setCustomUnits();
window.onresize = setCustomUnits;