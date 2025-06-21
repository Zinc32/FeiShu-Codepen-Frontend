import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getPen, Pen } from '../services/penService';
import Preview from '../components/Preview';
import ReadOnlyEditor from '../components/ReadOnlyEditor';
import * as sass from 'sass';
import * as less from 'less';
import { compileJsFramework, loadTypeScriptCompiler } from '../services/compilerService';
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

    // 编译 CSS 预处理器代码
    const compileCss = async (code: string, language: 'css' | 'scss' | 'less') => {
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
    };

    // 编译 JavaScript 框架代码 ，使用complierService中共享的编译服务
    const compileJs = async (code: string, language: 'js' | 'react' | 'vue' | 'ts') => {
        try {
            const result = await compileJsFramework(code, language);
            return result.code;
        } catch (error) {
            console.error(`Error compiling ${language}:`, error);
            return code;
        }
    };

    // 加载 TypeScript 编译器
    useEffect(() => {
        loadTypeScriptCompiler().catch(error => {
            console.error('Failed to load TypeScript compiler:', error);
        });
    }, []);

    useEffect(() => {
        const fetchPen = async () => {
            try {
                const data = await getPen(id!);
                setPen(data);
                
                // 编译CSS和JS代码
                const cssLanguage = data.cssLanguage || 'css';
                const jsLanguage = data.jsLanguage || 'js';
                
                const compiledCssResult = await compileCss(data.css, cssLanguage);
                const compiledJsResult = await compileJs(data.js, jsLanguage);
                
                setCompiledCss(compiledCssResult);
                setCompiledJs(compiledJsResult);
            } catch (err) {
                setError('无法加载代码片段');
                console.error('Error fetching pen:', err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPen();
        }
    }, [id]);

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