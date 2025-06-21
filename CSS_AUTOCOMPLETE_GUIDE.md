# CSS 和 JavaScript 自动补全功能指南

## 功能概述

本项目为CSS和JavaScript编辑器添加了**CodeMirror原生补全功能没有的**智能语法补全功能，与原生功能完美结合：

### CodeMirror原生CSS补全功能包含：
- **CSS属性补全**：动态获取浏览器支持的CSS属性
- **CSS值关键字补全**：布局值、定位值、显示值、文本值、颜色值、单位值、函数值等
- **颜色名称补全**：148个标准CSS颜色名称
- **伪类补全**：状态伪类、结构伪类、表单伪类等
- **HTML标签补全**：常用HTML标签
- **@规则补全**：@media、@keyframes、@import等
- **CSS变量补全**：自定义属性（CSS变量）

### CodeMirror原生JavaScript补全功能包含：
- **基础关键字补全**：var、let、const、function、class等
- **全局对象补全**：window、document、console、Array、Object、Math、Date等
- **方法补全**：所有内置对象的方法（Array.push、String.slice、Object.keys等）
- **属性补全**：所有内置对象的属性
- **类型补全**：TypeScript类型（如果启用）
- **智能上下文补全**：根据代码上下文提供相关补全

### 本项目新增的语法补全功能：

## CSS 语法补全

#### 1. 大括号自动补全
当你在CSS编辑器中输入选择器、伪类、媒体查询或动画关键帧后，会自动提示补全大括号：

**选择器补全：**
```css
.container { }  // 输入 .container 后按 Tab 或 Enter
```

**伪类补全：**
```css
.button:hover { }  // 输入 :hover 后按 Tab 或 Enter
```

**媒体查询补全：**
```css
@media (max-width: 768px) { }  // 输入媒体查询条件后按 Tab 或 Enter
```

**动画关键帧补全：**
```css
@keyframes slideIn { }  // 输入动画名称后按 Tab 或 Enter
```

#### 2. 冒号自动补全
当你在CSS属性后输入时，会自动提示补全冒号：

```css
color: ;  // 输入 color 后按 Tab 或 Enter
```

#### 3. 分号自动补全
当你在CSS值后输入时，会自动提示补全分号：

```css
color: red;  // 输入值后按 Tab 或 Enter
```

#### 4. 单位自动补全
当你在数字后输入时，会提示常用的CSS单位：

```css
width: 100px;  // 输入数字后按 Tab 或 Enter 选择单位
```

支持的单位：`px`, `em`, `rem`, `%`, `vh`, `vw`, `vmin`, `vmax`, `pt`, `pc`, `in`, `cm`, `mm`

## JavaScript 代码片段补全

### 设计原则
**只提供CodeMirror原生没有的功能**，避免重复实现。CodeMirror的`@codemirror/lang-javascript`包已经包含了非常完整的JavaScript补全功能，包括：
- 所有关键字、全局对象、方法、属性
- 智能上下文感知补全
- TypeScript支持

### 本项目新增的代码片段

#### 1. 函数模式代码片段
```javascript
// 输入 'function' 后选择
function name(params) {
	
}

// 输入 'arrow function' 后选择
(params) => {
	
}

// 输入 'async function' 后选择
async function name(params) {
	
}

// 输入 'async arrow' 后选择
async (params) => {
	
}

// 输入 'generator function' 后选择
function* name(params) {
	
}
```

#### 2. 条件语句代码片段
```javascript
// 输入 'if' 后选择
if (condition) {
	
}

// 输入 'if else' 后选择
if (condition) {
	
} else {
	
}

// 输入 'else if' 后选择
else if (condition) {
	
}

// 输入 'switch' 后选择
switch (expression) {
	case value:
		
		break;
	default:
		
}
```

#### 3. 循环语句代码片段
```javascript
// 输入 'for' 后选择
for (let i = 0; i < array.length; i++) {
	
}

// 输入 'for of' 后选择
for (const item of array) {
	
}

// 输入 'for in' 后选择
for (const key in object) {
	
}

// 输入 'while' 后选择
while (condition) {
	
}

// 输入 'do while' 后选择
do {
	
} while (condition);
```

#### 4. 错误处理代码片段
```javascript
// 输入 'try catch' 后选择
try {
	
} catch (error) {
	
}

// 输入 'try finally' 后选择
try {
	
} finally {
	
}

// 输入 'throw error' 后选择
throw new Error(message);
```

#### 5. 类和对象代码片段
```javascript
// 输入 'class' 后选择
class ClassName {
	constructor(params) {
		
	}
}

// 输入 'class extends' 后选择
class ClassName extends ParentClass {
	constructor(params) {
		
	}
}

// 输入 'getter' 后选择
get propertyName() {
	return ;
}

// 输入 'setter' 后选择
set propertyName(value) {
	
}

// 输入 'static method' 后选择
static methodName(params) {
	
}
```

#### 6. 模块代码片段
```javascript
// 输入 'import' 后选择
import module from 'path';

// 输入 'import destructuring' 后选择
import { name } from 'path';

// 输入 'import as' 后选择
import * as alias from 'path';

// 输入 'export default' 后选择
export default ;

// 输入 'export named' 后选择
export {  };
```

#### 7. Promise代码片段
```javascript
// 输入 'new Promise' 后选择
new Promise((resolve, reject) => {
	
});

// 输入 'Promise.resolve' 后选择
Promise.resolve();

// 输入 'Promise.reject' 后选择
Promise.reject();
```

#### 8. 常用工具函数代码片段
```javascript
// 输入 'JSON.stringify' 后选择
JSON.stringify(object);

// 输入 'JSON.parse' 后选择
JSON.parse(jsonString);

// 输入 'Object.keys' 后选择
Object.keys(object);

// 输入 'Object.values' 后选择
Object.values(object);

// 输入 'Object.entries' 后选择
Object.entries(object);

// 输入 'Array.from' 后选择
Array.from(arrayLike);

// 输入 'Array.isArray' 后选择
Array.isArray(value);
```

#### 9. DOM操作代码片段
```javascript
// 输入 'getElementById' 后选择
document.getElementById('id');

// 输入 'querySelector' 后选择
document.querySelector('selector');

// 输入 'querySelectorAll' 后选择
document.querySelectorAll('selector');

// 输入 'addEventListener' 后选择
element.addEventListener('event', (e) => {
	
});
```

#### 10. 定时器代码片段
```javascript
// 输入 'setTimeout' 后选择
setTimeout(() => {
	
}, 1000);

// 输入 'setInterval' 后选择
setInterval(() => {
	
}, 1000);

// 输入 'requestAnimationFrame' 后选择
requestAnimationFrame(() => {
	
});
```

#### 11. 常用变量声明代码片段
```javascript
// 输入 'const object' 后选择
const obj = {};

// 输入 'const array' 后选择
const arr = [];

// 输入 'const map' 后选择
const map = new Map();

// 输入 'const set' 后选择
const set = new Set();
```

#### 12. 常用模式代码片段
```javascript
// 输入 'console.log' 后选择
console.log();

// 输入 'console.error' 后选择
console.error();

// 输入 'debugger' 后选择
debugger;
```

## 智能上下文补全

### CSS 上下文感知补全
系统会根据当前CSS代码上下文智能提供相关补全：

1. **选择器上下文**：在选择器后提供大括号补全
2. **属性上下文**：在CSS属性后提供冒号补全
3. **值上下文**：在CSS值后提供分号补全
4. **数字上下文**：在数字后提供单位补全
5. **规则上下文**：在CSS规则后提供右大括号补全

### JavaScript 上下文感知补全
**CodeMirror原生提供**，包括：

1. **对象属性访问**：在 `obj.` 后提供所有可用方法
2. **数组上下文**：在数组操作中优先显示数组方法
3. **字符串上下文**：在字符串操作中优先显示字符串方法
4. **Math 上下文**：在 `Math.` 后提供数学方法
5. **Date 上下文**：在日期操作中提供日期方法
6. **Promise 上下文**：在异步操作中提供 Promise 方法
7. **DOM 上下文**：在 DOM 操作中提供 DOM API 方法
8. **Console 上下文**：在 `console.` 后提供控制台方法

### 排除规则
- 在注释中不提供补全
- 在字符串中不提供补全
- 避免重复的补全选项

## 使用方法

1. 在CSS或JavaScript编辑器中输入相应的代码
2. 当出现自动补全提示时，按 `Tab` 键或 `Enter` 键选择补全项
3. 也可以使用方向键选择不同的补全选项
4. 使用 `Ctrl+Space` 手动触发补全
5. 对于代码片段，使用 `Tab` 键在占位符之间跳转

## 技术实现

### 原生功能
- CSS：通过 `@codemirror/lang-css` 包的 `cssCompletionSource` 提供
- JavaScript：通过 `@codemirror/lang-javascript` 包提供完整的补全功能

### 自定义功能
- CSS：通过 `customCssCompletionSource` 提供语法符号补全
- JavaScript：通过 `jsSnippetCompletionSource` 提供代码片段补全
- 使用正则表达式匹配不同的语法模式
- 与原生补全功能结合使用，不重复实现

### 集成方式
```typescript
// CSS 自动补全
export const cssAutocomplete = autocompletion({
  override: [customCssCompletionSource, cssCompletionSource]
});

// JavaScript 自动补全
export const jsAutocomplete = autocompletion({
  override: [jsSnippetCompletionSource]
});
```

## 优势

1. **不重复实现**：只补充CodeMirror原生没有的功能
2. **完美集成**：与原生补全功能无缝结合
3. **智能上下文**：根据代码上下文提供相关补全
4. **性能优化**：避免重复的补全逻辑
5. **维护简单**：代码结构清晰，易于维护
6. **代码片段**：提供实用的代码片段，提高开发效率

## 总结

本项目的自动补全功能 = **CodeMirror原生补全** + **自定义语法补全** + **代码片段补全**

- **CodeMirror原生**：提供完整的JavaScript关键字、对象、方法、属性补全
- **自定义CSS补全**：提供大括号、冒号、分号、单位等语法补全
- **代码片段补全**：提供实用的代码片段，提高开发效率
- **完美结合**：提供最完整的代码编辑体验 