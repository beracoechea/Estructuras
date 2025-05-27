// src/components/AnnualComment.jsx

import React, { useState, useEffect } from 'react';

// Umbral de caracteres para truncar el texto
const TRUNCATE_LENGTH = 120;

export const AnnualComment = ({ itemId, currentYear, initialComments, onUpdate }) => {
    // Estado local para el texto del textarea (permite edición sin afectar el estado global)
    const [comment, setComment] = useState('');
    // Estado para la vista expandida del comentario guardado
    const [isExpanded, setIsExpanded] = useState(false);
    // Estado para controlar el proceso de guardado
    const [isSaving, setIsSaving] = useState(false);

    // Sincroniza el estado local cuando el año o los comentarios iniciales cambian
    useEffect(() => {
        const savedComment = initialComments?.[currentYear] || '';
        setComment(savedComment);
        // Resetea la vista expandida al cambiar de año
        setIsExpanded(false); 
    }, [currentYear, initialComments]);

    const handleSave = async () => {
        setIsSaving(true);
        const updatedData = {
            // Importante: Usamos el spread operator para no perder los comentarios de otros años
            comentariosAnuales: {
                ...(initialComments || {}),
                [currentYear]: comment,
            }
        };
        
        await onUpdate(itemId, updatedData);
        setIsSaving(false);
    };

    const savedComment = initialComments?.[currentYear] || '';
    const isLongComment = savedComment.length > TRUNCATE_LENGTH;
    const hasChanges = comment !== savedComment;

    return (
        <div className="annual-comment-container">
            <h4>Comentario Anual</h4>

            {/* --- ÁREA DE VISUALIZACIÓN DEL COMENTARIO GUARDADO --- */}
            {savedComment ? (
                <p 
                    className={`comment-display ${isLongComment ? 'expandable' : ''}`} 
                    onClick={() => isLongComment && setIsExpanded(!isExpanded)}
                >
                    {isLongComment && !isExpanded 
                        ? `${savedComment.substring(0, TRUNCATE_LENGTH)}... (ver más)` 
                        : savedComment
                    }
                </p>
            ) : (
                <p className="comment-display-empty">No hay comentarios para este año.</p>
            )}

            {/* --- ÁREA DE EDICIÓN --- */}
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe tus observaciones aquí..."
            />
            <button 
                onClick={handleSave} 
                disabled={isSaving || !hasChanges}
            >
                {isSaving ? 'Guardando...' : 'Guardar Comentario'}
            </button>
        </div>
    );
};