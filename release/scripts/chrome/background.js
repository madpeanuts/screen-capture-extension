(function(){var e=null,t=function(e){return e.title==="Targetprocess Screen Capture"&&e.url.match(/^chrome-extension:\/\//)},n=function(){return new Promise(function(e){chrome.tabs.captureVisibleTab(null,e)})},r=function(t){var n=null;chrome.tabs.onUpdated.addListener(function i(r,s){if(n&&r===n.id&&s.status==="loading"){chrome.tabs.onUpdated.removeListener(i);var o=chrome.extension.getViews().filter(function(e){return e.location.href===n.url})[0];o&&(o.screenshotUrl=t,o.screenshotSelection=e),e=null}});var r=chrome.extension.getURL("editor.html?id="+Number(new Date));chrome.tabs.create({url:r},function(e){n=e})},i=function(e){t(e)||Promise.cast(n()).then(function(e){r(e)})},s=function(e){chrome.tabs.sendMessage(e.id,{action:"captureSelection:start"})};chrome.runtime.onMessage.addListener(function(t,n){switch(t.action){case"captureVisible:selected":chrome.tabs.query({active:!0},function(e){i(e[0])});break;case"captureSelection:selected":chrome.tabs.query({active:!0},function(e){s(e[0])});break;case"captureSelection:completed":e=t.selection,i(n.tab)}});var o=function(e){chrome.tabs.get(e,function(e){e&&(t(e)?chrome.browserAction.disable():chrome.browserAction.enable())})};chrome.tabs.onUpdated.addListener(function(e){return o(e)}),chrome.tabs.onActivated.addListener(function(e){return o(e.tabId)})})();