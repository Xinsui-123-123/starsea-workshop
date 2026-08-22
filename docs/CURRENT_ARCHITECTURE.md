# 星海工坊 V2 当前架构（dev.31）

## 人物 / 生灵边界

- `type=角色` / cloud `content_type=person, subtype=character`：长期重要人物，安装到 `/重要人物/<姓名>`。
- `type=NPC` / cloud `content_type=person, subtype=support`：轻量“生灵 / 配角”。魔物、使魔、灵兽、路人不写 `/重要人物`。
- 星灵是 support 的特殊类型：安装为主角 `/主角/星灵`。
- 历史 `subtype=npc` 保持长期人物兼容。

## Canonical 结构化人物

```text
人设
  性格
  言行模式
  背景要点
  长期事实.<短标题> = <内容>
  补充设定                 # 旧版兼容

特性.<名称>
  系别
  类型
  效果

招式.<名称>
  档位
  系别
  类型
  蓝耗
  效果

背包.<名称>
  数量
  类别
  描述

星器.<名称>
  类型
  品阶
  契合
  效果

关系
  钩子
  秘密
```

归类原则：专用字段优先；无法自然硬分的稳定人物事实进入 `人设.长期事实`；原始作者文本保存在 Workshop `source.rawText`；`补充设定` 只保留旧档兼容。

## 主角特性

配套 dev.30 MVU 已新增 `/主角/特性`，魔法少女 / 守护者和魔人共用同一结构。被动天赋、体质、常驻效果不占招式档位，不需要蓝耗。

## dev.31 智能人物导入管线

```text
粘贴自然语言 / 导入世界书
        ↓
SillyTavern 当前模型 generateRaw
        ↓
JSON Schema structured output（优先）
        ↓  不支持时
纯 JSON raw fallback
        ↓
本地 Normalize / Validate
        ↓
AI 语义草稿 Import Draft
        ↓
固定 Skill Adapter（档位 / 蓝耗）
        ↓
Canonical Person
        ↓
payload.source[]
        ↓
开场名册 / 中途安装 / MVU / NPC 控制台
```

### AI 与代码的边界

AI 负责：
- 理解自然语言；
- 识别长期事实、特性、主动招式、物品、真正星器、钩子、秘密；
- 在没有标题时生成简短展示名称；
- 给主动招式判断语义强度 `powerTier` 和用途 `functionType`。

代码负责：
- JSON 结构清洗和枚举 / 数量 / 置信度归一；
- 变量安全名称；
- Canonical 路径；
- 档位和蓝耗数值；
- 发布 payload；
- 安装到 MVU。

AI 不直接决定最终变量路径，也不自由编写蓝耗数值。

## 世界书策略

- 支持 `entries` 为数组或对象的 SillyTavern 世界书。
- 用户填写人物名时，先用本地代码筛选包含该名字的条目及邻近条目。
- 未填写人物名时，保留聚合文本交由模型识别主角人物。
- 最多读 200 个非空 entry；聚合原文约 120k 字符上限；约 30k 字符分块整理后去重合并。
- 原始聚合文本仍写入 `source.rawText`。

## 云端协议

`person` 继续使用 XYWS Package v1：`payload.source[] + fallbackText`。publish / manage 只对 `source` 做数组级限制，不裁剪 source 元素内的结构化人物字段；read 直接返回 payload。因此 dev.31 无新增 `content_type`、无 SQL、无云函数迁移。

## 冻结

OAuth/Auth、CloudBase Session、cloud read/write/manage、compat、数据库 ownership / content_type 与既有安装器不重构。dev.31 的功能增量集中在 Workshop 人物导入 / 发布体验。
