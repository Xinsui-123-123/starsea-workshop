# 星海工坊 2.0.0-dev.24

本版把 dev.23 已完成的结构修改与 stage3.7a-r1 管理后端闭环配套：作者原地编辑、真实点赞/下载计数、SillyTavern 世界书导入与导入作品上传选栏。客户端业务协议沿用 dev.23，OAuth/Auth/compat 保持冻结。

# 星海工坊 · SillyTavern 第三方扩展

当前客户端：`2.0.0-dev.24`。

星海工坊用于发现、发布、下载并安装社区作品。现有 Discord 登录、CloudBase Session、ownership、公共作品读取、云端发布、删除权限与跨客户端刷新继续沿用已实机成功的链路；dev.24 包含 dev.23 的全部结构修改，并与 `xywsworksmanage stage3.7a-r1` 配套闭环作者编辑、真实点赞和下载计数；认证链仍保持冻结。

## 安装

在 SillyTavern 的「扩展 → 安装扩展」中填写：

```text
https://github.com/suyunsu797/starsea-workshop.git
```

安装完成后刷新 SillyTavern。

## 当前作品类型

- 人物
- 生灵
- 开局
- 规则
- 玩法
- 变身装束
- 能力 / 招式
- 物品

## dev.24 重点

- 全部作品类型都有“简介（选填）”；作者留空时，客户端会按正文或结构化字段自动生成卡片简介。
- SillyTavern 世界书 JSON（顶层 `entries`）可直接识别；导入前先选择目标栏目，条目 `content` 原文逐字保留。导入到人物 / 生灵时原文单独保存在 `fallbackText`，不会整段偷塞进钩子等结构化字段。
- 本地导入作品在“我的”里增加“上传云端”，上传前可重新选择栏目并修改名称、简介、正文或结构化字段。
- 当前账号自己的云端作品增加“编辑作品”入口；配套 stage3.7a-r1 后端后，PATCH 会原地更新同一个作品 ID，不需要删除重发。
- 点赞 / 下载计数走现有管理端点：点赞按登录账号幂等记录并由数据库触发器原子维护 likes；成功安装或导出会真实递增 uses。卡片、详情与热门排序读取的仍是 `xyws_works.likes / uses`。
- dev.22 的完整人物 / 生灵结构化发布、装束、能力、物品与分类栏改动继续保留。

## 变量原则

工坊安装器只写现有 canonical MVU 结构，不为分享功能私造第二套长期状态。世界书、星辉内核、Zod 与事件推进器不是本扩展的配置文件，不随普通工坊 UI 修改而改写。

## 主要目录

```text
manifest.json
index.js
style.css
src/
  auth.js
  cloud-config.js
  cloud.js
  cloud-write.js
  cloud-manage.js
  compat.js
  workshop.js
docs/
```

## 登录说明

正式登录链仍是香港 SCF 的同标签页 Discord OAuth → CloudBase Custom Login Session。不要恢复旧的 popup / `window.opener` / `BroadcastChannel` 登录方案。

## 安全

公开仓库只包含客户端扩展。CloudBase / Discord Secret、私钥、数据库凭据和服务端 API Key 不应提交到仓库。
