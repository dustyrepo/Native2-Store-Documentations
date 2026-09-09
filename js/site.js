(function () {
  var toggle = document.querySelector(".menu-toggle");
  var sidebar = document.querySelector(".sidebar");
  if (!toggle || !sidebar) return;

  var backdrop = document.createElement("div");
  backdrop.className = "sidebar-backdrop";
  document.body.appendChild(backdrop);

  function close() {
    sidebar.classList.remove("open");
    backdrop.classList.remove("open");
  }
  function open() {
    sidebar.classList.add("open");
    backdrop.classList.add("open");
  }

  toggle.addEventListener("click", function () {
    if (sidebar.classList.contains("open")) close(); else open();
  });
  backdrop.addEventListener("click", close);
  sidebar.addEventListener("click", function (e) {
    if (e.target.tagName === "A") close();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && sidebar.classList.contains("open")) close();
  });
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

(function () {
  var toggles = document.querySelectorAll(".nav-toggle");
  toggles.forEach(function (btn) {
    var children = btn.parentElement.nextElementSibling; // .nav-parent-row -> .nav-children
    if (!children) return;
    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));
      children.hidden = expanded;
    });
  });

  // Expand the current page's own tree by default; leave the other three
  // scripts collapsed. Every script reuses the same section ids
  // (#dependencies, #configuration, ...), so scroll-spy below is scoped to
  // this one group - matching ids in a collapsed sibling must stay untouched.
  var currentFile = location.pathname.split("/").pop() || "index.html";
  var activeGroup = document.querySelector('.nav-parent[data-page="' + currentFile + '"]');
  if (!activeGroup) return;

  activeGroup.querySelectorAll(".nav-children").forEach(function (ul) { ul.hidden = false; });
  activeGroup.querySelectorAll(".nav-toggle").forEach(function (t) { t.setAttribute("aria-expanded", "true"); });
  var topLink = activeGroup.querySelector(".nav-parent-link");
  if (topLink) topLink.classList.add("active");

  if ("IntersectionObserver" in window) {
    var leafLinks = Array.prototype.slice.call(activeGroup.querySelectorAll(".nav-children a"));
    var leafByTarget = {};
    var leafHeadings = [];
    leafLinks.forEach(function (a) {
      var id = (a.getAttribute("href").split("#")[1] || "");
      var el = id && document.getElementById(id);
      if (el) {
        leafByTarget[id] = a;
        leafHeadings.push(el);
      }
    });
    if (leafHeadings.length) {
      var sidebarObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            leafLinks.forEach(function (l) { l.classList.remove("active"); });
            var link = leafByTarget[entry.target.id];
            if (link) link.classList.add("active");
          });
        },
        { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
      );
      leafHeadings.forEach(function (h) { sidebarObserver.observe(h); });
    }
  }
})();

(function () {
  var COPY_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  var CHECK_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* no-op */ }
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  function addCopyButton(code) {
    if (code.closest(".copy-wrap")) return;
    var wrap = document.createElement("span");
    wrap.className = "copy-wrap";
    code.parentNode.insertBefore(wrap, code);
    wrap.appendChild(code);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.setAttribute("aria-label", "Copy " + code.textContent);
    btn.innerHTML = COPY_ICON;
    wrap.appendChild(btn);

    btn.addEventListener("click", function () {
      copyText(code.textContent).then(function () {
        btn.classList.add("copied");
        btn.innerHTML = CHECK_ICON;
        setTimeout(function () {
          btn.classList.remove("copied");
          btn.innerHTML = COPY_ICON;
        }, 1200);
      });
    });
  }

  document.querySelectorAll(".config-table td:first-child code").forEach(addCopyButton);
  document.querySelectorAll(".cmd-item code").forEach(addCopyButton);
})();
