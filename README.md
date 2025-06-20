Collecting workspace information 这是一个**飞书代码编辑器前端项目**，类似于 CodePen 的在线代码编辑器。让我为你详细介绍：

## 项目概述

这是一个基于 React + TypeScript 的前端应用，主要功能包括：

- **在线代码编辑器**：支持 HTML、CSS、JavaScript 实时编辑
- **实时预览**：代码修改后即时显示效果
- **用户系统**：登录/注册功能
- **代码片段管理**：保存、加载、删除代码片段
- **权限控制**：私有/公开代码片段

## 技术栈

- **框架**: React 18 + TypeScript
- **路由**: React Router DOM
- **样式**: Emotion (CSS-in-JS)
- **代码编辑器**: CodeMirror 6
- **HTTP 客户端**: Axios
- **构建工具**: Create React App

## 启动步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm start
```

### 3. 访问应用

项目会在 **http://localhost:8888** 启动（根据 .env 文件配置的 PORT=8888）

## 主要功能模块

### 页面路由

- `/login` - 登录页面 (src/pages/LoginPage.tsx)
- `/register` - 注册页面 (src/pages/RegisterPage.tsx)
- `/pens` - 代码片段列表页 (src/pages/PensPage.tsx)
- `/editor` - 代码编辑器页面 (src/components/Editor.tsx)
- `/editor/:id` - 编辑特定代码片段

### 核心组件

- `Editor` - 主编辑器组件，集成了 CodeMirror
- `Preview` - 实时预览组件
- `UserNavbar` - 用户导航栏

### 服务层

- `authService` - 用户认证服务
- `penService` - 代码片段 CRUD 操作
- `api` - HTTP 请求配置

## 后端依赖

项目需要后端 API 服务，配置在 .env 中：

```
REACT_APP_API_URL=http://localhost:3000/api
```

确保后端服务运行在 `localhost:3000`。

## 特色功能

1. **实时编辑预览**：三栏布局（HTML/CSS/JS 编辑器 + 预览面板）
2. **代码片段管理**：创建、保存、加载、删除代码片段
3. **用户认证**：JWT token 认证，支持登录状态持久化
4. **响应式设计**：适配不同屏幕尺寸

启动项目后，你可以注册账号开始使用在线代码编辑器功能！
