/*
 * 星海工坊 · 云端只读数据层 (cloud.js)
 * ============================================================================
 * 使用浏览器原生 fetch() 调用 CloudBase 公共作品 API，只允许 GET。
 * 客户端不保存任何数据库 Key / Publishable Key / 后端密钥。
 *
 * 请求约束：
 *   - GET WORKS_API_URL（CloudBase HTTP 网关 → xywsworksread → PostgreSQL xyws_works）
 *   - AbortController 超时 8 秒
 *   - 防止同一时间重复请求（inFlight 去重）
 *   - 任意一次真实请求后 60 秒冷却（成功/失败都冷却，force 可绕过）
 * ============================================================================
 */
(function () {
  'use strict';

  var ICON_MAP = { '玩法': '🎮', '角色': '👤', '开局': '🎬', 'NPC': '✧', '规则': '📜', '装束': '✦', '能力': '◇', '物品': '▣' };
  var REQUEST_TIMEOUT = 8000;
  var CACHE_TTL = 60000;

  var state = { inFlight: null, lastAttemptAt: 0, lastResult: null };

  // 临时诊断日志（统一前缀，便于在浏览器控制台检索；不改变任何生产语义）
  function dbg() {
    try { if (typeof console !== 'undefined') console.log.apply(console, ['[XYWS Cloud]'].concat(Array.prototype.slice.call(arguments))); } catch (e) {}
  }

  function config() {
    if (typeof window !== 'undefined' && window.__XYWS_CLOUD_CONFIG__) return window.__XYWS_CLOUD_CONFIG__;
    try { if (typeof globalThis !== 'undefined') return globalThis.__XYWS_CLOUD_CONFIG__ || null; } catch (e) {}
    return null;
  }

  // content_type / subtype → 工坊 type
  function mapType(row) {
    var ct = String((row && row.content_type) || '');
    if (ct === 'person') return (String((row && row.subtype) || '') === 'character') ? '角色' : 'NPC';
    if (ct === 'opening') return '开局';
    if (ct === 'rule') return '规则';
    if (ct === 'play') return '玩法';
    if (ct === 'outfit') return '装束';
    if (ct === 'ability') return '能力';
    if (ct === 'item') return '物品';
    return '';
  }

  function excerpt(v, n) {
    var s = String(v || '').replace(/\s+/g, ' ').trim();
    var max = n || 220;
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  }

  function fallbackSummary(type, p, title) {
    if (type === '玩法') return excerpt(p.prompt || title, 220);
    if (type === '开局') return excerpt(p.text || title, 220);
    if (type === '规则') return excerpt(Array.isArray(p.rules) ? p.rules.join(' · ') : title, 220);
    if (type === '装束') return excerpt(p.description || title, 220);
    if (type === '能力') return excerpt([p.slot, p.school, p.skillType, p.mpCost !== undefined && p.mpCost !== null ? ('蓝耗 ' + p.mpCost) : '', p.effect].filter(Boolean).join(' · ') || title, 220);
    if (type === '物品') return excerpt([p.category, p.quantity ? ('×' + p.quantity) : '', p.description].filter(Boolean).join(' · ') || title, 220);
    if (type === '角色' || type === 'NPC') {
      var src = Array.isArray(p.source) ? p.source : [], one = src[0] || {}, npc = (one && one.npc && typeof one.npc === 'object') ? one.npc : one, d = (npc && npc.档案) || {}, rel = (npc && npc.关系) || {};
      return excerpt([d.种族, d.身份, d.阵营, d.能力系别, rel.与主角关系, d.外貌].filter(Boolean).join(' · ') || p.fallbackText || title, 220);
    }
    return excerpt(title, 220);
  }

  // 云端 row → work 对象。payload 映射与 XYWS Package v1 完全一致，禁止另起协议。
  function rowToWork(row) {
    if (!row || typeof row !== 'object') return null;
    if (row.id === undefined || row.id === null || String(row.id).trim() === '') return null;
    if (row.protocol_version !== undefined && row.protocol_version !== null && Number(row.protocol_version) !== 1) return null;
    var type = mapType(row);
    if (!type) return null;
    var p = (row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)) ? row.payload : {};
    var w = {
      id: 'cloud:' + String(row.id || ''),
      xywsCloud: true,
      xywsOriginId: String(row.id || ''),
      xywsAuthor: String(row.author_display_name || ''),
      type: type,
      icon: ICON_MAP[type] || '✦',
      title: String(row.title || '未命名作品').slice(0, 120),
      desc: String(row.summary || fallbackSummary(type, p, row.title || '') || '').slice(0, 4000),
      tags: Array.isArray(row.tags) ? row.tags.map(function (x) { return String(x).slice(0, 60); }).slice(0, 24) : [],
      likes: Number(row.likes) || 0,
      uses: Number(row.uses) || 0,
      created: row.created_at || 0
    };
    if (type === '角色' || type === 'NPC') {
      w.source = Array.isArray(p.source) ? p.source : [];
      w.body = String(p.fallbackText || w.desc || '');
      if (String((row && row.subtype) || '') === 'support' && w.tags.indexOf('配角') < 0) w.tags.push('配角');
    } else if (type === '开局') {
      w.body = String(p.text || w.desc || '');
      w.source = w.body ? [w.body] : [];
    } else if (type === '规则') {
      var rr = Array.isArray(p.rules) ? p.rules.map(function (x) { return String(x).trim(); }).filter(Boolean) : [];
      w.source = rr.map(function (x, i) { return { id: 'cloud_rule_' + i, text: x, on: true }; });
      w.body = rr.join('\n\n') || w.desc;
    } else if (type === '玩法') {
      w.body = String(p.prompt || w.desc || '');
    } else if (type === '装束') {
      w.outfit = { description: String(p.description || '') };
      w.body = w.outfit.description || w.desc;
    } else if (type === '能力') {
      w.ability = { skillName: String(p.skillName || ''), slot: String(p.slot || ''), school: String(p.school || ''), skillType: String(p.skillType || ''), mpCost: Number(p.mpCost), effect: String(p.effect || '') };
    } else if (type === '物品') {
      w.item = { category: String(p.category || ''), quantity: Number(p.quantity) || 1, description: String(p.description || '') };
    }
    return w;
  }

  function fetchWorks(force) {
    var c = config();
    if (!c || !c.WORKS_API_URL) return Promise.resolve(null);
    if (state.inFlight) return state.inFlight;
    if (!force && state.lastAttemptAt && (Date.now() - state.lastAttemptAt < CACHE_TTL)) return Promise.resolve(state.lastResult);

    state.lastAttemptAt = Date.now();

    var controller = null;
    try { controller = new AbortController(); } catch (e) { controller = null; }
    var timer = null;
    if (controller) timer = setTimeout(function () { try { dbg('request aborted after 8s timeout (AbortController)'); controller.abort(); } catch (e) {} }, REQUEST_TIMEOUT);

    var url = c.WORKS_API_URL;

    dbg('request URL', url);
    dbg('request started', new Date().toISOString());

    var promise = fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: (controller ? controller.signal : undefined)
    }).then(function (res) {
      var ct = '';
      try { ct = String((res.headers && typeof res.headers.get === 'function') ? (res.headers.get('content-type') || '') : ''); } catch (e) {}
      dbg('HTTP status', res.status, String(res.statusText || ''), '| Content-Type:', ct || '(none)');
      return res.text().then(function (rawBody) {
        dbg('raw response body', rawBody.length > 20000 ? (rawBody.slice(0, 20000) + '\n...(truncated, total ' + rawBody.length + ' chars)') : rawBody);
        var parsed = null;
        try { parsed = JSON.parse(rawBody); } catch (e) { parsed = null; }
        if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + String(res.statusText || '') + (rawBody ? ' :: ' + rawBody.slice(0, 1000) : ''));
        if (!Array.isArray(parsed)) throw new Error('bad format: body is not a JSON array');
        dbg('parsed row count', parsed.length);
        if (parsed.length === 0) dbg('WARN: rows=0 — 若预期存在已发布作品，请检查 CloudBase 网关 / 云函数 / 数据库 published 行 / WORKS_API_URL');
        var works = parsed.map(rowToWork).filter(Boolean);
        dbg('mapped work count', works.length);
        if (parsed.length > 0 && works.length === 0) throw new Error('all rows invalid');
        state.lastResult = works;
        return works;
      });
    }).catch(function (e) {
      dbg('caught error: name=' + (e && e.name), 'message=' + (e && e.message), 'stack=' + (e && e.stack ? String(e.stack).slice(0, 1200) : '(none)'));
      state.lastResult = null;
      return null;
    }).finally(function () {
      if (timer) clearTimeout(timer);
      state.inFlight = null;
    });

    state.inFlight = promise;
    return promise;
  }

  var API = { fetchWorks: fetchWorks, rowToWork: rowToWork };
  try { if (typeof window !== 'undefined') window.__XYWS_CLOUD__ = API; } catch (e) {}
  try { if (typeof globalThis !== 'undefined') globalThis.__XYWS_CLOUD__ = globalThis.__XYWS_CLOUD__ || API; } catch (e) {}
})();
