/* Shared API helpers for GitHub Pages static runtime. */
(function () {
  function parseRepo(repoFull) {
    const [owner, repo] = String(repoFull || '').split('/').map((p) => p.trim());
    if (!owner || !repo) {
      throw new Error('Repositorio invalido. Use owner/repo.');
    }
    return { owner, repo };
  }

  function decodeBase64Utf8(base64Value) {
    const text = atob(String(base64Value || '').replace(/\n/g, ''));
    try {
      return decodeURIComponent(Array.from(text).map((ch) => `%${ch.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''));
    } catch (_) {
      return text;
    }
  }

  function encodeBase64Utf8(value) {
    return btoa(unescape(encodeURIComponent(String(value))));
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function readJsonFile({ repoFull, branch = 'main', path, token }) {
    const { owner, repo } = parseRepo(repoFull);
    const endpoint = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const headers = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${endpoint}?ref=${encodeURIComponent(branch)}`, { headers });
    if (res.status === 404) return { exists: false, sha: '', data: null, endpoint };
    if (!res.ok) throw new Error(`Falha ao ler ${path}: ${res.status}`);
    const raw = await res.json();
    const text = decodeBase64Utf8(raw.content || '');
    return {
      exists: true,
      sha: String(raw.sha || ''),
      data: text ? JSON.parse(text) : null,
      endpoint
    };
  }

  async function writeJsonFile({ repoFull, branch = 'main', path, token, message, data, retries = 4 }) {
    const { owner, repo } = parseRepo(repoFull);
    const headers = {
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    for (let attempt = 1; attempt <= retries; attempt += 1) {
      const current = await readJsonFile({ repoFull: `${owner}/${repo}`, branch, path, token });
      const body = {
        message: message || `Atualiza ${path}`,
        content: encodeBase64Utf8(`${JSON.stringify(data, null, 2)}\n`),
        branch
      };
      if (current.sha) body.sha = current.sha;
      const res = await fetch(current.endpoint, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
      });
      if (res.ok) return await res.json();
      const err = await res.json().catch(() => ({}));
      const msg = String(err.message || `Erro ${res.status}`);
      const conflict = res.status === 409 || res.status === 422 || /does not match|sha/i.test(msg);
      if (!conflict || attempt >= retries) throw new Error(msg);
      await wait(250 * attempt);
    }
    throw new Error(`Falha ao salvar ${path}.`);
  }

  window.MHApi = {
    parseRepo,
    readJsonFile,
    writeJsonFile
  };
})();