/*
 * 星海工坊 · 认证模块 (auth.js)
 * ============================================================================
 * 职责：Discord OAuth 登录（Redirect Bridge 方案）→ CloudBase Custom Login Session 管理。
 *
 * 全流程（阶段 3.1-D r3，不再依赖 callback HTML）：
 *   login() 生成一次性 bridge key → 暂存当前标签页 sessionStorage → 当前标签页打开 SCF /oauth/start
 *   → Discord 授权 → SCF callback 校验 state → 签发 Ticket
 *   → 用 bridge key AES-256-GCM 加密认证结果 → 302 回同一个 SillyTavern 标签页的
 *     URL fragment（#xyws-auth-bridge=密文）
 *   → auth.js 启动时直接在本页解密 → Ticket 调 CloudBase /signin/custom → 保存 Session
 *
 * 全部使用浏览器原生 fetch / localStorage / crypto（Web Crypto AES-GCM）：
 *   - 不引入任何 npm 包
 *   - 不引入 CloudBase JS SDK
 *
 * 安全约束：
 *   - bridge key：32 随机字节 → base64url，仅为跨同标签页 OAuth 导航暂存在 sessionStorage，
 *     callback 返回后立即删除；绝不写 localStorage / cookie / console
 *   - 不使用 popup / window.opener / BroadcastChannel / mailbox，避免跨窗口通信竞态
 *   - URL fragment 中只有 AES-GCM 密文（bridgePayload），绝无 Ticket / token 明文
 *   - Ticket 只存在于内存，用于一次换取 CloudBase Session，绝不写入 localStorage
 *   - 解密失败（错误 key / 错误 AAD / 篡改密文）一律登录失败，不降级
 *   - 同标签页 callback 返回后立即清除临时 bridge key；失败时保留明确诊断日志
 *   - 刷新失败即清除 Session，不无限重试
 *   - 退出登录只退出星海工坊 CloudBase Session，不动 Discord
 * ============================================================================
 */
(function () {
  'use strict';

  function config() {
    if (typeof window !== 'undefined' && window.__XYWS_CLOUD_CONFIG__) return window.__XYWS_CLOUD_CONFIG__;
    try { if (typeof globalThis !== 'undefined') return globalThis.__XYWS_CLOUD_CONFIG__ || null; } catch (e) {}
    return null;
  }

  var SESSION_KEY = 'xyws_auth_session_v1';
  var DEVICE_KEY = 'xyws_auth_device_v1';
  var REFRESH_MARGIN_MS = 5 * 60 * 1000;  // access_token 剩余不足 5 分钟即刷新

  function storage() {
    try { if (typeof window !== 'undefined' && window.localStorage) return window.localStorage; } catch (e) {}
    try { if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage; } catch (e) {}
    return null;
  }

  function getLS(key) {
    var s = storage();
    if (!s) return null;
    try { var v = s.getItem(key); return v == null ? null : v; } catch (e) { return null; }
  }

  function setLS(key, value) {
    var s = storage();
    if (!s) return;
    try { s.setItem(key, String(value)); } catch (e) {}
  }

  function removeLS(key) {
    var s = storage();
    if (!s) return;
    try { s.removeItem(key); } catch (e) {}
  }

  // 设备 ID：第一次运行随机生成（优先 crypto.randomUUID），缓存在 localStorage，
  // 长度明显小于 CloudBase x-device-id 的 72 字符限制；登录/刷新/退出复用同一个。
  function deviceId() {
    var existing = getLS(DEVICE_KEY);
    if (existing && typeof existing === 'string' && existing.length >= 8 && existing.length <= 72) {
      return existing;
    }

    var id = '';
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        id = crypto.randomUUID();
      }
    } catch (e) {}

    if (!id) {
      var rnd = '';
      try {
        if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
          var arr = new Uint8Array(16);
          crypto.getRandomValues(arr);
          for (var i = 0; i < arr.length; i++) rnd += ('0' + arr[i].toString(16)).slice(-2);
        }
      } catch (e) {}
      if (!rnd) {
        rnd = String(Math.random()).slice(2) + String(Math.random()).slice(2) + String(Date.now()).slice(-8);
      }
      id = 'xyws-' + rnd + '-' + Date.now().toString(36);
    }

    if (id.length > 72) id = id.slice(0, 72);
    setLS(DEVICE_KEY, id);
    return id;
  }

  function base64urlEncode(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function base64urlDecode(str) {
    var b64 = String(str).replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function parseSession(raw) {
    if (!raw) return null;
    try {
      var s = JSON.parse(raw);
      if (!s || typeof s !== 'object') return null;
      if (typeof s.access_token !== 'string' || !s.access_token) return null;
      return s;
    } catch (e) {
      return null;
    }
  }

  function getSession() {
    return parseSession(getLS(SESSION_KEY));
  }

  function isLoggedIn() {
    var s = getSession();
    return !!(s && s.access_token);
  }

  function getDiscordProfile() {
    var s = getSession();
    return (s && s.discord && typeof s.discord === 'object') ? s.discord : null;
  }

  function saveSession(next) {
    if (!next || typeof next !== 'object') return;
    try {
      var clean = {
        token_type: String(next.token_type || 'bearer'),
        access_token: String(next.access_token || ''),
        refresh_token: String(next.refresh_token || ''),
        expires_at: Number(next.expires_at) || 0,
        sub: String(next.sub || ''),
        device_id: String(next.device_id || deviceId()),
        discord: (next.discord && typeof next.discord === 'object') ? next.discord : {}
      };
      setLS(SESSION_KEY, JSON.stringify(clean));
    } catch (e) {}
  }

  function clearSession() {
    // 只清 Session；device id 保留复用
    removeLS(SESSION_KEY);
  }

  function cloudbaseBase() {
    var c = config();
    return (c && c.CLOUDBASE_AUTH_BASE) || '';
  }

  function jsonHeaders(extra) {
    var h = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    for (var k in (extra || {})) {
      if (Object.prototype.hasOwnProperty.call(extra, k)) h[k] = extra[k];
    }
    return h;
  }

  // Ticket → CloudBase Custom Login Session（ticket 只在本函数内使用，不持久化）
  async function fetchCustomSession(ticket) {
    var base = cloudbaseBase();
    if (!base) throw new Error('CloudBase 认证地址未配置');

    console.info('[XYWS Auth] cloudbase:signin:start');
    var resp;
    try {
      resp = await fetch(base + '/signin/custom', {
        method: 'POST',
        headers: jsonHeaders({ 'x-device-id': deviceId() }),
        body: JSON.stringify({ provider_id: 'custom', ticket: ticket })
      });
    } catch (e) {
      throw new Error('CloudBase 登录请求失败');
    }

    console.info('[XYWS Auth] cloudbase:signin:http', resp.status);

    var raw = await resp.text();
    var data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch (e) { data = null; }

    if (!resp.ok || !data) {
      throw new Error('CloudBase 登录失败（HTTP ' + resp.status + '）');
    }
    if (typeof data.access_token !== 'string' || !data.access_token ||
        typeof data.refresh_token !== 'string' || !data.refresh_token ||
        data.expires_in == null || data.sub == null) {
      throw new Error('CloudBase 登录失败：响应缺少必要字段');
    }

    return {
      token_type: String(data.token_type || 'bearer'),
      access_token: String(data.access_token),
      refresh_token: String(data.refresh_token),
      expires_at: Date.now() + (Number(data.expires_in) * 1000),
      sub: String(data.sub)
    };
  }

  /*
   * ============================================================================
   * Redirect Bridge 解密（浏览器 Web Crypto AES-256-GCM）
   * ============================================================================
   */

  // bridgePayload（base64url 的 envelope JSON）→ 认证结果对象。
  // key = 32-byte bridge key；AAD = 宿主 origin；ct = ciphertext + 16-byte GCM tag。
  async function decryptBridgePayload(bridgeKeyBytes, bridgePayload, hostOrigin) {
    var env = null;
    try {
      env = JSON.parse(new TextDecoder().decode(base64urlDecode(bridgePayload)));
    } catch (e) {
      throw new Error('登录结果格式错误');
    }
    if (!env || env.v !== 1 || typeof env.iv !== 'string' || !env.iv || typeof env.ct !== 'string' || !env.ct) {
      throw new Error('登录结果格式错误');
    }

    var ivBytes = base64urlDecode(env.iv);
    var ctBytes = base64urlDecode(env.ct);
    if (ivBytes.length !== 12 || ctBytes.length < 16) {
      throw new Error('登录结果格式错误');
    }

    var rawKey = null;
    try {
      rawKey = await crypto.subtle.importKey(
        'raw', bridgeKeyBytes, { name: 'AES-GCM' }, false, ['decrypt']
      );
    } catch (e) {
      throw new Error('登录结果解密失败');
    }

    var plain = null;
    try {
      plain = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBytes,
          additionalData: new TextEncoder().encode(hostOrigin),
          tagLength: 128
        },
        rawKey,
        ctBytes
      );
    } catch (e) {
      throw new Error('登录结果校验失败');
    }

    var obj = null;
    try {
      obj = JSON.parse(new TextDecoder().decode(plain));
    } catch (e) {
      throw new Error('登录结果解析失败');
    }
    if (!obj || typeof obj !== 'object' || obj.type !== 'xyws-auth-result') {
      throw new Error('登录结果类型错误');
    }
    return obj;
  }

  /*
   * ============================================================================
   * 同标签页 Redirect Login
   *
   * 不再使用 popup / window.opener / BroadcastChannel / localStorage mailbox。
   * 用户点击登录后，当前 SillyTavern 标签页直接导航到 Discord OAuth；callback
   * 仍由香港 SCF r3 使用 AES-GCM bridge 302 回当前 SillyTavern origin。
   *
   * 一次性 bridge key 暂存在“当前标签页、当前 origin”的 sessionStorage 中，
   * 用于跨页面导航后解密 callback fragment；回到 SillyTavern 后立即删除。
   * sessionStorage 随标签页会话存在，不会被发送到服务器，也不会跨标签共享。
   * ============================================================================
   */
  var REDIRECT_PENDING_KEY = 'xyws_auth_redirect_pending_v1';
  var REDIRECT_MAX_AGE_MS = 10 * 60 * 1000;
  var redirectResult = { handled: false, ok: false, error: '' };
  var redirectReadyPromise = null;

  function redirectSessionStorage(win) {
    try { return win && win.sessionStorage ? win.sessionStorage : null; } catch (e) { return null; }
  }

  function clearRedirectPending(win) {
    var ss = redirectSessionStorage(win);
    if (!ss) return;
    try { ss.removeItem(REDIRECT_PENDING_KEY); } catch (e) {}
  }

  function normalizeHostOrigin(win) {
    var hostOrigin = '';
    try { hostOrigin = String((win.location && win.location.origin) || ''); } catch (e) { hostOrigin = ''; }
    if (!hostOrigin || hostOrigin === 'null' || hostOrigin === 'undefined') {
      throw new Error('无法获取宿主窗口来源，无法安全登录');
    }
    try {
      var uo = new URL(hostOrigin);
      if ((uo.protocol !== 'http:' && uo.protocol !== 'https:') || !uo.hostname) {
        throw new Error('bad origin');
      }
    } catch (e) {
      throw new Error('宿主窗口来源不合法，无法安全登录');
    }
    return hostOrigin;
  }

  async function finishRedirectAuth(obj) {
    if (!obj || typeof obj !== 'object') throw new Error('登录结果格式错误');
    if (obj.ok !== true) {
      throw new Error((obj.error && typeof obj.error === 'string' && obj.error) || '登录未完成');
    }
    if (typeof obj.ticket !== 'string' || !obj.ticket) {
      throw new Error('登录结果缺少 Ticket');
    }

    var session = await fetchCustomSession(obj.ticket);
    var profile = (obj.user && typeof obj.user === 'object') ? obj.user : {};
    saveSession({
      token_type: session.token_type,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      sub: session.sub,
      device_id: deviceId(),
      discord: {
        id: String(profile.id || ''),
        username: String(profile.username || ''),
        global_name: String(profile.global_name || ''),
        avatar: String(profile.avatar || '')
      }
    });
    console.info('[XYWS Auth] session:saved');
    console.info('[XYWS Auth] login:success');
    return getSession();
  }

  async function consumeRedirectBridgeOnLoad() {
    var win = (typeof window !== 'undefined') ? window : null;
    if (!win || !win.location) return { handled: false, ok: false, error: '' };

    var marker = 'xyws-auth-bridge=';
    var hash = '';
    try { hash = String(win.location.hash || ''); } catch (e) { hash = ''; }
    var idx = hash.indexOf(marker);
    if (idx < 0) return { handled: false, ok: false, error: '' };

    console.info('[XYWS Auth] redirect:return');

    var bridgePayload = hash.slice(idx + marker.length);
    try { bridgePayload = decodeURIComponent(bridgePayload); } catch (e) {}

    // 回到酒馆后第一时间清理 URL fragment；密文不长期留在地址栏。
    try {
      if (win.history && typeof win.history.replaceState === 'function' && win.document) {
        win.history.replaceState(null, win.document.title, win.location.pathname + win.location.search);
      }
    } catch (e) {}

    var ss = redirectSessionStorage(win);
    if (!ss) throw new Error('浏览器会话存储不可用，无法完成登录');

    var raw = null;
    try { raw = ss.getItem(REDIRECT_PENDING_KEY); } catch (e) { raw = null; }
    // 复制到内存后立刻删除，bridge key 不继续留在浏览器存储里。
    clearRedirectPending(win);

    if (!raw) throw new Error('登录状态已失效，请重新登录');

    var pending = null;
    try { pending = JSON.parse(raw); } catch (e) { pending = null; }
    if (!pending || pending.v !== 1 || typeof pending.bridge_key !== 'string' || !pending.bridge_key) {
      throw new Error('登录状态已失效，请重新登录');
    }

    var hostOrigin = normalizeHostOrigin(win);
    if (String(pending.origin || '') !== hostOrigin) {
      throw new Error('登录来源校验失败');
    }

    var startedAt = Number(pending.at);
    if (!isFinite(startedAt) || startedAt <= 0 || Date.now() - startedAt > REDIRECT_MAX_AGE_MS) {
      throw new Error('登录已超时，请重新登录');
    }

    var keyBytes = null;
    try { keyBytes = base64urlDecode(pending.bridge_key); } catch (e) { keyBytes = null; }
    if (!keyBytes || keyBytes.length !== 32) {
      throw new Error('登录状态无效，请重新登录');
    }

    console.info('[XYWS Auth] bridge:received:same-tab');
    var obj = await decryptBridgePayload(keyBytes, bridgePayload, hostOrigin);
    keyBytes = null;
    console.info('[XYWS Auth] bridge:decrypt:ok');
    await finishRedirectAuth(obj);
    return { handled: true, ok: true, error: '' };
  }

  function whenRedirectReady() {
    return redirectReadyPromise || Promise.resolve(redirectResult);
  }

  function getRedirectResult() {
    return redirectResult;
  }

  // 发起登录：直接导航“当前 SillyTavern 标签页”，不再创建第二个酒馆 popup。
  function login(hostWin) {
    return new Promise(function (resolve, reject) {
      var c = config();
      if (!c || !c.AUTH_START_URL || !c.CLOUDBASE_AUTH_BASE) {
        reject(new Error('认证服务地址未配置'));
        return;
      }

      var win = hostWin || (typeof window !== 'undefined' ? window : null);
      if (!win || !win.location || typeof win.location.assign !== 'function') {
        reject(new Error('当前环境不支持页面登录跳转'));
        return;
      }

      var hostOrigin = '';
      try { hostOrigin = normalizeHostOrigin(win); } catch (e) { reject(e); return; }

      // 使用 Web Crypto 生成一次性 32-byte bridge key。
      var bridgeKeyBytes = new Uint8Array(32);
      try {
        if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
          throw new Error('no crypto');
        }
        crypto.getRandomValues(bridgeKeyBytes);
      } catch (e) {
        reject(new Error('当前浏览器不支持安全随机数，无法登录'));
        return;
      }
      var bridgeKey = base64urlEncode(bridgeKeyBytes);
      bridgeKeyBytes = null;

      // 同一浏览器标签页的 sessionStorage 用于跨 OAuth 导航保留一次性 key。
      // 它不会被发送到 Discord/SCF，callback 返回后会立即删除。
      var ss = redirectSessionStorage(win);
      if (!ss) {
        reject(new Error('浏览器会话存储不可用，无法登录'));
        return;
      }
      try {
        ss.setItem(REDIRECT_PENDING_KEY, JSON.stringify({
          v: 1,
          at: Date.now(),
          origin: hostOrigin,
          bridge_key: bridgeKey
        }));
      } catch (e) {
        reject(new Error('无法保存临时登录状态'));
        return;
      }

      var startUrl = c.AUTH_START_URL;
      try {
        var su = new URL(startUrl);
        // 香港 r3 参数名仍叫 opener_origin，但在 dev.13 中它实际就是“返回 origin”。
        su.searchParams.set('opener_origin', hostOrigin);
        su.searchParams.set('bridge_key', bridgeKey);
        startUrl = su.toString();
      } catch (e) {
        clearRedirectPending(win);
        reject(new Error('认证服务地址不合法'));
        return;
      }

      console.info('[XYWS Auth] login:start');
      console.info('[XYWS Auth] redirect:navigate');

      try {
        win.location.assign(startUrl);
      } catch (e) {
        clearRedirectPending(win);
        reject(new Error('无法打开 Discord 登录页面'));
        return;
      }

      // 正常情况下当前页面马上卸载，因此此 Promise 不应在旧页面里误报“登录成功”。
      // 若浏览器拒绝导航，5 秒后给出明确错误。
      setTimeout(function () {
        reject(new Error('登录页面未能打开，请重试'));
      }, 5000);
    });
  }

  // 距离过期不足约 5 分钟时自动刷新；刷新失败清除 Session 回到未登录
  async function refreshIfNeeded() {
    var s = getSession();
    if (!s || !s.access_token) return false;

    var now = Date.now();
    if (s.expires_at && (s.expires_at - now) > REFRESH_MARGIN_MS) {
      return true; // 还早，不需要刷新
    }
    if (!s.refresh_token) {
      clearSession();
      return false;
    }

    var base = cloudbaseBase();
    if (!base) {
      clearSession();
      return false;
    }

    var resp;
    try {
      resp = await fetch(base + '/token', {
        method: 'POST',
        headers: jsonHeaders({ 'x-device-id': deviceId() }),
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: s.refresh_token
        })
      });
    } catch (e) {
      clearSession();
      return false;
    }

    var raw = await resp.text();
    var data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch (e) { data = null; }

    // 成功必须验证：access_token 非空、refresh_token 非空、expires_in 是有限且 > 0 的数字。
    // 缺少/非法 expires_in 一律视为刷新失败并清理 Session。
    var expiresIn = Number(data && data.expires_in);
    var fieldsOk = !!(
      data &&
      typeof data.access_token === 'string' && data.access_token &&
      typeof data.refresh_token === 'string' && data.refresh_token &&
      isFinite(expiresIn) && expiresIn > 0
    );
    if (!resp.ok || !fieldsOk) {
      clearSession();
      return false;
    }

    // CloudBase refresh token 会轮换：成功后必须同时覆盖保存新的 access_token / refresh_token / expires_at / sub
    saveSession({
      token_type: data.token_type || s.token_type || 'bearer',
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + expiresIn * 1000,
      sub: (data.sub != null && String(data.sub)) || s.sub || '',
      device_id: s.device_id || deviceId(),
      discord: s.discord || {}
    });
    return true;
  }

  async function getAccessToken() {
    var s = getSession();
    if (!s || !s.access_token) return null;
    var ok = await refreshIfNeeded();
    if (!ok) return null;
    var s2 = getSession();
    return (s2 && s2.access_token) ? s2.access_token : null;
  }

  // 正式退出：优先调服务端 signout；无论成功/HTTP 错误/网络错误/超时，
  // 最终都必须清除本地 Session（保留 device id）。
  async function logout() {
    var s = getSession();
    var token = (s && s.access_token) ? s.access_token : '';
    var base = cloudbaseBase();

    if (token && base) {
      var controller = null;
      var timer = null;
      try {
        controller = new AbortController();
      } catch (e) {
        controller = null;
      }
      try {
        if (controller) {
          // 有界超时：网络异常或请求长期挂起时，本地退出不会无限等待
          timer = setTimeout(function () { try { controller.abort(); } catch (e) {} }, 8000);
        }
        await fetch(base + '/user/signout', {
          method: 'POST',
          headers: jsonHeaders({
            'Authorization': 'Bearer ' + token,
            'x-device-id': deviceId()
          }),
          body: '{}',
          signal: controller ? controller.signal : undefined
        });
      } catch (e) {
        // 网络失败 / 超时 Abort 也继续清除本地
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    clearSession();
    return true;
  }

  /*
   * ============================================================================
   * 云端身份 Probe（阶段 3.2-B）
   *
   * 用当前 CloudBase access_token 请求上海鉴权函数 /xyws/auth/me，
   * 服务端经 CloudBase /auth/v1/token/introspect 返回可信 sub，
   * 再与本地 Session 保存的 sub 比对；不一致必须失败。
   *
   * 安全约束：
   *   - 复用现有 getAccessToken()（内含自动刷新），绝不直接读 localStorage token
   *   - access_token 只出现在请求头，绝不写入 console / localStorage / 返回值
   *   - 8 秒 AbortController 有界超时
   * ============================================================================
   */
  async function probeIdentity() {
    var token = await getAccessToken();
    if (!token) {
      throw new Error('当前登录已失效，请重新登录');
    }

    var c = config();
    var url = (c && c.AUTH_ME_API_URL) || '';
    if (!url) {
      throw new Error('云端身份验证地址未配置');
    }

    var controller = null;
    try { controller = new AbortController(); } catch (e) { controller = null; }
    var timer = null;
    if (controller) {
      timer = setTimeout(function () { try { controller.abort(); } catch (e) {} }, 8000);
    }

    var resp;
    try {
      resp = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        signal: controller ? controller.signal : undefined
      });
    } catch (e) {
      throw new Error('云端身份验证请求失败');
    } finally {
      if (timer) clearTimeout(timer);
    }

    var raw = await resp.text();
    var data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch (e) { data = null; }

    if (!resp.ok || !data || data.ok !== true || typeof data.sub !== 'string' || !data.sub) {
      throw new Error('云端身份验证未通过');
    }

    var s = getSession();
    var localSub = (s && s.sub) ? String(s.sub) : '';
    if (!localSub || String(data.sub) !== localSub) {
      throw new Error('CloudBase 身份校验不一致');
    }

    return { ok: true, sub: String(data.sub) };
  }

  // 模块启动即检查：若这是 OAuth callback 返回的同一标签页，直接在本页完成解密和 CloudBase signin。
  redirectReadyPromise = consumeRedirectBridgeOnLoad().then(function (result) {
    redirectResult = result || { handled: false, ok: false, error: '' };
    return redirectResult;
  }).catch(function (err) {
    redirectResult = { handled: true, ok: false, error: (err && err.message) ? err.message : String(err) };
    try { console.error('[XYWS Auth] login:failed', redirectResult.error); } catch (e) {}
    return redirectResult;
  });

  var API = {
    login: login,
    whenRedirectReady: whenRedirectReady,
    getRedirectResult: getRedirectResult,
    getSession: getSession,
    isLoggedIn: isLoggedIn,
    getAccessToken: getAccessToken,
    refreshIfNeeded: refreshIfNeeded,
    probeIdentity: probeIdentity,
    logout: logout,
    getDiscordProfile: getDiscordProfile
  };

  try { if (typeof window !== 'undefined') window.__XYWS_AUTH__ = API; } catch (e) {}
  try { if (typeof globalThis !== 'undefined') globalThis.__XYWS_AUTH__ = globalThis.__XYWS_AUTH__ || API; } catch (e) {}
})();
