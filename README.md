# 校园危机管理游戏

这是一个基于 Flask 和 SocketIO 的在线多人游戏，模拟校园危机管理场景。

## 功能特点

- 实时多人游戏
- 角色扮演（学生、教师、保安）
- 危机管理模拟
- 实时互动和决策

## 本地开发

1. 克隆仓库
```bash
git clone [您的仓库URL]
cd [项目目录]
```

2. 创建并激活虚拟环境
```bash
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# 或
.venv\Scripts\activate  # Windows
```

3. 安装依赖
```bash
pip install -r requirements.txt
```

4. 运行应用
```bash
python run.py
```

## 部署

本项目使用 Vercel 进行部署。部署步骤：

1. Fork 本仓库到您的 GitHub 账号
2. 在 Vercel 中导入项目
3. 配置环境变量（如需要）：
   - `SECRET_KEY`：应用密钥

## 技术栈

- Flask
- Flask-SocketIO
- Eventlet
- Gunicorn

## 许可证

[添加您的许可证信息] 