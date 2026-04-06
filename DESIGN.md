# 汉堡王性价比计算器 - 设计方案

**版本**: v2.0
**最后更新**: 2026-04-06

## 项目概述

**目标**: 开源工具，帮助用户在主流团购平台上找到最划算的汉堡王套餐搭配

**核心功能**:
1. 构建以食物为中心的套餐索引
2. 用户自由选择菜品组合
3. 计算各食物套餐集合的交集（精确匹配）
4. 推荐高性价比的非精确匹配套餐

**开源原则**: 零服务器成本、社区驱动、用户可定制

## 技术架构

```
┌─────────────────────────────────────────┐
│           用户端 (uni-app + Vue 3)        │
│     微信小程序 / iOS App / Android App / H5  │
└─────────────────────────────────────────┘
                        ↓ CDN 动态请求
┌─────────────────────────────────────────┐
│     数据源: burgerking-calculator 仓库     │
│     CDN: jsdelivr.net/gh/Neko1t/...     │
└─────────────────────────────────────────┘
```

## 零成本方案

| 项目 | 成本 | 说明 |
|------|------|------|
| 服务器 | ¥0 | CDN + GitHub |
| 数据库 | ¥0 | JSON文件存储 |
| CDN流量 | ¥0 | jsDelivr免费额度 |
| 小程序发布 | ¥0 | 微信小程序免费发布 |

## 数据结构

### foods.json - 食物表
```json
{
  "foods": [
    {
      "name": "whopper",
      "nameZh": "皇堡",
      "soloPrice": 28.5,
      "category": "主食",
      "calories": 530
    }
  ]
}
```

**字段说明**:
- `name`: 食物ID（英文小写）
- `nameZh`: 中文名称
- `soloPrice`: 单品参考价格
- `category`: 分类（主食/小食/饮料/甜品）
- `calories`: 卡路里

### combos.json - 套餐表
```json
{
  "combos": [
    {
      "id": "combo_001",
      "name": "皇堡套餐",
      "platform": "meituan",
      "price": 39.9,
      "description": "皇堡+中薯条+中可乐"
    }
  ]
}
```

**字段说明**:
- `id`: 套餐唯一标识符
- `name`: 套餐名称
- `platform`: 平台（meituan/eleme/custom）
- `price`: 套餐价格
- `description`: 套餐简述

### combo_foods.json - 套餐食物关联表
```json
{
  "comboFoods": [
    { "comboId": "combo_001", "foodName": "whopper", "quantity": 1 }
  ]
}
```

**字段说明**:
- `comboId`: 套餐ID
- `foodName`: 食物ID（对应foods.name）
- `quantity`: 数量

### CDN 地址
```
https://cdn.jsdelivr.net/gh/Neko1t/burgerking-calculator@master/data
```

## 核心算法

**入口**: `recommendCombos(selectedFoodIds)`

**流程**:
1. 从 `comboFoods` 表查找每个选中食物的关联套餐
2. 区分**精确匹配**（完全覆盖需求）和**部分匹配**
3. 计算性价比: `soloPrice / combo.price * matchRatio`
4. 排序: 精确匹配优先 → 性价比降序 → 价格升序

## 套餐构建工具

`tools/build-combo.js` - 使用LLM直接从套餐截图识别并生成标准JSON

**使用方式**:
```bash
node tools/build-combo.js --clipboard   # 从剪贴板读取截图
node tools/build-combo.js --image path   # 从文件读取截图
```

**特点**:
- 纯LLM图像识别，无需OCR
- 自动加载食物映射表
- 输出标准JSON格式
- 自动合并到现有数据

## 数据更新流程

1. **截图**: 用户截图套餐页面
2. **识别**: 运行 `build-combo.js` 使用LLM识别
3. **审核**: 提交到GitHub Issues人工审核
4. **合并**: 维护者审核后合并到主库
5. **发布**: GitHub Actions自动发布新版本

## 开发路线图

### 阶段1：基础框架 ✅
- [x] 搭建uni-app项目
- [x] 实现数据加载机制（本地缓存 + CDN）
- [x] 实现食物选择页面
- [x] 实现套餐推荐算法
- [x] 准备初始数据

### 阶段2：套餐构建工具 ✅
- [x] 集成LLM图像识别
- [x] 实现JSON导出
- [x] 构建套餐关联表

### 阶段3：优化和发布
- [ ] UI/UX优化
- [ ] 性能优化
- [ ] 测试和修复Bug
- [ ] 微信小程序审核和发布

## 项目结构

```
burgerking-calculator/
├── uni-app/                    # uni-app前端项目
│   ├── src/
│   │   ├── pages/             # 页面
│   │   ├── components/        # 组件
│   │   ├── services/          # 业务逻辑
│   │   ├── store/             # Pinia状态管理
│   │   └── static/data/       # 本地数据
│   └── static/data/            # 静态数据（CDN托管）
│
├── tools/                     # 工具脚本
│   └── build-combo.js         # 套餐构建工具
│
├── docs/                       # 文档
│   └── CONTRIBUTING.md       # 贡献指南
│
├── CLAUDE.md                   # Claude Code指导
├── DESIGN.md                   # 本文档
└── README.md
```

## 技术栈

- **前端**: uni-app + Vue 3 + Composition API
- **状态管理**: Pinia
- **数据**: JSON文件存储 + GitHub Releases版本管理 + jsDelivr CDN
- **LLM**: MiniMax API（套餐构建）
