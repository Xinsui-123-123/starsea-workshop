# 星海工坊 V2 当前架构（dev.27）

## 人物边界

- `type=角色` / cloud `content_type=person, subtype=character`：长期重要人物。安装目标仅为现有合法 `/重要人物/<姓名>` 结构。
- `type=NPC` / cloud `content_type=person, subtype=support`：轻量“生灵 / 配角”。安装只向聊天框写叙事设定，明确禁止写 `/重要人物`、禁止进入 NPC 控制台、禁止创建新 MVU 字段。
- 兼容旧云端数据：历史 `subtype=npc` 继续当长期“人物”；只有 `subtype=support` 才归“生灵 / 配角”。

## 人物等级

人物创建只让玩家填写 `等级（1～70，选填）`，不再提供“层级声明”输入框。等级由现有星辉内核换算：

- Lv1–10：见习 / 孳生体
- Lv11–25：正式 / 蚀魂者
- Lv26–40：精英 / 化渊者
- Lv41–55：战姬 / 噬星者
- Lv56–70：传奇 / 渊厄

关键凡人或不知道等级时可直接留空。不会为了补表单新增 Zod / MVU 路径。

## 发布表单

人物只显示常用合法字段；叙事型内容放 `source.notes`。生灵使用独立轻量 source。

能力 / 招式恢复直接显示现有核心变量：招式名称、档位、系别、本能类别/类型、蓝耗、效果。招式名称可留空；发布时客户端用已有表单内容做确定性本地命名，不调用 AI，不新增变量字段。

现有 XYWS Package v1 与 7 种数据库 `content_type` 不变。

## 简介

空简介自动生成约 84 个字符以内的短简介；列表卡片 CSS 最多显示 3 行。作者手写简介仍完整保存，只在列表卡片截断显示。

## 普通扩展程序抽屉与更新

`manifest.json` 指向 `https://github.com/suyunsu797/starsea-workshop` 并开启 `auto_update`。dev.27 同时把星海工坊设置卡直接挂到 SillyTavern 普通“扩展程序”抽屉的 `#extensions_settings2 / #extensions_settings`，不需要先打开“管理扩展”。

Git-backed 安装时，该卡片调用 SillyTavern 自己的扩展发现 / 版本 / 更新接口检查仓库状态；有更新时在卡片标题直接显示红色“有更新”，并显示“更新星海工坊”按钮。

## 冻结

OAuth/Auth、CloudBase Session、cloud read/write/manage、compat、stage3.7a-r1、数据库内容类型、世界书执行、Zod、星辉内核和事件推进器未重构。
