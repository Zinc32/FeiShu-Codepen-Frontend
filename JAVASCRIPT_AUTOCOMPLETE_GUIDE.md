# JavaScript 代码补全功能指南

## 概述

本项目现已支持JavaScript、React、Vue、TypeScript的智能代码补全功能。通过CodeMirror的内置自动补全扩展和自定义代码片段，为不同语言提供针对性的代码补全体验。

## 支持的语言

### 1. JavaScript (js)
- **语言扩展**: `@codemirror/lang-javascript`
- **自动补全**: 自定义JavaScript代码片段
- **功能特性**:
  - 函数定义（普通函数、箭头函数、生成器函数、异步函数）
  - 控制流语句（if/else、switch、for循环、while循环）
  - 类和对象定义
  - 异步处理（Promise、async/await、try/catch）
  - 数组和对象方法
  - 常用语句（console.log、return、throw等）
  - 模块导入导出
  - 模板字符串

### 2. React (react)
- **语言扩展**: `@codemirror/lang-javascript` (启用TypeScript支持)
- **自动补全**: React专用代码片段 + 基础JavaScript代码片段
- **功能特性**:
  - **React特有功能**:
    - 组件定义（函数组件、类组件、Memo组件）
    - React Hooks (useState、useEffect、useRef、useCallback等)
    - JSX元素和属性
    - 条件渲染和列表渲染
    - 事件处理函数
    - React导入导出
  - **基础JavaScript功能**:
    - 函数定义、控制流语句
    - 类和对象定义、异步处理
    - 数组和对象方法、常用语句
    - 模块导入导出、模板字符串

### 3. Vue (vue)
- **语言扩展**: `@codemirror/lang-vue`
- **自动补全**: Vue 3专用代码片段 + 基础JavaScript代码片段
- **功能特性**:
  - **Vue特有功能**:
    - Vue 3 Composition API (createApp、ref、reactive、computed等)
    - 生命周期钩子 (onMounted、onUnmounted等)
    - 监听器 (watch、watchEffect)
    - 组件定义
    - 模板语法 (v-if、v-for、v-bind等)
    - 事件处理
    - 响应式数据更新
  - **基础JavaScript功能**:
    - 函数定义、控制流语句
    - 类和对象定义、异步处理
    - 数组和对象方法、常用语句
    - 模块导入导出、模板字符串

### 4. TypeScript (ts)
- **语言扩展**: `@codemirror/lang-javascript` (启用TypeScript支持)
- **自动补全**: TypeScript专用代码片段 + 基础JavaScript代码片段
- **功能特性**:
  - **TypeScript特有功能**:
    - 类型定义 (type、interface、enum)
    - 泛型 (generic functions、classes、interfaces)
    - 类型断言和类型守卫
    - 函数类型注解
    - 联合类型和交叉类型
    - 映射类型和工具类型
    - 条件类型
    - 模块声明
    - 装饰器
    - 异步类型
  - **基础JavaScript功能**:
    - 函数定义、控制流语句
    - 类和对象定义、异步处理
    - 数组和对象方法、常用语句
    - 模块导入导出、模板字符串

## 使用方法

### 1. 语言切换
在JavaScript编辑器顶部的语言选择器中，选择对应的语言：
- **JavaScript**: 标准JavaScript代码补全
- **React**: React框架代码补全 + 基础JavaScript代码补全
- **Vue**: Vue 3框架代码补全 + 基础JavaScript代码补全
- **TS**: TypeScript代码补全 + 基础JavaScript代码补全

### 2. 分层补全策略
为了提供更好的开发体验，React、Vue、TypeScript都采用了**分层补全**策略：

- **第一层**: 框架/语言特有的代码片段（优先级更高）
  - React: 组件、Hooks、JSX等
  - Vue: Composition API、生命周期、模板语法等
  - TypeScript: 类型定义、泛型、类型断言等

- **第二层**: 基础JavaScript代码片段
  - 函数定义、控制流语句
  - 类和对象定义、异步处理
  - 数组和对象方法、常用语句等

这样设计的好处：
- ✅ 在任何语言模式下都能使用基础的JavaScript代码片段
- ✅ 框架特有的代码片段具有更高优先级，更容易找到
- ✅ 避免重复定义相同的代码片段
- ✅ 提供完整的开发体验

### 3. 代码补全触发
- **自动触发**: 输入字符时自动显示补全建议
- **手动触发**: 按 `Ctrl+Space` (Windows) 或 `Cmd+Space` (Mac)
- **Tab键**: 选择补全项后按Tab键插入代码片段

### 4. 代码片段使用
代码片段支持占位符，使用Tab键在占位符之间跳转：
- `${1:label}`: 第一个占位符，显示为"label"
- `${2:label}`: 第二个占位符
- `${3}`: 第三个占位符（无标签）

## 代码片段示例

### JavaScript
```javascript
// 输入 "function" 触发函数定义片段
function functionName(params) {
    // 光标位置
}

// 输入 "arrow" 触发箭头函数片段
const functionName = (params) => {
    // 光标位置
}

// 输入 "if" 触发条件语句片段
if (condition) {
    // 光标位置
}
```

### React (分层补全示例)
```jsx
// 输入 "rfc" 触发React函数组件片段
function ComponentName(props) {
    return (
        // 光标位置
    );
}

// 输入 "useState" 触发React Hooks片段
const [state, setState] = useState(initialValue)

// 输入 "function" 触发基础JavaScript函数片段
function handleClick() {
    // 光标位置
}

// 输入 "if" 触发基础JavaScript条件语句片段
if (condition) {
    // 光标位置
}

// 输入 "for" 触发基础JavaScript循环片段
for (const item of array) {
    // 光标位置
}
```

### Vue (分层补全示例)
```javascript
// 输入 "vue component" 触发Vue组件片段
const component = {
    setup() {
        // 光标位置
        return {
            // 返回值
        }
    },
    template: ``
}

// 输入 "ref" 触发Vue响应式数据片段
const count = ref(0)

// 输入 "onMounted" 触发Vue生命周期钩子片段
onMounted(() => {
    // 光标位置
})

// 输入 "function" 触发基础JavaScript函数片段
function handleClick() {
    // 光标位置
}

// 输入 "if" 触发基础JavaScript条件语句片段
if (condition) {
    // 光标位置
}

// 输入 "for" 触发基础JavaScript循环片段
for (const item of array) {
    // 光标位置
}
```

### TypeScript (分层补全示例)
```typescript
// 输入 "interface" 触发TypeScript接口定义片段
interface InterfaceName {
    property: string
}

// 输入 "generic function" 触发TypeScript泛型函数片段
function functionName<T>(param: T): T {
    // 光标位置
}

// 输入 "type assertion" 触发TypeScript类型断言片段
const value = expression as string

// 输入 "function" 触发基础JavaScript函数片段
function handleClick(): void {
    // 光标位置
}

// 输入 "if" 触发基础JavaScript条件语句片段
if (condition) {
    // 光标位置
}

// 输入 "for" 触发基础JavaScript循环片段
for (const item of array) {
    // 光标位置
}
```

## 实际使用场景

### React开发场景
```jsx
// 1. 创建组件结构
function UserProfile({ user }) {
    // 2. 使用基础JavaScript处理数据
    const processUserData = (data) => {
        if (data && data.length > 0) {
            return data.map(item => ({
                ...item,
                processed: true
            }));
        }
        return [];
    };

    // 3. 使用React Hooks管理状态
    const [userData, setUserData] = useState([]);
    const [loading, setLoading] = useState(false);

    // 4. 使用基础JavaScript异步处理
    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/users');
            const data = await response.json();
            const processed = processUserData(data);
            setUserData(processed);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // 5. 使用React生命周期
    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div>
            {loading ? (
                <p>Loading...</p>
            ) : (
                userData.map(item => (
                    <div key={item.id}>{item.name}</div>
                ))
            )}
        </div>
    );
}
```

### Vue开发场景
```javascript
// 1. 创建Vue组件
const UserProfile = {
    setup() {
        // 2. 使用Vue响应式数据
        const userData = ref([]);
        const loading = ref(false);

        // 3. 使用基础JavaScript处理数据
        const processUserData = (data) => {
            if (data && data.length > 0) {
                return data.map(item => ({
                    ...item,
                    processed: true
                }));
            }
            return [];
        };

        // 4. 使用基础JavaScript异步处理
        const fetchData = async () => {
            try {
                loading.value = true;
                const response = await fetch('/api/users');
                const data = await response.json();
                const processed = processUserData(data);
                userData.value = processed;
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                loading.value = false;
            }
        };

        // 5. 使用Vue生命周期
        onMounted(() => {
            fetchData();
        });

        return {
            userData,
            loading
        };
    },
    template: `
        <div>
            <div v-if="loading">Loading...</div>
            <div v-else>
                <div v-for="item in userData" :key="item.id">
                    {{ item.name }}
                </div>
            </div>
        </div>
    `
};
```

### TypeScript开发场景
```typescript
// 1. 定义TypeScript接口
interface User {
    id: number;
    name: string;
    email: string;
}

interface ProcessedUser extends User {
    processed: boolean;
}

// 2. 使用泛型函数
function processData<T extends User>(data: T[]): ProcessedUser[] {
    if (data && data.length > 0) {
        return data.map(item => ({
            ...item,
            processed: true
        }));
    }
    return [];
}

// 3. 使用基础JavaScript异步处理
async function fetchData(): Promise<User[]> {
    try {
        const response = await fetch('/api/users');
        const data = await response.json();
        return data as User[];
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

// 4. 使用类型断言
const userData = await fetchData();
const processedData = processData(userData as User[]);

// 5. 使用基础JavaScript控制流
if (processedData.length > 0) {
    for (const user of processedData) {
        console.log(`User: ${user.name}, Processed: ${user.processed}`);
    }
}
```

## 技术实现

### 1. 架构设计
- **模块化**: 每种语言的补全功能独立实现
- **可扩展**: 易于添加新的语言支持
- **性能优化**: 使用CodeMirror的原生补全机制

### 2. 核心组件
- `autocompleteService.ts`: 自动补全服务，包含所有语言的代码片段
- `Editor.tsx`: 编辑器组件，根据语言选择对应的补全功能
- CodeMirror扩展: 语言扩展和自动补全扩展

### 3. 代码片段系统
- 使用CodeMirror的`snippetCompletion`API
- 支持占位符和标签
- 智能上下文检测（注释、字符串中不触发）

## 注意事项

1. **语言切换**: 切换语言时会重新初始化编辑器，确保使用正确的语言扩展和补全功能
2. **上下文感知**: 补全功能会检测当前上下文，在注释或字符串中不会触发
3. **性能考虑**: 代码片段数量适中，避免影响编辑器性能
4. **兼容性**: 支持现代浏览器，建议使用Chrome、Firefox、Safari等主流浏览器

## 未来扩展

1. **更多语言支持**: 可以添加Python、Java、C++等语言的代码补全
2. **智能补全**: 基于项目上下文的智能代码建议
3. **自定义片段**: 允许用户自定义代码片段
4. **代码格式化**: 集成代码格式化功能
5. **错误提示**: 增强的错误检测和提示功能

## 故障排除

### 常见问题
1. **补全不工作**: 检查语言选择是否正确，确保编辑器已初始化
2. **片段不显示**: 确认输入触发词正确，检查是否在注释或字符串中
3. **性能问题**: 如果编辑器响应慢，可以调整`maxRenderedOptions`参数

### 调试方法
1. 打开浏览器开发者工具
2. 查看Console中的错误信息
3. 检查网络请求是否正常
4. 验证依赖包是否正确安装

---

*最后更新: 2024年12月* 