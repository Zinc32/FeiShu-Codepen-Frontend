import { htmlCompletionSource } from '@codemirror/lang-html';
import { cssCompletionSource } from '@codemirror/lang-css';
import { javascriptLanguage } from '@codemirror/lang-javascript';
import { autocompletion, CompletionContext, CompletionSource, snippetCompletion } from '@codemirror/autocomplete';

// 常用 HTML5 标签
const htmlTags = [
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
  'form', 'input', 'button', 'textarea', 'select', 'option', 'label', 'fieldset', 'legend', 'section', 'article',
  'header', 'footer', 'nav', 'aside', 'main', 'figure', 'figcaption', 'blockquote', 'code', 'pre', 'em', 'strong',
  'b', 'i', 'u', 'br', 'hr', 'iframe', 'video', 'audio', 'canvas', 'svg', 'path', 'circle', 'rect', 'line', 'text'
];

// 常用 HTML 属性
const htmlAttributes = [
  'id', 'class', 'style', 'title', 'alt', 'src', 'href', 'type', 'name', 'value', 'placeholder', 'required',
  'disabled', 'readonly', 'maxlength', 'minlength', 'pattern', 'autocomplete', 'autofocus', 'checked', 'selected',
  'multiple', 'size', 'width', 'height', 'target', 'rel', 'download', 'media', 'controls', 'loop', 'muted',
  'preload', 'poster', 'data-', 'aria-'
];

// 自闭合标签列表
const selfClosingTags = [
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
];

// 自定义 HTML 补全源
export const customHtmlCompletionSource: CompletionSource = (context: CompletionContext) => {
  const word = context.matchBefore(/[\w-]*/);
  if (!word || (word.from == word.to && !context.explicit)) return null;

  const line = context.state.doc.lineAt(context.pos);
  const beforeCursor = line.text.slice(0, context.pos - line.from);
  
  // 通过光标位置检查是否在标签内（<tag> 或 <tag attr>）
  const inTag = /<[^>]*$/.test(beforeCursor);
  
  if (inTag) {
    // 在标签内，提供属性补全
    const options = htmlAttributes.map(attr => {
      if (attr === 'data-') {
        return {
          label: attr,
          type: 'property' as const,
          apply: attr
        };
      } else {
        // 使用snippetCompletion让光标定位到属性值引号内
        return snippetCompletion(`${attr}="\${1}"`, { label: attr });
      }
    });
    
    return {
      from: word.from,
      options,
      validFor: /[\w-]*/
    };
  } else {
    // 不在标签内，提供标签补全（使用snippetCompletion）
    const tagSnippets = htmlTags.map(tag => {
      if (selfClosingTags.includes(tag)) {
        // 自闭合标签，光标定位在属性值引号内
        return snippetCompletion(`<${tag} \${1} />`, { label: tag });
      } else {
        // 普通标签，光标定位在内容内
        return snippetCompletion(`<${tag}>\${1}</${tag}>`, { label: tag });
      }
    });
    
    return {
      from: word.from,
      options: tagSnippets,
      validFor: /[\w-]*/
    };
  }
};

// 增强的 HTML 自动补全
export const htmlAutocomplete = autocompletion({
  override: [customHtmlCompletionSource, htmlCompletionSource],
  defaultKeymap: true,
  maxRenderedOptions: 50
});

export const cssAutocomplete = autocompletion({
  override: [cssCompletionSource],
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
  
  // 获取当前输入的单词
  const currentWord = word.text.toLowerCase();
  
  // 添加调试信息
  console.log('JS补全触发:', { 
    word: word.text, 
    from: word.from, 
    to: word.to, 
    explicit: context.explicit,
    beforeCursor: beforeCursor.slice(-20),
    currentWord
  });
  
  // 常用代码片段（CodeMirror原生没有的代码片段）
  //CodeMirror的占位符语法需要snippets扩展支持,使用@codemirror/autocomplete自带的snippetCompletion工具来实现占位符跳转。
  //snippetCompletion返回一个完整的Completion对象，包含label、apply、type等属性。
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