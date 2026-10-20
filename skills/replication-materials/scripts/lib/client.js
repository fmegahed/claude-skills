(function () {
  "use strict";

  // Filters: one active value per key; "" means all.
  var bar = document.querySelector("[data-filters]");
  if (bar) {
    var rows = Array.prototype.slice.call(document.querySelectorAll("[data-row]"));
    var count = document.querySelector("[data-filter-count]");
    var active = {};
    var apply = function () {
      var shown = 0;
      rows.forEach(function (row) {
        var ok = Object.keys(active).every(function (key) {
          if (!active[key]) return true;
          var have = (row.getAttribute("data-" + key) || "").split(/\s+/);
          return have.indexOf(active[key]) !== -1;
        });
        row.hidden = !ok;
        if (ok) shown += 1;
      });
      if (count) count.textContent = "Showing " + shown + " of " + rows.length + ".";
    };
    var buttons = Array.prototype.slice.call(bar.querySelectorAll("button[data-filter-key]"));
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        var key = b.getAttribute("data-filter-key");
        var value = b.getAttribute("data-filter-value");
        active[key] = active[key] === value ? "" : value;
        buttons.forEach(function (o) {
          if (o.getAttribute("data-filter-key") !== key) return;
          var on = o.getAttribute("data-filter-value") === (active[key] || "");
          o.setAttribute("aria-pressed", on ? "true" : "false");
        });
        apply();
      });
    });
    bar.hidden = false;
  }

  // Document pages: render the markdown. The fallback text stays when a library is missing.
  var mdEl = document.getElementById("doc-md");
  var target = document.getElementById("doc-content");
  if (mdEl && target && typeof marked !== "undefined" && typeof DOMPurify !== "undefined") {
    var ctx = JSON.parse(document.getElementById("doc-ctx").textContent);
    var md = JSON.parse(mdEl.textContent);
    var fallback = document.getElementById("doc-fallback");
    var holder = document.createElement("div");
    holder.innerHTML = DOMPurify.sanitize(marked.parse(md));

    if (typeof renderMathInElement === "function") {
      renderMathInElement(holder, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
        ],
        throwOnError: false,
      });
    }

    // The page already has one h1 (the title). Drop a repeat of it and demote any other h1.
    var pageTitle = document.querySelector("h1");
    Array.prototype.forEach.call(holder.querySelectorAll("h1"), function (h, i) {
      if (i === 0 && pageTitle && h.textContent.trim() === pageTitle.textContent.trim()) { h.remove(); return; }
      var h2 = document.createElement("h2");
      h2.innerHTML = h.innerHTML;
      h.parentNode.replaceChild(h2, h);
    });

    var resolve = function (href) {
      var parts = (ctx.folder ? ctx.folder + "/" + href : href).split("/");
      var out = [];
      parts.forEach(function (p) {
        if (p === "..") out.pop();
        else if (p !== "." && p !== "") out.push(p);
      });
      return out.join("/");
    };
    Array.prototype.forEach.call(holder.querySelectorAll("a[href]"), function (a) {
      var href = a.getAttribute("href");
      if (/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(href)) return;
      var hashAt = href.indexOf("#");
      var file = hashAt === -1 ? href : href.slice(0, hashAt);
      var hash = hashAt === -1 ? "" : href.slice(hashAt);
      var query = file.indexOf("?");
      if (query !== -1) file = file.slice(0, query);
      if (!file) return;
      var path = resolve(file);
      if (Object.prototype.hasOwnProperty.call(ctx.pages, path)) a.setAttribute("href", ctx.pages[path] + hash);
      else a.setAttribute("href", ctx.blobBase + path.split("/").map(encodeURIComponent).join("/") + hash);
    });

    Array.prototype.forEach.call(holder.querySelectorAll("table"), function (t) {
      var wrap = document.createElement("div");
      var cap = t.querySelector("caption");
      wrap.className = "table-wrap";
      wrap.tabIndex = 0;
      wrap.setAttribute("role", "region");
      wrap.setAttribute("aria-label", cap ? cap.textContent : "Table");
      t.parentNode.insertBefore(wrap, t);
      wrap.appendChild(t);
    });
    Array.prototype.forEach.call(holder.querySelectorAll("pre"), function (p) {
      p.tabIndex = 0;
    });

    if (fallback) fallback.remove();
    target.appendChild(holder);
  }
})();
