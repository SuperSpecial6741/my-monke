// Authentic Local Physics Hook Engine
(function() {
    console.log("Initializing local stunt physics...");
    window.addEventListener('keydown', function(e) {
        // Direct key mapping configurations
        if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) > -1) {
            e.preventDefault();
        }
    }, {passive: false});
})();
