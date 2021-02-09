var historyById = {};

function getCurrentTab(callback) {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, function (res) {
        callback(res[0]);
    });
}

function updateIconDisplay(id) {
    let history = historyById[id.toString()];
    if (!history) {
        chrome.browserAction.setIcon({ path: {
            16: "unknown16.png",
            24: "unknown24.png",
            32: "unknown32.png"
        }});
    } else if (history.length == 1) {
        chrome.browserAction.setIcon({ path: {
            16: "pass16.png",
            24: "pass24.png",
            32: "pass32.png"
        }});
    } else {
        chrome.browserAction.setIcon({ path: {
            16: "fail16.png",
            24: "fail24.png",
            32: "fail32.png"
        }});
    }
}

function handleIconDisplay() {
    getCurrentTab(function (tab) {
        if (tab) {
            updateIconDisplay(tab.id);
        }
    });
}

chrome.tabs.onActivated.addListener(function (info) {
    handleIconDisplay();
});

chrome.tabs.onUpdated.addListener(function (id, info, tab) {
    if (info.url) {
        handleIconDisplay();
    }
});

function getTabInfo(respond) {
    getCurrentTab(function (tab) { respond(historyById[tab.id.toString()])});
}

function filterUrl(accum, raw) {
    let url = new URL(raw);
    let fullpath = url.host + url.pathname;
    let params = url.searchParams;

    const fb_redir = /l\.facebook\.com\/l.php/;
    if (fullpath.match(fb_redir) && params.has("u")) {
        accum.push({
            url: raw,
            type: "unwrap"
        });
        return filterUrl(accum, params.get("u"));
    }

    const block_list = [ "fbclid", "gclid", "msclid", "dclid", "zanpid", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclsrc" ];
    let found = [];
    for (let query of block_list) {
        if (params.has(query)) {
            found.push(query);
            params.delete(query);
        }
    }
    if (found.length) {
        accum.push({
            url: raw,
            type: "delete",
            params: found
        });
        url.search = "?" + params.toString();
        return filterUrl(accum, url.href);
    }

    accum.push({ url: raw });
    return accum;
}

function updateHistory(id, history) {
    const idx = id.toString();

    if (!historyById[idx]) {
        historyById[idx] = history;
    } else {
        const stored = historyById[idx];
        if (history[0].url === stored[0].url ||
            history[history.length - 1].url === stored[stored.length - 1].url) {
            // do nothing
        } else if (history[0].url === stored[stored.length - 1].url) {
            // chain histories
            historyById[idx].pop();
            historyById[idx].push(...history);
        } else {
            historyById[idx] = history;
        }
    }
}

function handleUrlEntry(req) {
    const result = filterUrl([], req.url);

    if (req.type === "main_frame") {
        updateHistory(req.tabId, result);
    }
    handleIconDisplay();

    if (result.length == 1) {
        return null;
    } else {
        return result[result.length - 1].url;
    }
}

chrome.webRequest.onBeforeRequest.addListener(function (req) {
    return { redirectUrl: handleUrlEntry(req) };
}, { urls: [ "http://*/*", "https://*/*" ] }, [ "blocking" ]);

chrome.extension.onMessage.addListener(function (req, sender, respond) {
    switch (req.type) {
    case "getTabInfo": getTabInfo(respond); return true;
    }
});
