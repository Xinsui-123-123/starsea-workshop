# 星海工坊 · 独立扩展（V2）

从「酒馆助手脚本-8.13·有立绘状态栏·星海工坊V1.8」中**安全拆出**的 SillyTavern 第三方扩展。

当前进度：V2 阶段 3.3-A。已接入正式 Discord 登录闭环（香港 SCF OAuth → CloudBase Custom Login Session）
与云端发布（上海发布 API，服务端 introspect 鉴权 + 服务端写 author_user_id）；
阶段 2.5 的 CloudBase 云端只读公共作品库（仅 GET）保持不变；**ownership 删除 / 管理员权限 / 云点赞收藏仍未实现**。

## 目录结构

```text
starsea-workshop-extension/
├─ manifest.json          # SillyTavern 扩展清单
├─ index.js               # 入口：import 顺序 compat → cloud-config → auth → cloud → workshop，再安装工坊并暴露 __XYWS_OPEN__
├─ style.css              # 工坊浮窗样式（自 V1.8 原样提取）
├─ src/
│  ├─ compat.js           # 兼容层：window/parent/top + SillyTavern/TavernHelper/Mvu 安全解析
│  ├─ cloud-config.js     # 公开 API 地址：作品 GET / Discord 登录发起 / CloudBase Auth / 发布 API（无任何 Key）
│  ├─ auth.js             # 认证模块（阶段 3.1-D）：Discord 登录 popup + CloudBase Session 管理
│  ├─ cloud.js            # CloudBase 云端只读数据层（原生 fetch，仅 GET）
│  ├─ cloud-write.js      # 云端写请求（阶段 3.3-A）：publishWork（认证发布）
│  └─ workshop.js         # 工坊本体（V1.8 原样迁移，UI/安装器/作品包/发布等）
├─ docs/
│  └─ CURRENT_ARCHITECTURE.md
└─ README.md
```

## 认证（阶段 3.1-D r3，同标签页 Redirect Bridge）

- 未登录打开工坊 → 显示 Discord 登录页；未登录不能进入首页/收藏/发布/我的/详情/安装。
- 点击「使用 Discord 登录」→ `login()` 生成**一次性 bridge key**（32 随机字节，暂存当前标签页 sessionStorage）→
  当前 SillyTavern 标签页直接跳转香港 SCF `/oauth/start?opener_origin=...&bridge_key=...` →
  Discord 授权 → callback 校验 state → 签发 CloudBase Custom Login Ticket →
  用 bridge key **AES-256-GCM 加密**认证结果（AAD = 宿主 origin）→
  **302 回同一个 SillyTavern 标签页的 URL fragment**（`#xyws-auth-bridge=密文`，无 HTML）。
- 返回后 auth.js 在本页直接解密（删除临时 bridge key）→
  Ticket 调 CloudBase `/auth/v1/signin/custom` 换取 Session（access_token / refresh_token / expires_in / sub）。
- **Ticket 只存在内存，不写入 localStorage；URL 中只有密文，绝无 Token 明文。**
- Session 保存在 `xyws_auth_session_v1`（含 access_token / refresh_token / expires_at / sub / device_id / discord 资料）；
  设备 ID 保存在 `xyws_auth_device_v1`（首次运行随机生成，登录/刷新/退出复用）。
- 距过期不足约 5 分钟自动刷新（`/auth/v1/token`，refresh token 轮换后覆盖保存）；刷新失败清除 Session。
- 退出登录：调 `/auth/v1/user/signout`（8 秒有界超时），无论结果都清除本地 Session（device id 保留）。
- 公共作品 GET API 本身未加鉴权，`xywsworksread` 未改。

## 云端发布（阶段 3.3-A）

发布页按钮为「发布到云端」：复用现有发布来源选择器与 `xywsCanonicalWork()`（XYWS Package v1）
构建作品 → `__XYWS_CLOUD_WRITE__.publishWork()`（经 `__XYWS_AUTH__.getAccessToken()` 取 token，
10 秒超时）→ `POST WORKS_PUBLISH_API_URL`（上海 `/xyws/works/publish`）。
服务端每次发布都会重新 introspect 验证用户，`author_user_id` 由服务端写入可信 `sub`；
客户端无法决定 id / status / likes / uses / created_at。
仅服务器确认成功后才写入本地镜像（`cloud:<server id>`，按 `xywsOriginId` 去重）并强制刷新公共列表；
云端失败绝不降级为本地成功。真正的云端归属记录在服务器，跨设备「我的作品」同步后续阶段接入。

## 云端身份验证（阶段 3.2-B）

「我的 → 账号 → 验证云端身份」调用 `__XYWS_AUTH__.probeIdentity()`：
复用现有 `getAccessToken()`（含自动刷新）→ `GET AUTH_ME_API_URL`（上海鉴权函数 `/xyws/auth/me`，
`Authorization: Bearer <access_token>`，8 秒超时）→ 服务端经 CloudBase
`/auth/v1/token/introspect` 返回可信 `sub` → 与本地 Session 的 `sub` 比对，不一致即失败。
成功后在账号区显示「CloudBase 身份 · 已验证」（仅本次页面运行期状态，不写 localStorage）；
access_token 绝不进入控制台或返回值。

## 云端数据流（阶段 2.5，保持不变）

SillyTavern → CloudBase HTTP 网关 → xywsworksread 云函数 → CloudBase PostgreSQL xyws_works（published 行）。
客户端不持有数据库 Key；CloudBase Publishable Key 只存在于云函数环境变量中。

## 安装

1. 打开 SillyTavern，点击顶部「扩展插件（Extensions）」→「打开扩展文件夹」，定位到 `extensions/` 目录（通常位于 `<SillyTavern>/data/<用户>/extensions/`）。
2. 把整个 `starsea-workshop-extension` 文件夹复制进 `extensions/`。
3. 刷新 / 重载 SillyTavern（或点「重载扩展」）。

## 使用

工坊不再随状态栏内置，而是作为独立扩展运行。两个既有入口继续可用：

- **状态栏**：安装 `酒馆助手脚本-8.13·有立绘状态栏·星海工坊V2_扩展桥接版.json` 后，状态栏顶部「✦」按钮会查找并调用 `__XYWS_OPEN__`；扩展未加载时提示「星海工坊扩展尚未加载」。
- **开场白**：`regex-8_13·星盟契约开场白·星海工坊轻量入口v1_1` 的「进入星海工坊」按钮同样只调用 `__XYWS_OPEN__`，无需改动。

## 本地数据

所有 V1.8 的 localStorage key 名称保持不变，已有收藏、我的作品、已安装内容、规则、玩法、窗口大小均不会丢失。


## 阶段 3.1-D dev.13 登录方式

Discord OAuth 改为同一浏览器标签页跳转：当前 SillyTavern 标签页离开到 Discord，callback 由香港 SCF r3 以 AES-GCM 密文 fragment 302 回同一 `127.0.0.1` 标签页。一次性 bridge key 仅在该标签页的 `sessionStorage` 暂存，返回后立即删除；不再依赖 popup、window.opener、BroadcastChannel 或 localStorage mailbox。


## dev.18 云端作品管理

新增 `src/cloud-manage.js`：登录用户可跨浏览器同步服务器 ownership 下的“我的作品”，并通过服务端 `/xyws/works/manage` 删除自己的云端作品；管理员删除权限同样由服务端判断。
