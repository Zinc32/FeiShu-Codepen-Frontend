import { htmlCompletionSource } from '@codemirror/lang-html';
import { cssCompletionSource } from '@codemirror/lang-css';
import { javascriptLanguage } from '@codemirror/lang-javascript';
import { bracketMatching } from '@codemirror/language';//括号匹配高亮
import { autocompletion, CompletionContext, CompletionSource, snippetCompletion } from '@codemirror/autocomplete';
import { keymap } from '@codemirror/view';

// 常用 HTML5 标签（用于标签补全）
const htmlTags = [
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
  'form', 'input', 'button', 'textarea', 'select', 'option', 'label', 'fieldset', 'legend', 'section', 'article',
  'header', 'footer', 'nav', 'aside', 'main', 'figure', 'figcaption', 'blockquote', 'code', 'pre', 'em', 'strong',
  'b', 'i', 'u', 'br', 'hr', 'iframe', 'video', 'audio', 'canvas', 'svg', 'path', 'circle', 'rect', 'line', 'text'
];

// 自闭合标签列表
const selfClosingTags = [
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
];

// HTML 标签补全源（支持输入部分标签名补全）
export const htmlTagCompletionSource: CompletionSource = (context: CompletionContext) => {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from == word.to && !context.explicit)) return null;

  const line = context.state.doc.lineAt(context.pos);
  const beforeCursor = line.text.slice(0, context.pos - line.from);
  
  // 检查是否在注释中
  const inComment = /<!--.*-->$/.test(beforeCursor);
  
  if (inComment) {
    return null; // 在注释中不提供补全
  }
  
  // 检查是否在标签内（<tag> 或 <tag attr>）
  const inTag = /<[^>]*$/.test(beforeCursor);
  
  if (inTag) {
    // 在标签内提供属性补全，自动添加 ="" 
    const commonAttributes = [
      'class', 'id', 'style', 'title', 'alt', 'src', 'href', 'type', 'name', 'value',
      'placeholder', 'required', 'disabled', 'readonly', 'maxlength', 'minlength',
      'pattern', 'autocomplete', 'autofocus', 'form', 'list', 'multiple', 'size',
      'step', 'min', 'max', 'checked', 'selected', 'hidden', 'target', 'rel',
      'download', 'hreflang', 'media', 'sizes', 'integrity', 'crossorigin',
      'async', 'defer', 'charset', 'content', 'http-equiv', 'name', 'property',
      'data-', 'aria-', 'role', 'tabindex', 'accesskey', 'draggable', 'spellcheck',
      'contenteditable', 'translate', 'dir', 'lang', 'xml:lang', 'xml:space'
    ];
    
    const attributeSnippets = commonAttributes.map(attr => {
      if (attr === 'data-' || attr === 'aria-') {
        // 对于data-和aria-属性，提供模板
        return snippetCompletion(`${attr}\${1:attribute}="\${2:value}"`, { label: attr });
      } else {
        // 普通属性，自动添加 =""
        return snippetCompletion(`${attr}="\${1}"`, { label: attr });
      }
    });
    //返回补全结果，from: word.from 表示补全结果的起始位置，options: attributeSnippets 表示补全选项，validFor: /\w*/ 表示补全的正则表达式
    return {
      from: word.from,
      options: attributeSnippets,
      validFor: /\w*/
    };
  }
  
  // 提供标签补全（使用snippetCompletion）
  const tagSnippets = htmlTags.map(tag => {
    if (selfClosingTags.includes(tag)) {
      // 自闭合标签，光标定位在属性位置
      return snippetCompletion(`<${tag} \${1} />`, { label: tag });
    } else {
      // 普通标签，光标定位在内容内
      return snippetCompletion(`<${tag}>\${1}</${tag}>`, { label: tag });
    }
  });
  
   // 只提供一些常用的HTML代码片段（CodeMirror原生没有的）
   const htmlSnippets = [
    // 常用的HTML结构片段
    snippetCompletion('<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<meta charset="UTF-8">\n\t<meta name="viewport" content="width=device-width, initial-scale=1.0">\n\t<title>${1:Document}</title>\n</head>\n<body>\n\t${2}\n</body>\n</html>', { label: 'html5' }),
    snippetCompletion('<meta charset="UTF-8">', { label: 'meta charset' }),
    snippetCompletion('<meta name="viewport" content="width=device-width, initial-scale=1.0">', { label: 'meta viewport' }),
    snippetCompletion('<link rel="stylesheet" href="${1:style.css}">', { label: 'link css' }),
    snippetCompletion('<script src="${1:script.js}"></script>', { label: 'script src' }),
    // 常用的表单结构
    snippetCompletion('<form action="${1}" method="${2:post}">\n\t${3}\n</form>', { label: 'form' }),
    snippetCompletion('<fieldset>\n\t<legend>${1:Legend}</legend>\n\t${2}\n</fieldset>', { label: 'fieldset' }),
    // 常用的列表结构
    snippetCompletion('<ul>\n\t<li>${1}</li>\n\t<li>${2}</li>\n</ul>', { label: 'ul list' }),
    snippetCompletion('<ol>\n\t<li>${1}</li>\n\t<li>${2}</li>\n</ol>', { label: 'ol list' }),
    // 常用的表格结构
    snippetCompletion('<table>\n\t<thead>\n\t\t<tr>\n\t\t\t<th>${1}</th>\n\t\t</tr>\n\t</thead>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>${2}</td>\n\t\t</tr>\n\t</tbody>\n</table>', { label: 'table' }),
    // 常用的语义化结构
    snippetCompletion('<header>\n\t${1}\n</header>\n<main>\n\t${2}\n</main>\n<footer>\n\t${3}\n</footer>', { label: 'semantic layout' }),
    // 常用的媒体元素
    snippetCompletion('<figure>\n\t<img src="${1}" alt="${2}">\n\t<figcaption>${3}</figcaption>\n</figure>', { label: 'figure' }),
    // 常用的数据属性
    snippetCompletion('data-${1:attribute}="${2:value}"', { label: 'data attribute' }),
    snippetCompletion('aria-${1:label}="${2:value}"', { label: 'aria attribute' })
  ];

  return {
    from: word.from,
    options: tagSnippets,
    validFor: /\w*/
  };
};

// HTML 自动补全（使用标签补全 + 代码片段 + CodeMirror原生）
export const htmlAutocomplete = autocompletion({
  override: [htmlTagCompletionSource, htmlCompletionSource],
  defaultKeymap: true,
  maxRenderedOptions: 50
});


// CSS 代码片段补全源（增强的CSS补全功能）
export const cssSnippetCompletionSource: CompletionSource = (context: CompletionContext) => {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from == word.to && !context.explicit)) return null;
  
  const line = context.state.doc.lineAt(context.pos);
  const beforeCursor = line.text.slice(0, context.pos - line.from);
  
  // 检查是否在注释中
  const inComment = /\/\*.*\*\/$/.test(beforeCursor) || /\/\/.*$/.test(beforeCursor);
  
  if (inComment) {
    return null; // 在注释中不提供补全
  }
  
  // 检查是否在字符串中
  const inString = /["'][^"']*$/.test(beforeCursor);
  
  if (inString) {
    return null; // 在字符串中不提供补全
  }
  
  // 检查是否在属性值中（冒号后面）
  const inPropertyValue = /:\s*[^;]*$/.test(beforeCursor);
  
  // 如果在属性值中，优先提供单位补全
  if (inPropertyValue) {
    // 匹配数字（包括多个数字，如 100, 200, 300）
    // 使用更精确的匹配，确保匹配到光标位置的数字
    const numberMatch = beforeCursor.match(/(\d+(?:\.\d+)?)\s*$/);
    if (numberMatch) {
      const number = numberMatch[1];
      const units = [
        { label: 'px', insert: 'px' },
        { label: 'rem', insert: 'rem' },
        { label: 'em', insert: 'em' },
        { label: '%', insert: '%' },
        { label: 'vw', insert: 'vw' },
        { label: 'vh', insert: 'vh' },
        { label: 'pt', insert: 'pt' },
        { label: 'pc', insert: 'pc' },
        { label: 'in', insert: 'in' },
        { label: 'cm', insert: 'cm' },
        { label: 'mm', insert: 'mm' },
        { label: 'deg', insert: 'deg' },
        { label: 'rad', insert: 'rad' },
        { label: 'turn', insert: 'turn' },
        { label: 's', insert: 's' },
        { label: 'ms', insert: 'ms' },
        { label: 'Hz', insert: 'Hz' },
        { label: 'kHz', insert: 'kHz' }
      ];
      
      return {
        from: context.pos,
        options: units.map(unit => ({
          label: unit.label, // 只显示单位名称
          apply: unit.insert,
          type: 'unit'
        })),
        validFor: /\w*/
      };
    }
  }
  
  // 常用CSS属性代码片段
  //补全时加上；
  const cssSnippets = [
    // Font相关 - 特殊处理font关键词
    ...(word.text === 'font' ? [
      snippetCompletion('font-size: ${1};', { label: 'font-size' }),
      snippetCompletion('font-weight: ${1};', { label: 'font-weight' }),
      snippetCompletion('font-family: ${1};', { label: 'font-family' }),
      snippetCompletion('font-style: ${1};', { label: 'font-style' }),
      snippetCompletion('font-variant: ${1};', { label: 'font-variant' }),
      snippetCompletion('font-stretch: ${1};', { label: 'font-stretch' }),
      snippetCompletion('font-size-adjust: ${1};', { label: 'font-size-adjust' }),
      snippetCompletion('font: ${1};', { label: 'font shorthand' })
    ] : [
      snippetCompletion('font-size: ${1};', { label: 'font-size' }),
      snippetCompletion('font-weight: ${1};', { label: 'font-weight' }),
      snippetCompletion('font-family: ${1};', { label: 'font-family' }),
      snippetCompletion('font-style: ${1};', { label: 'font-style' }),
      snippetCompletion('font-variant: ${1};', { label: 'font-variant' }),
      snippetCompletion('font-stretch: ${1};', { label: 'font-stretch' }),
      snippetCompletion('font-size-adjust: ${1};', { label: 'font-size-adjust' }),
      snippetCompletion('font: ${1};', { label: 'font shorthand' })
    ]),
    snippetCompletion('line-height: ${1};', { label: 'line-height' }),
    snippetCompletion('text-align: ${1};', { label: 'text-align' }),
    snippetCompletion('text-decoration: ${1};', { label: 'text-decoration' }),
    snippetCompletion('text-transform: ${1};', { label: 'text-transform' }),
    
    // Layout相关
    snippetCompletion('display: ${1};', { label: 'display' }),
    snippetCompletion('position: ${1};', { label: 'position' }),
    snippetCompletion('top: ${1};', { label: 'top' }),
    snippetCompletion('right: ${1};', { label: 'right' }),
    snippetCompletion('bottom: ${1};', { label: 'bottom' }),
    snippetCompletion('left: ${1};', { label: 'left' }),
    snippetCompletion('width: ${1};', { label: 'width' }),
    snippetCompletion('height: ${1};', { label: 'height' }),
    snippetCompletion('max-width: ${1};', { label: 'max-width' }),
    snippetCompletion('max-height: ${1};', { label: 'max-height' }),
    snippetCompletion('min-width: ${1};', { label: 'min-width' }),
    snippetCompletion('min-height: ${1};', { label: 'min-height' }),
    
    // Margin和Padding
    snippetCompletion('margin: ${1};', { label: 'margin' }),
    snippetCompletion('margin-top: ${1};', { label: 'margin-top' }),
    snippetCompletion('margin-right: ${1};', { label: 'margin-right' }),
    snippetCompletion('margin-bottom: ${1};', { label: 'margin-bottom' }),
    snippetCompletion('margin-left: ${1};', { label: 'margin-left' }),
    snippetCompletion('padding: ${1};', { label: 'padding' }),
    snippetCompletion('padding-top: ${1};', { label: 'padding-top' }),
    snippetCompletion('padding-right: ${1};', { label: 'padding-right' }),
    snippetCompletion('padding-bottom: ${1};', { label: 'padding-bottom' }),
    snippetCompletion('padding-left: ${1};', { label: 'padding-left' }),
    
    // Border相关
    snippetCompletion('border: ${1};', { label: 'border' }),
    snippetCompletion('border-width: ${1};', { label: 'border-width' }),
    snippetCompletion('border-style: ${1};', { label: 'border-style' }),
    snippetCompletion('border-color: ${1};', { label: 'border-color' }),
    snippetCompletion('border-radius: ${1};', { label: 'border-radius' }),
    
    // Background相关
    snippetCompletion('background: ${1};', { label: 'background' }),
    snippetCompletion('background-color: ${1};', { label: 'background-color' }),
    snippetCompletion('background-image: ${1};', { label: 'background-image' }),
    snippetCompletion('background-size: ${1};', { label: 'background-size' }),
    snippetCompletion('background-position: ${1};', { label: 'background-position' }),
    snippetCompletion('background-repeat: ${1};', { label: 'background-repeat' }),
    
    // Flexbox
    snippetCompletion('flex: ${1};', { label: 'flex' }),
    snippetCompletion('flex-direction: ${1};', { label: 'flex-direction' }),
    snippetCompletion('flex-wrap: ${1};', { label: 'flex-wrap' }),
    snippetCompletion('justify-content: ${1};', { label: 'justify-content' }),
    snippetCompletion('align-items: ${1};', { label: 'align-items' }),
    snippetCompletion('align-self: ${1};', { label: 'align-self' }),
    
    // Grid
    snippetCompletion('grid-template-columns: ${1};', { label: 'grid-template-columns' }),
    snippetCompletion('grid-template-rows: ${1};', { label: 'grid-template-rows' }),
    snippetCompletion('grid-gap: ${1};', { label: 'grid-gap' }),
    snippetCompletion('grid-column: ${1};', { label: 'grid-column' }),
    snippetCompletion('grid-row: ${1};', { label: 'grid-row' }),
    
    // Transform和Animation
    snippetCompletion('transform: ${1};', { label: 'transform' }),
    snippetCompletion('transition: ${1};', { label: 'transition' }),
    snippetCompletion('animation: ${1};', { label: 'animation' }),
    snippetCompletion('opacity: ${1};', { label: 'opacity' }),
    snippetCompletion('visibility: ${1};', { label: 'visibility' }),
    
    // 常用简写属性
    snippetCompletion('margin: ${1} ${2} ${3} ${4};', { label: 'margin shorthand' }),
    snippetCompletion('padding: ${1} ${2} ${3} ${4};', { label: 'padding shorthand' }),
    snippetCompletion('border: ${1} ${2} ${3};', { label: 'border shorthand' }),
    snippetCompletion('background: ${1} ${2} ${3} ${4};', { label: 'background shorthand' })
  ];
  
  return {
    from: word.from,
    options: cssSnippets,
    validFor: /\w*/
  };
};

// CSS 自动补全（使用CodeMirror原生 + 自定义代码片段）
export const cssAutocomplete = autocompletion({
  override: [cssSnippetCompletionSource, cssCompletionSource],
  defaultKeymap: true,
  maxRenderedOptions: 50
});

// JavaScript 代码片段补全源（CodeMirror原生没有的代码片段）
export const jsSnippetCompletionSource: CompletionSource = (context: CompletionContext) => {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from == word.to && !context.explicit)) return null;
  
  const line = context.state.doc.lineAt(context.pos);
  const beforeCursor = line.text.slice(0, context.pos - line.from);
  
  // 检查是否在字符串中
  const inString = /["'`][^"'`]*$/.test(beforeCursor);
  
  // 检查是否在注释中
  const inComment = /\/\/.*$/.test(beforeCursor) || /\/\*.*\*\/$/.test(beforeCursor);
  
  if (inComment || inString) {
    return null; // 在注释或字符串中不提供补全
  }
  
  // 常用代码片段（CodeMirror原生没有的代码片段）
  const codeSnippets = [
    snippetCompletion('new Promise((resolve, reject) => {\n\t${1}\n});', { label: 'new Promise' }),
    snippetCompletion('Promise((resolve, reject) => {\n\t${1}\n});', { label: 'Promise' }),
    snippetCompletion('function ${1:name}(${2:params}) {\n\t${3}\n}', { label: 'function' }),
    snippetCompletion('(${1:params}) => {\n\t${2}\n}', { label: 'arrow function' }),
    snippetCompletion('async function ${1:name}(${2:params}) {\n\t${3}\n}', { label: 'async function' }),
    snippetCompletion('async (${1:params}) => {\n\t${2}\n}', { label: 'async arrow' }),
    snippetCompletion('function* ${1:name}(${2:params}) {\n\t${3}\n}', { label: 'generator function' }),
    // 条件语句
    snippetCompletion('if (${1:condition}) {\n\t${2}\n}', { label: 'if' }),
    snippetCompletion('if (${1:condition}) {\n\t${2}\n} else {\n\t${3}\n}', { label: 'if else' }),
    snippetCompletion('else if (${1:condition}) {\n\t${2}\n}', { label: 'else if' }),
    snippetCompletion('switch (${1:expression}) {\n\tcase ${2:value}:\n\t\t${3}\n\t\tbreak;\n\tdefault:\n\t\t${4}\n}', { label: 'switch' }),
    // 循环语句
    snippetCompletion('for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t${3}\n}', { label: 'for' }),
    snippetCompletion('for (const ${1:item} of ${2:array}) {\n\t${3}\n}', { label: 'for of' }),
    snippetCompletion('for (const ${1:key} in ${2:object}) {\n\t${3}\n}', { label: 'for in' }),
    snippetCompletion('while (${1:condition}) {\n\t${2}\n}', { label: 'while' }),
    snippetCompletion('do {\n\t${1}\n} while (${2:condition});', { label: 'do while' }),
    // 错误处理
    snippetCompletion('try {\n\t${1}\n} catch (${2:error}) {\n\t${3}\n}', { label: 'try catch' }),
    snippetCompletion('try {\n\t${1}\n} finally {\n\t${2}\n}', { label: 'try finally' }),
    snippetCompletion('throw new Error(${1:message});', { label: 'throw error' }),
    // 类和对象
    snippetCompletion('class ${1:ClassName} {\n\tconstructor(${2:params}) {\n\t\t${3}\n\t}\n}', { label: 'class' }),
    snippetCompletion('class ${1:ClassName} extends ${2:ParentClass} {\n\tconstructor(${3:params}) {\n\t\t${4}\n\t}\n}', { label: 'class extends' }),
    snippetCompletion('get ${1:propertyName}() {\n\treturn ${2};\n}', { label: 'getter' }),
    snippetCompletion('set ${1:propertyName}(${2:value}) {\n\t${3}\n}', { label: 'setter' }),
    snippetCompletion('static ${1:methodName}(${2:params}) {\n\t${3}\n}', { label: 'static method' }),
    // 模块
    snippetCompletion('import ${1:module} from \'${2:path}\';', { label: 'import' }),
    snippetCompletion('import { ${1:name} } from \'${2:path}\';', { label: 'import destructuring' }),
    snippetCompletion('import * as ${1:alias} from \'${2:path}\';', { label: 'import as' }),
    snippetCompletion('export default ${1};', { label: 'export default' }),
    snippetCompletion('export { ${1} };', { label: 'export named' }),
    // Promise
    snippetCompletion('Promise.resolve(${1});', { label: 'Promise.resolve' }),
    snippetCompletion('Promise.reject(${1});', { label: 'Promise.reject' }),
    // 常用工具函数
    snippetCompletion('JSON.stringify(${1:object});', { label: 'JSON.stringify' }),
    snippetCompletion('JSON.parse(${1:jsonString});', { label: 'JSON.parse' }),
    snippetCompletion('Object.keys(${1:object});', { label: 'Object.keys' }),
    snippetCompletion('Object.values(${1:object});', { label: 'Object.values' }),
    snippetCompletion('Object.entries(${1:object});', { label: 'Object.entries' }),
    snippetCompletion('Array.from(${1:arrayLike});', { label: 'Array.from' }),
    snippetCompletion('Array.isArray(${1:value});', { label: 'Array.isArray' }),
    // DOM 操作
    snippetCompletion('document.getElementById(\'${1:id}\');', { label: 'getElementById' }),
    snippetCompletion('document.querySelector(\'${1:selector}\');', { label: 'querySelector' }),
    snippetCompletion('document.querySelectorAll(\'${1:selector}\');', { label: 'querySelectorAll' }),
    snippetCompletion('${1:element}.addEventListener(\'${2:event}\', (${3:e}) => {\n\t${4}\n});', { label: 'addEventListener' }),
    // 定时器
    snippetCompletion('setTimeout(() => {\n\t${1}\n}, ${2:1000});', { label: 'setTimeout' }),
    snippetCompletion('setInterval(() => {\n\t${1}\n}, ${2:1000});', { label: 'setInterval' }),
    snippetCompletion('requestAnimationFrame(() => {\n\t${1}\n});', { label: 'requestAnimationFrame' }),
    // 常用变量声明
    snippetCompletion('const ${1:obj} = {};', { label: 'const object' }),
    snippetCompletion('const ${1:arr} = [];', { label: 'const array' }),
    snippetCompletion('const ${1:map} = new Map();', { label: 'const map' }),
    snippetCompletion('const ${1:set} = new Set();', { label: 'const set' }),
    // 常用模式
    snippetCompletion('console.log(${1});', { label: 'console.log' }),
    snippetCompletion('console.error(${1});', { label: 'console.error' }),
    snippetCompletion('debugger;', { label: 'debugger' })
  ];
  
  return {
    from: word.from,
    options: codeSnippets,
    validFor: /\w*/
  };
};

// JavaScript 自动补全（使用CodeMirror原生 + 自定义代码片段）
export const jsAutocomplete = autocompletion({
  override: [jsSnippetCompletionSource],
  defaultKeymap: true,
  maxRenderedOptions: 100
});

// 获取JavaScript语言的补全源，包含原生JavaScript补全和自定义代码片段
export const jsCompletionSource = javascriptLanguage.data.of({
  autocomplete: jsAutocomplete
});

// 导出括号高亮匹配扩展
export const bracketMatchingExtension = bracketMatching();

// 自动括号补全扩展
export const closeBracketsExtension = keymap.of([
  {
    key: "(",
    run: (view) => {
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: [{ from, insert: "()" }],
        selection: { anchor: from + 1, head: from + 1 }
      });
      return true;
    }
  },
  {
    key: "[",
    run: (view) => {
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: [{ from, insert: "[]" }],
        selection: { anchor: from + 1, head: from + 1 }
      });
      return true;
    }
  },
  {
    key: "{",
    run: (view) => {
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: [{ from, insert: "{}" }],
        selection: { anchor: from + 1, head: from + 1 }
      });
      return true;
    }
  }
]); 