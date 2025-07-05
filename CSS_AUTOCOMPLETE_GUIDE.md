# CSS、Less、SCSS 和 JavaScript 自动补全功能指南

## 功能概述

本项目为CSS、Less、SCSS和JavaScript编辑器添加了**CodeMirror原生补全功能没有的**智能语法补全功能，与原生功能完美结合：

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

### CodeMirror原生HTML补全功能包含：
- **HTML5标签补全**：所有标准HTML5标签
- **HTML属性补全**：标签相关的属性
- **智能上下文感知**：根据标签提供相关属性
- **回车键补全**：支持回车键选择补全项

### 本项目新增的语法补全功能：

## Less 和 SCSS 代码补全

**设计原则**：提供CodeMirror原生没有的Less和SCSS智能语法补全功能，与CSS原生补全完美结合。

### Less 特有功能
- **变量系统**：@变量定义、引用、插值
- **混合器**：.mixin()定义、调用、参数传递
- **嵌套规则**：&父选择器引用、伪类、类、属性选择器
- **颜色函数**：lighten、darken、saturate、desaturate、fadein、fadeout、spin、mix、contrast
- **数学运算**：+、-、*、/ 运算符
- **条件语句**：when、when not、when and、when or
- **循环**：递归循环模式
- **导入**：@import各种导入方式
- **命名空间**：#namespace()定义和调用
- **扩展**：&:extend()继承选择器

### SCSS 特有功能
- **变量系统**：$变量定义、引用、插值
- **混合器**：@mixin定义、@include调用、参数传递
- **函数**：@function定义、@return返回值
- **控制指令**：@if、@else、@for、@each、@while
- **嵌套规则**：&父选择器引用、伪类、类、属性选择器
- **占位符选择器**：%placeholder定义、@extend继承
- **扩展**：@extend继承选择器
- **导入系统**：@import、@use、@forward
- **模块系统**：sass:math、sass:color、sass:string、sass:list、sass:map、sass:selector、sass:meta
- **颜色函数**：lighten、darken、saturate、desaturate、adjust-hue、fade-in、fade-out、mix、complement、invert
- **数学函数**：math.div、math.percentage、math.round、math.ceil、math.floor、math.abs、math.min、math.max
- **字符串函数**：string.quote、string.unquote、string.index、string.insert、string.length、string.slice
- **列表函数**：list.append、list.index、list.join、list.length、list.nth、list.set-nth
- **映射函数**：map.get、map.set、map.has-key、map.keys、map.values、map.merge
- **选择器函数**：selector.append、selector.extend、selector.replace、selector.unify
- **元数据函数**：meta.type-of、meta.calc-args、meta.calc-name、meta.global-variable-exists、meta.function-exists、meta.mixin-exists

## HTML 标签和属性补全

**设计原则**：提供CodeMirror原生没有的智能标签补全功能，支持输入部分标签名然后按回车补全。

### 1. 智能标签补全
支持输入部分标签名，然后按回车键补全完整标签：

```html
<!-- 输入 'butt' 然后按回车 -->
<button></button>

<!-- 输入 'div' 然后按回车 -->
<div></div>

<!-- 输入 'img' 然后按回车 -->
<img  />

<!-- 输入 'form' 然后按回车 -->
<form></form>
```

### 2. 智能属性补全
在标签内提供属性补全，支持回车键选择：

```html
<!-- 在 <div 后输入 'class' 然后按回车 -->
<div class=""></div>

<!-- 在 <img 后输入 'src' 然后按回车 -->
<img src="" />

<!-- 在 <input 后输入 'type' 然后按回车 -->
<input type="" />
```

### 3. 自闭合标签识别
自动识别自闭合标签，光标定位在属性位置：

```html
<!-- 输入 'img' 然后按回车 -->
<img  />

<!-- 输入 'input' 然后按回车 -->
<input  />

<!-- 输入 'br' 然后按回车 -->
<br />
```

### 4. 普通标签补全
普通标签补全后，光标定位在内容位置：

```html
<!-- 输入 'div' 然后按回车 -->
<div></div>

<!-- 输入 'p' 然后按回车 -->
<p></p>

<!-- 输入 'span' 然后按回车 -->
<span></span>
```

## HTML 代码片段补全

**设计原则**：只提供CodeMirror原生没有的HTML代码片段，避免重复实现。

#### 1. HTML5文档结构片段
```html
<!-- 输入 'html5' 后选择 -->
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Document</title>
</head>
<body>
	
</body>
</html>
```

#### 2. 常用meta标签片段
```html
<!-- 输入 'meta charset' 后选择 -->
<meta charset="UTF-8">

<!-- 输入 'meta viewport' 后选择 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

#### 3. 资源链接片段
```html
<!-- 输入 'link css' 后选择 -->
<link rel="stylesheet" href="style.css">

<!-- 输入 'script src' 后选择 -->
<script src="script.js"></script>
```

#### 4. 表单结构片段
```html
<!-- 输入 'form' 后选择 -->
<form action="" method="post">
	
</form>

<!-- 输入 'fieldset' 后选择 -->
<fieldset>
	<legend>Legend</legend>
	
</fieldset>
```

#### 5. 列表结构片段
```html
<!-- 输入 'ul list' 后选择 -->
<ul>
	<li></li>
	<li></li>
</ul>

<!-- 输入 'ol list' 后选择 -->
<ol>
	<li></li>
	<li></li>
</ol>
```

#### 6. 表格结构片段
```html
<!-- 输入 'table' 后选择 -->
<table>
	<thead>
		<tr>
			<th></th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td></td>
		</tr>
	</tbody>
</table>
```

#### 7. 语义化布局片段
```html
<!-- 输入 'semantic layout' 后选择 -->
<header>
	
</header>
<main>
	
</main>
<footer>
	
</footer>
```

#### 8. 媒体元素片段
```html
<!-- 输入 'figure' 后选择 -->
<figure>
	<img src="" alt="">
	<figcaption></figcaption>
</figure>
```

#### 9. 数据属性片段
```html
<!-- 输入 'data attribute' 后选择 -->
data-attribute="value"

<!-- 输入 'aria attribute' 后选择 -->
aria-label="value"
```

## CSS 语法补全

**注意**：CSS补全完全使用CodeMirror原生功能，包括：
- 所有CSS属性补全
- 所有CSS值补全
- 颜色名称补全
- 伪类补全
- @规则补全
- 单位补全
- 回车键补全支持

## Less 和 SCSS 语法补全

**设计原则**：Less和SCSS补全 = **CodeMirror原生CSS补全** + **Less/SCSS特有语法补全**

### Less 语法补全
- **原生CSS补全**：所有CSS属性、值、颜色、伪类、@规则、单位
- **Less特有补全**：变量、混合器、嵌套、颜色函数、数学运算、条件语句、循环、导入、命名空间、扩展
- **智能上下文**：根据代码上下文提供相关补全
- **回车键支持**：所有补全功能都支持回车键选择

### SCSS 语法补全
- **原生CSS补全**：所有CSS属性、值、颜色、伪类、@规则、单位
- **SCSS特有补全**：变量、混合器、函数、控制指令、嵌套、占位符、扩展、导入、模块系统、各种函数库
- **智能上下文**：根据代码上下文提供相关补全
- **回车键支持**：所有补全功能都支持回车键选择

## JavaScript 代码片段补全

### 设计原则
**只提供CodeMirror原生没有的功能**，避免重复实现。CodeMirror的`@codemirror/lang-javascript`包已经包含了非常完整的JavaScript补全功能，包括：
- 所有关键字、全局对象、方法、属性
- 智能上下文感知补全
- TypeScript支持
- 回车键补全支持

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

### HTML 上下文感知补全
**CodeMirror原生提供**，包括：

1. **标签上下文**：在 `<tag>` 内提供属性补全
2. **属性上下文**：在属性后提供值补全
3. **智能标签识别**：自动识别自闭合标签
4. **回车键补全**：支持回车键选择补全项

**本项目增强功能**：
1. **智能标签补全**：输入部分标签名，按回车补全完整标签
2. **智能属性补全**：在标签内提供常用属性补全
3. **光标定位优化**：补全后光标定位在合适位置

### CSS 上下文感知补全
**CodeMirror原生提供**，包括：

1. **选择器上下文**：在选择器后提供大括号补全
2. **属性上下文**：在CSS属性后提供冒号补全
3. **值上下文**：在CSS值后提供分号补全
4. **数字上下文**：在数字后提供单位补全
5. **规则上下文**：在CSS规则后提供右大括号补全
6. **回车键补全**：支持回车键选择补全项

### Less 上下文感知补全
**CodeMirror原生 + 自定义提供**，包括：

1. **CSS原生上下文**：所有CSS上下文感知功能
2. **变量上下文**：在@变量后提供值补全
3. **混合器上下文**：在.mixin()后提供参数补全
4. **嵌套上下文**：在&后提供选择器补全
5. **函数上下文**：在颜色函数后提供参数补全
6. **条件上下文**：在when后提供条件补全
7. **导入上下文**：在@import后提供文件路径补全
8. **回车键补全**：支持回车键选择补全项

### SCSS 上下文感知补全
**CodeMirror原生 + 自定义提供**，包括：

1. **CSS原生上下文**：所有CSS上下文感知功能
2. **变量上下文**：在$变量后提供值补全
3. **混合器上下文**：在@mixin后提供参数补全
4. **函数上下文**：在@function后提供参数和返回值补全
5. **控制指令上下文**：在@if、@for、@each后提供条件补全
6. **嵌套上下文**：在&后提供选择器补全
7. **占位符上下文**：在%后提供占位符名称补全
8. **扩展上下文**：在@extend后提供选择器补全
9. **导入上下文**：在@import、@use后提供文件路径补全
10. **模块上下文**：在sass:后提供模块名称补全
11. **函数库上下文**：在math.、color.、string.等后提供函数补全
12. **回车键补全**：支持回车键选择补全项

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
9. **回车键补全**：支持回车键选择补全项

### 排除规则
- 在注释中不提供补全
- 在字符串中不提供补全
- 避免重复的补全选项

## 使用方法

1. 在HTML、CSS或JavaScript编辑器中输入相应的代码
2. 当出现自动补全提示时，按 `Tab` 键或 `Enter` 键选择补全项
3. 也可以使用方向键选择不同的补全选项
4. 使用 `Ctrl+Space` 手动触发补全
5. 对于代码片段，使用 `Tab` 键在占位符之间跳转

### HTML标签补全示例
```html
<!-- 输入 'butt' 然后按回车 -->
butt → <button></button>

<!-- 输入 'div' 然后按回车 -->
div → <div></div>

<!-- 输入 'img' 然后按回车 -->
img → <img  />

<!-- 在 <div 后输入 'class' 然后按回车 -->
<div class → <div class=""></div>
```

## 技术实现

### 原生功能
- **HTML**：通过 `@codemirror/lang-html` 包的 `htmlCompletionSource` 提供
- **CSS**：通过 `@codemirror/lang-css` 包的 `cssCompletionSource` 提供
- **Less**：通过 `@codemirror/lang-less` 包提供语法高亮和基础补全
- **SCSS**：通过 `@codemirror/lang-css` 包提供语法高亮，配合自定义SCSS补全
- **JavaScript**：通过 `@codemirror/lang-javascript` 包提供完整的补全功能

### 自定义功能
- **HTML**：通过 `customHtmlCompletionSource` 提供智能标签和属性补全
- **HTML代码片段**：通过 `htmlSnippetCompletionSource` 提供代码片段补全
- **Less代码片段**：通过 `lessSnippetCompletionSource` 提供Less特有语法补全
- **SCSS代码片段**：通过 `scssSnippetCompletionSource` 提供SCSS特有语法补全
- **JavaScript**：通过 `jsSnippetCompletionSource` 提供代码片段补全
- 使用正则表达式匹配不同的语法模式
- 与原生补全功能结合使用，不重复实现

### 集成方式
```typescript
// HTML 自动补全
export const htmlAutocomplete = autocompletion({
  override: [customHtmlCompletionSource, htmlSnippetCompletionSource, htmlCompletionSource]
});

// CSS 自动补全
export const cssAutocomplete = autocompletion({
  override: [cssCompletionSource]
});

// Less 自动补全
export const lessAutocomplete = autocompletion({
  override: [lessSnippetCompletionSource, cssCompletionSource]
});

// SCSS 自动补全
export const scssAutocomplete = autocompletion({
  override: [scssSnippetCompletionSource, cssCompletionSource]
});

// JavaScript 自动补全
export const jsAutocomplete = autocompletion({
  override: [jsSnippetCompletionSource]
});
```

## 优势

1. **智能标签补全**：支持输入部分标签名，按回车补全完整标签
2. **智能属性补全**：在标签内提供常用属性补全
3. **光标定位优化**：补全后光标定位在合适位置
4. **不重复实现**：只补充CodeMirror原生没有的功能
5. **完美集成**：与原生补全功能无缝结合
6. **智能上下文**：根据代码上下文提供相关补全
7. **性能优化**：避免重复的补全逻辑
8. **维护简单**：代码结构清晰，易于维护
9. **代码片段**：提供实用的代码片段，提高开发效率
10. **回车键支持**：原生支持回车键补全选择

## 总结

本项目的自动补全功能 = **CodeMirror原生补全** + **自定义智能标签补全** + **自定义代码片段补全** + **Less/SCSS特有语法补全**

- **CodeMirror原生**：提供完整的HTML、CSS、JavaScript关键字、对象、方法、属性补全
- **自定义智能标签补全**：支持输入部分标签名，按回车补全完整标签
- **自定义代码片段**：提供实用的代码片段，提高开发效率
- **Less特有补全**：提供变量、混合器、嵌套、函数、条件语句、循环等Less特性
- **SCSS特有补全**：提供变量、混合器、函数、控制指令、模块系统等SCSS特性
- **完美结合**：提供最完整的代码编辑体验
- **实时切换**：支持在CSS、Less、SCSS之间无缝切换
- **回车键支持**：所有补全功能都支持回车键选择 