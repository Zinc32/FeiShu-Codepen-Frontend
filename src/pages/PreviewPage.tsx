import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { getPen, Pen } from '../services/penService';
import Preview from '../components/Preview';

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #f6f8fa;
    overflow: hidden;
`;

const Header = styled.div`
    padding: 12px 20px;
    background: white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 100;
    flex-shrink: 0;
`;

const Container = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    overflow: hidden;
`;

const Title = styled.h1`
    margin: 0;
    color: #333;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
`;

const Description = styled.p`
    color: #666;
    margin: 4px 0 0 0;
    font-size: 14px;
    line-height: 1.4;
`;

const PreviewContainer = styled.div`
    flex: 1;
    background: white;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
`;

const PreviewHeader = styled.div`
    padding: 8px 16px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
`;

const PreviewTitle = styled.div`
    font-size: 13px;
    color: #666;
`;

const PreviewContent = styled.div`
    flex: 1;
    position: relative;
    overflow: hidden;
    background: white;
    width: 100%;
`;

const PreviewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [pen, setPen] = useState<Pen | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPen = async () => {
            try {
                const data = await getPen(id!);
                setPen(data);
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
            <Header>
                <Container>
                    <Title>{pen.title}</Title>
                    {pen.description && <Description>{pen.description}</Description>}
                </Container>
            </Header>
            <Container>
                <PreviewContainer>
                    <PreviewHeader>
                        <PreviewTitle>预览</PreviewTitle>
                    </PreviewHeader>
                    <PreviewContent>
                        <Preview
                            html={pen.html}
                            css={pen.css}
                            js={pen.js}
                        />
                    </PreviewContent>
                </PreviewContainer>
            </Container>
        </PageContainer>
    );
};

export default PreviewPage; 