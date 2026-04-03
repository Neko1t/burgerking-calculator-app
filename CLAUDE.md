# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📋 开发命令

### 项目初始化
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
```

### 数据管理
```bash
# 检查数据更新
node tools/check_updates.js

# 同步GitHub数据
node tools/sync_data.js

# 验证数据格式
node tools/validate_data.py
```

### 测试
```bash
# 运行算法测试
node test_algorithm.js

# 运行单元测试
pnpm test

# 运行端到端测试
pnpm test:e2e
```

### 开发工具
```bash
# 启动HBuilderX
"E:\HBuilder\HBuilderX\HBuilderX.exe"

# 使用HBuilderX运行小程序
# 在HBuilderX中导入项目后，右键点击项目 → 运行 → 运行到小程序模拟器
```

## 🏗️ 项目架构

### 整体架构
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

### 核心组件

#### 1. 数据层
- **foods.json**: 食物数据 + 索引
- **combos.json**: 套餐数据
- **combo_foods.json**: 套餐-食物关联
- **metadata.json**: 版本和更新信息
- **CDN**: jsDelivr/UNPKG

#### 2. 业务逻辑层
- **combo-recommender.js**: 套餐推荐算法
- **data-store.js**: Pinia状态管理
- **ocr-service.js**: OCR识别服务

#### 3. 用户界面层
- **pages/index/index.vue**: 首页（食物选择）
- **pages/result/index.vue**: 结果页（套餐推荐）
- **pages/ocr/index.vue**: OCR上传页
- **pages/settings/index.vue**: 设置页

### 关键算法

#### 套餐推荐算法
```javascript
// 输入: 用户选择的菜品ID列表
// 输出: 按性价比排序的推荐列表

1. 获取每个食物的套餐集合
2. 计算交集（精确匹配）
3. 计算子集匹配（高性价比推荐）
4. 计算性价比得分
5. 排序并返回结果

// 性价比计算公式
精确匹配: 得分 = 单品总价 / 套餐价格
部分匹配: 得分 = (匹配单品总价 / 套餐价格) × 匹配度权重
```

#### 数据更新流程
```
用户提交套餐 → OCR识别 → 生成JSON → GitHub Issues → 审核 → 合并 → 自动发布 → 用户获取更新
```

### 开发流程

#### 1. 数据填充
```bash
# 手动录入初始套餐数据
# 使用tools/scraper/爬虫脚本抓取美团数据
# 验证数据格式: python tools/validate_data.py
```

#### 2. 功能开发
```bash
# 开发新功能
# 添加测试用例
# 运行测试: node test_algorithm.js
# 提交代码
```

#### 3. 部署更新
```bash
# 提交数据更新到GitHub
# 触发自动发布工作流
# 用户自动获取最新数据
```

### 技术栈

#### 前端
- **框架**: uni-app (Vue 3)
- **状态管理**: Pinia
- **UI组件**: uni-ui
- **构建工具**: Vite
- **类型检查**: TypeScript

#### 后端/工具
- **数据存储**: JSON文件 + SQLite
- **爬虫**: Python + BeautifulSoup
- **OCR**: 百度OCR / 腾讯OCR / Tesseract.js
- **自动化**: GitHub Actions

### 项目结构
```
burgerking-calculator/
├── uni-app/              # uni-app前端项目
│   ├── src/
│   │   ├── pages/       # 页面组件
│   │   ├── components/  # 可复用组件
│   │   ├── services/    # 业务逻辑
│   │   ├── store/       # 状态管理
│   │   └── utils/       # 工具函数
│   └── package.json     # 依赖配置
│
├── data/                # 数据文件（CDN托管）
│   ├── foods.json
│   ├── combos.json
│   ├── combo_foods.json
│   └── metadata.json
│
├── tools/               # 工具脚本
│   ├── scraper/         # 爬虫脚本
│   ├── sync_data.py     # 数据同步
│   └── validate_data.py # 数据验证
│
├── docs/                # 文档
│   ├── CONTRIBUTING.md
│   ├── DATA_STRUCTURE.md
│   └── API.md
│
├── .github/             # GitHub配置
│   └── workflows/
│       └── release.yml  # 自动发布
│
├── test/                # 测试文件
│   └── test_algorithm.js # 算法测试
│
└── CLAUDE.md            # 本文档
```

### 关键文件说明

#### 1. 核心算法文件
- `uni-app/src/services/combo-recommender.js`: 套餐推荐算法
- `test/test_algorithm.js`: 算法测试脚本

#### 2. 数据结构文件
- `data/foods.json`: 食物数据模型
- `data/combos.json`: 套餐数据模型
- `docs/DATA_STRUCTURE.md`: 数据结构详细说明

#### 3. 自动化文件
- `.github/workflows/release.yml`: GitHub Actions自动发布
- `tools/sync_data.py`: 数据同步脚本

### 开发注意事项

1. **数据一致性**: 修改数据时需要同时更新foods.json和combos.json
2. **算法验证**: 修改推荐算法后必须运行测试
3. **版本管理**: 数据更新需要更新metadata.json
4. **OCR集成**: 新增OCR服务需要添加适配器
5. **性能优化**: 复杂计算考虑缓存机制

### 贡献指南

1. **数据贡献**: 提交套餐数据到GitHub Issues
2. **代码贡献**: Fork仓库 → 创建PR → 代码审查
3. **测试**: 添加测试用例覆盖新功能
4. **文档**: 更新相关文档

### 故障排除

#### 常见问题
1. **依赖安装失败**: 使用pnpm替代npm
2. **uni-app运行失败**: 使用HBuilderX图形界面
3. **数据加载失败**: 检查CDN链接和网络连接
4. **算法错误**: 运行测试脚本验证

#### 调试技巧
1. 使用HBuilderX的调试工具
2. 添加日志输出到关键算法步骤
3. 使用浏览器开发者工具调试H5版本
4. 检查数据格式和完整性

### 项目状态

- **开发阶段**: MVP开发中
- **测试覆盖**: 算法测试已实现
- **部署状态**: GitHub Actions自动发布
- **社区参与**: 开源贡献模式

---

**重要提示**: 本项目采用零服务器成本架构，所有数据通过CDN分发，所有计算在前端执行。开发时请注意性能优化和数据处理效率。