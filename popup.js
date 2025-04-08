var WebsiteUrl;
var WebsiteHostName;

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    WebsiteUrl = tabs[0].url;
    WebsiteHostName = new URL(tabs[0].url).hostname;
    document.getElementById("url").innerText = WebsiteHostName;
});

function ShowError(text) {
    var div = document.createElement('div');
    div.setAttribute('id', 'ERRORcontainer');
    div.innerHTML = `
        <div class="ERROR">
            <p>${text}</p>     
        </div>`;
    document.getElementsByClassName("bottomItem")[0].appendChild(div);

    setTimeout(() => {
        document.getElementById("ERRORcontainer").remove();
    }, 3000);
}

document.getElementById("btn").addEventListener("click", () => {
    const hours = parseInt(document.getElementById("blockHours").value);

    if (!hours || hours <= 0 || hours > 24) {
        ShowError("Please enter a valid number of hours (1–24)");
        return;
    }   

    if (WebsiteUrl.toLowerCase().includes("chrome://")) {
        ShowError("You cannot block a chrome URL");
        return;
    }

    chrome.storage.local.get("BlockedUrls", (data) => {
        const now = Date.now();
        const blockTill = now + hours * 60 * 60 * 1000;

        let urls = data.BlockedUrls || [];
        const existing = urls.find(e => e.url === WebsiteHostName);

        if (existing && existing.status === "BLOCKED" && existing.BlockTill > now) {
            ShowError("This URL is already blocked");
            return;
        }

        // Remove old record for this URL if it exists
        urls = urls.filter(e => e.url !== WebsiteHostName);

        urls.push({ status: "BLOCKED", url: WebsiteHostName, BlockTill: blockTill });
        chrome.storage.local.set({ BlockedUrls: urls });

        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            chrome.tabs.sendMessage(
                tabs[0].id,
                { from: "popup", subject: "startTimer" }
            );
        });
    });
});
