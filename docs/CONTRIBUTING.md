# 贡献指南

感谢你愿意为汉堡王性价比计算器项目做出贡献！

## 贡献方式

### 1. 提交新套餐数据

通过 GitHub Issues 提交套餐数据：

1. 截图目标平台的套餐页面
2. 使用 `tools/build-combo.js` 识别生成 JSON
3. 提交到 GitHub Issues

#### 提交格式示例：

```json
{
  "combos": [
    {
      "id": "combo_new",
      "name": "套餐名称",
      "platform": "meituan",
      "price": 39.9,
      "description": "套餐简述"
    }
  ],
  "comboFoods": [
    { "comboId": "combo_new", "foodName": "whopper", "quantity": 1 }
  ]
}
```

#### 提交步骤：

1. 打开项目 [GitHub Issues](../../issues)
2. 点击 "New issue"
3. 选择 "New combo submission"
4. 标题格式：`[新增套餐] 平台-套餐名称`
5. 内容中包含：
   - 套餐截图
   - 生成的 JSON 数据
   - 原始链接（可选）
6. 点击 "Submit new issue"

### 2. 代码贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 贡献规范

### 代码规范

- 遵循 Vue 3 和 uni-app 的最佳实践
- 添加适当的注释和文档
- 确保 `pnpm build:h5` 构建成功

### 数据规范

- 确保数据准确性和完整性
- 使用标准化的食物ID（参考 foods.json）
- 提供原始链接以便验证

## 开发环境

### 前置要求

- Node.js 16+
- pnpm

### 安装

```bash
git clone https://github.com/Neko1t/burgerking-calculator-app.git
cd burgerking-calculator-app
pnpm install
```

### 运行

```bash
pnpm dev:h5           # H5版本
pnpm dev:mp-weixin    # 微信小程序
pnpm dev:app          # App版本
```

### 构建

```bash
pnpm build:h5         # 构建H5
pnpm build:mp-weixin  # 构建微信小程序
```

## 套餐构建工具

使用 LLM 从套餐截图识别并生成标准 JSON：

```bash
# 从剪贴板读取截图
node tools/build-combo.js --clipboard

# 从文件读取截图
node tools/build-combo.js --image screenshot.png
```

生成的数据会自动合并到 `uni-app/static/data/` 目录。

## 相关文档

- [设计方案](DESIGN.md)
- [CLAUDE.md](../../CLAUDE.md) - 开发指导

## 联系我们

有问题或建议请提交 [GitHub Issues](../../issues)。

感谢你的贡献！
