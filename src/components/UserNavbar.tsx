import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import {
    NavbarContainer,NavbarContent,Logo,UserSection,UserInfo,UserAvatar,Username,LogoutButton,LoadingSpinner} 
    from '../styles/userNavbarStyles';

const UserNavbar: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);

    const handleLogoClick = () => {
        navigate('/pens');
    };

    const handleLogout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('登出失败:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    // 获取用户名首字母作为头像
    const getAvatarInitial = (username: string) => {
        return username.charAt(0).toUpperCase();
    };

    return (
        <NavbarContainer>
            <NavbarContent>
                <Logo onClick={handleLogoClick}>
                    <span>🚀</span>
                    飞书代码编辑器
                </Logo>

                <UserSection>
                    {user && (
                        <UserInfo>
                            <UserAvatar>
                                {getAvatarInitial(user.username)}
                            </UserAvatar>
                            <Username>{user.username}</Username>
                        </UserInfo>
                    )}

                    <LogoutButton
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                    >
                        {isLoggingOut ? (
                            <>
                                <LoadingSpinner />
                                登出中...
                            </>
                        ) : (
                            '登出'
                        )}
                    </LogoutButton>
                </UserSection>
            </NavbarContent>
        </NavbarContainer>
    );
};

export default UserNavbar; 