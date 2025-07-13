
document.addEventListener('DOMContentLoaded', function () {
  const copyBtn = document.querySelector('.copy-button');
  const scanOutput = document.getElementById('scanOutput');

  copyBtn.addEventListener('click', () => {
    if (!scanOutput.value) return;

    // Create temporary textarea
    const temp = document.createElement('textarea');
    temp.value = scanOutput.value;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);

    // Optional: show feedback
    copyBtn.title = 'Copied!';
    setTimeout(() => copyBtn.title = 'Copy to clipboard', 2000);
  });
});


document.getElementById("scanPageElements").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const [{ result: formElements }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const formElements = Array.from(document.querySelectorAll("input, textarea, select, button"));
      const getLabel = (el) => {
        const id = el.id;
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) return label.innerText.trim();
        }
        if (el.closest("label")) {
          return el.closest("label").innerText.trim();
        }
        const prev = el.previousElementSibling;
        if (prev && prev.tagName === "LABEL") return prev.innerText.trim();
        return "";
      };

      return formElements.map((el, index) => ({
        index: index + 1,
        tag: el.tagName.toLowerCase(),
        type: el.type || "",
        name: el.name || "",
        id: el.id || "",
        class: el.className || "",
        placeholder: el.placeholder || "",
        label: getLabel(el)
      }));
    }
  });

  const automationSteps = formElements.map((el, idx) => {
    const nameSelector = el.name ? `[name="${el.name}"]` : null;
    const idSelector = el.id ? `#${el.id}` : null;
    const classSelector = el.class
      ? `${el.tag}.${el.class.trim().split(/\s+/)[0]}` : null;
    const fallbackSelector = `${el.tag}:nth-of-type(${idx + 1})`;

    const primarySelector = nameSelector || idSelector || classSelector || fallbackSelector;
    const valueKey = el.name || el.id || `field${idx + 1}`;

    const step = {
      action: el.tag === "button" ? "click" : "fill",
      selector: primarySelector,
      valueKey: valueKey,
      label: el.label || ""
    };

    const commentLines = [];
    if (nameSelector) commentLines.push(`// "selector": "${nameSelector}",`);
    if (idSelector) commentLines.push(`// "selector": "${idSelector}",`);
    if (classSelector) commentLines.push(`// "selector": "${classSelector}",`);

    return { step, commentLines };
  });

  let jsonWithComments = '[\n';
  automationSteps.forEach(({ step, commentLines }, i) => {
    jsonWithComments += '  {\n';
    jsonWithComments += `    "action": "${step.action}",\n`;
    jsonWithComments += `    "selector": "${step.selector}",\n`;
    commentLines.forEach(line => {
      jsonWithComments += `    ${line}\n`;
    });
    jsonWithComments += `    "valueKey": "${step.valueKey}",\n`;
    jsonWithComments += `    "label": "${step.label.replace(/"/g, '\\"')}"\n`;
    jsonWithComments += i === automationSteps.length - 1 ? '  }\n' : '  },\n';
  });
  jsonWithComments += ']';

  pickedSteps = automationSteps.map(({ step }) => step);
  document.getElementById("scanOutput").value = jsonWithComments;
});

// ✅ Register the message listener only ONCE (outside any function)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CATEGORY_RESULTS") {
    const data = message.categories;
    const formattedJson = JSON.stringify(data, null, 2);
    document.getElementById("scanOutput").value = formattedJson;
  }
});

// ✅ Then your click event can just inject content.js
document.getElementById("scanPageCategory").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab || !activeTab.id) {
      alert("No active tab found.");
      return;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId: activeTab.id },
        files: ["content.js"]
      },
      () => {
        console.log("Content script injected.");
        // No need to add a listener here
      }
    );
  });
});
