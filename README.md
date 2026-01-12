# Job Tracker - Chrome Extension

一个Chrome扩展程序，用于自动检测并同步工作申请信息到Google Sheets。

## 功能特性

- 🔍 自动检测工作页面（支持LinkedIn、Indeed等）
- 📊 自动提取工作信息（职位名称、公司、申请日期、JD链接等）
- 💾 **两种存储模式**：
  - **本地存储模式**：完全免费，无需Google账户，数据保存在浏览器本地
  - **Google Sheets模式**：免费同步到Google Sheets（Google Sheets API完全免费）
- 📥 CSV导出功能（本地模式下可导出所有数据）
- 🔔 智能通知系统
- 🚫 防止重复记录
- ⚡ 离线支持（本地模式完全离线，Sheets模式支持离线队列）

## 项目结构

```
Job-Tracker/
├── manifest.json              # 扩展配置文件
├── popup/
│   ├── popup.html            # 弹出窗口HTML
│   ├── popup.js              # 弹出窗口逻辑
│   └── popup.css             # 样式文件
├── content/
│   └── content.js            # 内容脚本，用于提取数据
├── background/
│   └── background.js         # 后台服务，处理API调用
├── utils/
│   ├── extractors.js         # 不同网站的数据提取器
│   ├── sheets-api.js         # Google Sheets API封装
│   └── storage.js            # 本地存储管理
├── icons/                    # 扩展图标
└── README.md                 # 项目文档
```

## 快速开始（本地存储模式 - 完全免费）

**最简单的方式，无需任何配置：**

1. 准备图标文件（见下方）
2. 加载扩展（见下方）
3. 打开扩展，选择"本地存储模式"
4. 开始使用！数据会自动保存到浏览器本地
5. 需要时点击"导出为CSV"即可导出所有数据

**就这么简单！无需Google账户，无需任何配置！**

## 安装步骤

### 1. 准备图标文件

在 `icons/` 目录下添加以下图标文件：
- `icon16.png` (16x16像素)
- `icon48.png` (48x48像素)
- `icon128.png` (128x128像素)

### 2. 选择存储模式

**选项A：本地存储模式（推荐新手，完全免费）**
- 无需任何配置
- 数据保存在浏览器本地
- 可随时导出为CSV文件
- 跳过步骤3-4，直接到步骤5

**选项B：Google Sheets模式（需要同步功能）**
- 需要配置Google Cloud（见下方）
- 数据自动同步到Google Sheets
- 支持多设备同步

### 3. 配置Google Cloud项目（仅Google Sheets模式需要）

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 **Google Sheets API**：
   - 导航到 "APIs & Services" > "Library"
   - 搜索 "Google Sheets API"
   - 点击 "Enable"
4. 配置OAuth 2.0凭据：
   - 导航到 "APIs & Services" > "Credentials"
   - 点击 "Create Credentials" > "OAuth client ID"
   - 选择 "Chrome App" 作为应用类型
   - 复制生成的 **Client ID**
5. 更新 `manifest.json`：
   - 将 `YOUR_CLIENT_ID.apps.googleusercontent.com` 替换为你的实际Client ID

### 4. 创建Google Sheet（仅Google Sheets模式需要）

1. 创建一个新的Google Sheet
2. 设置表头（第一行）：
   - A列: 工作名称
   - B列: 公司名称
   - C列: 申请日期
   - D列: JD链接
   - E列: 申请状态
   - F列: 记录时间
3. 从Sheet URL中提取Sheet ID：
   - URL格式: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
   - 复制 `SHEET_ID` 部分

### 5. 加载扩展

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 启用 "开发者模式"（右上角）
4. 点击 "加载已解压的扩展程序"
5. 选择项目根目录

## 使用方法

### 首次设置

1. 点击扩展图标
2. 点击 "连接Google" 按钮，完成OAuth认证
3. 在 "Google Sheet ID" 输入框中输入你的Sheet ID
4. 点击 "保存配置"

### 使用扩展

1. **自动模式**（推荐）：
   - 访问工作页面（LinkedIn、Indeed等）
   - 扩展会自动检测并显示通知
   - 点击 "保存到Sheet" 按钮即可

2. **手动模式**：
   - 在任何工作页面，点击扩展图标
   - 点击 "提取当前页面" 按钮
   - 在页面通知中确认保存

### 查看记录

- 点击扩展图标查看最近记录
- 所有数据会自动同步到Google Sheets

## 支持的网站

- ✅ LinkedIn (linkedin.com/jobs)
- ✅ Indeed (indeed.com)
- ✅ 通用网站（基于常见HTML结构）

## 技术栈

- **Manifest V3** - Chrome扩展最新标准
- **Chrome Identity API** - OAuth认证
- **Google Sheets API v4** - 数据同步
- **Chrome Storage API** - 本地数据存储
- **Content Scripts** - 页面数据提取

## 开发

### 文件说明

- `manifest.json` - 扩展配置和权限
- `content/content.js` - 在网页中运行，检测和提取工作信息
- `background/background.js` - 后台服务，处理API调用和数据同步
- `popup/` - 用户界面，显示状态和配置
- `utils/extractors.js` - 不同网站的数据提取逻辑
- `utils/sheets-api.js` - Google Sheets API封装
- `utils/storage.js` - 本地存储管理

### 调试

1. 打开Chrome开发者工具
2. 查看扩展的background service worker：
   - `chrome://extensions/` > 找到扩展 > 点击 "service worker"
3. 查看content script日志：
   - 在目标网页上打开开发者工具（F12）
4. 查看popup日志：
   - 右键点击扩展图标 > "检查弹出内容"

## 常见问题

### Q: Google Cloud需要付费吗？
A: **不需要！** Google Sheets API完全免费，个人使用不会产生任何费用。免费配额（每分钟60次请求）对个人使用完全足够。

### Q: 有没有完全免费的替代方案？
A: **有！** 使用"本地存储模式"，完全免费且无需Google账户。数据保存在浏览器本地，可随时导出为CSV文件。

### Q: 本地存储的数据会丢失吗？
A: 数据保存在Chrome浏览器本地存储中，关闭浏览器不会丢失。但如果清除浏览器数据会丢失，建议定期导出CSV备份。

### Q: 认证失败怎么办？（仅Google Sheets模式）
A: 检查manifest.json中的Client ID是否正确，确保Google Cloud项目中已启用Sheets API。

### Q: 无法保存到Sheet？（仅Google Sheets模式）
A: 检查Sheet ID是否正确，确保Sheet已共享给认证的Google账户。

### Q: 检测不到工作信息？
A: 某些网站可能需要手动点击"提取当前页面"按钮。如果仍然失败，可能是网站结构发生了变化。

### Q: 如何导出数据？
A: 点击扩展图标，点击"导出为CSV"按钮即可。导出的CSV文件可以用Excel、Google Sheets等打开。

### Q: 如何修改列结构？
A: 编辑 `utils/sheets-api.js` 中的 `saveJobData` 方法，调整列的顺序和内容。

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！
