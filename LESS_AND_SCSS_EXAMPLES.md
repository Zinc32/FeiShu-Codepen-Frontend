# Less 和 SCSS 示例代码

## Less 示例

### 1. 变量和混合器
```less
// 变量定义
@primary-color: #007bff;
@secondary-color: #6c757d;
@border-radius: 4px;
@font-size-base: 16px;

// 混合器定义
.button-mixin(@bg-color: @primary-color, @text-color: white) {
  background-color: @bg-color;
  color: @text-color;
  border: none;
  border-radius: @border-radius;
  padding: 8px 16px;
  font-size: @font-size-base;
  cursor: pointer;
  
  &:hover {
    background-color: darken(@bg-color, 10%);
  }
  
  &:active {
    background-color: darken(@bg-color, 20%);
  }
}

// 使用混合器
.btn-primary {
  .button-mixin();
}

.btn-secondary {
  .button-mixin(@secondary-color);
}

.btn-custom {
  .button-mixin(#28a745, #fff);
}
```

### 2. 嵌套和父选择器
```less
.navbar {
  background-color: @primary-color;
  padding: 1rem;
  
  &-brand {
    font-weight: bold;
    color: white;
  }
  
  &-nav {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    
    li {
      margin-right: 1rem;
      
      &:last-child {
        margin-right: 0;
      }
      
      a {
        color: white;
        text-decoration: none;
        
        &:hover {
          color: lighten(@primary-color, 30%);
        }
      }
    }
  }
}
```

### 3. 条件语句和循环
```less
// 条件语句
.generate-columns(@n, @i: 1) when (@i =< @n) {
  .col-@{i} {
    width: percentage(@i / @n);
  }
  .generate-columns(@n, @i + 1);
}

// 生成12列网格
.generate-columns(12);

// 颜色主题循环
@colors: red, blue, green, yellow, purple;

.generate-color-classes(@i: 1) when (@i =< length(@colors)) {
  @color: extract(@colors, @i);
  .bg-@{color} {
    background-color: @color;
  }
  .text-@{color} {
    color: @color;
  }
  .generate-color-classes(@i + 1);
}

.generate-color-classes();
```

### 4. 数学运算和函数
```less
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
  
  @media (max-width: 768px) {
    padding: 0 10px;
  }
}

.card {
  background: white;
  border-radius: @border-radius;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
  
  &-title {
    font-size: @font-size-base * 1.25;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  
  &-body {
    font-size: @font-size-base * 0.875;
    line-height: 1.5;
  }
}
```

## SCSS 示例

### 1. 变量和混合器
```scss
// 变量定义
$primary-color: #007bff;
$secondary-color: #6c757d;
$border-radius: 4px;
$font-size-base: 16px;

// 混合器定义
@mixin button-mixin($bg-color: $primary-color, $text-color: white) {
  background-color: $bg-color;
  color: $text-color;
  border: none;
  border-radius: $border-radius;
  padding: 8px 16px;
  font-size: $font-size-base;
  cursor: pointer;
  
  &:hover {
    background-color: darken($bg-color, 10%);
  }
  
  &:active {
    background-color: darken($bg-color, 20%);
  }
}

// 使用混合器
.btn-primary {
  @include button-mixin();
}

.btn-secondary {
  @include button-mixin($secondary-color);
}

.btn-custom {
  @include button-mixin(#28a745, #fff);
}
```

### 2. 函数和控制指令
```scss
// 函数定义
@function calculate-width($columns, $total-columns: 12) {
  @return percentage($columns / $total-columns);
}

@function get-color($color-name) {
  $colors: (
    'primary': $primary-color,
    'secondary': $secondary-color,
    'success': #28a745,
    'danger': #dc3545,
    'warning': #ffc107,
    'info': #17a2b8
  );
  
  @return map-get($colors, $color-name);
}

// 控制指令
@for $i from 1 through 12 {
  .col-#{$i} {
    width: calculate-width($i);
  }
}

$breakpoints: (
  'sm': 576px,
  'md': 768px,
  'lg': 992px,
  'xl': 1200px
);

@each $name, $width in $breakpoints {
  @media (min-width: $width) {
    .container-#{$name} {
      max-width: $width;
    }
  }
}
```

### 3. 嵌套和占位符
```scss
// 占位符选择器
%card-base {
  background: white;
  border-radius: $border-radius;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
}

%button-base {
  border: none;
  border-radius: $border-radius;
  padding: 8px 16px;
  font-size: $font-size-base;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

// 使用占位符
.card {
  @extend %card-base;
  
  &-title {
    font-size: $font-size-base * 1.25;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  
  &-body {
    font-size: $font-size-base * 0.875;
    line-height: 1.5;
  }
  
  &-footer {
    border-top: 1px solid #dee2e6;
    padding-top: 0.5rem;
    margin-top: 1rem;
  }
}

.btn {
  @extend %button-base;
  
  &-primary {
    @extend %button-base;
    background-color: $primary-color;
    color: white;
    
    &:hover {
      background-color: darken($primary-color, 10%);
    }
  }
  
  &-secondary {
    @extend %button-base;
    background-color: $secondary-color;
    color: white;
    
    &:hover {
      background-color: darken($secondary-color, 10%);
    }
  }
}
```

### 4. 模块系统
```scss
// 使用Sass模块
@use "sass:math";
@use "sass:color";
@use "sass:string";

// 数学函数
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 math.div(30px, 2);
  
  @media (max-width: 768px) {
    padding: 0 10px;
  }
}

// 颜色函数
.theme {
  &-light {
    background-color: color.adjust($primary-color, $lightness: 20%);
    color: color.adjust($primary-color, $lightness: -20%);
  }
  
  &-dark {
    background-color: color.adjust($primary-color, $lightness: -20%);
    color: color.adjust($primary-color, $lightness: 20%);
  }
}

// 字符串函数
.icon {
  &::before {
    content: string.quote("📱");
    margin-right: 0.5rem;
  }
  
  &-home::before {
    content: string.quote("🏠");
  }
  
  &-user::before {
    content: string.quote("👤");
  }
}
```

### 5. 高级特性
```scss
// 条件语句
@mixin responsive($breakpoint) {
  @if $breakpoint == 'mobile' {
    @media (max-width: 767px) {
      @content;
    }
  } @else if $breakpoint == 'tablet' {
    @media (min-width: 768px) and (max-width: 1023px) {
      @content;
    }
  } @else if $breakpoint == 'desktop' {
    @media (min-width: 1024px) {
      @content;
    }
  }
}

// 使用条件语句
.navbar {
  display: flex;
  align-items: center;
  
  @include responsive('mobile') {
    flex-direction: column;
    padding: 0.5rem;
  }
  
  @include responsive('tablet') {
    padding: 1rem;
  }
  
  @include responsive('desktop') {
    padding: 1.5rem;
  }
}

// 循环和列表
$spacers: (0, 0.25, 0.5, 1, 1.5, 3);

@each $spacer in $spacers {
  $index: index($spacers, $spacer);
  .m-#{$index - 1} {
    margin: $spacer * 1rem;
  }
  
  .p-#{$index - 1} {
    padding: $spacer * 1rem;
  }
}
```

## 测试建议

1. **Less测试**：
   - 在CSS编辑器中选择"LESS"语言
   - 输入`@`测试变量补全
   - 输入`.`测试混合器补全
   - 输入`&`测试父选择器补全
   - 输入`lighten`测试颜色函数补全
   - 输入`when`测试条件语句补全

2. **SCSS测试**：
   - 在CSS编辑器中选择"SCSS"语言
   - 输入`$`测试变量补全
   - 输入`@mixin`测试混合器补全
   - 输入`@function`测试函数补全
   - 输入`@if`测试控制指令补全
   - 输入`%`测试占位符补全
   - 输入`@use`测试模块系统补全
   - 输入`math.`测试数学函数补全

3. **切换测试**：
   - 在CSS、Less、SCSS之间切换，验证编辑器正确重新初始化
   - 验证每种语言都有相应的语法高亮
   - 验证每种语言都有相应的自动补全功能 