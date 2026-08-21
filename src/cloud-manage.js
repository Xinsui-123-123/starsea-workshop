/*
 * 星海工坊 · 客户端云端作品管理 (cloud-manage.js)
 * ============================================================================
 * 阶段 3.5-A：读取当前登录用户的云端作品 + 删除作品。
 *
 * - token 只通过 __XYWS_AUTH__.getAccessToken() 获取，不直读 localStorage。
 * - GET WORKS_MANAGE_API_URL：服务端按 trusted sub 返回“我的作品”，客户端再复用 cloud.js 的 rowToWork()。
 * - DELETE WORKS_MANAGE_API_URL：body {id:<数据库作品 id>}；真正 ownership/admin 判断全部在服务端。
 * - 不保存 token，不把 author_user_id 暴露给 UI。
 * ============================================================================
 */
(function () {
  'use strict';

  var REQUEST_TIMEOUT = 10000;

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

  function cloudApi() {
    if (typeof window !== 'undefined' && window.__XYWS_CLOUD__) return window.__XYWS_CLOUD__;
    try { if (typeof globalThis !== 'undefined') return globalThis.__XYWS_CLOUD__ || null; } catch (e) {}
    return null;
  }

  async function tokenOrThrow() {
    var A = authApi();
    if (!A || typeof A.getAccessToken !== 'function') throw new Error('认证模块未加载');
    var token = await A.getAccessToken();
    if (!token) throw new Error('当前登录已失效，请重新登录');
    return token;
  }

  async function request(method, body) {
    var c = config();
    var url = (c && c.WORKS_MANAGE_API_URL) || '';
    if (!url) throw new Error('作品管理地址未配置');
    var token = await tokenOrThrow();

    var controller = null;
    try { controller = new AbortController(); } catch (e) { controller = null; }
    var timer = null;
    if (controller) timer = setTimeout(function () { try { controller.abort(); } catch (e) {} }, REQUEST_TIMEOUT);

    var resp;
    try {
      var opts = {
        method: method,
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        signal: controller ? controller.signal : undefined
      };
      if (body !== undefined) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
      }
      resp = await fetch(url, opts);
    } catch (e) {
      throw new Error(e && e.name === 'AbortError' ? '作品管理请求超时' : '作品管理请求失败');
    } finally {
      if (timer) clearTimeout(timer);
    }

    var raw = await resp.text();
    var data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch (e) { data = null; }

    if (resp.status === 401) throw new Error('当前登录已失效，请重新登录');
    if (resp.status === 403) throw new Error('你不能删除别人的作品');
    if (resp.status === 404) throw new Error('作品已不存在');
    if (resp.status === 409) throw new Error('作品状态已变化，请刷新后重试');
    if (!resp.ok || !data || data.ok !== true) throw new Error('云端作品管理未通过');
    return data;
  }

  async function fetchMine() {
    var data = await request('GET');
    if (!Array.isArray(data.works)) throw new Error('云端作品列表格式异常');
    var C = cloudApi();
    if (!C || typeof C.rowToWork !== 'function') throw new Error('云端作品读取模块未加载');
    var works = data.works.map(function (row) { return C.rowToWork(row); }).filter(Boolean);
    return { works: works, isAdmin: data.isAdmin === true };
  }

  async function deleteWork(originId) {
    var id = String(originId || '').trim();
    if (!id) throw new Error('作品 ID 无效');
    var data = await request('DELETE', { id: id });
    if (String(data.id || '') !== id) throw new Error('云端删除结果异常');
    return { id: id, admin: data.admin === true };
  }

  var API = { fetchMine: fetchMine, deleteWork: deleteWork };
  try { if (typeof window !== 'undefined') window.__XYWS_CLOUD_MANAGE__ = API; } catch (e) {}
  try { if (typeof globalThis !== 'undefined') globalThis.__XYWS_CLOUD_MANAGE__ = globalThis.__XYWS_CLOUD_MANAGE__ || API; } catch (e) {}
})();
