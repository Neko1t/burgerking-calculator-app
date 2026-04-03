# 数据结构说明

本文件描述汉堡王性价比计算器项目的数据模型和结构。

## 📊 核心数据模型

### 食物表 (foods.json)

每个食物的基本信息和其所在的套餐集合。

```json
{
  "foods": [
    {
      "id": "bk_whopper",
      "name": "皇堡",
      "aliases": ["安格斯牛堡", "经典汉堡"],
      "category": "burger",
      "soloPrice": 15.0,
      "comboIds": ["combo_001", "combo_003", "combo_005"],
      "updateTime": "2026-04-01T12:00:00Z"
    }
  ],
  "metadata": {
    "version": "1.0.0",
    "lastUpdate": "2026-04-01T00:00:00Z",
    "totalCount": 1
  }
}
```

**字段说明**:
- `id`: 食物唯一标识符（英文小写，下划线分隔）
- `name`: 食物名称（中文）
- `aliases`: 别名列表（同义词）
- `category`: 分类（burger/side/drink/dessert）
- `soloPrice`: 单品参考价格（可选）
- `comboIds`: 该食物所在的所有套餐ID列表
- `updateTime`: 最后更新时间

### 套餐表 (combos.json)

每个套餐的基本信息和价格。

```json
{
  "combos": [
    {
      "id": "combo_001",
      "name": "皇堡超值套餐",
      "platform": "meituan",
      "price": 28.0,
      "foodIds": ["bk_whopper", "bk_fries", "bk_coke"],
      "originalUrl": "https://meituan.com/...",
      "confidence": 0.95,
      "updateTime": "2026-04-01T12:00:00Z"
    }
  ],
  "metadata": {
    "version": "1.0.0",
    "lastUpdate": "2026-04-01T00:00:00Z",
    "totalCount": 1
  }
}
```

**字段说明**:
- `id`: 套餐唯一标识符
- `name`: 套餐名称
- `platform`: 平台（meituan/eleme/douyin）
- `price`: 套餐价格
- `foodIds`: 套餐包含的食物ID列表
- `originalUrl`: 原始链接（可选）
- `confidence`: 数据置信度（0-1，OCR识别时使用）
- `updateTime`: 最后更新时间

### 套餐-食物关联表 (combo_foods.json)

套餐和食物的详细关联信息。

```json
{
  "comboFoods": [
    {
      "comboId": "combo_001",
      "foodId": "bk_whopper",
      "quantity": 1,
      "confidence": 0.98,
      "updateTime": "2026-04-01T12:00:00Z"
    }
  ],
  "metadata": {
    "version": "1.0.0",
    "lastUpdate": "2026-04-01T00:00:00Z",
    "totalCount": 1
  }
}
```

**字段说明**:
- `comboId`: 套餐ID
- `foodId`: 食物ID
- `quantity`: 数量
- `confidence`: 识别置信度（0-1）
- `updateTime`: 最后更新时间

### 元数据表 (metadata.json)

所有数据文件的版本和更新信息。

```json
{
  "version": "1.0.0",
  "lastUpdate": "2026-04-01T00:00:00Z",
  "dataSources": {
    "foods": {
      "count": 1,
      "lastUpdate": "2026-04-01T12:00:00Z"
    },
    "combos": {
      "count": 1,
      "lastUpdate": "2026-04-01T12:00:00Z"
    },
    "comboFoods": {
      "count": 1,
      "lastUpdate": "2026-04-01T12:00:00Z"
    }
  },
  "nextUpdateCheck": "2026-04-02T00:00:00Z"
}
```

## 🔄 数据更新流程

### 1. 用户提交套餐数据

用户通过App的OCR功能识别新套餐，生成JSON数据。

### 2. 提交到GitHub Issues

用户将JSON数据提交到GitHub Issues。

### 3. 审核和合并

维护者审核数据，确认准确后合并到主库。

### 4. 自动发布

GitHub Actions自动发布新版本，更新所有数据文件。

### 5. 用户获取更新

用户下次启动App时，自动从CDN获取最新数据。

## 📝 数据验证规则

### 食物ID规范

- 使用英文小写字母和下划线
- 格式：`品牌_食物名称_特征`
- 示例：`bk_whopper`, `bk_fries_medium`

### 套餐ID规范

- 格式：`platform_序号`
- 示例：`meituan_001`, `eleme_002`

### 数据验证脚本

```python
# tools/validate_data.py
def validate_food_data(foods):
    """验证食物数据格式"""
    for food in foods:
        assert 'id' in food, "缺少id字段"
        assert 'name' in food, "缺少name字段"
        assert 'category' in food, "缺少category字段"
        # 其他验证...

def validate_combo_data(combos):
    """验证套餐数据格式"""
    for combo in combos:
        assert 'id' in combo, "缺少id字段"
        assert 'name' in combo, "缺少name字段"
        assert 'platform' in combo, "缺少platform字段"
        # 其他验证...
```

## 📊 数据统计

| 数据类型 | 当前数量 | 最后更新 | 状态 |
|----------|----------|----------|------|
| 食物 | 0 | 2026-04-01 | 待填充 |
| 套餐 | 0 | 2026-04-01 | 待填充 |
| 关联 | 0 | 2026-04-01 | 待填充 |

## 🔧 开发工具

### 数据同步脚本

```python
# tools/sync_data.py
def sync_from_issues():
    """从GitHub Issues同步已审核的套餐数据"""
    # 1. 获取所有带有[新增套餐]标签且已关闭的Issues
    # 2. 解析JSON数据
    # 3. 验证数据格式
    # 4. 合并到combos.json
    # 5. 更新metadata.json
```

### 数据验证脚本

```python
# tools/validate_data.py
def validate_all_data():
    """验证所有数据文件的格式和完整性"""
    # 验证foods.json
    # 验证combos.json
    # 验证combo_foods.json
    # 检查数据一致性
```

## 📈 数据增长计划

| 阶段 | 目标数量 | 时间 | 负责人 |
|------|----------|------|--------|
| 初始 | 50 | 2026-04-15 | 社区 |
| 中期 | 200 | 2026-05-15 | 社区 |
| 长期 | 500+ | 持续 | 社区 |

## 📝 贡献者指南

### 如何添加新食物

1. 确定食物ID（遵循命名规范）
2. 添加到foods.json
3. 更新相关套餐的foodIds
4. 运行验证脚本

### 如何添加新套餐

1. 确定套餐ID（遵循命名规范）
2. 添加到combos.json
3. 添加套餐-食物关联到combo_foods.json
4. 更新相关食物的comboIds
5. 运行验证脚本

## 📚 相关文档

- [项目设计方案](DESIGN.md)
- [贡献指南](CONTRIBUTING.md)
- [API文档](API.md)