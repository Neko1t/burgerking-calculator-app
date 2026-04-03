# 汉堡王性价比计算器 - 开源项目设计方案

## 1. 项目概述

**目标**: 开源工具，帮助用户在主流团购平台上找到最划算的汉堡王套餐搭配

**核心功能**:
1. 构建以食物为中心的套餐索引（每个食物维护其所在的套餐集合）
2. 用户自由选择菜品组合
3. 计算各食物套餐集合的交集（精确匹配）
4. 推荐高性价比的非精确匹配套餐（多送但更划算的套餐）
5. 保留套餐原始链接/地址

**开源原则**: 零服务器成本、社区驱动、用户可定制

**技术栈**: uni-app + 静态数据CDN + 多种OCR支持

---

## 2. 技术架构（零服务器成本）

```
┌─────────────────────────────────────────────────────────┐
│              用户端 (uni-app)                            │
│      微信小程序 / iOS App / Android App / H5            │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ 食物选择UI   │  │ 套餐推荐     │  │ OCR上传界面  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              数据层 (CDN静态数据)                         │
│  GitHub/Gitee → jsDelivr/UNPKG → 前端缓存                │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ foods.json   │  │ combos.json  │  │ config.json  │ │
│  │ 食物索引数据  │  │ 套餐数据     │  │ 版本/更新信息 │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              OCR服务 (第三方API)                          │
│  百度OCR / 腾讯OCR / 阿里OCR / 本地OCR（用户可选）         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              社区贡献 (GitHub)                            │
│  用户提交套餐 → Issues/PR → 审核 → 合并到主库 → 自动发布   │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 零服务器成本架构详解

### 3.1 数据存储方案

#### 3.1.1 静态数据托管

**文件结构**:
```
/data/
  ├── foods.json          # 食物数据 + 索引
  ├── combos.json         # 套餐数据
  ├── combo_foods.json    # 套餐-食物关联
  └── metadata.json       # 元数据（版本号、更新时间等）

/releases/
  ├── v1.0.0/
  │   ├── foods.json
  │   ├── combos.json
  │   └── metadata.json
  └── latest -> v1.0.0/   # 最新版本软链接
```

**CDN加速**:
- GitHub → jsDelivr: `https://cdn.jsdelivr.net/gh/your-username/burgerking-calculator@latest/data/foods.json`
- Gitee → 自建CDN或其他CDN服务

**数据加载流程**:
```
1. 前端启动 → 检查本地缓存版本
2. 检查远程最新版本 (metadata.json)
3. 如果远程版本 > 本地版本 → 下载更新
4. 更新本地缓存 → 使用最新数据
```

#### 3.1.2 数据更新策略

**社区贡献流程**:
```
1. 用户发现新套餐 → 上传截图 → OCR识别
2. 校验识别结果 → 确认无误
3. 生成套餐数据JSON → 提交到GitHub Issues
   标题: [新增套餐] 美团-安格斯牛堡套餐
   内容:
   ```json
   {
     "name": "安格斯牛堡套餐",
     "platform": "meituan",
     "price": 32.0,
     "foods": ["bk_angus_burger", "bk_fries", "bk_coke"],
     "url": "https://...",
     "confidence": 0.95
   }
   ```
4. 维护者审核 → 确认数据准确
5. 合并到主库 → 更新combos.json
6. 自动触发GitHub Actions → 发布新版本
7. 用户下次启动 → 自动获取最新数据
```

**自动化脚本**:
```python
# tools/sync_data.py
def sync_from_issues():
    """
    从GitHub Issues同步已审核的套餐数据
    定时运行或手动触发
    """
    # 1. 获取所有带有[新增套餐]标签且已关闭的Issues
    # 2. 解析JSON数据
    # 3. 验证数据格式
    # 4. 合并到combos.json
    # 5. 更新metadata.json（版本号+1）
    # 6. 提交代码
```

### 3.2 OCR服务架构

#### 3.2.1 多OCR支持框架

**用户配置界面**:
```
┌─────────────────────────────────────┐
│         OCR设置                     │
├─────────────────────────────────────┤
│  选择OCR服务:                       │
│  ○ 百度OCR (推荐，准确率高)         │
│  ○ 腾讯OCR                         │
│  ○ 阿里OCR                         │
│  ○ 本地OCR (免费但较慢)             │
├─────────────────────────────────────┤
│  API Key: [________________]        │
│  API Secret: [________________]     │
├─────────────────────────────────────┤
│          [保存设置]                 │
└─────────────────────────────────────┘
```

**OCR适配器模式**:
```typescript
// ocr/ocr-adapter.ts
interface OcrAdapter {
  name: string;
  recognize(image: File): Promise<OcrResult>;
}

class BaiduOcrAdapter implements OcrAdapter {
  name = '百度OCR';
  async recognize(image: File): Promise<OcrResult> {
    // 调用百度OCR API
  }
}

class TencentOcrAdapter implements OcrAdapter {
  name = '腾讯OCR';
  async recognize(image: File): Promise<OcrResult> {
    // 调用腾讯OCR API
  }
}

class LocalOcrAdapter implements OcrAdapter {
  name = '本地OCR';
  async recognize(image: File): Promise<OcrResult> {
    // 使用Tesseract.js本地识别
  }
}

// OCR工厂
class OcrFactory {
  static getAdapter(type: string): OcrAdapter {
    switch(type) {
      case 'baidu': return new BaiduOcrAdapter();
      case 'tencent': return new TencentOcrAdapter();
      case 'local': return new LocalOcrAdapter();
      default: return new BaiduOcrAdapter();
    }
  }
}
```

**本地OCR方案（Tesseract.js）**:
```javascript
// ocr/local-ocr.ts
import Tesseract from 'tesseract.js';

class LocalOcrAdapter implements OcrAdapter {
  name = '本地OCR';

  async recognize(image: File): Promise<OcrResult> {
    const result = await Tesseract.recognize(
      image,
      'chi_sim+eng',  // 中文简体+英文
      {
        logger: m => console.log(m)
      }
    );

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      lines: result.data.lines
    };
  }
}
```

**优点**:
- 用户可自由选择OCR服务
- 完全零成本（本地OCR免费）
- 不依赖单一服务商
- API Key保存在本地，安全

### 3.3 前端架构

#### 3.3.1 数据管理

**Store结构（Pinia）**:
```typescript
// store/data.ts
export const useDataStore = defineStore('data', {
  state: () => ({
    foods: [] as Food[],
    combos: [] as Combo[],
    comboFoods: [] as ComboFood[],
    version: '',
    lastUpdate: ''
  }),

  actions: {
    // 加载本地缓存
    async loadFromCache() {
      const cached = uni.getStorageSync('bk_data');
      if (cached) {
        this.$patch(cached);
        return true;
      }
      return false;
    },

    // 从CDN加载最新数据
    async loadFromCDN() {
      const metadata = await fetch(`${CDN_URL}/metadata.json`).then(r => r.json());
      const version = metadata.version;

      // 检查是否需要更新
      if (version <= this.version) return;

      // 并行下载所有数据文件
      const [foods, combos, comboFoods] = await Promise.all([
        fetch(`${CDN_URL}/foods.json`).then(r => r.json()),
        fetch(`${CDN_URL}/combos.json`).then(r => r.json()),
        fetch(`${CDN_URL}/combo_foods.json`).then(r => r.json())
      ]);

      // 更新数据
      this.foods = foods;
      this.combos = combos;
      this.comboFoods = comboFoods;
      this.version = version;
      this.lastUpdate = metadata.lastUpdate;

      // 保存到本地缓存
      this.saveToCache();
    },

    // 保存到本地缓存
    saveToCache() {
      uni.setStorageSync('bk_data', this.$state);
    }
  }
});
```

#### 3.3.2 套餐推荐算法（前端计算）

**交集计算**:
```typescript
// services/combo-recommender.ts
export function recommendCombos(selectedFoodIds: string[]): Recommendation[] {
  const dataStore = useDataStore();

  // 1. 获取每个食物的套餐集合
  const foodComboSets = selectedFoodIds.map(foodId => {
    const food = dataStore.foods.find(f => f.id === foodId);
    return new Set(food?.comboIds || []);
  });

  // 2. 计算交集（精确匹配）
  const exactMatches = Array.from(foodComboSets[0])
    .filter(comboId => foodComboSets.every(set => set.has(comboId)));

  // 3. 计算子集匹配（高性价比推荐）
  const partialMatches = new Set<string>();
  foodComboSets.forEach(set => {
    set.forEach(comboId => {
      if (!exactMatches.includes(comboId)) {
        partialMatches.add(comboId);
      }
    });
  });

  // 4. 计算每个套餐的性价比
  const recommendations = [
    ...exactMatches.map(comboId => ({
      combo: getComboById(comboId),
      type: 'exact' as const,
      matchedFoodIds: selectedFoodIds
    })),
    ...Array.from(partialMatches).map(comboId => ({
      combo: getComboById(comboId),
      type: 'partial' as const,
      matchedFoodIds: calculateMatchedFoods(comboId, selectedFoodIds)
    }))
  ];

  // 5. 计算性价比得分并排序
  return recommendations
    .map(rec => ({
      ...rec,
      costEfficiency: calculateCostEfficiency(rec)
    }))
    .sort((a, b) => sortRecommendations(a, b));
}

function calculateCostEfficiency(rec: Recommendation): number {
  const { combo, matchedFoodIds } = rec;
  const matchedFoods = getFoodsByIds(matchedFoodIds);
  const soloPrice = matchedFoods.reduce((sum, f) => sum + f.soloPrice, 0);

  // 精确匹配
  if (rec.type === 'exact') {
    return soloPrice / combo.price;
  }

  // 部分匹配：考虑匹配度权重
  const matchRatio = matchedFoodIds.length / getComboFoodCount(combo.id);
  return (soloPrice / combo.price) * matchRatio;
}

function sortRecommendations(a: Recommendation, b: Recommendation): number {
  // 1. 精确匹配优先
  if (a.type !== b.type) return a.type === 'exact' ? -1 : 1;

  // 2. 性价比降序
  if (a.costEfficiency !== b.costEfficiency) {
    return b.costEfficiency - a.costEfficiency;
  }

  // 3. 价格升序
  if (a.combo.price !== b.combo.price) {
    return a.combo.price - b.combo.price;
  }

  return 0;
}
```

---

## 4. 项目结构

### 4.1 仓库结构

```
burgerking-calculator/
├── uni-app/                    # uni-app前端项目
│   ├── src/
│   │   ├── pages/             # 页面
│   │   │   ├── index/         # 首页（食物选择）
│   │   │   ├── result/        # 结果页（套餐推荐）
│   │   │   ├── ocr/           # OCR上传页
│   │   │   └── settings/      # 设置页
│   │   ├── components/        # 组件
│   │   ├── services/          # 业务逻辑
│   │   │   ├── combo-recommender.ts
│   │   │   ├── data-loader.ts
│   │   │   └── ocr-service.ts
│   │   ├── store/             # Pinia状态管理
│   │   ├── utils/             # 工具函数
│   │   └── static/            # 静态资源
│   ├── package.json
│   └── manifest.json          # uni-app配置
│
├── data/                       # 数据文件（CDN托管）
│   ├── foods.json
│   ├── combos.json
│   ├── combo_foods.json
│   └── metadata.json
│
├── tools/                      # 工具脚本
│   ├── scraper/               # 爬虫脚本
│   │   ├── meituan_scraper.py
│   │   └── ocr_extractor.py
│   ├── sync_data.py           # 同步GitHub Issues数据
│   └── validate_data.py       # 数据验证
│
├── docs/                       # 文档
│   ├── CONTRIBUTING.md       # 贡献指南
│   ├── API.md                # API文档
│   └── DATA_STRUCTURE.md     # 数据结构说明
│
├── .github/                    # GitHub配置
│   └── workflows/
│       └── release.yml        # 自动发布工作流
│
├── README.md
├── LICENSE
└── project_design_proposal.md
```

### 4.2 GitHub Actions自动发布

```yaml
# .github/workflows/release.yml
name: Release Data Update

on:
  push:
    branches: [main]
    paths:
      - 'data/**'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Update version
        run: |
          # 递增版本号
          npm version patch --no-git-tag-version
          VERSION=$(node -p "require('./package.json').version")
          echo "VERSION=$VERSION" >> $GITHUB_ENV

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: v${{ env.VERSION }}
          name: Data Update v${{ env.VERSION }}
          body: |
            ## 更新内容
            - 更新套餐数据
            - 版本: ${{ env.VERSION }}
            - 更新时间: ${{ github.event.head_commit.timestamp }}
          files: |
            data/*.json
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 5. 开发路线图

### 阶段1：基础框架（1-2周）
- [ ] 搭建uni-app项目
- [ ] 实现数据加载机制（本地缓存 + CDN）
- [ ] 实现食物选择页面
- [ ] 实现套餐推荐算法（前端计算）
- [ ] 准备初始数据（手动录入少量套餐）

### 阶段2：OCR功能（1周）
- [ ] 集成百度OCR SDK
- [ ] 实现OCR上传和识别
- [ ] 实现OCR适配器框架
- [ ] 添加本地OCR（Tesseract.js）支持
- [ ] 实现OCR设置页面

### 阶段3：社区贡献系统（1周）
- [ ] 设计贡献提交流程
- [ ] 实现数据生成和导出功能
- [ ] 编写贡献指南（CONTRIBUTING.md）
- [ ] 实现数据同步脚本
- [ ] 配置GitHub Actions自动发布

### 阶段4：数据构建（1周）
- [ ] 手动爬取美团初始套餐数据
- [ ] 构建食物索引
- [ ] 录入单品价格
- [ ] 数据验证和清洗

### 阶段5：优化和发布（1周）
- [ ] UI/UX优化
- [ ] 性能优化
- [ ] 测试和修复Bug
- [ ] 微信小程序审核和发布
- [ ] GitHub仓库公开

---

## 6. 技术栈详情

### 前端（uni-app）
```json
{
  "dependencies": {
    "vue": "^3.3.0",
    "pinia": "^2.1.0",
    "@dcloudio/uni-ui": "^1.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  },
  "optionalDependencies": {
    "tesseract.js": "^4.0.0"  // 本地OCR
  }
}
```

### 工具脚本（Python）
```python
requirements.txt:
requests
beautifulsoup4
pandas
openai  # 可选：用于高级OCR解析
```

### CDN配置
```javascript
// config/cdn.js
export const CDN_CONFIG = {
  // GitHub + jsDelivr
  baseURL: 'https://cdn.jsdelivr.net/gh/your-username/burgerking-calculator@latest/data',

  // 备用：Gitee（国内访问更快）
  fallbackURL: 'https://cdn.example.com/data',

  // 版本检查间隔（毫秒）
  checkInterval: 24 * 60 * 60 * 1000,  // 24小时

  // 本地缓存有效期
  cacheExpire: 7 * 24 * 60 * 60 * 1000  // 7天
};
```

---

## 7. 成本分析

| 项目 | 成本 | 说明 |
|------|------|------|
| 服务器 | ¥0 | 完全使用CDN + GitHub |
| 数据库 | ¥0 | JSON文件存储 |
| OCR服务 | ¥0 | 用户自带API Key或使用本地OCR |
| CDN流量 | ¥0 | GitHub/jdDelivr免费额度 |
| 小程序发布 | ¥0 | 微信小程序免费发布 |
| GitHub私有仓库 | ¥0 | 开源项目 |
| **总计** | **¥0** | 完全免费 |

---

## 8. 开源计划

### 8.1 贡献方式

1. **提交套餐数据**
   - 发现新套餐 → OCR识别 → 提交GitHub Issues
   - 维护者审核 → 合并到主库

2. **代码贡献**
   - Fork仓库 → 提交PR → 代码审查 → 合并

3. **Bug反馈**
   - 提交GitHub Issues
   - 描述问题和复现步骤

### 8.2 社区建设

- GitHub仓库公开
- README文档完善
- 贡献指南（CONTRIBUTING.md）
- Star和Fork目标
- 微信小程序评论区/社区群

### 8.3 数据质量保证

- 数据验证脚本（`tools/validate_data.py`）
- 人工审核流程
- 用户反馈机制（不准确数据可举报）
- 定期数据审计

---

## 9. 成功指标

- GitHub Star > 100（上线3个月）
- 微信小程序用户 > 1000（上线6个月）
- 套餐数据量 > 200（覆盖主流套餐）
- 社区贡献者 > 10（提交套餐数据）
- 套餐准确率 > 90%（用户反馈）
- 性价比推荐准确率 > 85%
- 用户满意度 > 4.5/5.0（小程序评分）

---

## 10. 风险与挑战

| 风险项 | 影响 | 应对策略 |
|--------|------|----------|
| 套餐数据过时 | 中 | 社区持续贡献，定期更新 |
| OCR识别准确率 | 中 | 提供本地OCR选项，人工校验 |
| 小程序审核被拒 | 低 | 遵守小程序规范，准备申诉材料 |
| 社区参与度低 | 中 | 简化贡献流程，积极维护社区 |
| CDN访问慢（国内） | 中 | 提供Gitee镜像或自建CDN |
| API Key泄露 | 低 | 教育用户不要分享Key，使用本地OCR |

---

## 11. 后续扩展方向

- 支持其他快餐品牌（麦当劳、肯德基）
- 支持更多团购平台（抖音、饿了么）
- 套餐价格趋势分析
- 用户偏好学习（智能推荐）
- 套餐组合优化（多套餐组合）
- 社区分享和收藏功能
