import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getPen, Pen } from '../services/penService';
import Preview from '../components/Preview';
import ReadOnlyEditor from '../components/ReadOnlyEditor';
import { compileJsFramework, loadTypeScriptCompiler, compileCssFramework } from '../services/compilerService';
import Split from 'react-split';
import { Global } from '@emotion/react';
import {
    PageContainer,
    Header,
    Container,
    Title,
    Description,
    PreviewContainer,
    PreviewHeader,
    PreviewTitle,
    PreviewContent
} from '../styles/PreviewPage.styles';

const PreviewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [pen, setPen] = useState<Pen | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [compiledCss, setCompiledCss] = useState('');
    const [compiledJs, setCompiledJs] = useState('');
    const [tsCompilerLoaded, setTSCompilerLoaded] = useState(false);

    // 编译 JavaScript 框架代码，使用compilerService中共享的编译服务
    const compileJs = async (code: string, language: 'js' | 'react' | 'vue' | 'ts') => {
        try {
            const result = await compileJsFramework(code, language);
            return result.code;
        } catch (error) {
            console.error(`Error compiling ${language}:`, error);
            return code;
        }
    };

    // 编译CSS、SCSS、LESS，使用complierService中共享的编译服务
    const compileCss = async (code: string, language: 'css' | 'scss' | 'less') => {
        try {
            const result = await compileCssFramework(code, language);
            return result.code;
        } catch (error) {
            console.error(`Error compiling ${language}:`, error);
            return code;
        }
    };

    // 加载 TypeScript 编译器
    useEffect(() => {
        loadTypeScriptCompiler()
            .then(() => {
                console.log('TypeScript compiler loaded successfully');
                setTSCompilerLoaded(true);
            })
            .catch(error => {
                console.error('Failed to load TypeScript compiler:', error);
                // 即使加载失败，也设置为true，避免无限等待
                setTSCompilerLoaded(true);
            });
    }, []);

    // 处理代码编译的函数
    const processCodeCompilation = useCallback(async (penData: Pen) => {
        try {
            const cssLanguage = penData.cssLanguage || 'css';
            const jsLanguage = penData.jsLanguage || 'js';
            
            // 编译CSS（不需要等待TypeScript编译器）
            const compiledCssResult = await compileCss(penData.css, cssLanguage);
            setCompiledCss(compiledCssResult);
            
            // 对于TypeScript，需要等待编译器加载完成
            if (jsLanguage === 'ts' && !tsCompilerLoaded) {
                console.log('Waiting for TypeScript compiler to load...');
                return; // 等待编译器加载
            }
            
            // 编译JavaScript/TypeScript
            const compiledJsResult = await compileJs(penData.js, jsLanguage);
            setCompiledJs(compiledJsResult);
        } catch (error) {
            console.error('Error during code compilation:', error);
            setError('代码编译失败');
        }
    }, [tsCompilerLoaded]);

    // 获取Pen数据
    useEffect(() => {
        const fetchPen = async () => {
            if (!id) return;
            
            try {
                setLoading(true);
                setError(null);
                
                const data = await getPen(id);
                setPen(data);
                
                // 处理代码编译
                await processCodeCompilation(data);
            } catch (err) {
                setError('无法加载代码片段');
                console.error('Error fetching pen:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPen();
    }, [id, processCodeCompilation]);

    // 当TypeScript编译器加载完成后，重新处理代码编译
    useEffect(() => {
        if (tsCompilerLoaded && pen) {
            processCodeCompilation(pen);
        }
    }, [tsCompilerLoaded, pen, processCodeCompilation]);

    if (loading) {
        return (
            <PageContainer>
                <Container>
                    <div>加载中...</div>
                </Container>
            </PageContainer>
        );
    }

    if (error || !pen) {
        return (
            <PageContainer>
                <Container>
                    <div>{error || '代码片段不存在'}</div>
                </Container>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <Global styles={`
               .gutter {
                 background-color: #e1e4e8;
                 background-clip: padding-box;
                 transition: background 0.2s;
                 z-index: 10;
               }
               .gutter.gutter-horizontal {
                 cursor: col-resize;
                 width: 6px;
               }
               .gutter.gutter-vertical {
                 cursor: row-resize;
                 height: 6px;
               }
               .gutter:hover {
                 background-color: #b3d4fc;
               }
            `} />
            <Header>
                <Container>
                    <Title>{pen.title}</Title>
                    {pen.description && <Description>{pen.description}</Description>}
                </Container>
            </Header>
            <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
                <Split
                    direction="horizontal"
                    sizes={[50, 50]}
                    minSize={200}
                    gutterSize={6}
                    style={{ display: 'flex', flex: 1, minHeight: 0, height: '100%' }}
                >
                    {/* 左侧只读代码编辑器 */}
                    <ReadOnlyEditor
                        html={pen.html}
                        css={pen.css}
                        js={pen.js}
                        jsLanguage={pen.jsLanguage || 'js'}
                    />
                    {/* 右侧预览区域 */}
                    <PreviewContainer>
                        <PreviewHeader>
                            <PreviewTitle>预览</PreviewTitle>
                        </PreviewHeader>
                        <PreviewContent>
                            <Preview
                                html={pen.html}
                                css={compiledCss}
                                js={compiledJs}
                                jsLanguage={pen.jsLanguage || 'js'}
                            />
                        </PreviewContent>
                    </PreviewContainer>
                </Split>
            </div>
        </PageContainer>
    );
};

export default PreviewPage;