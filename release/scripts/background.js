(function(){var e=function(){return new Promise(function(e){chrome.tabs.captureVisibleTab(null,e)})},t=function(){var e=chrome.extension.getURL("editor.html?id="+Number(new Date));return new Promise(function(t){chrome.tabs.create({url:e},t)})},n=function(e,t){chrome.tabs.onUpdated.addListener(function n(r,i){if(r===t.id||i.status==="complete"){chrome.tabs.onUpdated.removeListener(n);var s=chrome.extension.getViews().filter(function(e){return e.location.href===t.url})[0];s.screenshotUrl=e}})},r=function(){window===top&&window.addEventListener("keyup",function(e){e.ctrlKey&&e.shiftKey&&e.keyCode&&chrome.extension.sendRequest({message:"shortcut-is-fired",code:e.keyCode})},!1)},i=function(){Promise.all([e(),t()]).then(function(e){n(e[0],e[1])})};chrome.browserAction.onClicked.addListener(i),r()})();