(function () {
  var toggle = document.querySelector(".menu-toggle");
  var sidebar = document.querySelector(".sidebar");
  if (toggle && sidebar) {
    toggle.addEventListener("click", function () {
      sidebar.classList.toggle("open");
    });
    sidebar.addEventListener("click", function (e) {
      if (e.target.tagName === "A") sidebar.classList.remove("open");
    });
  }
})();

(function () {
  var skeleton = document.getElementById("skeleton");
  if (!skeleton) return;

  function hide() {
    if (!skeleton.isConnected) return;
    skeleton.classList.add("skeleton-hide");
    setTimeout(function () { skeleton.remove(); }, 200);
  }

  var minDisplay = new Promise(function (resolve) { setTimeout(resolve, 180); });
  var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();

  Promise.all([minDisplay, fontsReady]).then(hide);
  setTimeout(hide, 1200); // safety net if fonts.ready never settles
})();
