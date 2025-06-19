import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserPens, Pen } from '../services/penService';
import UserNavbar from '../components/UserNavbar';
import {
    PageContainer,
    Container,
    Header,
    Title,
    CreateButton,
    PenGrid,
    PenCard,
    ShareButton,
    Toast,
    PenTitle,
    PenDescription,
    PenMeta,
    PenDate,
    PenStatus,
    EmptyState,
    EmptyIcon,
    EmptyTitle,
    EmptyText
} from '../styles/PensPage.styles';

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