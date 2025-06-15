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
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    text-decoration: none;
    color: inherit;
    transition: transform 0.2s, box-shadow 0.2s;
    min-height: 200px;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
`;

const ShareButton = styled.button`
    position: absolute;
    top: 12px;
    right: 12px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 6px 12px;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: background-color 0.2s;

    &:hover {
        background: #45a049;
    }
`;

const Toast = styled.div`
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 1000;
    animation: fadeInOut 2s ease-in-out;

    @keyframes fadeInOut {
        0% { opacity: 0; }
        15% { opacity: 1; }
        85% { opacity: 1; }
        100% { opacity: 0; }
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
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

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

    const handleShare = (e: React.MouseEvent, penId: string) => {
        e.preventDefault(); // 阻止链接跳转
        const shareUrl = `${window.location.origin}/p/${penId}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            setToastMessage('分享链接已复制到剪贴板！');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
        }).catch(err => {
            console.error('复制失败:', err);
            setToastMessage('复制失败，请手动复制链接');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
        });
    };

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
                                <ShareButton onClick={(e) => handleShare(e, pen.id)}>
                                    🔗 分享
                                </ShareButton>
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
            {showToast && <Toast>{toastMessage}</Toast>}
        </PageContainer>
    );
};

export default PensPage; 