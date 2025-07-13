(() => {
  const output = [];

  const panels = document.querySelectorAll('.categories-panel');
  panels.forEach(panel => {
    const mainCategoryAnchor = panel.querySelector('.topClass');
    const mainCategory = mainCategoryAnchor?.textContent.trim() || '';

    const subCategoryLinks = panel.querySelectorAll('.panel-body .sub-category');

    if (subCategoryLinks.length === 0) {
      output.push({
        "Main Category": mainCategory,
        "Sub Category": ""
      });
    } else {
      subCategoryLinks.forEach(link => {
        const sub = link?.textContent.trim().replace(/\u00a0/g, '') || '';
        output.push({
          "Main Category": mainCategory,
          "Sub Category": sub
        });
      });
    }
  });

  chrome.runtime.sendMessage({ type: "CATEGORY_RESULTS", categories: output });
})();
