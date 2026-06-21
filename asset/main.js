// Hardening
document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});

// Prevent right click (mousedown and mouseup)
document.addEventListener('mousedown', function (e) {
    if (e.button === 2) { // Right click
        e.preventDefault();
    }
});
document.addEventListener('mouseup', function (e) {
    if (e.button === 2) { // Right click
        e.preventDefault();
    }
});

document.onkeydown = function (e) {
    // F12
    if (e.key === 'F12') return false;
    // Ctrl+Shift+I/J/C
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) return false;
    // Ctrl+U
    if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) return false;
    // Ctrl+S
    if (e.ctrlKey && (e.key === 's' || e.key === 'S')) return false;
};