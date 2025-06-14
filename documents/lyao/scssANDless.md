实现支持scss和less的功能

关键代码

```react
// 编译 CSS 预处理器代码
const compileCss = useCallback(async (code: string, language: 'scss' | 'less') => {
    try {
        if (language === 'scss') {
            const result = sass.compileString(code);
            return result.css;
        } else if (language === 'less') {
            const result = await less.render(code);
            return result.css;
        }
        return code;
    } catch (error) {
        console.error(`Error compiling ${language}:`, error);
        return code;
    }
}, []);

// 当 CSS 代码或语言改变时重新编译
useEffect(() => {
    if (cssLanguage !== 'css') {
        compileCss(cssCode, cssLanguage).then(setCompiledCss);
    } else {
        setCompiledCss(cssCode);
    }
}, [cssCode, cssLanguage, compileCss]);
```

测试代码
HTML

```html
<div class="container">
  <h1 class="title">Hello SCSS/LESS!</h1>
</div>
```

SCSS

```scss
// 变量
$primary-color: #3498db;
$secondary-color: #2ecc71;
$font-stack: Arial, sans-serif;

// 混合器
@mixin flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

// 嵌套规则
.container {
  background-color: $primary-color;
  font-family: $font-stack;
  
  &:hover {
    background-color: darken($primary-color, 10%);
  }
  
  .title {
    color: white;
    @include flex-center;
    
    &:hover {
      color: $secondary-color;
    }
  }
}
```

效果
![image-20250614232541234](assets/image-20250614232541234.png)

LESS

```less
// 变量
@primary-color: #e74c3c;
@secondary-color: #f1c40f;
@font-stack: 'Helvetica Neue', sans-serif;

// 混合器
.flex-center() {
  display: flex;
  justify-content: center;
  align-items: center;
}

// 嵌套规则
.container {
  background-color: @primary-color;
  font-family: @font-stack;
  
  &:hover {
    background-color: darken(@primary-color, 10%);
  }
  
  .title {
    color: white;
    .flex-center();
    
    &:hover {
      color: @secondary-color;
    }
  }
}
```

效果
![image-20250614232416422](assets/image-20250614232416422.png)