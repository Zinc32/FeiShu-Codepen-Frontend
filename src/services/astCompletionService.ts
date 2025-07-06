// AST补全服务 - 集成到CodeMirror编辑器
import { CompletionContext, CompletionSource } from '@codemirror/autocomplete';
import { ASTAnalysisService, CompletionItem, ContextInfo } from './astAnalysisService';

// AST补全源
export const astCompletionSource: CompletionSource = async (context: CompletionContext) => {
  // 调试信息
  const isDebugEnabled = localStorage.getItem('debugAST') === 'true';
  
  const astService = new ASTAnalysisService();
  const code = context.state.doc.toString();
  const position = getPositionFromContext(context);
  const language = getCurrentLanguage(context);
  
  if (isDebugEnabled) {
    console.log('AST Completion Debug:', {
      language,
      position,
      codeLength: code.length,
      cursorPos: context.pos
    });
  }
  
  try {
    // 解析代码生成AST
    const ast = astService.parseCode(code, language);
    
    if (!ast) {
      if (isDebugEnabled) {
        console.log('AST parsing failed - no AST generated');
      }
      return null; // 如果解析失败，返回null
    }
    
    if (isDebugEnabled) {
      console.log('AST parsed successfully:', ast.type);
    }
    
    // 分析上下文
    const contextInfo = astService.analyzeContext(ast, position, language, code);//这里的code是后来改的，因为添加了检查节点是否在vue模板中
    
    if (isDebugEnabled) {
      console.log('Context analyzed:', {
        objectType: contextInfo.objectType,
        accessPath: contextInfo.accessPath,
        scopeVariables: contextInfo.scope.variables.size
      });
    }
    
    // 生成补全建议
    const completions = astService.generateCompletions(contextInfo);
    
    if (isDebugEnabled) {
      console.log('Generated completions:', completions.length);
    }
    
    // 过滤基于用户输入的补全
    const filteredCompletions = filterCompletions(completions, context);
    
    if (filteredCompletions.length === 0) {
      if (isDebugEnabled) {
        console.log('No filtered completions found');
      }
      return null;
    }
    
    if (isDebugEnabled) {
      console.log('Filtered completions:', filteredCompletions.map(c => c.label));
    }
    
    return {
      from: context.pos,
      options: filteredCompletions.map(comp => ({
        label: comp.label,
        apply: comp.insertText,
        type: comp.kind,
        detail: comp.detail,
        documentation: comp.documentation,
        boost: getCompletionBoost(comp, contextInfo)
      }))
    };
  } catch (error) {
    console.warn('AST completion failed:', error);
    return null; // 出错时返回null，不影响其他补全源
  }
};

// 简化的AST补全源 - 用于测试
export const simpleASTCompletionSource: CompletionSource = (context: CompletionContext) => {
  const isDebugEnabled = localStorage.getItem('debugAST') === 'true';
  
  if (isDebugEnabled) {
    console.log('Simple AST Completion triggered');
  }
  
  // 简单的测试补全 - 总是返回一些基础补全
  const testCompletions = [
    {
      label: 'testVariable',
      insertText: 'testVariable',
      kind: 'variable' as const,
      detail: 'Test variable',
      documentation: 'This is a test variable'
    },
    {
      label: 'testFunction',
      insertText: 'testFunction()',
      kind: 'function' as const,
      detail: 'Test function',
      documentation: 'This is a test function'
    },
    {
      label: 'testMethod',
      insertText: 'testMethod()',
      kind: 'method' as const,
      detail: 'Test method',
      documentation: 'This is a test method'
    }
  ];
  
  if (isDebugEnabled) {
    console.log('Simple AST completions:', testCompletions.map(c => c.label));
  }
  
  return {
    from: context.pos,
    options: testCompletions.map(comp => ({
      label: comp.label,
      apply: comp.insertText,
      type: comp.kind,
      detail: comp.detail,
      documentation: comp.documentation,
      boost: 10
    }))
  };
};

// 获取光标位置
function getPositionFromContext(context: CompletionContext): { line: number; column: number } {
  const line = context.state.doc.lineAt(context.pos);
  return {
    line: line.number,
    column: context.pos - line.from
  };
}

// 获取当前语言
function getCurrentLanguage(context: CompletionContext): 'js' | 'ts' | 'react' | 'vue' {
  // 从编辑器状态中获取语言信息
  const state = context.state;
  const code = state.doc.toString();
  
  // 检查是否有TypeScript语法
  const hasTypeScript = code.includes(':') && (
    code.includes('interface') || 
    code.includes('type ') || 
    code.includes('enum ') ||
    code.includes('implements') ||
    code.includes('extends') ||
    /\w+:\s*(string|number|boolean|any|void|never|unknown|object|array|function)/.test(code)
  );
  
  if (hasTypeScript) {
    return 'ts';
  }
  
  // 检查是否有JSX（React）语法
  const hasJSX = code.includes('jsx') || 
                 code.includes('React') ||
                 code.includes('useState') ||
                 code.includes('useEffect') ||
                 code.includes('useRef') ||
                 code.includes('useCallback') ||
                 code.includes('useMemo') ||
                 (code.includes('<') && code.includes('>') && code.includes('/'));
  
  if (hasJSX) {
    return 'react';
  }
  
  // 检查是否有Vue相关语法
  const hasVue = code.includes('<template>') || 
                 code.includes('vue') ||
                 code.includes('setup()') ||
                 code.includes('ref(') ||
                 code.includes('reactive(') ||
                 code.includes('computed(') ||
                 code.includes('watch(') ||
                 code.includes('v-if') ||
                 code.includes('v-for') ||
                 code.includes('v-model');
  
  if (hasVue) {
    return 'vue';
  }
  
  // 默认返回JavaScript
  return 'js';
}

// 过滤补全建议
function filterCompletions(completions: CompletionItem[], context: CompletionContext): CompletionItem[] {
  const word = context.matchBefore(/\w*/);
  if (!word) {
    return completions;
  }
  
  const userInput = word.text.toLowerCase();
  
  return completions.filter(comp => {
    const label = comp.label.toLowerCase();
    return label.includes(userInput) || label.startsWith(userInput);
  });
}

// 映射补全类型到CodeMirror期望的格式
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

// 智能代码分析器
class SmartCodeAnalyzer {
  private variableDefinitions = new Map<string, VariableDefinition>();
  
  // 分析代码并提取变量定义
  analyzeCode(code: string): void {
    this.variableDefinitions.clear();
    
    try {
      // 使用简单的正则表达式分析变量定义
      this.analyzeVariableDefinitions(code);
      console.log('Smart Code Analysis - Variable definitions:', this.variableDefinitions);
    } catch (error) {
      console.warn('Smart code analysis failed:', error);
    }
  }
  
  // 分析变量定义
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
  
  // 推断变量类型
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
    } else if (value.includes('new Array') || value.includes('[]')) {
      definition.type = 'array';
      this.addArrayMethods(definition);
    }
    
    // 添加通用对象方法
    this.addCommonObjectMethods(definition);
    
    return definition;
  }
  
  // 提取对象属性
  private extractObjectProperties(objectLiteral: string, definition: VariableDefinition): void {
    // 简单的对象字面量解析
    const propertyPattern = /(\w+)\s*:\s*([^,}]+)/g;
    let match;
    
    while ((match = propertyPattern.exec(objectLiteral)) !== null) {
      const propName = match[1];
      const propValue = match[2].trim();
      
      const propType = this.inferPropertyType(propValue);
      definition.properties.set(propName, {
        name: propName,
        type: propType,
        documentation: `${propName} property`
      });
    }
  }
  
  // 推断属性类型
  private inferPropertyType(value: string): string {
    if (value.startsWith('"') || value.startsWith("'")) {
      return 'string';
    } else if (!isNaN(Number(value))) {
      return 'number';
    } else if (value === 'true' || value === 'false') {
      return 'boolean';
    } else if (value.startsWith('{') || value.startsWith('[')) {
      return 'object';
    } else {
      return 'unknown';
    }
  }
  
  // 添加数组方法
  private addArrayMethods(definition: VariableDefinition): void {
    const arrayMethods = [
      { name: 'length', type: 'property' as const, detail: 'number', documentation: 'Array length' },
      { name: 'push', type: 'method' as const, detail: 'function', documentation: 'Adds elements to the end of an array' },
      { name: 'pop', type: 'method' as const, detail: 'function', documentation: 'Removes the last element from an array' },
      { name: 'shift', type: 'method' as const, detail: 'function', documentation: 'Removes the first element from an array' },
      { name: 'unshift', type: 'method' as const, detail: 'function', documentation: 'Adds elements to the beginning of an array' },
      { name: 'slice', type: 'method' as const, detail: 'function', documentation: 'Extracts a section of an array' },
      { name: 'splice', type: 'method' as const, detail: 'function', documentation: 'Changes array contents' },
      { name: 'map', type: 'method' as const, detail: 'function', documentation: 'Creates new array with results' },
      { name: 'filter', type: 'method' as const, detail: 'function', documentation: 'Creates new array with filtered elements' },
      { name: 'reduce', type: 'method' as const, detail: 'function', documentation: 'Reduces array to single value' },
      { name: 'forEach', type: 'method' as const, detail: 'function', documentation: 'Calls function for each element' },
      { name: 'find', type: 'method' as const, detail: 'function', documentation: 'Returns first element that passes test' },
      { name: 'findIndex', type: 'method' as const, detail: 'function', documentation: 'Returns index of first element that passes test' },
      { name: 'includes', type: 'method' as const, detail: 'function', documentation: 'Checks if array contains element' },
      { name: 'indexOf', type: 'method' as const, detail: 'function', documentation: 'Returns first index of element' },
      { name: 'join', type: 'method' as const, detail: 'function', documentation: 'Joins array elements into string' },
      { name: 'reverse', type: 'method' as const, detail: 'function', documentation: 'Reverses array order' },
      { name: 'sort', type: 'method' as const, detail: 'function', documentation: 'Sorts array elements' }
    ];
    
    arrayMethods.forEach(method => {
      definition.methods.set(method.name, method);
    });
  }
  
  // 添加字符串方法
  private addStringMethods(definition: VariableDefinition): void {
    const stringMethods = [
      { name: 'length', type: 'property' as const, detail: 'number', documentation: 'String length' },
      { name: 'toUpperCase', type: 'method' as const, detail: 'function', documentation: 'Converts to uppercase' },
      { name: 'toLowerCase', type: 'method' as const, detail: 'function', documentation: 'Converts to lowercase' },
      { name: 'trim', type: 'method' as const, detail: 'function', documentation: 'Removes whitespace' },
      { name: 'split', type: 'method' as const, detail: 'function', documentation: 'Splits string into array' },
      { name: 'replace', type: 'method' as const, detail: 'function', documentation: 'Replaces substrings' },
      { name: 'substring', type: 'method' as const, detail: 'function', documentation: 'Extracts characters' },
      { name: 'indexOf', type: 'method' as const, detail: 'function', documentation: 'Returns first occurrence index' },
      { name: 'includes', type: 'method' as const, detail: 'function', documentation: 'Checks if contains substring' },
      { name: 'startsWith', type: 'method' as const, detail: 'function', documentation: 'Checks if starts with substring' },
      { name: 'endsWith', type: 'method' as const, detail: 'function', documentation: 'Checks if ends with substring' },
      { name: 'charAt', type: 'method' as const, detail: 'function', documentation: 'Returns character at index' },
      { name: 'charCodeAt', type: 'method' as const, detail: 'function', documentation: 'Returns Unicode value' }
    ];
    
    stringMethods.forEach(method => {
      definition.methods.set(method.name, method);
    });
  }
  
  // 添加数字方法
  private addNumberMethods(definition: VariableDefinition): void {
    const numberMethods = [
      { name: 'toString', type: 'method' as const, detail: 'function', documentation: 'Converts to string' },
      { name: 'toFixed', type: 'method' as const, detail: 'function', documentation: 'Formats number with fixed decimals' },
      { name: 'toPrecision', type: 'method' as const, detail: 'function', documentation: 'Formats number with specified precision' },
      { name: 'valueOf', type: 'method' as const, detail: 'function', documentation: 'Returns primitive value' }
    ];
    
    numberMethods.forEach(method => {
      definition.methods.set(method.name, method);
    });
  }
  
  // 添加日期方法
  private addDateMethods(definition: VariableDefinition): void {
    const dateMethods = [
      { name: 'getFullYear', type: 'method' as const, detail: 'function', documentation: 'Returns full year' },
      { name: 'getMonth', type: 'method' as const, detail: 'function', documentation: 'Returns month (0-11)' },
      { name: 'getDate', type: 'method' as const, detail: 'function', documentation: 'Returns day of month' },
      { name: 'getDay', type: 'method' as const, detail: 'function', documentation: 'Returns day of week' },
      { name: 'getHours', type: 'method' as const, detail: 'function', documentation: 'Returns hours' },
      { name: 'getMinutes', type: 'method' as const, detail: 'function', documentation: 'Returns minutes' },
      { name: 'getSeconds', type: 'method' as const, detail: 'function', documentation: 'Returns seconds' },
      { name: 'getTime', type: 'method' as const, detail: 'function', documentation: 'Returns timestamp' },
      { name: 'toString', type: 'method' as const, detail: 'function', documentation: 'Returns string representation' },
      { name: 'toDateString', type: 'method' as const, detail: 'function', documentation: 'Returns date string' },
      { name: 'toTimeString', type: 'method' as const, detail: 'function', documentation: 'Returns time string' },
      { name: 'toISOString', type: 'method' as const, detail: 'function', documentation: 'Returns ISO string' }
    ];
    
    dateMethods.forEach(method => {
      definition.methods.set(method.name, method);
    });
  }
  
  // 添加通用对象方法
  private addCommonObjectMethods(definition: VariableDefinition): void {
    const commonMethods = [
      { name: 'toString', type: 'method' as const, detail: 'function', documentation: 'Returns string representation' },
      { name: 'valueOf', type: 'method' as const, detail: 'function', documentation: 'Returns primitive value' },
      { name: 'hasOwnProperty', type: 'method' as const, detail: 'function', documentation: 'Checks if has property' },
      { name: 'isPrototypeOf', type: 'method' as const, detail: 'function', documentation: 'Checks prototype chain' },
      { name: 'propertyIsEnumerable', type: 'method' as const, detail: 'function', documentation: 'Checks if property is enumerable' },
      { name: 'toLocaleString', type: 'method' as const, detail: 'function', documentation: 'Returns localized string' }
    ];
    
    commonMethods.forEach(method => {
      if (!definition.methods.has(method.name)) {
        definition.methods.set(method.name, method);
      }
    });
  }
  
  // 获取变量的补全建议
  getCompletionsForVariable(varName: string): CompletionItem[] {
    const definition = this.variableDefinitions.get(varName);
    if (!definition) {
      return [];
    }
    
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
  
  // 获取所有变量定义
  getVariableDefinitions(): Map<string, VariableDefinition> {
    return this.variableDefinitions;
  }
}

// 变量定义接口
interface VariableDefinition {
  name: string;
  type: string;
  properties: Map<string, PropertyDefinition>;
  methods: Map<string, MethodDefinition>;
}

interface PropertyDefinition {
  name: string;
  type: string;
  documentation: string;
}

interface MethodDefinition {
  name: string;
  type: 'method' | 'property';
  detail: string;
  documentation: string;
}

// 全局智能代码分析器实例
const smartAnalyzer = new SmartCodeAnalyzer();

// 生成智能对象属性补全
function generateSmartObjectPropertyCompletions(objectName: string, code: string): CompletionItem[] {
  // 分析代码
  smartAnalyzer.analyzeCode(code);
  
  // 获取变量的补全建议
  const completions = smartAnalyzer.getCompletionsForVariable(objectName);
  
  console.log(`Smart Completion - Found ${completions.length} completions for ${objectName}:`, completions.map(c => c.label));
  
  return completions;
}

// 生成备用补全
function generateFallbackCompletions(context: CompletionContext, language: string) {
  const word = context.matchBefore(/\w*/);
  const from = word ? word.from : context.pos;
  
  const completions: CompletionItem[] = [
    { label: 'console', insertText: 'console', kind: 'variable', detail: 'object', documentation: 'Console object for logging' },
    { label: 'document', insertText: 'document', kind: 'variable', detail: 'object', documentation: 'Document object' },
    { label: 'window', insertText: 'window', kind: 'variable', detail: 'object', documentation: 'Window object' },
    { label: 'Math', insertText: 'Math', kind: 'variable', detail: 'object', documentation: 'Math object' },
    { label: 'Date', insertText: 'Date', kind: 'variable', detail: 'function', documentation: 'Date constructor' },
    { label: 'Array', insertText: 'Array', kind: 'variable', detail: 'function', documentation: 'Array constructor' },
    { label: 'Object', insertText: 'Object', kind: 'variable', detail: 'function', documentation: 'Object constructor' },
    { label: 'String', insertText: 'String', kind: 'variable', detail: 'function', documentation: 'String constructor' },
    { label: 'Number', insertText: 'Number', kind: 'variable', detail: 'function', documentation: 'Number constructor' },
    { label: 'Boolean', insertText: 'Boolean', kind: 'variable', detail: 'function', documentation: 'Boolean constructor' }
  ];
  
  const filteredCompletions = filterCompletions(completions, context);
  
  if (filteredCompletions.length === 0) {
    return null;
  }
  
  return {
    from: from,
    options: filteredCompletions.map(comp => ({
      label: comp.label,
      apply: comp.insertText,
      type: mapCompletionType(comp.kind),
      detail: comp.detail,
      documentation: comp.documentation,
      boost: 5
    }))
  };
}

// 获取补全优先级
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
  
  // 根据文件类型调整优先级
  if (context.fileType === 'react' && completion.label.includes('Component')) {
    boost += 3; // React组件优先级更高
  }
  
  if (context.fileType === 'vue' && completion.label.startsWith('v-')) {
    boost += 3; // Vue指令优先级更高
  }
  
  return boost;
}

// 缓存管理器
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
  
  setCachedCompletions(code: string, position: { line: number; column: number }, completions: CompletionItem[]): void {
    const key = this.generateCacheKey(code, position);
    this.cache.set(key, { completions, timestamp: Date.now() });
  }
  
  private generateCacheKey(code: string, position: { line: number; column: number }): string {
    // 简化的缓存键生成
    return `${code.length}_${position.line}_${position.column}`;
  }
  
  clearCache(): void {
    this.cache.clear();
  }
}

// 性能监控
class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  
  startTimer(operation: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      if (!this.metrics.has(operation)) {
        this.metrics.set(operation, []);
      }
      this.metrics.get(operation)!.push(duration);
      
      // 只保留最近10次的结果
      const times = this.metrics.get(operation)!;
      if (times.length > 10) {
        times.shift();
      }
    };
  }
  
  getAverageTime(operation: string): number {
    const times = this.metrics.get(operation);
    if (!times || times.length === 0) {
      return 0;
    }
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }
  
  logMetrics(): void {
    console.log('AST Completion Performance Metrics:');
    this.metrics.forEach((times, operation) => {
      const avg = this.getAverageTime(operation);
      console.log(`${operation}: ${avg.toFixed(2)}ms (${times.length} samples)`);
    });
  }
}

// 错误处理器
class ErrorHandler {
  private errorCount = 0;
  private readonly MAX_ERRORS = 10;
  private readonly ERROR_RESET_INTERVAL = 60000; // 1分钟
  
  constructor() {
    // 定期重置错误计数
    setInterval(() => {
      this.errorCount = 0;
    }, this.ERROR_RESET_INTERVAL);
  }
  
  handleError(error: Error, context: CompletionContext): boolean {
    this.errorCount++;
    
    console.warn('AST Completion Error:', error);
    
    // 如果错误太多，暂时禁用AST补全
    if (this.errorCount > this.MAX_ERRORS) {
      console.warn('Too many AST completion errors, temporarily disabled');
      return false;
    }
    
    return true;
  }
  
  shouldEnableASTCompletion(): boolean {
    return this.errorCount <= this.MAX_ERRORS;
  }
}

// 全局实例
const completionCache = new CompletionCache();
const performanceMonitor = new PerformanceMonitor();
const errorHandler = new ErrorHandler();

// 增强的实时智能补全源（支持持续触发）
export const enhancedSmartCompletionSource: CompletionSource = (context: CompletionContext) => {
  try {
    console.log('Enhanced Smart Completion - Starting...');
    
    const code = context.state.doc.toString();
    const language = getCurrentLanguage(context);
    
    console.log('Enhanced Smart Completion - Language:', language);
    
    // 获取当前单词
    const word = context.matchBefore(/\w*/);
    if (!word) {
      console.log('Enhanced Smart Completion - No word found');
      return null;
    }
    
    const currentWord = word.text;
    const from = word.from;
    
    console.log('Enhanced Smart Completion - Current word:', currentWord, 'from position:', from);
    
    // 分析代码，获取所有变量定义
    smartAnalyzer.analyzeCode(code);
    const variableDefinitions = smartAnalyzer.getVariableDefinitions();
    
    // 1. 检查是否在属性访问上下文中（如 user.name）
    const beforeCursor = code.slice(0, context.pos);
    const memberAccessMatch = beforeCursor.match(/(\w+)\.(\w*)$/);
    
    if (memberAccessMatch) {
      const objectName = memberAccessMatch[1];
      const propertyPrefix = memberAccessMatch[2] || '';
      
      console.log('Enhanced Smart Completion - Detected member access for object:', objectName, 'property prefix:', propertyPrefix);
      
      // 生成智能对象属性补全
      const completions = generateSmartObjectPropertyCompletions(objectName, code);
      
      // 根据属性前缀过滤
      const filteredCompletions = completions.filter(comp => 
        comp.label.toLowerCase().startsWith(propertyPrefix.toLowerCase())
      );
      
      if (filteredCompletions.length === 0) {
        console.log('Enhanced Smart Completion - No matching property completions found');
        return null;
      }
      
      console.log('Enhanced Smart Completion - Returning property completions:', filteredCompletions.map(c => c.label));
      
      return {
        from: from,
        options: filteredCompletions.map(comp => ({
          label: comp.label,
          apply: comp.insertText,
          type: mapCompletionType(comp.kind),
          detail: comp.detail,
          documentation: comp.documentation,
          boost: getCompletionBoost(comp, { objectType: 'property', fileType: language } as ContextInfo) + 20
        }))
      };
    }
    
    // 2. 检查是否在变量名输入中（如 user）
    const variableNames = Array.from(variableDefinitions.keys());
    const matchingVariables = variableNames.filter(name => 
      name.toLowerCase().startsWith(currentWord.toLowerCase())
    );
    
    if (matchingVariables.length > 0) {
      console.log('Enhanced Smart Completion - Found matching variables:', matchingVariables);
      
      const variableCompletions = matchingVariables.map(varName => ({
        label: varName,
        insertText: varName,
        kind: 'variable' as const,
        detail: 'variable',
        documentation: `Variable: ${varName}`,
        boost: 15
      }));
      
      return {
        from: from,
        options: variableCompletions.map(comp => ({
          label: comp.label,
          apply: comp.insertText,
          type: mapCompletionType(comp.kind),
          detail: comp.detail,
          documentation: comp.documentation,
          boost: comp.boost
        }))
      };
    }
    
    // 3. 检查是否在全局对象访问中（如 console.log）
    const globalObjects = ['console', 'document', 'window', 'Math', 'Date', 'Array', 'Object', 'String', 'Number', 'Boolean'];
    const matchingGlobals = globalObjects.filter(name => 
      name.toLowerCase().startsWith(currentWord.toLowerCase())
    );
    
    if (matchingGlobals.length > 0) {
      console.log('Enhanced Smart Completion - Found matching globals:', matchingGlobals);
      
      const globalCompletions = matchingGlobals.map(name => ({
        label: name,
        insertText: name,
        kind: 'variable' as const,
        detail: 'global object',
        documentation: `Global object: ${name}`,
        boost: 10
      }));
      
      return {
        from: from,
        options: globalCompletions.map(comp => ({
          label: comp.label,
          apply: comp.insertText,
          type: mapCompletionType(comp.kind),
          detail: comp.detail,
          documentation: comp.documentation,
          boost: comp.boost
        }))
      };
    }
    
    // 4. 检查是否在方法调用中（如 console.log）
    const methodCallMatch = beforeCursor.match(/(\w+)\.(\w*)$/);
    if (methodCallMatch) {
      const objectName = methodCallMatch[1];
      const methodPrefix = methodCallMatch[2] || '';
      
      // 根据对象名提供相应的方法
      let methodCompletions: CompletionItem[] = [];
      
      if (objectName === 'console') {
        methodCompletions = [
          { label: 'log', insertText: 'log()', kind: 'method', detail: 'function', documentation: 'Logs a message to the console' },
          { label: 'error', insertText: 'error()', kind: 'method', detail: 'function', documentation: 'Logs an error message to the console' },
          { label: 'warn', insertText: 'warn()', kind: 'method', detail: 'function', documentation: 'Logs a warning message to the console' },
          { label: 'info', insertText: 'info()', kind: 'method', detail: 'function', documentation: 'Logs an info message to the console' }
        ];
      } else if (objectName === 'document') {
        methodCompletions = [
          { label: 'getElementById', insertText: 'getElementById()', kind: 'method', detail: 'function', documentation: 'Gets an element by its ID' },
          { label: 'querySelector', insertText: 'querySelector()', kind: 'method', detail: 'function', documentation: 'Selects the first element that matches a CSS selector' },
          { label: 'querySelectorAll', insertText: 'querySelectorAll()', kind: 'method', detail: 'function', documentation: 'Selects all elements that match a CSS selector' },
          { label: 'createElement', insertText: 'createElement()', kind: 'method', detail: 'function', documentation: 'Creates a new element' }
        ];
      } else if (objectName === 'Math') {
        methodCompletions = [
          { label: 'floor', insertText: 'floor()', kind: 'method', detail: 'function', documentation: 'Returns the largest integer less than or equal to a number' },
          { label: 'ceil', insertText: 'ceil()', kind: 'method', detail: 'function', documentation: 'Returns the smallest integer greater than or equal to a number' },
          { label: 'round', insertText: 'round()', kind: 'method', detail: 'function', documentation: 'Rounds a number to the nearest integer' },
          { label: 'random', insertText: 'random()', kind: 'method', detail: 'function', documentation: 'Returns a random number between 0 and 1' },
          { label: 'abs', insertText: 'abs()', kind: 'method', detail: 'function', documentation: 'Returns the absolute value of a number' },
          { label: 'max', insertText: 'max()', kind: 'method', detail: 'function', documentation: 'Returns the largest of zero or more numbers' },
          { label: 'min', insertText: 'min()', kind: 'method', detail: 'function', documentation: 'Returns the smallest of zero or more numbers' }
        ];
      }
      
      // 根据方法前缀过滤
      const filteredMethods = methodCompletions.filter(method => 
        method.label.toLowerCase().startsWith(methodPrefix.toLowerCase())
      );
      
      if (filteredMethods.length > 0) {
        console.log('Enhanced Smart Completion - Found matching methods:', filteredMethods.map(m => m.label));
        
        return {
          from: from,
          options: filteredMethods.map(comp => ({
            label: comp.label,
            apply: comp.insertText,
            type: mapCompletionType(comp.kind),
            detail: comp.detail,
            documentation: comp.documentation,
            boost: 18
          }))
        };
      }
    }
    
    console.log('Enhanced Smart Completion - No matching completions found');
    return null;
    
  } catch (error) {
    console.error('Enhanced Smart Completion Error:', error);
    return null;
  }
};

// 智能补全源（使用智能代码分析器）
export const smartCompletionSource: CompletionSource = (context: CompletionContext) => {
  try {
    console.log('Smart Completion - Starting...');
    
    const code = context.state.doc.toString();
    const language = getCurrentLanguage(context);
    
    console.log('Smart Completion - Language:', language);
    
    // 检查是否在属性访问位置（如 user.）
    const beforeCursor = code.slice(0, context.pos);
    const memberAccessMatch = beforeCursor.match(/(\w+)\.\s*$/);
    
    if (memberAccessMatch) {
      const objectName = memberAccessMatch[1];
      console.log('Smart Completion - Detected member access for object:', objectName);
      
      // 生成智能对象属性补全
      const completions = generateSmartObjectPropertyCompletions(objectName, code);
      const filteredCompletions = filterCompletions(completions, context);
      
      if (filteredCompletions.length === 0) {
        console.log('Smart Completion - No property completions found');
        return null;
      }
      
      // 计算补全的起始位置
      const word = context.matchBefore(/\w*/);
      const from = word ? word.from : context.pos;
      
      console.log('Smart Completion - Returning property completions from position:', from);
      console.log('Smart Completion - Property completions:', filteredCompletions.map(c => c.label));
      
      return {
        from: from,
        options: filteredCompletions.map(comp => ({
          label: comp.label,
          apply: comp.insertText,
          type: mapCompletionType(comp.kind),
          detail: comp.detail,
          documentation: comp.documentation,
          boost: getCompletionBoost(comp, { objectType: 'property', fileType: language } as ContextInfo)
        }))
      };
    }
    
    // 如果不是属性访问，返回null让其他补全源处理
    console.log('Smart Completion - Not a property access, returning null');
    return null;
    
  } catch (error) {
    console.error('Smart Completion Error:', error);
    return null;
  }
};

// 增强的AST补全源（带缓存和性能监控）
export const enhancedASTCompletionSource: CompletionSource = async (context: CompletionContext) => {
  try {
    console.log('AST Completion - Starting...');
    
    const code = context.state.doc.toString();
    const position = getPositionFromContext(context);
    const language = getCurrentLanguage(context);
    
    console.log('AST Completion - Position:', position, 'Language:', language);
    
    // 检查是否在属性访问位置（如 user.）
    const beforeCursor = code.slice(0, context.pos);
    const memberAccessMatch = beforeCursor.match(/(\w+)\.\s*$/);
    
    if (memberAccessMatch) {
      const objectName = memberAccessMatch[1];
      console.log('AST Completion - Detected member access for object:', objectName);
      
      // 生成智能对象属性补全
      const completions = generateSmartObjectPropertyCompletions(objectName, code);
      const filteredCompletions = filterCompletions(completions, context);
      
      if (filteredCompletions.length === 0) {
        console.log('AST Completion - No property completions found');
        return null;
      }
      
      // 计算补全的起始位置
      const word = context.matchBefore(/\w*/);
      const from = word ? word.from : context.pos;
      
      console.log('AST Completion - Returning property completions from position:', from);
      console.log('AST Completion - Property completions:', filteredCompletions.map(c => c.label));
      
      return {
        from: from,
        options: filteredCompletions.map(comp => ({
          label: comp.label,
          apply: comp.insertText,
          type: mapCompletionType(comp.kind),
          detail: comp.detail,
          documentation: comp.documentation,
          boost: getCompletionBoost(comp, { objectType: 'property', fileType: language } as ContextInfo)
        }))
      };
    }
    
    // 如果不是属性访问，尝试解析完整AST
    const astService = new ASTAnalysisService();
    
    // 尝试解析代码生成AST
    const ast = astService.parseCode(code, language);
    
    if (!ast) {
      console.log('AST Completion - Failed to parse AST, trying fallback');
      return generateFallbackCompletions(context, language);
    }
    
    console.log('AST Completion - AST parsed successfully');
    
    // 分析上下文
    const contextInfo = astService.analyzeContext(ast, position, language, code);//这里的code也是新加的
    console.log('AST Completion - Context analyzed:', contextInfo);
    
    // 生成补全建议
    const completions = astService.generateCompletions(contextInfo);
    console.log('AST Completion - Generated completions:', completions.length);
    
    // 过滤基于用户输入的补全
    const filteredCompletions = filterCompletions(completions, context);
    console.log('AST Completion - Filtered completions:', filteredCompletions.length);
    
    if (filteredCompletions.length === 0) {
      console.log('AST Completion - No filtered completions, returning null');
      return null;
    }
    
    // 计算补全的起始位置
    const word = context.matchBefore(/\w*/);
    const from = word ? word.from : context.pos;
    
    console.log('AST Completion - Returning completions from position:', from);
    console.log('AST Completion - Completions:', filteredCompletions.map(c => c.label));
    
    const completionResult = {
      from: from,
      options: filteredCompletions.map(comp => ({
        label: comp.label,
        apply: comp.insertText,
        type: mapCompletionType(comp.kind),
        detail: comp.detail,
        documentation: comp.documentation,
        boost: getCompletionBoost(comp, contextInfo)
      }))
    };
    
    console.log('AST Completion - Final result:', completionResult);
    console.log('AST Completion - Number of options:', completionResult.options.length);
    console.log('AST Completion - From position:', completionResult.from);
    console.log('AST Completion - Context position:', context.pos);
    
    return completionResult;
    
  } catch (error) {
    console.error('AST Completion Error:', error);
    return generateFallbackCompletions(context, getCurrentLanguage(context));
  }
};

// 测试补全源
export const testCompletionSource: CompletionSource = (context) => {
  console.log('Test completion triggered at position:', context.pos);
  
  const word = context.matchBefore(/\w*/);
  const from = word ? word.from : context.pos;
  
  return {
    from: from,
    options: [
      {
        label: 'testVariable',
        apply: 'testVariable',
        type: 'variable'
      },
      {
        label: 'testFunction',
        apply: 'testFunction()',
        type: 'function'
      }
    ]
  };
};

// 导出工具函数
export const clearCompletionCache = () => completionCache.clearCache();
export const getPerformanceMetrics = () => performanceMonitor.logMetrics();
export const resetErrorCount = () => errorHandler['errorCount'] = 0; 