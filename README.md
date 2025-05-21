# Truth Unlocked

一个基于Title IX主题的多人在线游戏。

## 技术栈

- Next.js
- Firebase Realtime Database
- Vercel

## 本地开发

1. 克隆仓库
```bash
git clone https://github.com/your-username/truth-unlocked.git
cd truth-unlocked
```

2. 安装依赖
```bash
npm install
```

3. 运行开发服务器
```bash
npm run dev
```

4. 打开 [http://localhost:3000](http://localhost:3000) 查看结果

## 部署

本项目使用Vercel进行部署。每次推送到main分支时都会自动部署。

## 环境变量

在Vercel中需要配置以下环境变量：

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`
- `FIREBASE_DATABASE_URL` 