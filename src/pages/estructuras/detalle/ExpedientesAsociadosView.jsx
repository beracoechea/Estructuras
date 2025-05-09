// src/pages/estructuras/detalle/ExpedientesAsociadosView.jsx
import React, { useState } from 'react';
import { EditExpedienteModal } from '../../../modals/EditExpedienteModal';

export const ExpedientesAsociadosView = ({
    expedientes,
    loading,
    error,
    onOpenAddModal,
    onUpdateExpediente,
    formatDate,
    estructuraNombre,
}) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [expedienteToEdit, setExpedienteToEdit] = useState(null);
    const [expandedExpedienteId, setExpandedExpedienteId] = useState(null);

    const handleOpenEditModal = (expedienteData) => {
        setExpedienteToEdit(expedienteData);
        setIsEditModalOpen(true);
    };
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setExpedienteToEdit(null);
    };
    const toggleExpandExpediente = (expedienteId) => {
        setExpandedExpedienteId(prevId => (prevId === expedienteId ? null : expedienteId));
    };

    if (loading) return <div className="status-container"><p>Cargando expedientes...</p></div>;
    if (error) return <div className="status-container error"><p>{error}</p></div>;

    // --- Función Auxiliar para obtener Date de forma segura ---
    const getSafeDateFromTimestamp = (firestoreTimestamp) => {
        if (firestoreTimestamp && typeof firestoreTimestamp.toDate === 'function') {
            return firestoreTimestamp.toDate();
        }
        // Opcional: si sospechas que puedes tener strings de fecha, intenta parsearlos aquí.
        // Pero es mejor asegurar que los datos sean Timestamps.
        // console.warn("Encontrado un campo fechaVencimiento que no es un Timestamp:", firestoreTimestamp);
        return null;
    };

    const sortedExpedientes = [...expedientes].sort((a, b) => {
        const now = new Date().setHours(0, 0, 0, 0);

        // Usar la función auxiliar segura
        const dateA = getSafeDateFromTimestamp(a.fechaVencimiento);
        const timeA = dateA ? dateA.getTime() : null;
        const aIsPast = timeA ? timeA < now : false;

        const dateB = getSafeDateFromTimestamp(b.fechaVencimiento); // <--- Aquí se usa la función segura
        const timeB = dateB ? dateB.getTime() : null;
        const bIsPast = timeB ? timeB < now : false;

        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;

        if (!aIsPast && bIsPast) return -1;
        if (aIsPast && !bIsPast) return 1;

        return timeA - timeB;
    });

    return (
        <div className="detalle-seccion expedientes-asociados">
            <div className="expedientes-list-header">
                <h2>Expedientes Asociados {estructuraNombre ? `a ${estructuraNombre}` : ''}</h2>
                <button className="button-add-new" onClick={onOpenAddModal}>
                    + Añadir Expediente
                </button>
            </div>

            {sortedExpedientes.length === 0 ? (
                <div className="status-container no-data">
                    <p>No se han insertado expedientes para esta estructura todavía.</p>
                </div>
            ) : (
                <div className="antecedentes-cards-container">
                    {sortedExpedientes.map((exp) => {
                        const isExpanded = expandedExpedienteId === exp.id;
                        const hoy = new Date();
                        // Usar la función auxiliar también para la visualización
                        const fechaVenc = getSafeDateFromTimestamp(exp.fechaVencimiento);
                        let vencimientoClass = '';
                        let vencimientoText = fechaVenc ? formatDate(exp.fechaVencimiento) : 'N/A'; // formatDate debería manejar Timestamps

                        if (fechaVenc) {
                            const diffTime = fechaVenc.getTime() - hoy.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            if (diffTime < 0) {
                                vencimientoClass = 'vencido';
                                vencimientoText += ` (Venció hace ${Math.abs(diffDays)} días)`;
                            } else if (diffDays <= 0) { // Exactamente hoy o ya pasó pero es el mismo día
                                vencimientoClass = 'vence-hoy';
                                vencimientoText += " (Vence hoy)";
                            } else if (diffDays <= 30) {
                                vencimientoClass = 'vence-pronto';
                                vencimientoText += ` (Vence en ${diffDays} días)`;
                            }
                        } else {
                            vencimientoText = 'N/A'; // Si getSafeDateFromTimestamp devuelve null
                        }


                        return (
                            <div key={exp.id} className={`antecedente-card ${isExpanded ? 'expanded' : ''} ${vencimientoClass}`}>
                                <div className="antecedente-summary" onClick={() => toggleExpandExpediente(exp.id)}>
                                    <div className="summary-info">
                                        <span className="summary-field"><strong>Nombre:</strong> {exp.nombre || 'N/A'}</span>
                                        <span className="summary-field"><strong>Número:</strong> {exp.numero || 'N/A'}</span>
                                        <span className="summary-field"><strong>Fecha Doc.:</strong> {formatDate(exp.fecha)}</span>
                                        <span className="summary-field"><strong>Estatus:</strong> {exp.estatus || 'N/A'}</span>
                                        {/* Mostrar fecha de vencimiento resumida si existe */}
                                        {fechaVenc && ( // Solo mostrar si hay fecha de vencimiento válida
                                            <span className={`summary-field vencimiento-info ${vencimientoClass}`}>
                                                <strong>Vence:</strong> {formatDate(exp.fechaVencimiento)} {/* formatDate debería poder con el timestamp original si es válido */}
                                            </span>
                                        )}
                                    </div>
                                    <span className="expand-icon">{isExpanded ? '−' : '+'}</span>
                                </div>
                                <div className="antecedente-details">
                                    <p><strong>Link Digital:</strong> {exp.linkDigital ? <a href={exp.linkDigital} target="_blank" rel="noopener noreferrer" className="link-acceso" onClick={e => e.stopPropagation()}>Ver</a> : 'N/A'}</p>
                                    <p><strong>Ubicación Física:</strong> {exp.ubicacionFisica || 'N/A'}</p>
                                    <div className="text-area-display"><strong>Observaciones:</strong><pre>{exp.observaciones || 'N/A'}</pre></div>
                                    <p><strong>Original (Cant.):</strong> {exp.original ?? 'N/A'}</p>
                                    <p><strong>Copias Cert. (Cant.):</strong> {exp.copiasCertificadas ?? 'N/A'}</p>
                                    <p className={vencimientoClass}>
                                        <strong>Fecha de Vencimiento:</strong> {vencimientoText}
                                    </p>
                                    <p><strong>Fecha Registro:</strong> {formatDate(exp.fechaRegistro)}</p>
                                    {exp.fechaActualizacion && <p><strong>Últ. Actualización:</strong> {formatDate(exp.fechaActualizacion)}</p>}

                                    <div className="antecedente-actions">
                                        <button
                                            className="button-edit-antecedente"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenEditModal(exp);
                                            }}
                                        >
                                            Editar Expediente
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <EditExpedienteModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                onUpdateExpediente={onUpdateExpediente}
                initialData={expedienteToEdit}
            />
        </div>
    );
};