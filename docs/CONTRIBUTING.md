# 贡献指南

感谢你愿意为汉堡王性价比计算器项目做出贡献！本指南将帮助你了解如何参与项目。

## 📝 贡献方式

### 1. 提交新套餐数据

最简单的贡献方式是提交新的套餐数据：

1. **使用App的OCR功能**识别新套餐
2. **导出套餐数据**为JSON格式
3. **提交到GitHub Issues**

#### 提交格式示例：

```json
{
  "name": "安格斯牛堡套餐",
  "platform": "meituan",
  "price": 32.0,
  "foodIds": ["bk_angus_burger", "bk_fries", "bk_coke"],
  "originalUrl": "https://meituan.com/...",
  "confidence": 0.95
}
```

#### 提交步骤：

1. 打开项目 [GitHub Issues](../../issues)
2. 点击 "New issue"
3. 选择 "Bug report" 或 "Feature request"
4. 标题格式：`[新增套餐] 美团-安格斯牛堡套餐`
5. 内容中粘贴JSON数据
6. 点击 "Submit new issue"

### 2. 代码贡献

如果你想贡献代码：

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交Pull Request

## 📋 贡献规范

### 代码规范

- 使用ESLint和Prettier进行代码格式化
- 遵循Vue 3和uni-app的最佳实践
- 添加适当的注释和文档
- 编写单元测试

### 数据规范

- 确保数据准确性和完整性
- 使用标准化的食物ID
- 提供原始链接以便验证
- 包含置信度信息（如果使用OCR识别）

## 🛠️ 开发环境设置

### 前置要求

- Node.js 16+
- Python 3.8+
- 微信开发者工具（用于小程序开发）

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/your-username/burgerking-calculator.git
cd burgerking-calculator

# 安装前端依赖
cd uni-app
npm install

# 安装工具依赖
cd tools
pip install -r requirements.txt
```

### 运行项目

```bash
# 微信小程序
npm run dev:mp-weixin

# H5
npm run dev:h5

# App
npm run dev:app
```

## 🧪 测试

### 前端测试

```bash
# 运行单元测试
npm run test

# 运行端到端测试
npm run test:e2e
```

### 数据测试

```bash
# 验证数据格式
python tools/validate_data.py

# 同步数据
python tools/sync_data.py
```

## 📚 文档

- [项目设计方案](DESIGN.md)
- [数据结构说明](DATA_STRUCTURE.md)
- [API文档](API.md)

## 🤝 联系我们

如果你有任何问题或建议，请：

1. 在 [GitHub Discussions](../../discussions) 中提问
2. 提交 [GitHub Issues](../../issues)
3. 发送邮件到：contributor@burgerking-calculator.org

感谢你的贡献！