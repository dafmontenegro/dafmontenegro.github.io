function menuController() {
    let abcBar = document.getElementById('ABC-bar');
    if (abcBar.style.display === 'flex') {
        abcBar.style.display = 'none';
    } else {
        abcBar.style.display = 'flex';
    }
}

function changeMode(icon) {
    let element = document.body;
    element.classList.toggle("light-mode");
    if (icon.textContent === 'light_mode') {
        icon.textContent = 'dark_mode';
    } else {
        icon.textContent = 'light_mode';
    }
}