(function () {
  var data = window.N2_SEARCH_INDEX || [];
  var trigger = document.getElementById("search-trigger");
  var overlay = document.getElementById("search-overlay");
  var input = document.getElementById("search-input");
  var resultsEl = document.getElementById("search-results");
  if (!trigger || !overlay || !input || !resultsEl) return;

  // A <base> tag (only on 404.html, pinned to the site root so its relative
  // asset links survive being served for an arbitrary broken URL) already
  // resolves everything - don't also sniff location.pathname for depth,
  // which would misfire if the broken URL itself contains "/scripts/".
  var basePrefix = document.querySelector("base")
    ? ""
    : location.pathname.indexOf("/scripts/") !== -1 ? "../" : "";
  var currentResults = [];
  var activeIndex = -1;

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function renderEmpty(message) {
    resultsEl.innerHTML = '<p class="search-empty">' + message + "</p>";
    currentResults = [];
    activeIndex = -1;
  }

  function score(entry, terms) {
    var hay = (entry.title + " " + entry.section + " " + entry.keywords + " " + entry.excerpt).toLowerCase();
    var total = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      if (!t) continue;
      if (hay.indexOf(t) === -1) return -1;
      total += entry.title.toLowerCase().indexOf(t) !== -1 ? 3 : 1;
      total += entry.keywords.toLowerCase().indexOf(t) !== -1 ? 1 : 0;
    }
    return total;
  }

  function renderResults() {
    resultsEl.innerHTML = currentResults
      .map(function (e, i) {
        return (
          '<a class="search-result' + (i === activeIndex ? " active" : "") + '" href="' + basePrefix + e.page + '" data-i="' + i + '">' +
          '<div class="r-title"><span class="r-section">' + escapeHtml(e.section) + "</span>" + escapeHtml(e.title) + "</div>" +
          '<div class="r-excerpt">' + escapeHtml(e.excerpt) + "</div>" +
          "</a>"
        );
      })
      .join("");
  }

  function search(query) {
    var terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) {
      renderEmpty("Type to search config keys, commands, and sections across all four scripts.");
      return;
    }
    var scored = data
      .map(function (e) { return { entry: e, s: score(e, terms) }; })
      .filter(function (r) { return r.s >= 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, 8);

    currentResults = scored.map(function (r) { return r.entry; });
    activeIndex = currentResults.length ? 0 : -1;

    if (!currentResults.length) {
      renderEmpty('No matches. Try a config key like <code>Config.Framework</code> or a command like <code>/mute</code>.');
      return;
    }
    renderResults();
  }

  function open() {
    overlay.hidden = false;
    input.value = "";
    renderEmpty("Type to search config keys, commands, and sections across all four scripts.");
    setTimeout(function () { input.focus(); }, 0);
  }

  function close() {
    overlay.hidden = true;
    trigger.focus();
  }

  function move(delta) {
    if (!currentResults.length) return;
    activeIndex = (activeIndex + delta + currentResults.length) % currentResults.length;
    renderResults();
    var active = resultsEl.querySelector(".search-result.active");
    if (active) active.scrollIntoView({ block: "nearest" });
  }

  trigger.addEventListener("click", open);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) close();
  });
  input.addEventListener("input", function () { search(input.value); });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && currentResults[activeIndex]) {
        location.href = basePrefix + currentResults[activeIndex].page;
      }
    }
  });

  document.addEventListener("keydown", function (e) {
    if (!overlay.hidden && e.key === "Escape") { close(); return; }
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
      e.preventDefault();
      open();
    }
  });
})();
