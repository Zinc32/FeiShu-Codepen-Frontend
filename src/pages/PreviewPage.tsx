import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPen, Pen } from '../services/penService';
import Preview from '../components/Preview';
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