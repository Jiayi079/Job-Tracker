# 快速设置指南

## 第一步：准备图标

在 `icons/` 目录下添加以下图标文件：
- `icon16.png` (16x16像素)
- `icon48.png` (48x48像素)  
- `icon128.png` (128x128像素)

你可以：
1. 使用在线图标生成器
2. 从免费图标网站下载
3. 使用设计工具创建

## 第二步：配置Google Cloud

### 1. 创建项目
1. 访问 https://console.cloud.google.com/
2. 点击项目选择器，创建新项目
3. 输入项目名称（如 "Job Tracker"）

### 2. 启用Google Sheets API
1. 在左侧菜单选择 "APIs & Services" > "Library"
2. 搜索 "Google Sheets API"
3. 点击进入，然后点击 "Enable"

### 3. 创建OAuth凭据
1. 导航到 "APIs & Services" > "Credentials"
2. 点击 "+ CREATE CREDENTIALS" > "OAuth client ID"
3. 如果是第一次，需要先配置OAuth同意屏幕：
   - 选择 "External"（除非你有Google Workspace）
   - 填写应用名称（如 "Job Tracker"）
   - 添加你的邮箱作为支持邮箱
   - 保存并继续，完成其余步骤
4. 创建OAuth客户端ID：
   - 应用类型选择 **"Chrome App"**
   - 应用名称：Job Tracker
   - 点击 "Create"
5. **重要**：复制生成的 Client ID（格式：`xxxxx.apps.googleusercontent.com`）

### 4. 更新manifest.json
打开 `manifest.json`，找到这一行：
```json
"client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
```
将 `YOUR_CLIENT_ID` 替换为你刚才复制的完整 Client ID。

## 第三步：创建Google Sheet

1. 访问 https://sheets.google.com/
2. 创建新的电子表格
3. 在第一行设置表头：
   - A1: 工作名称
   - B1: 公司名称
   - C1: 申请日期
   - D1: JD链接
   - E1: 申请状态
   - F1: 记录时间
4. 从浏览器地址栏复制Sheet ID：
   - URL格式：`https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
   - 复制 `SHEET_ID` 部分（长字符串）

## 第四步：加载扩展

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 启用右上角的 **"开发者模式"**
4. 点击 **"加载已解压的扩展程序"**
5. 选择项目根目录（包含 `manifest.json` 的文件夹）

## 第五步：首次配置

1. 点击浏览器工具栏中的扩展图标
2. 点击 **"连接Google"** 按钮
   - 会弹出Google登录窗口
   - 选择你的Google账户
   - 授权访问Google Sheets
3. 在 **"Google Sheet ID"** 输入框中粘贴你的Sheet ID
4. 点击 **"保存配置"**

## 完成！

现在你可以：
- 访问LinkedIn或Indeed的工作页面
- 扩展会自动检测并显示通知
- 点击 "保存到Sheet" 即可同步到Google Sheets

## 故障排除

### 认证失败
- 检查manifest.json中的Client ID是否正确
- 确保已启用Google Sheets API
- 检查OAuth同意屏幕是否已配置

### 无法保存到Sheet
- 检查Sheet ID是否正确
- 确保Sheet已共享给认证的Google账户（或使用同一账户）
- 检查Sheet的第一行是否设置了正确的表头

### 检测不到工作信息
- 某些网站可能需要手动点击 "提取当前页面"
- 如果网站结构特殊，可能需要更新 `utils/extractors.js`
