const { pinyin } = window.pinyinPro;

function toPinyin(hanzi) {
  return window.pinyinPro
    .pinyin(hanzi, {
      toneType: "mark",
      type: "array",
    })
    .join(" ");
}

function updateSegment(seg) {
  const text = Array.from(seg.childNodes)
    .filter(
      (n) => !(n.nodeType === 1 && n.classList.contains("pinyin-overlay"))
    )
    .map((n) => n.textContent)
    .join("")
    .trim();

  if (!text) return;

  // Skip if there's no Chinese in the segment
  if (!/[\u4e00-\u9fff]/.test(text)) return;

  // 1. Get existing overlay or create one
  let overlay = seg.querySelector(".pinyin-overlay");
  if (!overlay) {
    overlay = document.createElement("span");
    overlay.className = "pinyin-overlay";
    seg.prepend(overlay); // attach immediately
  }

  // 2. Update only if the caption text changed
  const shouldShow = toPinyin(text); // what we *want* on screen
  if (overlay.innerText !== shouldShow) {
    // only rewrite if stale
    overlay.innerText = shouldShow;
  }
}

const observer = new MutationObserver((mutations) => {
  const updatedSegments = new Set();

  mutations.forEach((mutation) => {
    // console.log("⚡ Mutation type:", mutation.type, mutation);

    if (mutation.type === "characterData") {
      const segment = mutation.target.parentElement?.closest(
        ".ytp-caption-segment"
      );
      if (segment) {
        updatedSegments.add(segment);
      }
    }

    if (mutation.type === "childList") {
      const parentSegment = mutation.target.closest(".ytp-caption-segment");
      if (parentSegment) {
        updatedSegments.add(parentSegment);
      }

      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;

        // The added node might itself be a caption segment
        if (node.classList.contains("ytp-caption-segment")) {
          updatedSegments.add(node);
        }

        // ...or it might *contain* segments inside
        node
          .querySelectorAll(".ytp-caption-segment")
          .forEach((seg) => updatedSegments.add(seg));
      });
    }
  });

  updatedSegments.forEach(updateSegment);
});

function waitForCaptions() {
  const container = document.querySelector(".ytp-caption-window-container");
  if (container) {
    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true,
    });
    console.log("✅ Pinyin overlay observer initialized");
  } else {
    setTimeout(waitForCaptions, 1000);
  }
}

waitForCaptions();
