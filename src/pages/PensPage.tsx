import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { getUserPens, Pen } from '../services/penService';
import UserNavbar from '../components/UserNavbar';

const PageContainer = styled.div`
    min-height: 100vh;
    background: #f8f9fa;
`;

const Container = styled.div`
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
`;

const Title = styled.h1`
    margin: 0;
    color: #333;
    font-size: 2rem;
`;

const CreateButton = styled(Link)`
    padding: 12px 24px;
    background: linear-gradient(45deg, #667eea, #764ba2);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
`;

const PenGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
    margin-top: 20px;
`;

const PenCard = styled(Link)`
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    padding: 20px;
    text-decoration: none;
    color: inherit;
    transition: all 0.3s ease;
    border: 1px solid #e0e0e0;
    
    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        border-color: #667eea;
    }
`;

const PenTitle = styled.h3`
    margin: 0 0 12px 0;
    color: #333;
    font-size: 1.2rem;
    font-weight: 600;
`;

const PenDescription = styled.p`
    margin: 0 0 16px 0;
    color: #666;
    font-size: 0.9rem;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
`;

const PenMeta = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
`;

const PenDate = styled.div`
    color: #999;
    font-size: 0.8rem;
`;

const PenStatus = styled.div<{ isPublic: boolean }>`
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 500;
    background: ${props => props.isPublic ? '#e8f5e8' : '#fff3cd'};
    color: ${props => props.isPublic ? '#2d7738' : '#856404'};
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 60px 20px;
    color: #666;
`;

const EmptyIcon = styled.div`
    font-size: 4rem;
    margin-bottom: 16px;
`;

const EmptyTitle = styled.h3`
    margin: 0 0 8px 0;
    color: #333;
`;

const EmptyText = styled.p`
    margin: 0 0 24px 0;
    color: #666;
`;

const PensPage: React.FC = () => {
    const [pens, setPens] = useState<Pen[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPens = async () => {
            try {
                const userPens = await getUserPens();
                setPens(userPens);
            } catch (error) {
                console.error('Error loading pens:', error);
            } finally {
                setLoading(false);
            }
        };

        loadPens();
    }, []);

    if (loading) {
        return (
            <PageContainer>
                <UserNavbar />
                <Container>
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        加载中...
                    </div>
                </Container>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <UserNavbar />
            <Container>
                <Header>
                    <Title>我的代码片段</Title>
                    <CreateButton to="/editor">
                        ✨ 创建新项目
                    </CreateButton>
                </Header>

                {pens.length === 0 ? (
                    <EmptyState>
                        <EmptyIcon>📝</EmptyIcon>
                        <EmptyTitle>还没有代码片段</EmptyTitle>
                        <EmptyText>创建你的第一个代码片段，开始编程之旅吧！</EmptyText>
                        <CreateButton to="/editor">
                            创建第一个项目
                        </CreateButton>
                    </EmptyState>
                ) : (
                    <PenGrid>
                        {pens.map((pen) => (
                            <PenCard key={pen.id} to={`/editor/${pen.id}`}>
                                <PenTitle>{pen.title}</PenTitle>
                                <PenDescription>
                                    {pen.description || '暂无描述'}
                                </PenDescription>
                                <PenMeta>
                                    <PenDate>
                                        {new Date(pen.updatedAt).toLocaleDateString('zh-CN')}
                                    </PenDate>
                                    <PenStatus isPublic={pen.isPublic}>
                                        {pen.isPublic ? '公开' : '私有'}
                                    </PenStatus>
                                </PenMeta>
                            </PenCard>
                        ))}
                    </PenGrid>
                )}
            </Container>
        </PageContainer>
    );
};

export default PensPage; 