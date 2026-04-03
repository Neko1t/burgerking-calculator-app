# 套餐数据双轨管理方案

## 设计目标

1. **在线数据（CDN）**：维护一份权威的、公共的套餐数据，用户只读
2. **本地数据（Local）**：用户可在本地增删改查，个性化管理
3. **数据同步**：支持从CDN拉取更新，同时保留本地修改

## 数据结构设计

### 1. CDN 基础数据（只读）

```json
// data/foods.json - 食物基础数据
{
  "version": "1.0.0",
  "lastUpdate": "2026-04-01T00:00:00Z",
  "foods": [
    {
      "id": "bk_whopper",
      "name": "皇堡",
      "category": "burger",
      "soloPrice": 15.0,
      "comboIds": ["combo_001", "combo_002"],
      "source": "cdn"  // 数据来源标记
    }
  ]
}

// data/combos.json - 套餐基础数据
{
  "version": "1.0.0",
  "lastUpdate": "2026-04-01T00:00:00Z",
  "combos": [
    {
      "id": "combo_001",
      "name": "皇堡超值套餐",
      "platform": "meituan",
      "price": 28.0,
      "foodIds": ["bk_whopper", "bk_fries", "bk_coke"],
      "source": "cdn"
    }
  ]
}

// data/combo_foods.json - 套餐食物关联
{
  "comboFoods": [
    { "comboId": "combo_001", "foodId": "bk_whopper", "quantity": 1 },
    { "comboId": "combo_001", "foodId": "bk_fries", "quantity": 1 },
    { "comboId": "combo_001", "foodId": "bk_coke", "quantity": 1 }
  ]
}
```

### 2. 本地用户数据（可读写）

```json
// local_user_data.json - 存储在用户本地的个性化数据
{
  "localFoods": [
    {
      "id": "user_food_001",
      "name": "自定义鸡肉卷",
      "category": "burger",
      "soloPrice": 18.0,
      "comboIds": [],
      "source": "local",
      "createdAt": "2026-04-03T10:00:00Z",
      "updatedAt": "2026-04-03T10:00:00Z"
    }
  ],
  "localCombos": [
    {
      "id": "user_combo_001",
      "name": "我的专属套餐",
      "platform": "custom",
      "price": 35.0,
      "foodIds": ["user_food_001", "bk_fries"],
      "source": "local",
      "createdAt": "2026-04-03T10:00:00Z",
      "updatedAt": "2026-04-03T10:00:00Z"
    }
  ],
  "localComboFoods": [
    { "comboId": "user_combo_001", "foodId": "user_food_001", "quantity": 1 },
    { "comboId": "user_combo_001", "foodId": "bk_fries", "quantity": 1 }
  ],
  "deletedItems": [
    // 记录用户删除的CDN数据ID，用于同步时忽略
    {
      "type": "food",
      "id": "bk_coffee",
      "deletedAt": "2026-04-03T10:00:00Z"
    }
  ]
}
```

## 核心实现方案

### 1. DataStore 架构

```javascript
// store/data.js

export const useDataStore = defineStore('data', {
  state: () => ({
    // CDN基础数据
    cdnFoods: [],
    cdnCombos: [],
    cdnComboFoods: [],

    // 本地用户数据
    localFoods: [],
    localCombos: [],
    localComboFoods: [],

    // 用户删除记录
    deletedItems: [],

    // 版本信息
    cdnVersion: '1.0.0',
    localVersion: '1.0.0',
    lastSyncTime: null,

    // 加载状态
    isLoading: false,
    isSyncing: false
  }),

  getters: {
    // 合并后的食物列表（CDN + 本地）
    allFoods: (state) => {
      const cdnFiltered = state.cdnFoods.filter(
        f => !state.deletedItems.some(d => d.type === 'food' && d.id === f.id)
      )
      return [...cdnFiltered, ...state.localFoods]
    },

    // 合并后的套餐列表
    allCombos: (state) => {
      const cdnFiltered = state.cdnCombos.filter(
        c => !state.deletedItems.some(d => d.type === 'combo' && d.id === c.id)
      )
      return [...cdnFiltered, ...state.localCombos]
    },

    // 合并后的套餐食物关联
    allComboFoods: (state) => {
      const cdnFiltered = state.cdnComboFoods.filter(
        cf => !state.deletedItems.some(d =>
          (d.type === 'combo' && d.id === cf.comboId) ||
          (d.type === 'food' && d.id === cf.foodId)
        )
      )
      return [...cdnFiltered, ...state.localComboFoods]
    }
  },

  actions: {
    // 初始化：从本地存储加载数据
    async init() {
      this.isLoading = true
      try {
        // 1. 尝试从本地存储加载
        await this.loadFromLocal()

        // 2. 检查CDN更新
        const hasUpdate = await this.checkCDNUpdate()
        if (hasUpdate) {
          await this.syncFromCDN()
        }
      } finally {
        this.isLoading = false
      }
    },

    // 从本地存储加载
    async loadFromLocal() {
      const localData = uni.getStorageSync('local_user_data')
      if (localData) {
        this.localFoods = localData.localFoods || []
        this.localCombos = localData.localCombos || []
        this.localComboFoods = localData.localComboFoods || []
        this.deletedItems = localData.deletedItems || []
        this.localVersion = localData.version || '1.0.0'
      }
    },

    // 保存到本地存储
    async saveToLocal() {
      const localData = {
        version: this.localVersion,
        localFoods: this.localFoods,
        localCombos: this.localCombos,
        localComboFoods: this.localComboFoods,
        deletedItems: this.deletedItems,
        lastUpdate: new Date().toISOString()
      }
      uni.setStorageSync('local_user_data', localData)
    },

    // 从CDN同步数据
    async syncFromCDN() {
      this.isSyncing = true
      try {
        const metadata = await this.fetchData('metadata.json')

        // 下载CDN数据
        const [foodsData, combosData, comboFoodsData] = await Promise.all([
          this.fetchData('foods.json'),
          this.fetchData('combos.json'),
          this.fetchData('combo_foods.json')
        ])

        this.cdnFoods = foodsData.foods || []
        this.cdnCombos = combosData.combos || []
        this.cdnComboFoods = comboFoodsData.comboFoods || []
        this.cdnVersion = metadata.version

        this.lastSyncTime = new Date().toISOString()
      } finally {
        this.isSyncing = false
      }
    },

    // ==================== 本地增删改操作 ====================

    // 添加食物
    addFood(food) {
      const newFood = {
        ...food,
        id: `local_${Date.now()}`,
        source: 'local',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      this.localFoods.push(newFood)
      this.saveToLocal()
      return newFood
    },

    // 更新食物
    updateFood(foodId, updates) {
      const index = this.localFoods.findIndex(f => f.id === foodId)
      if (index !== -1) {
        this.localFoods[index] = {
          ...this.localFoods[index],
          ...updates,
          updatedAt: new Date().toISOString()
        }
        this.saveToLocal()
      }
    },

    // 删除食物
    deleteFood(foodId) {
      // 如果是CDN数据，记录到deletedItems
      const isCDNFood = this.cdnFoods.some(f => f.id === foodId)
      if (isCDNFood) {
        this.deletedItems.push({
          type: 'food',
          id: foodId,
          deletedAt: new Date().toISOString()
        })
      } else {
        // 本地数据直接删除
        this.localFoods = this.localFoods.filter(f => f.id !== foodId)
        this.localComboFoods = this.localComboFoods.filter(cf => cf.foodId !== foodId)
      }
      this.saveToLocal()
    },

    // 恢复CDN食物（从删除列表移除）
    restoreFood(foodId) {
      this.deletedItems = this.deletedItems.filter(
        d => !(d.type === 'food' && d.id === foodId)
      )
      this.saveToLocal()
    },

    // 添加套餐
    addCombo(combo, foodIds) {
      const newCombo = {
        ...combo,
        id: `local_combo_${Date.now()}`,
        source: 'local',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      this.localCombos.push(newCombo)

      // 添加套餐食物关联
      const comboFoods = foodIds.map(foodId => ({
        comboId: newCombo.id,
        foodId,
        quantity: 1
      }))
      this.localComboFoods.push(...comboFoods)

      this.saveToLocal()
      return newCombo
    },

    // 更新套餐
    updateCombo(comboId, updates, newFoodIds) {
      const index = this.localCombos.findIndex(c => c.id === comboId)
      if (index !== -1) {
        this.localCombos[index] = {
          ...this.localCombos[index],
          ...updates,
          updatedAt: new Date().toISOString()
        }

        // 更新套餐食物关联
        if (newFoodIds) {
          this.localComboFoods = this.localComboFoods.filter(cf => cf.comboId !== comboId)
          const comboFoods = newFoodIds.map(foodId => ({
            comboId,
            foodId,
            quantity: 1
          }))
          this.localComboFoods.push(...comboFoods)
        }

        this.saveToLocal()
      }
    },

    // 删除套餐
    deleteCombo(comboId) {
      const isCDNCombo = this.cdnCombos.some(c => c.id === comboId)
      if (isCDNCombo) {
        this.deletedItems.push({
          type: 'combo',
          id: comboId,
          deletedAt: new Date().toISOString()
        })
      } else {
        this.localCombos = this.localCombos.filter(c => c.id !== comboId)
        this.localComboFoods = this.localComboFoods.filter(cf => cf.comboId !== comboId)
      }
      this.saveToLocal()
    },

    // 恢复CDN套餐
    restoreCombo(comboId) {
      this.deletedItems = this.deletedItems.filter(
        d => !(d.type === 'combo' && d.id === comboId)
      )
      this.saveToLocal()
    },

    // 获取单个套餐的所有食物
    getComboFoods(comboId) {
      const allFoods = this.allFoods
      const comboFoodIds = this.allComboFoods
        .filter(cf => cf.comboId === comboId)
        .map(cf => cf.foodId)
      return allFoods.filter(f => comboFoodIds.includes(f.id))
    }
  }
})
```

## 用户操作流程

### 场景1：首次使用
```
1. 打开APP
2. 检测到本地无数据
3. 自动从CDN拉取基础数据
4. 数据加载完成，展示给用户
```

### 场景2：正常使用
```
1. 打开APP
2. 检查CDN是否有更新
3. 如有更新，提示用户是否同步
4. 用户选择本地数据，开始使用
```

### 场景3：用户添加自定义套餐
```
1. 用户在OCR页面拍照/手动输入
2. 系统识别或用户填写套餐信息
3. 保存到本地localCombos
4. 立即可在推荐算法中生效
```

### 场景4：用户删除不想要的CDN套餐
```
1. 用户长按/滑动删除套餐
2. 系统将套餐ID记录到deletedItems
3. 该套餐在推荐算法中被排除
4. 用户可在"已删除"列表中恢复
```

### 场景5：从CDN更新数据
```
1. 用户点击"检查更新"
2. 系统拉取CDN最新版本
3. 与本地数据进行合并
   - 新增的CDN数据：加入
   - 用户删除的CDN数据：保留在deletedItems
   - 用户本地的修改/新增：保留
4. 更新完成，提示用户
```

## 文件结构

```
uni-app/src/
├── store/
│   └── data.js          # 核心数据管理
├── pages/
│   ├── index/           # 首页（使用合并后数据）
│   ├── result/          # 结果页
│   ├── ocr/            # OCR页（可添加本地数据）
│   └── settings/       # 设置页（同步管理、删除恢复）
├── components/
│   └── ...
│
data/                    # CDN静态数据（GitHub托管）
├── foods.json
├── combos.json
├── combo_foods.json
├── metadata.json
│
local/                   # 本地运行时数据（无需提交）
└── (由uni.setStorage管理)
```

## API 设计

### DataStore 关键方法

| 方法 | 说明 | 参数 | 返回 |
|------|------|------|------|
| `init()` | 初始化，加载数据 | - | Promise |
| `syncFromCDN()` | 从CDN同步 | - | Promise |
| `addFood(food)` | 添加食物 | food对象 | 新增的食物 |
| `updateFood(id, updates)` | 更新食物 | id, updates | - |
| `deleteFood(id)` | 删除食物 | id | - |
| `restoreFood(id)` | 恢复已删除食物 | id | - |
| `addCombo(combo, foodIds)` | 添加套餐 | combo, foodIds | 新增的套餐 |
| `updateCombo(id, updates, foodIds)` | 更新套餐 | id, updates, foodIds | - |
| `deleteCombo(id)` | 删除套餐 | id | - |
| `restoreCombo(id)` | 恢复已删除套餐 | id | - |
| `getDeletedItems()` | 获取已删除列表 | - | deletedItems[] |
| `clearDeletedItems()` | 清空删除记录 | - | - |

## 冲突处理策略

### 1. CDN数据更新 vs 本地删除
- 用户删除的CDN数据，即使CDN更新也不自动恢复
- 需要用户手动在"已删除"列表中恢复

### 2. CDN数据更新 vs 本地修改
- 本地修改的CDN数据：保留本地修改，覆盖CDN更新
- 策略：本地优先

### 3. 本地新增数据
- 与CDN更新互不影响
- 保留在localFoods/localCombos中

## 存储策略

### CDN数据（只读）
```javascript
// 缓存策略：CDN优先，本地缓存作为fallback
uni.getStorageSync('cdn_data_cache')
```

### 本地用户数据
```javascript
// 存储位置：uni.getStorageSync('local_user_data')
// 自动保存：每次增删改后自动保存
// 手动导出：用户可导出为JSON文件备份
```

## 性能考虑

1. **懒加载**：首次只加载必要数据，按需加载完整数据
2. **增量同步**：CDN返回lastUpdate时间戳，只同步变化部分
3. **内存缓存**：频繁访问的数据保持在内存中
4. **离线优先**：本地数据立即可用，CDN同步在后台进行

## 安全考虑

1. **数据隔离**：本地数据与CDN数据严格分离
2. **防误删**：删除前二次确认
3. **备份机制**：支持导出本地数据为JSON
4. **版本控制**：每次修改更新localVersion，支持回滚
