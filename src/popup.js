function handleTabInfo(info) {
    let main = document.getElementById("main");

    if (info) {
        for (let stage of info) {
            let wrap = document.createElement("p");
            let text = document.createTextNode(stage.url);
            wrap.appendChild(text);
            main.appendChild(wrap);
        }
    } else {
        let wrap = document.createElement("p");
        let text = document.createTextNode("No dequery rewriting history");
        wrap.append(text);
        main.appendChild(wrap);
    }
}

chrome.extension.sendMessage({ type: "getTabInfo" }, function (response) {
    handleTabInfo(response);
});
