/*
 * 星海工坊 · 云端配置 (cloud-config.js)
 * ============================================================================
 * 只保存公开 API 地址（不是 Secret）：
 *   - WORKS_API_URL          CloudBase 公共作品库 GET（阶段 2.5，只读）
 *   - AUTH_START_URL         香港 SCF Discord OAuth 登录发起（阶段 3.1-D）
 *   - CLOUDBASE_AUTH_BASE    CloudBase 登录认证 HTTP API 基础地址
 *   - AUTH_ME_API_URL        上海鉴权函数身份 Probe（阶段 3.2-B，/xyws/auth/me）
 *   - WORKS_PUBLISH_API_URL  上海发布 API（阶段 3.3-A，/xyws/works/publish）
 *   - WORKS_MANAGE_API_URL   上海作品管理 API（阶段 3.5-A，/xyws/works/manage）
 *
 * 任何 Client Secret / CloudBase 自定义登录私钥 / API Key 都绝对不允许进入扩展。
 * ============================================================================
 */
(function () {
  'use strict';
  var CONFIG = {
 WORKS_API_URL: 'https://208.75.133.5.sslip.io/xyws/works',
AUTH_START_URL: 'https://208.75.133.5.sslip.io/oauth/start',
CLOUDBASE_AUTH_BASE: 'https://208.75.133.5.sslip.io/auth/v1',
AUTH_ME_API_URL: 'https://208.75.133.5.sslip.io/xyws/auth/me',
WORKS_PUBLISH_API_URL: 'https://208.75.133.5.sslip.io/xyws/works/publish',
WORKS_MANAGE_API_URL: 'https://208.75.133.5.sslip.io/xyws/works/manage'
  };
  try { if (typeof window !== 'undefined') window.__XYWS_CLOUD_CONFIG__ = CONFIG; } catch (e) {}
  try { if (typeof globalThis !== 'undefined') globalThis.__XYWS_CLOUD_CONFIG__ = CONFIG; } catch (e) {}
})();
