(function () {
  var status = document.getElementById("copy-status");

  function markSlots(pre) {
    var walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT);
    var nodes = [];
    var node;
    while ((node = walker.nextNode())) nodes.push(node);
    var pattern = /【[^】]*】/g;
    nodes.forEach(function (textNode) {
      var value = textNode.nodeValue;
      if (!value || value.indexOf("【") === -1) return;
      pattern.lastIndex = 0;
      var frag = document.createDocumentFragment();
      var last = 0;
      var match;
      while ((match = pattern.exec(value))) {
        if (match.index > last) {
          frag.appendChild(document.createTextNode(value.slice(last, match.index)));
        }
        var mark = document.createElement("mark");
        mark.textContent = match[0];
        frag.appendChild(mark);
        last = match.index + match[0].length;
      }
      if (last < value.length) {
        frag.appendChild(document.createTextNode(value.slice(last)));
      }
      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  function selectNode(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    return selection;
  }

  function fallbackCopy(text) {
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "0";
      area.style.left = "0";
      area.style.width = "2em";
      area.style.height = "2em";
      area.style.padding = "0";
      area.style.border = "none";
      area.style.outline = "none";
      area.style.boxShadow = "none";
      area.style.background = "transparent";
      area.style.fontSize = "16px";
      document.body.appendChild(area);
      area.focus();
      area.select();
      try {
        area.setSelectionRange(0, area.value.length);
      } catch (err) {
        /* iOS may reject setSelectionRange on some fields */
      }
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (err) {
        ok = false;
      }
      document.body.removeChild(area);

      if (!ok) {
        var holder = document.createElement("div");
        holder.textContent = text;
        holder.setAttribute("contenteditable", "true");
        holder.style.position = "fixed";
        holder.style.top = "0";
        holder.style.left = "0";
        holder.style.opacity = "0";
        holder.style.fontSize = "16px";
        document.body.appendChild(holder);
        holder.focus();
        selectNode(holder);
        try {
          ok = document.execCommand("copy");
        } catch (err) {
          ok = false;
        }
        document.body.removeChild(holder);
      }

      if (ok) resolve();
      else reject(new Error("copy-failed"));
    });
  }

  function copyText(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      return navigator.clipboard.writeText(text).catch(function () {
        return fallbackCopy(text);
      });
    }
    return fallbackCopy(text);
  }

  function promptText(pre) {
    return pre.textContent.replace(/^\uFEFF/, "").replace(/\s+$/u, "");
  }

  document.querySelectorAll("pre.prompt").forEach(markSlots);

  document.querySelectorAll(".copy").forEach(function (button) {
    button.addEventListener("click", function () {
      var pre = document.getElementById(button.getAttribute("data-copy"));
      if (!pre) return;
      var label = button.getAttribute("data-label") || "複製指令";
      var name = button.getAttribute("data-name") || "";
      copyText(promptText(pre)).then(function () {
        button.textContent = "已複製";
        button.classList.add("is-done");
        if (status) status.textContent = "已複製：" + name;
        window.setTimeout(function () {
          button.textContent = label;
          button.classList.remove("is-done");
        }, 1800);
      }).catch(function () {
        var range = document.createRange();
        range.selectNodeContents(pre);
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        button.textContent = "請長按複製";
        if (status) status.textContent = "未能自動複製「" + name + "」，指令已選取，請長按複製。";
        window.setTimeout(function () {
          button.textContent = label;
        }, 2400);
      });
    });
  });
})();
