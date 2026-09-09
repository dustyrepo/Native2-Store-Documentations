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

(function () {
  var toc = document.querySelector(".toc");
  if (!toc || !("IntersectionObserver" in window)) return;

  var links = Array.prototype.slice.call(toc.querySelectorAll("a"));
  var linkByTarget = {};
  var headings = [];

  links.forEach(function (a) {
    var id = a.getAttribute("href").slice(1);
    var el = document.getElementById(id);
    if (el) {
      linkByTarget[id] = a;
      headings.push(el);
    }
  });
  if (!headings.length) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove("active"); });
        var link = linkByTarget[entry.target.id];
        if (link) link.classList.add("active");
      });
    },
    { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
  );

  headings.forEach(function (h) { observer.observe(h); });
})();
