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

## 第二步：首次加载扩展（获取扩展ID）

**重要**：创建OAuth凭据需要扩展ID（内容ID），所以需要先加载扩展获取ID。

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 启用右上角的 **"开发者模式"**
4. 点击 **"加载已解压的扩展程序"**
5. 选择项目根目录（包含 `manifest.json` 的文件夹）
6. **获取扩展ID**：
   - 加载后，在扩展列表中会显示你的扩展
   - 在扩展卡片下方可以看到 **"ID"**（一串32位的字母数字组合）
   - 复制这个ID，例如：`abcdefghijklmnopqrstuvwxyz123456`
   - 这就是你需要的 **"内容 ID"**

## 第三步：配置Google Cloud

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
   - **重要**：在最后一步，将应用发布状态设置为 **"生产"**（Production），而不是"测试"（Testing）
     - 如果看到"发布应用"按钮，点击它
     - 或者导航到 "APIs & Services" > "OAuth consent screen"
     - 滚动到底部，找到"发布状态"部分
     - 点击"发布应用"或"BACK TO DASHBOARD"后点击"PUBLISH APP"
4. 创建OAuth客户端ID：
   - 应用类型选择 **"Chrome 扩展程序"**（Chrome Extension）
   - 名称：Job Tracker（或任意名称）
   - **内容 ID**：粘贴你在第二步获取的扩展ID
   - 点击 "创建"
5. **重要**：复制生成的 Client ID（格式：`xxxxx.apps.googleusercontent.com`）

### 4. 更新manifest.json
打开 `manifest.json`，找到这一行：
```json
"client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
```
将 `YOUR_CLIENT_ID` 替换为你刚才复制的完整 Client ID。

**注意**：更新后需要重新加载扩展（在 `chrome://extensions/` 页面点击扩展的刷新按钮）。

## 第四步：创建Google Sheet

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

### 认证失败 - Error 403: access_denied
**问题**：显示"Access blocked: 应用未完成Google验证流程"

**原因**：OAuth同意屏幕处于"测试"模式，只有测试用户才能访问。

**解决方案（两种方式，任选其一）：**

**方案1：发布应用为生产模式（推荐）**

**如何找到OAuth同意屏幕页面：**

**方法A（推荐）：**
1. 在Google Cloud Console顶部，点击左侧菜单（三条横线图标）
2. 找到并点击 **"APIs & Services"**（API和服务）
3. 在下拉菜单中点击 **"OAuth consent screen"**（OAuth同意屏幕）

**方法B（如果使用新版界面）：**
1. 在左侧导航菜单中，找到 **"Google Auth Platform"** 部分
2. 点击 **"品牌塑造"**（Branding）- 这会打开OAuth同意屏幕配置页面

**找到页面后：**
1. 滚动到页面底部，找到 **"发布状态"**（Publishing status）部分
2. 如果显示"测试中"（Testing），点击 **"发布应用"**（PUBLISH APP）按钮
3. 确认发布（可能会显示警告，点击"确认"即可）
4. 等待几分钟后，重新尝试连接Google账户

**方案2：添加测试用户（临时方案）**

**导航到OAuth同意屏幕页面（同上）**

**找到页面后：**
1. 在页面中找到 **"测试用户"**（Test users）部分（通常在"发布状态"上方）
2. 点击 **"+ ADD USERS"** 或 **"添加用户"** 按钮
3. 在弹出的对话框中，添加你的Google邮箱地址（例如：`eva.gu0709@gmail.com`）
4. 点击"添加"或"保存"
5. 保存后，重新尝试连接Google账户

**如果仍然找不到：**
- 确保你使用的是正确的项目（检查顶部项目选择器）
- 尝试直接访问：`https://console.cloud.google.com/apis/credentials/consent?project=你的项目ID`

**注意**：方案1是永久解决方案，方案2只是临时方案，每次添加新用户都需要手动添加。

### 其他认证问题
- 检查manifest.json中的Client ID是否正确
- 确保已启用Google Sheets API
- 检查OAuth同意屏幕是否已配置

### 无法保存到Sheet
- 检查Sheet ID是否正确
- 确保Sheet已共享给认证的Google账户（或使用同一账户）
- 检查Sheet的第一行是否设置了正确的表头

### 检测不到工作信息
**可能的原因和解决方法：**

1. **页面未完全加载**
   - 等待页面完全加载后再点击"提取当前页面"
   - 刷新页面后重试

2. **不在正确的工作详情页面**
   - 确保你在工作详情页面（不是列表页）
   - LinkedIn URL应该包含 `/jobs/view/` 或 `/jobs/`
   - Indeed URL应该包含 `/viewjob` 或 `/job/`

3. **网站结构变化**
   - 打开浏览器开发者工具（F12）
   - 查看Console标签页
   - 查找 "Job Tracker" 相关的日志信息
   - 这些日志会告诉你提取失败的原因

4. **手动调试**
   - 在Console中输入：`document.querySelector('h1')` 查看是否能找到标题
   - 如果找不到，说明页面结构可能已变化，需要更新 `utils/extractors.js` 中的选择器

5. **临时解决方案**
   - 如果自动提取失败，可以手动复制工作信息
   - 使用"导出为CSV"功能查看已保存的记录
