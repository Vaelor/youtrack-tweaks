console.log('YouTrack tweaks');

const youtrackTabs = new Map();

let repositoryTweaksConfig = [];
let userTweaksConfiguration = [];

function asyncLoad(path) {
  return new Promise(function(resolve, reject) {
    const serverUrl = `chrome-extension://${chrome.runtime.id}/repository/`;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', serverUrl + path, true);
    xhr.onload = () => resolve(xhr.responseText);
    xhr.onerror = () => reject(xhr.status);
    xhr.send();
  });
}

function injectTagWithContent(tab, content, isJS = true, fnArgs = []) {
  const newLineReplacement = '!nl!';
  let escapedContent = content.trim()
      .replace(new RegExp("'", 'g'), "\\'") // escape single quotes
      .replace(new RegExp("\\n", 'g'), newLineReplacement);// remove new lines

  const getArg = arg => typeof arg === 'string' ? `\\'${arg}\\'` : arg;

  if (isJS) { // wrap into function
    if (escapedContent.indexOf('function') === 0) {
      escapedContent = `(${escapedContent})(${fnArgs.map(getArg).join(',')});`;
    } else {
      escapedContent = `(function() { ${escapedContent} })();`;
    }
  }

  const code = `
    (function () {
      const script = document.createElement('${isJS ? 'script' : 'style'}');
      script.textContent = '${escapedContent}'.replace(new RegExp("${newLineReplacement}", 'g'), '\\n');
      (document.head || document.body || document.documentElement).appendChild(script);
    })(); 
  `;

  chrome.tabs.executeScript(tab.id, {code});
}

function loadAndInject(tab, path, ...args) {
  return asyncLoad(path).then(content => {
    injectTagWithContent(tab, content, path.indexOf('.js') !== -1, args);
  });
}

function forAllTabs(action) {
  youtrackTabs.forEach((tabData, tabId) => {
    console.log('updating tab', tabId);
    action(tabData.tab);
  });
}

const configFilter = (config, tab) => {
  console.log('config filter', tab.id)
  const url = config.config && config.config.url || '';
  return (url === '' || tab.url.indexOf(url) !== -1);
};

function sendSafeStop(tab) {
  console.log('sending stop', tab.url);
  injectTagWithContent(tab, `
    window.ytTweaks && window.ytTweaks.stopTweaks();
  `);
  return Promise.resolve();
}

function sendConfiguration(tab) {
  const filteredConfigs = userTweaksConfiguration.filter(config => configFilter(config, tab));
  console.log('sending configuration', tab.url, filteredConfigs);
  injectTagWithContent(tab, `
    window.ytTweaks.configure(${JSON.stringify(filteredConfigs)});
  `);
  return Promise.resolve();
}

function getTweaksFromJSON(json, path = '') {
  if (json.tweaks) {
    let result = [];
    for (let name in json.tweaks) {
      result = result.concat(getTweaksFromJSON(json.tweaks[name], (path ? path + '/' : '') + name));
    }
    return result;
  } else {
    return {
      name: path,
      config: json
    }
  }
}

function checkAndInject(tab) {
  console.log('checkAndInject', tab);

  const tabData = youtrackTabs.get(tab.id);

  const matchedConfigs = userTweaksConfiguration.slice().filter(config => configFilter(config, tab)).map(c => c.type);

  return Promise.resolve().then(() => {
    if (!tabData.coreInjected) {
      tabData.coreInjected = true;
      return loadAndInject(tab, `index.js`);
    }
  }).then(() => {
    return Promise.all(repositoryTweaksConfig.map(tweak => {
      const filePromises = [];
      const tweakInjected = tabData.injected.get(tweak.name);

      if (!tweakInjected && matchedConfigs.indexOf(tweak.name) !== -1) {
        tweak.config.js && filePromises.push(loadAndInject(tab, `${tweak.name}/index.js`, tweak.name, chrome.runtime.id));
        tweak.config.css && filePromises.push(loadAndInject(tab, `${tweak.name}/index.css`));

        tabData.injected.set(tweak.name, true);
      }

      return Promise.all(filePromises);
    }));
  }).then(() => sendConfiguration(tab));
}

function getYoutrackTabsByQuery(query = {title: '*YouTrack*'}) {
  return new Promise(resolve => {
    chrome.tabs.query(query, function(tabs) {
      resolve(tabs);
    });
  });
}

chrome.tabs.onRemoved.addListener(tabId => {
  console.log('tab delete: onRemove', tabId);
  youtrackTabs.delete(tabId);
});

chrome.runtime.onMessage.addListener((request, sender) => {
  const tab = sender.tab;

  if (request.probe !== undefined) {
    if (request.probe) {
      console.log('set tab', tab.id, tab.url);

      youtrackTabs.set(tab.id, {
        tab: tab,
        injected: new Map(),
        coreInjected: false
      });
      checkAndInject(tab);
    } else {
      console.log('tab delete: bad probe', tab.id);

      youtrackTabs.delete(tab.id);
    }
  } else if (request.tweaks) {
    console.log('new config');

    userTweaksConfiguration = request.tweaks;
    forAllTabs(checkAndInject);
  }
});

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.ping) {
    sendResponse({pong: true});
  }
});

const storage = window.browser ? chrome.storage.local : chrome.storage.sync; // fix for firefox

function readSavedConfiguration() {
  return new Promise(resolve => {
    storage.get(['tweaks', 'version'], data => {
      userTweaksConfiguration = data.tweaks || [];
      console.log('initial tweaks fetched', JSON.stringify(userTweaksConfiguration));

      if (!data.welcome && userTweaksConfiguration.length === 0) {
        resolve(setDefaultTweaks());
      } else {
        resolve();
      }
    });
  });
}

function setDefaultTweaks() {
  return asyncLoad('default.json').
  then(content => {
    const tweaks = JSON.parse(content);
    storage.set({
      welcome: true,
      tweaks
    });
    userTweaksConfiguration = tweaks;
  });
}

asyncLoad('options.json').then(content => {
  repositoryTweaksConfig = getTweaksFromJSON(JSON.parse(content));
}).then(() => {
  return readSavedConfiguration()
    .then(getYoutrackTabsByQuery)
    .then(tabs => {
      tabs.forEach(tab => chrome.tabs.reload(tab.id));
    });
});