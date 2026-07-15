# 客户信息登记 APP

根据《客户信息登记表-SE.docx》开发的手机端客户信息采集工具，支持：

1. 展会/客户基本信息填写
2. 按所选产品自动展开对应的问询表单（可多选，每个产品均带"备注"，防止遗漏未在选项中的内容）
3. 填完产品需求后填写 "GMP Compliance & Process Requirements"
4. 选择沟通人（Ray / Alex / Hannah / 其他手动输入）
5. 本地保存所有客户记录；后续如有新增需求，可随时调出记录再编辑，
   每次编辑保存都会生成新版本号 R1、R2、R3……（改几次就是 R 几），历史版本会保留在文档的"修改记录"中
6. 一键导出为 Word (.docx) 文档

数据保存在手机本地（不联网、不上传服务器），删除 App 或清除数据会导致记录丢失，如需要请及时导出 Word 备份。

---

## 一、本地开发预览（可选，电脑上用浏览器看效果）

```bash
npm install
npm run dev
```

打开命令行提示的网址（一般是 http://localhost:5173）即可在浏览器中体验网页版界面。

---

## 二、打包成安卓 APK（通过 GitHub Actions 自动编译，不需要自己装安卓开发环境）

项目里已经包含：
- `android/` 安卓工程（由 Capacitor 生成）
- `.github/workflows/android-build.yml` —— GitHub 自动编译脚本

只需要把整个项目上传到 GitHub，GitHub 会自动帮你编译出 `.apk` 安装包，你只需要下载即可。

### 步骤 1：解压 zip

把我导出的 `customer-app.zip` 解压到你电脑上的任意文件夹。

### 步骤 2：在 GitHub 上新建仓库（repository）

1. 打开 https://github.com ，登录你的账号（没有账号先免费注册）。
2. 右上角点击 "+" → "New repository"。
3. 填写仓库名字，例如 `customer-registration-app`。
4. 选择 "Private"（私有，别人看不到）或 "Public" 都可以。
5. **不要**勾选 "Add a README file" 等初始化选项（因为我们本地已经有文件了）。
6. 点击 "Create repository"。

### 步骤 3：上传项目代码到 GitHub

打开电脑的终端 / 命令行工具，`cd` 进入解压后的项目文件夹，依次执行（把 `你的用户名` 和 `仓库名` 换成实际的）：

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

如果没装过 Git，先去 https://git-scm.com/downloads 下载安装。
如果不熟悉命令行，也可以用 GitHub Desktop（图形界面工具，https://desktop.github.com ）：
打开 GitHub Desktop → "Add local repository" → 选择解压后的文件夹 → "Publish repository"。

### 步骤 4：查看自动编译进度

1. 代码推送成功后，打开你的 GitHub 仓库网页。
2. 点击顶部的 "Actions" 标签页。
3. 你会看到一个正在运行（黄色圆点）或已完成（绿色勾）的工作流，名字是 "Build Android APK"。
4. 点进去等待几分钟（通常 3–6 分钟），编译完成后会显示绿色勾 ✔。

### 步骤 5：下载 APK

1. 在编译完成的那次运行页面里，往下拉，找到 "Artifacts" 区域。
2. 点击 `app-debug-apk` 即可下载一个压缩包，解压后就是 `app-debug.apk`。
3. 把这个 APK 传到安卓手机上（微信传输、USB 传输、网盘都可以），点击安装。
   （手机可能提示"未知来源应用"风险提示，这是正常的，因为不是应用商店签名，允许安装即可。）

### 以后有代码更新怎么办？

以后如果需要改需求、加产品字段等，改完代码后，在项目文件夹里执行：

```bash
git add .
git commit -m "更新说明"
git push
```

推送后 GitHub 会自动重新触发编译，重复"步骤 4、5"下载新的 APK 即可。

也可以完全不改代码，直接在 GitHub 仓库网页的 Actions 页面点击 "Build Android APK" → "Run workflow" 手动重新触发编译。

---

## 三、常见问题

**Q: 编译失败怎么办？**
点开失败的红色 ✗ 记录，展开报错的步骤，把报错信息复制给我，我可以帮你分析修复。

**Q: 想要正式签名、上架应用商店？**
目前工作流生成的是"调试版 (debug)"APK，仅用于内部安装测试。如果要正式发布到应用商店，需要额外配置签名证书 (keystore)，可以再告诉我，我帮你补充签名步骤。

**Q: 数据会不会丢？**
所有客户数据保存在手机本地存储中。建议定期使用"导出 Word"功能，把重要客户资料导出备份保存。

**Q: 表单字段能不能修改/增加？**
可以。所有字段定义都在 `src/data/formSchema.js` 文件里，按同样格式增删字段即可，改完推送到 GitHub 就会自动重新编译。
