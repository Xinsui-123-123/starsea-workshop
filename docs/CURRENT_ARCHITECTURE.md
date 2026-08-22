# 星海工坊 V2 当前架构（dev.26）

## 人物边界

- `type=角色` / cloud `content_type=person, subtype=character`：长期重要人物。安装目标仅为现有合法 `/重要人物/<姓名>` 结构。
- `type=NPC` / cloud `content_type=person, subtype=support`：轻量“生灵 / 配角”。安装只向聊天框写叙事设定，明确禁止写 `/重要人物`、禁止进入 NPC 控制台、禁止创建新 MVU 字段。
- 兼容旧云端数据：历史 `subtype=npc` 继续当长期“人物”；只有 `subtype=support` 才归“生灵 / 配角”。

## 发布表单

人物只显示常用合法字段；叙事型内容放 `source.notes`。生灵使用独立轻量 source。玩法、装束、能力、物品表单已减负，现有 XYWS Package v1 与 7 种数据库 `content_type` 不变。

## 简介

空简介自动生成约 108 字短简介；卡片 CSS 最多显示 3 行。作者手写简介仍完整保存，只在列表卡片截断显示。

## 更新

manifest 指向 `https://github.com/suyunsu797/starsea-workshop` 并开启 `auto_update`。Git 更新需要 Git-backed 安装；手工复制目录显示 `(-)` 时无法仅靠 manifest 补出 `.git` 元数据。

## 冻结

OAuth/Auth、CloudBase Session、compat、stage3.7a-r1、数据库内容类型、世界书执行、Zod、星辉内核和事件推进器未重构。
