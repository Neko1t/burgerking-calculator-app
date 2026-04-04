# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

汉堡王性价比计算器 - 一个零服务器成本的前端应用，通过CDN分发数据，前端计算推荐。

**仓库**: https://github.com/Neko1t/burgerking-calculator-app

## 开发命令

```bash
# 安装依赖
pnpm install

# 运行微信小程序
pnpm dev:mp-weixin

# 运行H5版本
pnpm dev:h5

# 运行App版本
pnpm dev:app

# 构建微信小程序
pnpm build:mp-weixin

# 构建H5版本
pnpm build:h5

# 构建App版本
pnpm build:app

# 算法测试
node test_algorithm.js
```

## 架构

```
┌─────────────────────────────────────────┐
│           用户端 (uni-app + Vue 3)        │
│     微信小程序 / iOS App / Android App / H5  │
└─────────────────────────────────────────┘
                        ↓ CDN 动态请求
┌─────────────────────────────────────────┐
│     数据源: burgerking-calculator 仓库     │
│     CDN: jsdelivr.net/gh/Neko1t/...     │
│     data/foods.json, combos.json,        │
│     combo_foods.json, metadata.json      │
└─────────────────────────────────────────┘
```

## 数据结构

### foods.json
```json
{ id, name, soloPrice, category, calories }
```
- **category**: 主食、小食、饮料、甜品

### combos.json
```json
{ id, name, price, platform, originalUrl, description }
```
- **platform**: meituan, eleme, custom

### combo_foods.json (关联表)
```json
{ comboId, foodId, quantity }
```
- 通过 `comboId` + `foodId` 关联套餐与食物

### CDN 地址
```
https://cdn.jsdelivr.net/gh/Neko1t/burgerking-calculator@master/data
```

## 核心文件

| 文件 | 作用 |
|------|------|
| `uni-app/src/store/data.js` | Pinia状态管理 - CDN+本地双轨数据 |
| `uni-app/src/services/combo-recommender.js` | 套餐推荐算法 |
| `uni-app/src/pages/index/index.vue` | 首页(食物选择+购物车) |
| `uni-app/src/pages/result/index.vue` | 结果页(套餐推荐+详情弹窗) |
| `uni-app/src/pages/combo/index.vue` | 套餐管理页(CDN/本地双列表) |

## 双轨数据管理

Store (`useDataStore`) 实现了两层数据架构：

1. **CDN层** (只读): 从 jsDelivr CDN 拉取，存储在 `cdnFoods/cdnCombos/cdnComboFoods`
2. **本地层** (可CRUD): 用户自建数据，存储在 `localFoods/localCombos/localComboFoods`
3. **软删除**: CDN项目删除后存入 `deletedItems`，不影响源数据

### 关键API
```javascript
// 获取合并后数据
dataStore.allFoods      // 合并后的食物列表
dataStore.allCombos      // 合并后的套餐列表
dataStore.allComboFoods  // 合并后的关联表

// 本地增删改
dataStore.addFood(food)
dataStore.deleteFood(foodId)  // CDN食物会软删除
dataStore.addCombo(combo, foodIds)
dataStore.deleteCombo(comboId) // CDN套餐会软删除

// 查询
dataStore.getComboFoods(comboId)      // 获取套餐的所有食物
dataStore.getCombosByFoodId(foodId)   // 获取食物所在的套餐
```

## 推荐算法

入口: `recommendCombos(selectedFoodIds)`

流程:
1. 从 `comboFoods` 表查找每个选中食物的关联套餐
2. 区分**精确匹配**(完全覆盖需求)和**部分匹配**
3. 计算性价比: `soloPrice / combo.price * matchRatio`
4. 排序: 精确匹配优先 → 性价比降序 → 价格升序

**重要**: 算法通过 `comboFoods` 表查询关联，**不是** `food.comboIds` 字段

## CSS变量系统

页面使用统一的设计变量:

```scss
--color-primary: #e09550        // 主色(柔和暖橙)
--color-primary-light: #f0b27a
--color-success: #38b000          // 绿色(节省金额)
--color-text: #1a1a1a            // 主文字
--color-text-secondary: #6c757d  // 次要文字
--color-text-tertiary: #adb5bd   // 三级文字
--color-bg: #fefae0              // 米黄背景
--font-size: xs/sm/md/lg/xl/xxl  // 统一字号层级
```

## 页面说明

### 首页 (index)
- 分类标签切换: 主食/小食/饮料/甜品
- 食物卡片列表，支持增减数量
- 底部浮窗显示已选数量和总价
- 购物车弹窗

### 结果页 (result)
- 三段推荐: 精确匹配/高性价比/部分匹配
- 套餐卡片显示菜品摘要
- "去看看"打开详情弹窗
- "去购买"跳转或显示详情

### 套餐管理页 (combo)
- 平台筛选: 全部/美团/饿了么/自定义
- CDN/本地双列表展示
- 同步CDN数据功能
- 添加/编辑套餐弹窗

## 注意事项

1. **分类字段**: foods.json 使用中文分类(主食/小食/饮料/甜品)，代码需匹配
2. **数据关联**: 套餐与食物通过 `combo_foods.json` 关联，不是 `food.comboIds`
3. **初始化**: 页面需调用 `dataStore.init()` 加载数据
4. **Git提交**: 使用本地git配置(用户: Neko1t)，不要用Claude作为提交者
