import React from 'react';
import { Pen } from '../services/penService';
import {
    ImportPanelContainer,
    ImportPanelTitle,
    ImportCounter,
    ImportSection,
    ImportSectionHeader,
    ImportTypeLabel,
    ButtonGroup,
    ToggleButton,
    ClearButton,
    SelectedItemsContainer,
    PriorityHint,
    DragList,
    DragItem,
    DragItemInfo,
    IndexLabel,
    ItemTitle,
    DragItemControls,
    DirectionButton,
    RemoveButton,
    SelectPanel,
    SelectPanelHeader,
    SelectAllButton,
    UnselectAllButton,
    SelectItem,
    SelectCheckbox,
    SelectItemText
} from '../styles/importPanel.styles';

interface ImportPanelProps {
    // CSS 相关
    importedCssPenIds: string[];
    setImportedCssPenIds: React.Dispatch<React.SetStateAction<string[]>>;
    showCssImportPanel: boolean;
    setShowCssImportPanel: React.Dispatch<React.SetStateAction<boolean>>;

    // JS 相关
    importedJsPenIds: string[];
    setImportedJsPenIds: React.Dispatch<React.SetStateAction<string[]>>;
    showJsImportPanel: boolean;
    setShowJsImportPanel: React.Dispatch<React.SetStateAction<boolean>>;

    // 用户笔记数据
    userPens: Pen[];

    // 拖拽状态
    draggedCssIndex: number | null;
    setDraggedCssIndex: React.Dispatch<React.SetStateAction<number | null>>;
    draggedJsIndex: number | null;
    setDraggedJsIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

const ImportPanel: React.FC<ImportPanelProps> = ({
    importedCssPenIds,
    setImportedCssPenIds,
    showCssImportPanel,
    setShowCssImportPanel,
    importedJsPenIds,
    setImportedJsPenIds,
    showJsImportPanel,
    setShowJsImportPanel,
    userPens,
    draggedCssIndex,
    setDraggedCssIndex,
    draggedJsIndex,
    setDraggedJsIndex
}) => {
    // CSS 操作函数
    const toggleCssPen = (penId: string) => {
        setImportedCssPenIds(prev =>
            prev.includes(penId) ? prev.filter(id => id !== penId) : [...prev, penId]
        );
    };

    const clearAllCssImports = () => setImportedCssPenIds([]);

    const importAllCss = () => {
        const availableCssIds = userPens.filter(pen => pen.css.trim()).map(pen => pen.id);
        setImportedCssPenIds(availableCssIds);
    };

    // JS 操作函数
    const toggleJsPen = (penId: string) => {
        setImportedJsPenIds(prev =>
            prev.includes(penId) ? prev.filter(id => id !== penId) : [...prev, penId]
        );
    };

    const clearAllJsImports = () => setImportedJsPenIds([]);

    const importAllJs = () => {
        const availableJsIds = userPens.filter(pen => pen.js.trim()).map(pen => pen.id);
        setImportedJsPenIds(availableJsIds);
    };

    // CSS 拖拽操作
    const handleCssDragStart = (e: React.DragEvent, index: number) => {
        setDraggedCssIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleCssDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleCssDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedCssIndex !== null) {
            const newOrder = [...importedCssPenIds];
            const draggedItem = newOrder[draggedCssIndex];
            newOrder.splice(draggedCssIndex, 1);
            newOrder.splice(dropIndex, 0, draggedItem);
            setImportedCssPenIds(newOrder);
            setDraggedCssIndex(null);
        }
    };

    // JS 拖拽操作
    const handleJsDragStart = (e: React.DragEvent, index: number) => {
        setDraggedJsIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleJsDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleJsDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedJsIndex !== null) {
            const newOrder = [...importedJsPenIds];
            const draggedItem = newOrder[draggedJsIndex];
            newOrder.splice(draggedJsIndex, 1);
            newOrder.splice(dropIndex, 0, draggedItem);
            setImportedJsPenIds(newOrder);
            setDraggedJsIndex(null);
        }
    };

    // 移动函数
    const moveCssUp = (index: number) => {
        if (index > 0) {
            const newOrder = [...importedCssPenIds];
            [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
            setImportedCssPenIds(newOrder);
        }
    };

    const moveCssDown = (index: number) => {
        if (index < importedCssPenIds.length - 1) {
            const newOrder = [...importedCssPenIds];
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
            setImportedCssPenIds(newOrder);
        }
    };

    const moveJsUp = (index: number) => {
        if (index > 0) {
            const newOrder = [...importedJsPenIds];
            [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
            setImportedJsPenIds(newOrder);
        }
    };

    const moveJsDown = (index: number) => {
        if (index < importedJsPenIds.length - 1) {
            const newOrder = [...importedJsPenIds];
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
            setImportedJsPenIds(newOrder);
        }
    };

    return (
        <ImportPanelContainer>
            <ImportPanelTitle>
                <span>📦 导入其他 Pen</span>
                <ImportCounter>
                    ({importedCssPenIds.length + importedJsPenIds.length} 个已选)
                </ImportCounter>
            </ImportPanelTitle>

            {/* CSS 导入区域 */}
            <ImportSection>
                <ImportSectionHeader>
                    <ImportTypeLabel $type="css">
                        🎨 CSS ({importedCssPenIds.length})
                    </ImportTypeLabel>
                    <ButtonGroup>
                        <ToggleButton
                            active={showCssImportPanel}
                            $type="css"
                            onClick={() => setShowCssImportPanel(!showCssImportPanel)}
                        >
                            {showCssImportPanel ? '收起' : '选择'}
                        </ToggleButton>
                        {importedCssPenIds.length > 0 && (
                            <ClearButton onClick={clearAllCssImports}>
                                清空
                            </ClearButton>
                        )}
                    </ButtonGroup>
                </ImportSectionHeader>

                {/* CSS 已选标签 */}
                {importedCssPenIds.length > 0 && (
                    <SelectedItemsContainer>
                        <PriorityHint>
                            优先级顺序（可拖拽调整，越靠前优先级越低）:
                        </PriorityHint>
                        <DragList>
                            {importedCssPenIds.map((penId, index) => {
                                const pen = userPens.find(p => p.id === penId);
                                return pen ? (
                                    <DragItem
                                        key={penId}
                                        draggable
                                        isDragging={draggedCssIndex === index}
                                        onDragStart={(e) => handleCssDragStart(e, index)}
                                        onDragOver={handleCssDragOver}
                                        onDrop={(e) => handleCssDrop(e, index)}
                                    >
                                        <DragItemInfo>
                                            <IndexLabel>#{index + 1}</IndexLabel>
                                            <ItemTitle $type="css">🎨 {pen.title}</ItemTitle>
                                        </DragItemInfo>
                                        <DragItemControls>
                                            <DirectionButton
                                                onClick={() => moveCssUp(index)}
                                                disabled={index === 0}
                                                title="上移"
                                            >
                                                ↑
                                            </DirectionButton>
                                            <DirectionButton
                                                onClick={() => moveCssDown(index)}
                                                disabled={index === importedCssPenIds.length - 1}
                                                title="下移"
                                            >
                                                ↓
                                            </DirectionButton>
                                            <RemoveButton
                                                onClick={() => toggleCssPen(penId)}
                                                title="移除"
                                            >
                                                ×
                                            </RemoveButton>
                                        </DragItemControls>
                                    </DragItem>
                                ) : null;
                            })}
                        </DragList>
                    </SelectedItemsContainer>
                )}

                {/* CSS 选择面板 */}
                {showCssImportPanel && (
                    <SelectPanel>
                        <SelectPanelHeader>
                            <SelectAllButton onClick={importAllCss}>
                                全选
                            </SelectAllButton>
                            <UnselectAllButton onClick={clearAllCssImports}>
                                全不选
                            </UnselectAllButton>
                        </SelectPanelHeader>
                        {userPens
                            .filter(pen => pen.css.trim())
                            .map(pen => (
                                <SelectItem key={pen.id}>
                                    <SelectCheckbox
                                        type="checkbox"
                                        checked={importedCssPenIds.includes(pen.id)}
                                        onChange={() => toggleCssPen(pen.id)}
                                    />
                                    <SelectItemText selected={importedCssPenIds.includes(pen.id)}>
                                        🎨 {pen.title}
                                    </SelectItemText>
                                </SelectItem>
                            ))}
                    </SelectPanel>
                )}
            </ImportSection>

            {/* JS 导入区域 */}
            <ImportSection>
                <ImportSectionHeader>
                    <ImportTypeLabel $type="js">
                        ⚡ JS ({importedJsPenIds.length})
                    </ImportTypeLabel>
                    <ButtonGroup>
                        <ToggleButton
                            active={showJsImportPanel}
                            $type="js"
                            onClick={() => setShowJsImportPanel(!showJsImportPanel)}
                        >
                            {showJsImportPanel ? '收起' : '选择'}
                        </ToggleButton>
                        {importedJsPenIds.length > 0 && (
                            <ClearButton onClick={clearAllJsImports}>
                                清空
                            </ClearButton>
                        )}
                    </ButtonGroup>
                </ImportSectionHeader>

                {/* JS 已选标签 */}
                {importedJsPenIds.length > 0 && (
                    <SelectedItemsContainer>
                        <PriorityHint>
                            优先级顺序（可拖拽调整，越靠前优先级越低）:
                        </PriorityHint>
                        <DragList>
                            {importedJsPenIds.map((penId, index) => {
                                const pen = userPens.find(p => p.id === penId);
                                return pen ? (
                                    <DragItem
                                        key={penId}
                                        draggable
                                        isDragging={draggedJsIndex === index}
                                        onDragStart={(e) => handleJsDragStart(e, index)}
                                        onDragOver={handleJsDragOver}
                                        onDrop={(e) => handleJsDrop(e, index)}
                                    >
                                        <DragItemInfo>
                                            <IndexLabel>#{index + 1}</IndexLabel>
                                            <ItemTitle $type="js">⚡ {pen.title}</ItemTitle>
                                        </DragItemInfo>
                                        <DragItemControls>
                                            <DirectionButton
                                                onClick={() => moveJsUp(index)}
                                                disabled={index === 0}
                                                title="上移"
                                            >
                                                ↑
                                            </DirectionButton>
                                            <DirectionButton
                                                onClick={() => moveJsDown(index)}
                                                disabled={index === importedJsPenIds.length - 1}
                                                title="下移"
                                            >
                                                ↓
                                            </DirectionButton>
                                            <RemoveButton
                                                onClick={() => toggleJsPen(penId)}
                                                title="移除"
                                            >
                                                ×
                                            </RemoveButton>
                                        </DragItemControls>
                                    </DragItem>
                                ) : null;
                            })}
                        </DragList>
                    </SelectedItemsContainer>
                )}

                {/* JS 选择面板 */}
                {showJsImportPanel && (
                    <SelectPanel>
                        <SelectPanelHeader>
                            <SelectAllButton onClick={importAllJs}>
                                全选
                            </SelectAllButton>
                            <UnselectAllButton onClick={clearAllJsImports}>
                                全不选
                            </UnselectAllButton>
                        </SelectPanelHeader>
                        {userPens
                            .filter(pen => pen.js.trim())
                            .map(pen => (
                                <SelectItem key={pen.id}>
                                    <SelectCheckbox
                                        type="checkbox"
                                        checked={importedJsPenIds.includes(pen.id)}
                                        onChange={() => toggleJsPen(pen.id)}
                                    />
                                    <SelectItemText selected={importedJsPenIds.includes(pen.id)}>
                                        ⚡ {pen.title}
                                    </SelectItemText>
                                </SelectItem>
                            ))}
                    </SelectPanel>
                )}
            </ImportSection>
        </ImportPanelContainer>
    );
};

export default ImportPanel; 