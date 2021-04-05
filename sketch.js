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
    element.classList.toggle("dark-mode");
    if (icon.textContent === 'dark_mode') {
        icon.textContent = 'light_mode';
    } else {
        icon.textContent = 'dark_mode';
    }
}