# AST补全实现详细指南

## 概述

本文档详细说明了项目中AST补全功能的完整实现逻辑、匹配方式、补全词定义位置以及补全提示框的显示机制。

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    CodeMirror Editor                        │
├─────────────────────────────────────────────────────────────┤
│                 autocompletion() 扩展                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ smartCompletion │  │ jsSnippetComp   │  │ 原生JS补全   │ │
│  │     Source      │  │    Source       │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│              AST补全服务 (astCompletionService.ts)          │
├─────────────────────────────────────────────────────────────┤
│              AST分析服务 (astAnalysisService.ts)            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ SmartCodeAnalyzer│  │ ContextAnalyzer │  │NodeFinder    │ │
│  │ (智能代码分析)   │  │ (上下文分析)    │  │ (节点查找)   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 1. 补全触发机制

### 1.1 触发条件

AST补全在以下情况下触发：

1. **用户输入**：当用户输入 `.` 时触发属性访问补全
2. **手动触发**：按 `Ctrl+Space` 手动触发补全
3. **自动触发**：CodeMirror检测到可能的补全机会

### 1.2 触发检测逻辑

```typescript
// 在 smartCompletionSource 中
const beforeCursor = code.slice(0, context.pos);
const memberAccessMatch = beforeCursor.match(/(\w+)\.\s*$/);

if (memberAccessMatch) {
  const objectName = memberAccessMatch[1];
  // 触发智能补全
}
```

**匹配正则表达式**：`/(\w+)\.\s*$/`
- `(\w+)`：匹配变量名（字母、数字、下划线）
- `\.`：匹配点号
- `\s*`：匹配可选的空白字符
- `$`：匹配行尾

## 2. 补全词定义位置

### 2.1 智能代码分析器 (SmartCodeAnalyzer)

**位置**：`astCompletionService.ts` 第239-483行

**功能**：动态分析用户代码，提取变量定义和类型信息

```typescript
class SmartCodeAnalyzer {
  private variableDefinitions = new Map<string, VariableDefinition>();
  
  // 分析代码并提取变量定义
  analyzeCode(code: string): void {
    this.variableDefinitions.clear();
    this.analyzeVariableDefinitions(code);
  }
  
  // 获取变量的补全建议
  getCompletionsForVariable(varName: string): CompletionItem[] {
    const definition = this.variableDefinitions.get(varName);
    if (!definition) return [];
    
    const completions: CompletionItem[] = [];
    
    // 添加属性
    definition.properties.forEach((prop, propName) => {
      completions.push({
        label: propName,
        insertText: propName,
        kind: 'property',
        detail: prop.type,
        documentation: prop.documentation
      });
    });
    
    // 添加方法
    definition.methods.forEach((method, methodName) => {
      const insertText = method.type === 'method' ? `${methodName}()` : methodName;
      completions.push({
        label: methodName,
        insertText: insertText,
        kind: method.type === 'method' ? 'method' : 'property',
        detail: method.detail,
        documentation: method.documentation
      });
    });
    
    return completions;
  }
}
```

### 2.2 变量定义分析

**位置**：`astCompletionService.ts` 第256-270行

```typescript
private analyzeVariableDefinitions(code: string): void {
  // 匹配 const/let/var 变量声明
  const varPattern = /(?:const|let|var)\s+(\w+)\s*=\s*({[^}]*}|\[[^\]]*\]|"[^"]*"|'[^']*'|\d+|[^;,\n]+)/g;
  let match;
  
  while ((match = varPattern.exec(code)) !== null) {
    const varName = match[1];
    const value = match[2];
    
    const definition = this.inferVariableType(varName, value);
    this.variableDefinitions.set(varName, definition);
  }
}
```

**正则表达式解析**：
- `(?:const|let|var)`：匹配变量声明关键字
- `\s+(\w+)`：匹配变量名
- `\s*=\s*`：匹配赋值符号
- `({[^}]*}|\[[^\]]*\]|"[^"]*"|'[^']*'|\d+|[^;,\n]+)`：匹配各种类型的值

### 2.3 类型推断逻辑

**位置**：`astCompletionService.ts` 第271-308行

```typescript
private inferVariableType(varName: string, value: string): VariableDefinition {
  const definition: VariableDefinition = {
    name: varName,
    type: 'unknown',
    properties: new Map(),
    methods: new Map()
  };
  
  // 推断类型
  if (value.startsWith('{') && value.endsWith('}')) {
    definition.type = 'object';
    this.extractObjectProperties(value, definition);
  } else if (value.startsWith('[') && value.endsWith(']')) {
    definition.type = 'array';
    this.addArrayMethods(definition);
  } else if (value.startsWith('"') || value.startsWith("'")) {
    definition.type = 'string';
    this.addStringMethods(definition);
  } else if (!isNaN(Number(value))) {
    definition.type = 'number';
    this.addNumberMethods(definition);
  } else if (value === 'true' || value === 'false') {
    definition.type = 'boolean';
  } else if (value.includes('new Date')) {
    definition.type = 'date';
    this.addDateMethods(definition);
  }
  
  // 添加通用对象方法
  this.addCommonObjectMethods(definition);
  
  return definition;
}
```

## 3. 补全词来源分类

### 3.1 用户定义的属性

**来源**：动态分析代码中的对象字面量

```typescript
// 示例代码
const user = {name: 'he', age: 25};

// 提取的属性
{
  name: {name: 'name', type: 'string', documentation: 'name property'},
  age: {name: 'age', type: 'number', documentation: 'age property'}
}
```

### 3.2 内置方法（按类型）

#### 数组方法
**位置**：`astCompletionService.ts` 第343-370行

```typescript
private addArrayMethods(definition: VariableDefinition): void {
  const arrayMethods = [
    { name: 'length', type: 'property' as const, detail: 'number', documentation: 'Array length' },
    { name: 'push', type: 'method' as const, detail: 'function', documentation: 'Adds elements to the end of an array' },
    { name: 'pop', type: 'method' as const, detail: 'function', documentation: 'Removes the last element from an array' },
    { name: 'map', type: 'method' as const, detail: 'function', documentation: 'Creates new array with results' },
    { name: 'filter', type: 'method' as const, detail: 'function', documentation: 'Creates new array with filtered elements' },
    // ... 更多数组方法
  ];
  
  arrayMethods.forEach(method => {
    definition.methods.set(method.name, method);
  });
}
```

#### 字符串方法
**位置**：`astCompletionService.ts` 第371-393行

```typescript
private addStringMethods(definition: VariableDefinition): void {
  const stringMethods = [
    { name: 'length', type: 'property' as const, detail: 'number', documentation: 'String length' },
    { name: 'toUpperCase', type: 'method' as const, detail: 'function', documentation: 'Converts to uppercase' },
    { name: 'toLowerCase', type: 'method' as const, detail: 'function', documentation: 'Converts to lowercase' },
    { name: 'trim', type: 'method' as const, detail: 'function', documentation: 'Removes whitespace' },
    // ... 更多字符串方法
  ];
}
```

#### 数字方法
**位置**：`astCompletionService.ts` 第394-407行

```typescript
private addNumberMethods(definition: VariableDefinition): void {
  const numberMethods = [
    { name: 'toString', type: 'method' as const, detail: 'function', documentation: 'Converts to string' },
    { name: 'toFixed', type: 'method' as const, detail: 'function', documentation: 'Formats number with fixed decimals' },
    { name: 'toPrecision', type: 'method' as const, detail: 'function', documentation: 'Formats number with specified precision' },
    { name: 'valueOf', type: 'method' as const, detail: 'function', documentation: 'Returns primitive value' }
  ];
}
```

#### 日期方法
**位置**：`astCompletionService.ts` 第408-429行

```typescript
private addDateMethods(definition: VariableDefinition): void {
  const dateMethods = [
    { name: 'getFullYear', type: 'method' as const, detail: 'function', documentation: 'Returns full year' },
    { name: 'getMonth', type: 'method' as const, detail: 'function', documentation: 'Returns month (0-11)' },
    { name: 'getDate', type: 'method' as const, detail: 'function', documentation: 'Returns day of month' },
    // ... 更多日期方法
  ];
}
```

#### 通用对象方法
**位置**：`astCompletionService.ts` 第430-447行

```typescript
private addCommonObjectMethods(definition: VariableDefinition): void {
  const commonMethods = [
    { name: 'toString', type: 'method' as const, detail: 'function', documentation: 'Returns string representation' },
    { name: 'valueOf', type: 'method' as const, detail: 'function', documentation: 'Returns primitive value' },
    { name: 'hasOwnProperty', type: 'method' as const, detail: 'function', documentation: 'Checks if has property' },
    { name: 'isPrototypeOf', type: 'method' as const, detail: 'function', documentation: 'Checks prototype chain' },
    { name: 'propertyIsEnumerable', type: 'method' as const, detail: 'function', documentation: 'Checks if property is enumerable' },
    { name: 'toLocaleString', type: 'method' as const, detail: 'function', documentation: 'Returns localized string' }
  ];
}
```

### 3.3 代码片段补全

**位置**：`autocompleteService.ts` 第513-606行

```typescript
export const jsSnippetCompletionSource: CompletionSource = (context: CompletionContext) => {
  // 函数模式代码片段
  const functionSnippets = [
    snippetCompletion('function ${1:name}(${2:params}) {\n\t${3}\n}', { label: 'function' }),
    snippetCompletion('(${1:params}) => {\n\t${2}\n}', { label: 'arrow function' }),
    snippetCompletion('async function ${1:name}(${2:params}) {\n\t${3}\n}', { label: 'async function' }),
    // ... 更多函数片段
  ];
  
  // 条件语句代码片段
  const conditionalSnippets = [
    snippetCompletion('if (${1:condition}) {\n\t${2}\n}', { label: 'if' }),
    snippetCompletion('if (${1:condition}) {\n\t${2}\n} else {\n\t${3}\n}', { label: 'if else' }),
    // ... 更多条件语句片段
  ];
  
  // 循环语句代码片段
  const loopSnippets = [
    snippetCompletion('for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t${3}\n}', { label: 'for' }),
    snippetCompletion('for (const ${1:item} of ${2:array}) {\n\t${3}\n}', { label: 'for of' }),
    // ... 更多循环语句片段
  ];
};
```

## 4. 匹配方式详解

### 4.1 属性访问匹配

**触发条件**：用户输入 `变量名.`

```typescript
// 匹配逻辑
const beforeCursor = code.slice(0, context.pos);
const memberAccessMatch = beforeCursor.match(/(\w+)\.\s*$/);

if (memberAccessMatch) {
  const objectName = memberAccessMatch[1]; // 提取变量名
  // 生成该变量的补全建议
}
```

**示例**：
```javascript
const user = {name: 'he'};
user.  // 触发补全，显示 name 属性和对象方法
```

### 4.2 用户输入过滤

**位置**：`astCompletionService.ts` 第202-216行

```typescript
function filterCompletions(completions: CompletionItem[], context: CompletionContext): CompletionItem[] {
  const word = context.matchBefore(/\w*/);
  if (!word) return completions;
  
  const input = word.text.toLowerCase();
  if (!input) return completions;
  
  return completions.filter(completion => 
    completion.label.toLowerCase().includes(input)
  );
}
```

**过滤逻辑**：
1. 获取用户当前输入的单词
2. 将输入转换为小写
3. 过滤出包含用户输入的补全项

**示例**：
```javascript
const user = {name: 'he', age: 25};
user.n  // 只显示 name（包含 'n'）
user.a  // 只显示 age（包含 'a'）
```

### 4.3 优先级排序

**位置**：`astCompletionService.ts` 第563-605行

```typescript
function getCompletionBoost(completion: CompletionItem, context: ContextInfo): number {
  let boost = 0;
  
  // 根据类型调整优先级
  switch (completion.kind) {
    case 'variable':
      boost += 10;
      break;
    case 'function':
      boost += 8;
      break;
    case 'method':
      boost += 12;
      break;
    case 'property':
      boost += 9;
      break;
    case 'class':
      boost += 7;
      break;
    case 'keyword':
      boost += 5;
      break;
  }
  
  // 根据上下文调整优先级
  if (context.objectType === 'variable' && completion.kind === 'method') {
    boost += 5; // 在变量访问时，方法优先级更高
  }
  
  return boost;
}
```

**优先级规则**：
1. **方法** (boost: 12) - 最高优先级
2. **属性** (boost: 9) - 高优先级
3. **变量** (boost: 10) - 高优先级
4. **函数** (boost: 8) - 中等优先级
5. **类** (boost: 7) - 中等优先级
6. **关键字** (boost: 5) - 低优先级

## 5. 补全提示框显示机制

### 5.1 显示内容结构

每个补全项包含以下信息：

```typescript
interface CompletionItem {
  label: string;           // 显示在补全列表中的文本
  insertText: string;      // 插入到编辑器中的文本
  kind: string;           // 类型（影响图标显示）
  detail?: string;        // 详细信息（显示在右侧）
  documentation?: string; // 文档说明（悬停显示）
  sortText?: string;      // 排序文本
}
```

### 5.2 显示格式

**基本格式**：
```
[label] [detail] [documentation]
```

**示例显示**：
```
name          string    name property
toString()    function  Returns string representation
valueOf()     function  Returns primitive value
hasOwnProperty(property) function Checks if has property
```

### 5.3 图标映射

**位置**：`astCompletionService.ts` 第217-238行

```typescript
function mapCompletionType(kind: string): string {
  switch (kind) {
    case 'variable':
      return 'variable';
    case 'function':
      return 'function';
    case 'method':
      return 'method';
    case 'property':
      return 'property';
    case 'class':
      return 'class';
    case 'keyword':
      return 'keyword';
    case 'module':
      return 'module';
    default:
      return 'text';
  }
}
```

**图标类型**：
- `variable` - 变量图标
- `function` - 函数图标
- `method` - 方法图标
- `property` - 属性图标
- `class` - 类图标
- `keyword` - 关键字图标
- `module` - 模块图标

## 6. 实现状态

### 6.1 已完成功能

✅ **智能代码分析**：
- 动态分析变量定义
- 类型推断（对象、数组、字符串、数字、日期、布尔值）
- 属性提取

✅ **补全生成**：
- 用户定义属性补全
- 类型特定方法补全
- 通用对象方法补全

✅ **匹配机制**：
- 属性访问匹配
- 用户输入过滤
- 优先级排序

✅ **显示机制**：
- 补全项格式化
- 图标映射
- 详细信息显示

### 6.2 当前使用的补全源

**Editor.tsx 中的配置**：
```typescript
jsAutocompleteExt = autocompletion({
  override: [smartCompletionSource, jsSnippetCompletionSource]
});
```

**补全源优先级**：
1. `smartCompletionSource` - 智能代码分析补全（主要）
2. `jsSnippetCompletionSource` - JavaScript代码片段补全（辅助）

### 6.3 调试信息

**控制台输出**：
```
Smart Completion - Starting...
Smart Completion - Language: js
Smart Completion - Detected member access for object: user
Smart Code Analysis - Variable definitions: Map(1) {'user' => VariableDefinition}
Smart Completion - Found X completions for user: ['name', 'toString', 'valueOf', ...]
Smart Completion - Returning property completions from position: X
Smart Completion - Property completions: ['name', 'toString', 'valueOf', ...]
```

## 7. 性能优化

### 7.1 缓存机制

**位置**：`astCompletionService.ts` 第606-636行

```typescript
class CompletionCache {
  private cache = new Map<string, { completions: CompletionItem[]; timestamp: number }>();
  private readonly CACHE_TTL = 3000; // 3秒缓存
  
  getCachedCompletions(code: string, position: { line: number; column: number }): CompletionItem[] | null {
    const key = this.generateCacheKey(code, position);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.completions;
    }
    
    return null;
  }
}
```

### 7.2 性能监控

**位置**：`astCompletionService.ts` 第637-674行

```typescript
class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  
  startTimer(operation: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      // 记录性能指标
    };
  }
  
  logMetrics(): void {
    console.log('AST Completion Performance Metrics:');
    this.metrics.forEach((times, operation) => {
      const avg = this.getAverageTime(operation);
      console.log(`${operation}: ${avg.toFixed(2)}ms (${times.length} samples)`);
    });
  }
}
```

### 7.3 错误处理

**位置**：`astCompletionService.ts` 第675-711行

```typescript
class ErrorHandler {
  private errorCount = 0;
  private readonly MAX_ERRORS = 10;
  
  handleError(error: Error, context: CompletionContext): boolean {
    this.errorCount++;
    
    // 如果错误太多，暂时禁用AST补全
    if (this.errorCount > this.MAX_ERRORS) {
      console.warn('Too many AST completion errors, temporarily disabled');
      return false;
    }
    
    return true;
  }
}
```

## 8. 测试验证

### 8.1 测试用例

**基本测试**：
```javascript
const user = {name: 'he'};
user.  // 应该显示 name 属性，不应该显示 age
```

**类型测试**：
```javascript
const numbers = [1, 2, 3];
numbers.  // 应该显示数组方法
```

**字符串测试**：
```javascript
const message = "Hello";
message.  // 应该显示字符串方法
```

### 8.2 调试启用

**启用调试**：
```javascript
localStorage.setItem('debugAST', 'true');
```

**查看性能指标**：
```javascript
// 在控制台执行
getPerformanceMetrics();
```

## 9. 总结

### 9.1 实现特点

1. **智能性**：动态分析用户代码，提供准确的补全
2. **类型感知**：根据变量类型提供相应的方法和属性
3. **性能优化**：缓存机制和性能监控
4. **错误处理**：优雅的错误处理和降级策略
5. **可扩展性**：模块化设计，易于扩展

### 9.2 技术栈

- **CodeMirror 6**：编辑器核心
- **正则表达式**：代码分析和匹配
- **TypeScript**：类型安全
- **性能API**：性能监控
- **Map数据结构**：高效的数据存储

### 9.3 当前状态

✅ **已完成**：智能代码分析、类型推断、补全生成、匹配机制、显示机制
🔄 **进行中**：性能优化、错误处理
📋 **计划中**：嵌套属性访问、更复杂的类型推断

这个AST补全系统提供了比传统静态补全更智能、更准确的代码补全体验，能够根据用户的实际代码动态生成补全建议。 