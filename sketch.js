function menuController() {
    if (screen.width < 840) {
        let icon = document.getElementById('menu-icon');
        if (icon.textContent === "menu") {
            icon.textContent = "close";
        } else {
            icon.textContent = "menu";
        }
        let menu = document.getElementById('menu-bar');
        if (menu.style.display === 'block') {
            menu.style.display = 'none';
        } else {
            menu.style.display = 'block';
        }
    }
}