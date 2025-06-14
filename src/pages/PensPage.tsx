import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { getUserPens, Pen } from '../services/penService';

const Container = styled.div`
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
`;

const Title = styled.h1`
    margin: 0;
    color: #333;
`;

const CreateButton = styled(Link)`
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    &:hover {
        background-color: #45a049;
    }
`;

const PenGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
`;

const PenCard = styled(Link)`
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    padding: 15px;
    text-decoration: none;
    color: inherit;
    transition: transform 0.2s;
    &:hover {
        transform: translateY(-2px);
    }
`;

const PenTitle = styled.h3`
    margin: 0 0 10px 0;
    color: #333;
`;

const PenDescription = styled.p`
    margin: 0;
    color: #666;
    font-size: 0.9em;
`;

const PenDate = styled.div`
    margin-top: 10px;
    color: #999;
    font-size: 0.8em;
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
        return <Container>Loading...</Container>;
    }

    return (
        <Container>
            <Header>
                <Title>My Code Snippets</Title>
                <CreateButton to="/editor">Create New</CreateButton>
            </Header>
            <PenGrid>
                {pens.map((pen) => (
                    <PenCard key={pen.id} to={`/editor/${pen.id}`}>
                        <PenTitle>{pen.title}</PenTitle>
                        <PenDescription>{pen.description || 'No description'}</PenDescription>
                        <PenDate>
                            Last updated: {new Date(pen.updatedAt).toLocaleDateString()}
                        </PenDate>
                    </PenCard>
                ))}
            </PenGrid>
        </Container>
    );
};

export default PensPage; 