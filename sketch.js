function menuController() {
    if (window.innerHeight >= window.innerWidth) {
        let icon = document.getElementById('menu-icon');
        if (icon.textContent === "menu") {
            icon.textContent = "close";
        } else {
            icon.textContent = "menu";
        }
        let menu = document.getElementById('menu-bar');
        if (menu.style.display === 'grid') {
            menu.style.display = 'none';
        } else {
            menu.style.display = 'grid';
        }
    }
}