# 星海工坊 · 当前架构（V2 迁移后）

## 一、整体结构

工坊 V1.8 原本是「状态栏脚本」里的第二个 IIFE，紧挨在状态栏本体（第一个 IIFE）之后。V2 把它原样拆成独立扩展，入口从「状态栏内置」改为「跨 window 暴露 `__XYWS_OPEN__`」。

```
状态栏脚本（桥接版）                    独立扩展（starsea-workshop-extension）
┌────────────────────────┐            ┌──────────────────────────────┐
│ 第一个 IIFE（状态栏本体）│            │ index.js —— 入口               │
│  · MVU 读取/面板/地图/立绘│            │ src/compat.js —— 环境发现      │
│  · 世界规则系统           │            │ src/auth.js —— 认证（3.1-D）   │
│  · __XYSB_RULES_BRIDGE__ │◄──读写规则──┤ src/workshop.js —— 工坊本体   │
│  · 「✦」按钮（桥接绑定）   │            │ style.css —— 浮窗样式         │
└────────┬───────────────┘            └──────────────────────────────┘
         │ __XYWS_OPEN__（window / parent / top）
         ▼
      开场白（轻量入口 V1.1）·「进入星海工坊」按钮
```

## 二、模块边界与职责

| 文件 | 职责 |
| --- | --- |
| `index.js` | 顶部按顺序 `import`：`compat.js → cloud-config.js → auth.js → cloud.js → cloud-write.js → workshop.js`；再发现宿主 doc/win、调用 `install()`，并把 `__XYWS_OPEN__` 暴露到 window/parent/top。有界重试（250ms×40 ≈ 10s）。 |
| `src/compat.js` | 安全解析 window / window.parent / window.top / SillyTavern / TavernHelper / Mvu / document；跨域 try/catch 降级；`waitFor` 有界低频轮询。 |
| `src/cloud-config.js` | 公开 API 地址（非 Secret）：`WORKS_API_URL`（公共作品 GET，阶段 2.5）、`AUTH_START_URL`（香港 SCF 登录发起，阶段 3.1-D）、`CLOUDBASE_AUTH_BASE`（CloudBase Auth HTTP API）。不含任何数据库 Key / Publishable Key / Discord Client Secret / 自定义登录私钥。 |
| `src/auth.js` | 认证模块（阶段 3.1-D r3，同标签页）：一次性 bridge key（sessionStorage 暂存）→ 当前标签页跳转 `/oauth/start` → callback 302 回同一标签页 fragment（AES-256-GCM 密文）→ 本页解密 → Ticket 换 CloudBase Session（`/signin/custom`）→ Session 保存/读取（`xyws_auth_session_v1`）、device id（`xyws_auth_device_v1`）、`refreshIfNeeded`（`/token`）、`logout`（`/user/signout`，8 秒超时）、`probeIdentity`（阶段 3.2-B：`/xyws/auth/me` introspect 校验 sub）。纯浏览器原生 fetch / localStorage / crypto，无 npm 包。 |
| `src/cloud.js` | 云端只读数据层：原生 `fetch`（仅 GET，header 仅 `Accept`）+ 行→work 映射 + `inFlight` 并发去重 + 60 秒冷却（成功/失败都冷却，`force` 绕过）+ 8 秒 AbortController。 |
| `src/cloud-write.js` | 云端写请求（阶段 3.3-A）：`publishWork(work, author)` 经 `__XYWS_AUTH__.getAccessToken()`（含自动刷新）取 token → `POST WORKS_PUBLISH_API_URL`（Bearer，10 秒超时）→ 校验 `ok/work/id` 后返回 `data.work`；不直接读 localStorage token，token 不落 console。 |
| `src/workshop.js` | 工坊本体（V1.8 原样迁移）。UI、storage、package、NPC/开局/规则/玩法安装器、发布器全部位于其中，函数以 `xyws*` 前缀分组；`DEMO_WORKS` 兜底、`WORKS` 为当前浏览数据源（云端成功时替换为云端作品）。阶段 3.1-D 仅做最小侵入：登录屏（auth screen）、未登录拦截、`renderMine` 顶部账号面板、登录/退出按钮。 |
| `style.css` | 工坊浮窗 CSS，自 V1.8 的内联 `<style id="xyws-style">` 原样提取（含 `\n`/`\"` 反转义）。 |

> 说明：V1.8 的 UI / storage / package / installers / publisher 都存在于同一个 `install(doc, win, buttonId)` 闭包内，共享 `overlay / currentScreen / currentCat / currentWork / doc / win` 等状态。为满足「行为等价迁移、禁止重新设计现有功能」的硬约束，本次未强行把它们拆成独立文件，避免破坏现有功能。具体子系统位置见下方「三」。

### 认证数据流（阶段 3.1-D r3，同标签页 Redirect Bridge）

1. 未登录打开工坊 → `auth` 登录屏；登录后进入 `home` 并触发 `xywsRefreshCloud(false)`。
2. `__XYWS_AUTH__.login(win)`：生成一次性 bridge key（当前标签页 sessionStorage 暂存）→ `win.location.assign(AUTH_START_URL + '?opener_origin=...&bridge_key=...')`，当前标签页直接导航离开。
3. 香港 SCF `/oauth/start` 校验 opener_origin + bridge_key（必须 32 字节 base64url）→ 生成随机 state → 设置三个 `__Host-` Cookie（state / opener_origin / bridge_key，Secure/HttpOnly/SameSite=Lax/Path=/, 10 分钟）→ 302 Discord authorize（scope=identify）。
4. Discord callback：`timingSafeEqual` 校验 state（先于一切，含 error/access_denied）→ `code → /users/@me → customUserId → createCloudBaseTicket()` → 用 bridge key AES-256-GCM 加密结果（IV 12B 随机、AAD=opener_origin、ct=ciphertext+tag）→ **302 回 `<opener_origin>/#xyws-auth-bridge=<bridgePayload>`**，三 Cookie 立即清除；不返回任何 HTML。
5. 回到同一标签页后，auth.js 启动时 `consumeRedirectBridgeOnLoad()` 清除 fragment、从 sessionStorage 读取并删除临时 bridge key、本页 Web Crypto AES-GCM 解密（AAD=hostOrigin）→ Ticket（仅内存）→ `POST /auth/v1/signin/custom` 换 Session → 保存 `xyws_auth_session_v1`。不使用 popup / window.opener / BroadcastChannel / localStorage mailbox。
6. 距过期 <5 分钟：`POST /auth/v1/token`（refresh_token 轮换，expires_in 必须有限>0）→ 覆盖保存；失败清除 Session。
7. 退出：`POST /auth/v1/user/signout`（Bearer，8 秒 AbortController 超时），无论结果清除本地 Session（保留 device id）。
8. 阶段 3.2-B：`probeIdentity()` 复用 `getAccessToken()` → `GET /xyws/auth/me`（上海鉴权函数，Bearer）→ 服务端 introspect 返回可信 sub → 与本地 Session sub 比对，不一致即失败。
9. 本阶段只做登录闭环与身份 probe；`xyws_works` 公共 GET 未加鉴权，ownership / 真正云端上传未实现。

### 云端只读数据流（阶段 2.5，保持不变）

1. `index.js` 依次 `import`：`compat.js`（环境发现）→ `cloud-config.js`（写 `__XYWS_CLOUD_CONFIG__`）→ `cloud.js`（写 `__XYWS_CLOUD__`）→ `workshop.js`。
2. 打开工坊时 `xywsRefreshCloud(false)` → `cloud.fetchWorks(force)`：`GET WORKS_API_URL`（CloudBase HTTP 网关 → xywsworksread → PostgreSQL xyws_works），header 仅 `Accept`，阶段 2 只允许 GET；客户端不持有数据库 Key，Publishable Key 只在云函数环境变量中。
3. 行 → work：`id = cloud:<UUID>`（稳定非随机）、`xywsCloud=true`、payload 映射与 XYWS Package v1 一致。
4. 结果：成功 → `WORKS = 云端作品`；失败/格式错误（非空 rows 且 0 条合法行）→ 返回 null → `WORKS = DEMO_WORKS.slice()`，最多提示一次「云端作品库暂时不可用」。
5. 60 秒冷却：任意一次真实请求后 60 秒内不再发起 GET（成功/失败都冷却）；`force=true` 绕过；`inFlight` 并发去重；8 秒 AbortController；无轮询。
6. 作品库仍只读：本阶段未做云端上传、云端点赞/收藏/举报；登录闭环见上方「认证数据流（阶段 3.1-D）」，`xywsworksread` 未加鉴权。

## 三、功能 → 位置映射（`src/workshop.js` 内）

| 子系统 | 关键函数 / 常量 |
| --- | --- |
| 作品数据（内置示例） | `WORKS`、`TYPES`、`ICON` |
| UI（浮窗/首页/详情/发布/收藏/我的/已启用） | `ensureOverlay`、`show/open/close`、`renderHome/renderHot/renderNpcPage/renderList/renderEnabled/renderFavs/renderMine`、`openDetail`、`card`、`toast` |
| storage | `getLS/setLS/arr`，`LS_FAV/LS_INST/LS_MINE/LS_LIKED/LS_IMPORTED/LS_PLAY_BASE/XYWS_SIZE_KEY`，`xywsPlayKey/xywsPlayLoad/xywsPlaySaveLocal` |
| package（XYWS Package v1） | `xywsBuildPackage/xywsCanonicalWork/xywsFromCanonical/xywsParsePackage/xywsImportText/xywsReadImportFile/xywsExportWork/xywsExportMine/xywsDownloadJson` |
| NPC 安装器（加入名册 / 中途加入） | `xywsInstallNpc`、`xywsInstallNpcOpening`、`xywsWorkNpcSources`、`xywsNpcRecord`、`xywsResolveOpeningRosterBridge` |
| 开局安装器 | `xywsInstallOpening`（精确写 `#send_textarea`，不自动发送） |
| 规则安装器 | `xywsInstallRule`、`xywsRuleTexts`、`xywsLoadRulesAll/xywsSaveRulesAll`（经由状态栏 `__XYSB_RULES_BRIDGE__`） |
| 玩法安装器 | `xywsInstallPlay`、`xywsSyncPlayToPacer`、`xywsPlayMountParts`、`xywsInitPlayPacerBridge`（写入 `系统状态.推进器.自定义取材`） |
| 发布器 | `openPublish`、`publishLocal`、`pubSource` |
| 已启用管理 | `xywsManagedItems`、`xywsToggleManaged`、`xywsRemoveManaged` |
| 兼容桥（扩展侧入口） | `src/compat.js` + `index.js` |

## 四、对外全局接口

- 扩展暴露：`__XYWS_OPEN__`（工坊入口，window/parent/top）、`__XYWS_WORKSHOP__`（安装器）、`__XYWS_COMPAT__`（兼容层）、`__XYWS_CLOUD_CONFIG__`（公开 API 配置）、`__XYWS_CLOUD__`（只读数据层）、`__XYWS_CLOUD_WRITE__`（写请求层：publishWork）、`__XYWS_AUTH__`（认证模块：login / whenRedirectReady / getRedirectResult / getSession / isLoggedIn / getAccessToken / refreshIfNeeded / probeIdentity / logout / getDiscordProfile）。
- 依赖既有接口：`__XYSB_RULES_BRIDGE__`（状态栏规则桥）、`__XYWS_OPENING_ADD_ROSTER__`（开场白名册桥）、`SillyTavern` / `TavernHelper` / `Mvu`。

## 五、localStorage key（保持不变）

工坊自有：`xyws_favs_v1`、`xyws_installed_v1`、`xyws_myworks_v1`、`xyws_liked_v1`、`xyws_imported_works_v1`、`xyws_playpacks_v1::<scopeHash>`、`xyws_play_pacer_migrated_v1::<scopeHash>`、`xyws_desktop_size_v1`。

阶段 3.1-D 新增：`xyws_auth_session_v1`（CloudBase Session：token_type / access_token / refresh_token / expires_at / sub / device_id / discord）、`xyws_auth_device_v1`（设备 ID，首次随机生成后复用）。**Ticket 不写入 localStorage。**

依赖（归其他组件，只读或经桥）：`xysb_world_rules`、`xysb_world_rules_auto`（状态栏规则系统）、`star_pact_profiles_v1`、`star_pact_cur_v5`、`star_pact_cur_v5_roster`（开场白）。


## 阶段 3.1-D dev.13 登录方式

Discord OAuth 改为同一浏览器标签页跳转：当前 SillyTavern 标签页离开到 Discord，callback 由香港 SCF r3 以 AES-GCM 密文 fragment 302 回同一 `127.0.0.1` 标签页。一次性 bridge key 仅在该标签页的 `sessionStorage` 暂存，返回后立即删除；不再依赖 popup、window.opener、BroadcastChannel 或 localStorage mailbox。


## 阶段 3.5-A（dev.18）

`/xyws/works/manage` 由独立上海 HTTP 函数提供 authenticated GET/DELETE。客户端不接触 `author_user_id`，服务端通过 CloudBase token introspect 得到可信 `sub` 后读取 ownership；普通用户只能删除 `author_user_id === sub` 的作品，管理员由 `XYWS_ADMIN_DISCORD_USER_ID` 服务端环境变量决定。


## dev.24 / stage3.7a-r1 增量

- `/xyws/works/manage` 在原 GET/DELETE 上新增 PATCH（owner 原地编辑）与 POST（like/download）。
- `public.xyws_work_likes` 以 `(work_id,user_id)` 主键保证一个账号对同一作品最多一个赞；触发器原子维护 `xyws_works.likes`。
- 下载量继续保存在 `xyws_works.uses`，管理后端使用带旧值条件的 PATCH compare-and-swap 重试，避免并发覆盖。
- 客户端不提交 `author_user_id`，编辑权限仍只认服务端 introspect 的 trusted sub。
