# 汉堡王性价比计算器

<div align="center">

![License](https://img.shields.io/github/license/Neko1t/burgerking-calculator-app)
![Stars](https://img.shields.io/github/stars/Neko1t/burgerking-calculator-app)
![Platform](https://img.shields.io/badge/platform-WeChat%20Mini%20Program%20%7C%20iOS%20%7C%20Android%20%7C%20H5-brightgreen)

**开源工具，帮你找到最划算的汉堡王套餐**

[功能介绍](#功能特点) • [快速开始](#快速开始) • [贡献指南](#贡献指南)

</div>

---

## ✨ 功能特点

- 🍔 **智能推荐**: 基于食物索引的套餐交集算法，自动计算性价比
- 📊 **精确匹配**: 找到同时包含你选择的所有食物的套餐
- 💰 **高性价比推荐**: 推荐多送但更划算的套餐
- 📷 **OCR识别**: 支持多种OCR服务（百度/腾讯/本地），自动识别新套餐
- 🌐 **零成本**: 无需服务器，完全基于CDN和GitHub
- 🤝 **社区驱动**: 用户可提交套餐数据，共建开源数据库
- 📱 **多端支持**: 微信小程序、iOS、Android、H5一套代码

---

## 🚀 快速开始

### 安装依赖

```bash
cd uni-app
npm install
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

### 数据初始化

项目首次运行时会自动从CDN加载最新套餐数据，并缓存到本地。

---

## 📦 项目结构

```
burgerking-calculator/
├── uni-app/              # uni-app前端项目
├── data/                 # 数据文件（CDN托管）
├── tools/                # 工具脚本
├── docs/                 # 文档
└── .github/              # GitHub配置
```

详细说明请查看 [项目结构文档](docs/PROJECT_STRUCTURE.md)

---

## 🤝 贡献指南

我们欢迎各种形式的贡献！

### 提交新套餐

1. 使用App的OCR功能识别新套餐
2. 导出套餐数据JSON
3. 提交到 [GitHub Issues](../../issues)
4. 等待审核合并

### 代码贡献

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交Pull Request

详细指南请查看 [CONTRIBUTING.md](docs/CONTRIBUTING.md)

---

## 📝 设计文档

- [项目设计方案](DESIGN.md) - 完整的技术架构和设计思路
- [数据结构说明](docs/DATA_STRUCTURE.md) - 数据模型和字段说明
- [API文档](docs/API.md) - 前端API接口说明

---

## 📊 开源计划

- [x] 基础框架搭建
- [ ] 数据加载机制
- [ ] OCR识别功能
- [ ] 社区贡献系统
- [ ] 微信小程序发布
- [ ] 社区运营

---

## 🙏 致谢

- 感谢所有贡献者的支持
- 数据来源于美团等公开平台，仅供学习交流使用

---

## 📄 License

本项目采用 MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🔗 相关链接

- [设计文档](DESIGN.md)
- [贡献指南](docs/CONTRIBUTING.md)
- [GitHub Issues](../../issues)
- [Discussions](../../discussions)

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！**

Made with ❤️ by Open Source Community

</div>
