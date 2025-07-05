# Less 和 SCSS 代码补全功能指南

## 功能概述

本项目为CSS编辑器添加了**Less和SCSS的智能代码补全功能**，与原生CSS补全功能完美结合：

### CodeMirror原生CSS补全功能包含：
- **CSS属性补全**：动态获取浏览器支持的CSS属性
- **CSS值关键字补全**：布局值、定位值、显示值、文本值、颜色值、单位值、函数值等
- **颜色名称补全**：148个标准CSS颜色名称
- **伪类补全**：状态伪类、结构伪类、表单伪类等
- **HTML标签补全**：常用HTML标签
- **@规则补全**：@media、@keyframes、@import等
- **CSS变量补全**：自定义属性（CSS变量）

### 本项目新增的Less和SCSS补全功能：

## Less 代码补全功能

### 1. 变量定义和引用
```less
// 输入 '@variable' 后选择
@variableName: value;

// 输入 '@variable important' 后选择
@variableName: value !important;

// 输入 'less variable interpolation' 后选择
@{variableName}

// 输入 'less string interpolation' 后选择
~"@{variableName}"
```

### 2. 混合器 (Mixins)
```less
// 输入 'less mixin' 后选择
.mixinName() {
	
}

// 输入 'less mixin with param' 后选择
.mixinName(param) {
	
}

// 输入 'less mixin with default' 后选择
.mixinName(param: defaultValue) {
	
}

// 输入 'less mixin with variable' 后选择
.mixinName(@param) {
	
}

// 输入 'call mixin' 后选择
.mixinName();

// 输入 'call mixin with param' 后选择
.mixinName(value);
```

### 3. 嵌套规则
```less
// 输入 'less pseudo' 后选择
&:hover {
	
}

// 输入 'less class' 后选择
&.className {
	
}

// 输入 'less attribute' 后选择
&[attribute] {
	
}
```

### 4. 颜色函数
```less
// 输入 'lighten' 后选择
lighten(@color, 10%);

// 输入 'darken' 后选择
darken(@color, 10%);

// 输入 'saturate' 后选择
saturate(@color, 10%);

// 输入 'desaturate' 后选择
desaturate(@color, 10%);

// 输入 'fadein' 后选择
fadein(@color, 10%);

// 输入 'fadeout' 后选择
fadeout(@color, 10%);

// 输入 'spin' 后选择
spin(@color, 10);

// 输入 'mix' 后选择
mix(@color1, @color2, 50%);

// 输入 'contrast' 后选择
contrast(@color);
```

### 5. 数学运算
```less
// 输入 'less addition' 后选择
value + value;

// 输入 'less subtraction' 后选择
value - value;

// 输入 'less multiplication' 后选择
value * value;

// 输入 'less division' 后选择
value / value;
```

### 6. 条件语句
```less
// 输入 'less when' 后选择
when (condition) {
	
}

// 输入 'less when not' 后选择
when not (condition) {
	
}

// 输入 'less when and' 后选择
when (condition) and (condition) {
	
}

// 输入 'less when or' 后选择
when (condition) or (condition) {
	
}
```

### 7. 循环
```less
// 输入 'less loop' 后选择
.loop(@counter) when (@counter > 0) {
	
	.loop(@counter - 1);
}
```

### 8. 导入
```less
// 输入 'less import' 后选择
@import "file.less";

// 输入 'less import css' 后选择
@import (less) "file.css";

// 输入 'less import reference' 后选择
@import (reference) "file.less";

// 输入 'less import inline' 后选择
@import (inline) "file.less";
```

### 9. 命名空间
```less
// 输入 'less namespace' 后选择
#namespace() {
	
}

// 输入 'call namespace mixin' 后选择
#namespace > .mixin();
```

### 10. 扩展
```less
// 输入 'less extend' 后选择
&:extend(.class);

// 输入 'less extend all' 后选择
&:extend(.class all);
```

### 11. 父选择器引用
```less
// 输入 'less parent selector' 后选择
& {
	
}
```

## SCSS 代码补全功能

### 1. 变量定义和引用
```scss
// 输入 'scss variable' 后选择
$variableName: value;

// 输入 'scss variable default' 后选择
$variableName: value !default;

// 输入 'scss variable global' 后选择
$variableName: value !global;

// 输入 'scss interpolation' 后选择
#{expression}
```

### 2. 混合器 (Mixins)
```scss
// 输入 'scss mixin' 后选择
@mixin mixinName {
	
}

// 输入 'scss mixin with param' 后选择
@mixin mixinName($param) {
	
}

// 输入 'scss mixin with default' 后选择
@mixin mixinName($param: defaultValue) {
	
}

// 输入 'scss mixin with rest' 后选择
@mixin mixinName($param...) {
	
}

// 输入 'include mixin' 后选择
@include mixinName;

// 输入 'include mixin with param' 后选择
@include mixinName(value);
```

### 3. 函数
```scss
// 输入 'scss function' 后选择
@function functionName($param) {
	@return value;
}

// 输入 'scss function typed' 后选择
@function functionName($param: type) {
	@return value;
}
```

### 4. 控制指令
```scss
// 输入 'scss if' 后选择
@if condition {
	
}

// 输入 'scss if else' 后选择
@if condition {
	
} @else {
	
}

// 输入 'scss if else if' 后选择
@if condition {
	
} @else if condition {
	
}

// 输入 'scss for through' 后选择
@for $i from 1 through 10 {
	
}

// 输入 'scss for to' 后选择
@for $i from 1 to 10 {
	
}

// 输入 'scss each' 后选择
@each $item in list {
	
}

// 输入 'scss each with index' 后选择
@each $item, $index in list {
	
}

// 输入 'scss while' 后选择
@while condition {
	
}
```

### 5. 嵌套规则
```scss
// 输入 'scss pseudo' 后选择
&:hover {
	
}

// 输入 'scss class' 后选择
&.className {
	
}

// 输入 'scss attribute' 后选择
&[attribute] {
	
}

// 输入 'scss pseudo element' 后选择
&::before {
	
}
```

### 6. 占位符选择器
```scss
// 输入 'scss placeholder' 后选择
%placeholderName {
	
}

// 输入 'extend placeholder' 后选择
@extend %placeholderName;
```

### 7. 扩展
```scss
// 输入 'scss extend' 后选择
@extend .class;

// 输入 'scss extend optional' 后选择
@extend .class !optional;
```

### 8. 导入和模块系统
```scss
// 输入 'scss import' 后选择
@import "file";

// 输入 'scss import as' 后选择
@import "file" as namespace;

// 输入 'scss import with' 后选择
@import "file" with (config);

// 输入 'scss use' 后选择
@use "file";

// 输入 'scss use as' 后选择
@use "file" as namespace;

// 输入 'scss use with' 后选择
@use "file" with (config);

// 输入 'scss forward' 后选择
@forward "file";
```

### 9. 模块系统
```scss
// 输入 'use sass math' 后选择
@use "sass:math";

// 输入 'use sass color' 后选择
@use "sass:color";

// 输入 'use sass string' 后选择
@use "sass:string";

// 输入 'use sass list' 后选择
@use "sass:list";

// 输入 'use sass map' 后选择
@use "sass:map";

// 输入 'use sass selector' 后选择
@use "sass:selector";

// 输入 'use sass meta' 后选择
@use "sass:meta";
```

### 10. 颜色函数
```scss
// 输入 'lighten' 后选择
lighten($color, 10%);

// 输入 'darken' 后选择
darken($color, 10%);

// 输入 'saturate' 后选择
saturate($color, 10%);

// 输入 'desaturate' 后选择
desaturate($color, 10%);

// 输入 'adjust-hue' 后选择
adjust-hue($color, 10deg);

// 输入 'fade-in' 后选择
fade-in($color, 0.1);

// 输入 'fade-out' 后选择
fade-out($color, 0.1);

// 输入 'mix' 后选择
mix($color1, $color2, 50%);

// 输入 'complement' 后选择
complement($color);

// 输入 'invert' 后选择
invert($color);
```

### 11. 数学函数
```scss
// 输入 'math.div' 后选择
math.div(dividend, divisor);

// 输入 'math.percentage' 后选择
math.percentage(number);

// 输入 'math.round' 后选择
math.round(number);

// 输入 'math.ceil' 后选择
math.ceil(number);

// 输入 'math.floor' 后选择
math.floor(number);

// 输入 'math.abs' 后选择
math.abs(number);

// 输入 'math.min' 后选择
math.min(number1, number2);

// 输入 'math.max' 后选择
math.max(number1, number2);
```

### 12. 字符串函数
```scss
// 输入 'string.quote' 后选择
string.quote(string);

// 输入 'string.unquote' 后选择
string.unquote(string);

// 输入 'string.index' 后选择
string.index(string, substring);

// 输入 'string.insert' 后选择
string.insert(string, substring, index);

// 输入 'string.length' 后选择
string.length(string);

// 输入 'string.slice' 后选择
string.slice(string, start, end);
```

### 13. 列表函数
```scss
// 输入 'list.append' 后选择
list.append(list, value);

// 输入 'list.index' 后选择
list.index(list, value);

// 输入 'list.join' 后选择
list.join(list, separator);

// 输入 'list.length' 后选择
list.length(list);

// 输入 'list.nth' 后选择
list.nth(list, n);

// 输入 'list.set-nth' 后选择
list.set-nth(list, n, value);
```

### 14. 映射函数
```scss
// 输入 'map.get' 后选择
map.get(map, key);

// 输入 'map.set' 后选择
map.set(map, key, value);

// 输入 'map.has-key' 后选择
map.has-key(map, key);

// 输入 'map.keys' 后选择
map.keys(map);

// 输入 'map.values' 后选择
map.values(map);

// 输入 'map.merge' 后选择
map.merge(map1, map2);
```

### 15. 选择器函数
```scss
// 输入 'selector.append' 后选择
selector.append(selector1, selector2);

// 输入 'selector.extend' 后选择
selector.extend(selector, extendee, extender);

// 输入 'selector.replace' 后选择
selector.replace(selector, original, replacement);

// 输入 'selector.unify' 后选择
selector.unify(selector1, selector2);
```

### 16. 元数据函数
```scss
// 输入 'meta.type-of' 后选择
meta.type-of(value);

// 输入 'meta.calc-args' 后选择
meta.calc-args(calc);

// 输入 'meta.calc-name' 后选择
meta.calc-name(calc);

// 输入 'meta.global-variable-exists' 后选择
meta.global-variable-exists(name);

// 输入 'meta.function-exists' 后选择
meta.function-exists(name);

// 输入 'meta.mixin-exists' 后选择
meta.mixin-exists(name);
```

### 17. 父选择器引用
```scss
// 输入 'scss parent selector' 后选择
& {
	
}
```

### 18. 注释
```scss
// 输入 'scss single line comment' 后选择
// comment

// 输入 'scss multi line comment' 后选择
/* comment */
```

## 使用方法

1. 在CSS编辑器中，点击语言选择器选择"LESS"或"SCSS"
2. 编辑器会自动切换到相应的语言模式
3. 开始输入代码，当出现自动补全提示时，按 `Tab` 键或 `Enter` 键选择补全项
4. 也可以使用方向键选择不同的补全选项
5. 使用 `Ctrl+Space` 手动触发补全
6. 对于代码片段，使用 `Tab` 键在占位符之间跳转

## 技术实现

### 语言包支持
- **Less**：使用 `@codemirror/lang-less` 包提供语法高亮和基础补全
- **SCSS**：使用 `@codemirror/lang-css` 包提供语法高亮，配合自定义SCSS补全

### 自动补全集成
```typescript
// Less 自动补全
export const lessAutocomplete = autocompletion({
  override: [lessSnippetCompletionSource, cssCompletionSource],
  defaultKeymap: true,
  maxRenderedOptions: 50
});

// SCSS 自动补全
export const scssAutocomplete = autocompletion({
  override: [scssSnippetCompletionSource, cssCompletionSource],
  defaultKeymap: true,
  maxRenderedOptions: 50
});
```

### 编辑器集成
```typescript
// 根据CSS语言选择对应的扩展和自动补全
switch (cssLanguage) {
  case 'less':
    cssExtension = less();
    cssAutocompleteExt = lessAutocomplete;
    break;
  case 'scss':
    cssExtension = css(); // SCSS使用CSS语言包，但添加SCSS特有的自动补全
    cssAutocompleteExt = scssAutocomplete;
    break;
  case 'css':
  default:
    cssExtension = css();
    cssAutocompleteExt = cssAutocomplete;
    break;
}
```

## 优势

1. **完整的Less支持**：包含变量、混合器、嵌套、函数、条件语句、循环等所有Less特性
2. **完整的SCSS支持**：包含变量、混合器、函数、控制指令、模块系统等所有SCSS特性
3. **智能上下文感知**：根据代码上下文提供相关补全
4. **与原生CSS完美结合**：Less和SCSS补全与原生CSS补全无缝集成
5. **代码片段支持**：提供实用的代码片段，提高开发效率
6. **回车键支持**：所有补全功能都支持回车键选择
7. **语法高亮**：Less使用专门的语法高亮，SCSS使用CSS语法高亮
8. **实时切换**：可以在CSS、Less、SCSS之间实时切换，编辑器会自动重新初始化

## 总结

本项目的Less和SCSS自动补全功能 = **CodeMirror原生CSS补全** + **Less特有语法补全** + **SCSS特有语法补全**

- **CodeMirror原生CSS**：提供完整的CSS属性、值、颜色、伪类等补全
- **Less特有补全**：提供变量、混合器、嵌套、函数、条件语句、循环等Less特性
- **SCSS特有补全**：提供变量、混合器、函数、控制指令、模块系统等SCSS特性
- **完美结合**：提供最完整的CSS预处理器编辑体验
- **实时切换**：支持在CSS、Less、SCSS之间无缝切换 