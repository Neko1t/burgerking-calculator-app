# CLAUDE.md

汉堡王性价比计算器开发指导。

## 开发命令

```bash
pnpm install
pnpm dev:mp-weixin   # 微信小程序
pnpm dev:h5           # H5版本
pnpm dev:app          # App版本
pnpm build:mp-weixin  # 构建微信小程序
pnpm build:h5         # 构建H5
```

## 架构

```
用户端 (uni-app + Vue 3)
         ↓ CDN 动态请求
数据源: burgerking-calculator 仓库 (jsdelivr CDN)
```

## 核心文件

| 文件 | 作用 |
|------|------|
| `uni-app/src/store/data.js` | Pinia状态管理 - CDN+本地双轨数据 |
| `uni-app/src/services/combo-recommender.js` | 套餐推荐算法 |
| `uni-app/src/pages/index/index.vue` | 首页(食物选择+购物车) |
| `uni-app/src/pages/result/index.vue` | 结果页(套餐推荐+详情弹窗) |
| `uni-app/src/pages/combo/index.vue` | 套餐管理页(CDN/本地双列表) |

## 数据结构

### foods.json
```json
{ id, name, nameZh, soloPrice, category, calories }
```

### combos.json
```json
{ id, name, price, platform, originalUrl, description }
```

### combo_foods.json
```json
{ comboId, foodName, quantity }
```

### CDN 地址
```
https://cdn.jsdelivr.net/gh/Neko1t/burgerking-calculator@master/data
```

## 数据管理

Store (`useDataStore`) 实现两层数据架构：
1. **CDN层** (只读): 从 jsDelivr CDN 拉取
2. **本地层** (可CRUD): 用户自建数据

## 推荐算法

入口: `recommendCombos(selectedFoodIds)`

流程:
1. 从 `comboFoods` 表查找关联套餐
2. 区分**精确匹配**和**部分匹配**
3. 计算性价比: `soloPrice / combo.price * matchRatio`
4. 排序: 精确匹配优先 → 性价比降序 → 价格升序

## 注意事项

1. **分类字段**: foods.json 使用中文分类(主食/小食/饮料/甜品)
2. **数据关联**: 套餐与食物通过 `combo_foods.json` 关联
3. **初始化**: 页面需调用 `dataStore.init()` 加载数据
4. **Git提交**: 使用本地git配置(用户: Neko1t)

## 工具脚本

| 文件 | 作用 |
|------|------|
| `tools/build-combo.js` | 套餐数据库构建工具(LLM识别) |

### build-combo.js 使用
```bash
node tools/build-combo.js --clipboard  # 从剪贴板读取截图
node tools/build-combo.js --image path # 从文件读取截图
```
