/*
 * 星海工坊 · 客户端云端写请求模块 (cloud-write.js)
 * ============================================================================
 * 职责（阶段 3.3-A）：客户端 authenticated 写请求——把作品发布到云端。
 *
 * 只暴露 publishWork(work, author)：
 *   - 通过 __XYWS_AUTH__.getAccessToken() 取当前用户 token（含自动刷新），
 *     绝不直接读取 xyws_auth_session_v1
 *   - POST WORKS_PUBLISH_API_URL（上海发布 API /xyws/works/publish）
 *   - Authorization: Bearer <用户 access_token>
 *   - 10 秒 AbortController 有界超时
 *   - access_token 绝不写入 console / localStorage / 返回值
 *
 * 成功判定：HTTP 2xx 且 data.ok === true 且 data.work 是 object 且 work.id 非空。
 * 返回 data.work。失败抛给调用方可理解的 Error，不自动重新发起 Discord OAuth。
 * ============================================================================
 */
(function () {
  'use strict';

  function config() {
    if (typeof window !== 'undefined' && window.__XYWS_CLOUD_CONFIG__) return window.__XYWS_CLOUD_CONFIG__;
    try { if (typeof globalThis !== 'undefined') return globalThis.__XYWS_CLOUD_CONFIG__ || null; } catch (e) {}
    return null;
  }

  function authApi() {
    if (typeof window !== 'undefined' && window.__XYWS_AUTH__) return window.__XYWS_AUTH__;
    try { if (typeof globalThis !== 'undefined') return globalThis.__XYWS_AUTH__ || null; } catch (e) {}
    return null;
  }

  async function publishWork(work, author) {
    var A = authApi();
    if (!A || typeof A.getAccessToken !== 'function') {
      throw new Error('认证模块未加载');
    }

    var token = await A.getAccessToken();
    if (!token) {
      throw new Error('当前登录已失效，请重新登录');
    }

    var c = config();
    var url = (c && c.WORKS_PUBLISH_API_URL) || '';
    if (!url) {
      throw new Error('作品发布地址未配置');
    }

    var controller = null;
    try { controller = new AbortController(); } catch (e) { controller = null; }
    var timer = null;
    if (controller) {
      timer = setTimeout(function () { try { controller.abort(); } catch (e) {} }, 10000);
    }

    var resp;
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ work: work, author: author }),
        signal: controller ? controller.signal : undefined
      });
    } catch (e) {
      throw new Error(e && e.name === 'AbortError' ? '作品发布超时' : '作品发布请求失败');
    } finally {
      if (timer) clearTimeout(timer);
    }

    var raw = await resp.text();
    var data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch (e) { data = null; }

    if (resp.status === 401) {
      throw new Error('当前登录已失效，请重新登录');
    }
    if (resp.status === 413) {
      throw new Error('作品内容过大');
    }
    if (!resp.ok || !data || data.ok !== true || !data.work || typeof data.work !== 'object' || typeof data.work.id !== 'string' || !data.work.id) {
      if (resp.status >= 400 && resp.status < 500) {
        throw new Error('作品内容不符合发布要求');
      }
      throw new Error('作品发布未通过');
    }

    return data.work;
  }

  var API = {
    publishWork: publishWork
  };

  try { if (typeof window !== 'undefined') window.__XYWS_CLOUD_WRITE__ = API; } catch (e) {}
  try { if (typeof globalThis !== 'undefined') globalThis.__XYWS_CLOUD_WRITE__ = globalThis.__XYWS_CLOUD_WRITE__ || API; } catch (e) {}
})();
