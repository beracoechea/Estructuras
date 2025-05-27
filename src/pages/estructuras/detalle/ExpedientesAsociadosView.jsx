// src/pages/estructuras/detalle/ExpedientesAsociadosView.jsx
import React, { useState } from 'react';
import { EditExpedienteModal } from '../../../modals/EditExpedienteModal';
import './Expediente.css';

export const ExpedientesAsociadosView = ({
    expedientes,
    loading,
    error,
    onUpdateExpediente,
    formatDate,
    estructuraNombre,
    estructuraId,
    onOpenPrestamoModal,
    onAddDefaultExpedientes,
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
    
    const getSafeDateFromTimestamp = (firestoreTimestamp) => {
        if (firestoreTimestamp && typeof firestoreTimestamp.toDate === 'function') {
            return firestoreTimestamp.toDate();
        }
        return null;
    };
    
    // ==================================================================
    // =====> 1. FILTRAR LOS EXPEDIENTES QUE NO TIENEN TIPO <=====
    // ==================================================================
    const expedientesFiltrados = expedientes.filter(exp => !exp.tipo); 
    // Esto filtrará los expedientes donde `tipo` es undefined, null, o '' (cadena vacía).
    // Si necesitas una condición más específica (ej. solo undefined), puedes cambiarla:
    // const expedientesFiltrados = expedientes.filter(exp => typeof exp.tipo === 'undefined');

    // Ahora ordenamos la lista ya filtrada
    const sortedExpedientes = [...expedientesFiltrados].sort((a, b) => {
        const now = new Date().setHours(0, 0, 0, 0);
        const dateA = getSafeDateFromTimestamp(a.fechaVencimiento);
        const timeA = dateA ? dateA.getTime() : null;
        const aIsPast = timeA ? timeA < now : false;
        const dateB = getSafeDateFromTimestamp(b.fechaVencimiento);
        const timeB = dateB ? dateB.getTime() : null;
        const bIsPast = timeB ? timeB < now : false;

        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;

        if (!aIsPast && bIsPast) return -1;
        if (aIsPast && !bIsPast) return 1;

        return timeA - timeB;
    });

    if (loading && expedientesFiltrados.length === 0) return <div className="status-container"><p>Cargando expedientes...</p></div>;
    if (error) return <div className="status-container error"><p>{error}</p></div>;

    return (
        <div className="detalle-seccion expedientes-asociados">
            <div className="expedientes-asociados-actions-header">
                <button 
                    onClick={onAddDefaultExpedientes} 
                    disabled={loading}
                    className="button-primary"
                >
                    {loading ? 'Cargando...' : 'Cargar Exp. Predeterminados'}
                </button>
            </div>

            <div className="expedientes-list-header">
                <h2>Expedientes Asociados (sin tipo específico)</h2> {/* Título actualizado para reflejar el filtro */}
            </div>

            {/* Usamos sortedExpedientes (que ahora viene de expedientesFiltrados) para la condición de "no data" y para el mapeo */}
            {!loading && sortedExpedientes.length === 0 && !error && ( 
                <div className="status-container no-data">
                    <p>
                        No hay expedientes sin tipo específico cargados para esta estructura, o todos los expedientes tienen un tipo.
                        Puede utilizar el botón "Cargar Expedientes Predeterminados" para añadirlos (algunos podrían tener tipo y otros no).
                    </p>
                </div>
            )}

            {!error && sortedExpedientes.length > 0 && (
                <div className="antecedentes-cards-container">
                    {sortedExpedientes.map((exp) => { // Mapeamos sobre la lista filtrada y ordenada
                        const isExpanded = expandedExpedienteId === exp.id;
                        const hoy = new Date();
                        const fechaVenc = getSafeDateFromTimestamp(exp.fechaVencimiento);
                        let vencimientoClass = '';
                        let vencimientoText = exp.fechaVencimiento ? formatDate(exp.fechaVencimiento) : 'N/A';

                        if (fechaVenc) {
                            const diffTime = fechaVenc.getTime() - hoy.getTime(); 
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            if (diffTime < 0 && fechaVenc.setHours(0,0,0,0) < hoy.setHours(0,0,0,0)) {
                                vencimientoClass = 'vencido';
                                vencimientoText += ` (Venció hace ${Math.abs(diffDays)} días)`;
                            } else if (fechaVenc.setHours(0,0,0,0) === hoy.setHours(0,0,0,0)) {
                                vencimientoClass = 'vence-hoy';
                                vencimientoText += " (Vence hoy)";
                            } else if (diffDays > 0 && diffDays <= 30) {
                                vencimientoClass = 'vence-pronto';
                                vencimientoText += ` (Vence en ${diffDays} días)`;
                            }
                        } else {
                            vencimientoText = 'N/A';
                        }

                        return (
                            <div key={exp.id} className={`antecedente-card ${isExpanded ? 'expanded' : ''} ${vencimientoClass}`}>
                                <div className="antecedente-summary" onClick={() => toggleExpandExpediente(exp.id)}>
                                    <div className="summary-info">
                                        <span className="summary-field"><strong>Nombre:</strong> {exp.nombre || 'N/A'}</span>
                                        <span className="summary-field"><strong>Número:</strong> {exp.numero || 'N/A'}</span>
                                        <span className="summary-field"><strong>Fecha Doc.:</strong> {exp.fecha ? formatDate(exp.fecha) : 'N/A'}</span>
                                        <span className="summary-field"><strong>Estatus:</strong> {exp.estatus || 'Pendiente'}</span>
                                        {exp.fechaVencimiento && (
                                            <span className={`summary-field vencimiento-info ${vencimientoClass}`}>
                                                <strong>Vence:</strong> {formatDate(exp.fechaVencimiento)}
                                            </span>
                                        )}
                                    </div>
                                    <span className="expand-icon">{isExpanded ? '−' : '+'}</span>
                                </div>
                                <div className="antecedente-details">
                                    <p><strong>Link Digital:</strong> {exp.linkDigital ? <a href={exp.linkDigital} target="_blank" rel="noopener noreferrer" className="link-acceso" onClick={e => e.stopPropagation()}>Ver</a> : 'N/A'}</p>
                                    <p><strong>Ubicación Física:</strong> {exp.ubicacionFisica || 'N/A'}</p>
                                    <div className="text-area-display"><strong>Observaciones:</strong><pre>{exp.observaciones || 'N/A'}</pre></div>
                                    <p><strong>Original (Cant.):</strong> {exp.original != null ? exp.original : 'N/A'}</p>
                                    <p><strong>Copias Cert. (Cant.):</strong> {exp.copiasCertificadas != null ? exp.copiasCertificadas : 'N/A'}</p>
                                    <p className={vencimientoClass}>
                                        <strong>Fecha de Vencimiento:</strong> {vencimientoText}
                                    </p>
                                    <p><strong>Fecha Registro:</strong> {exp.fechaRegistro ? formatDate(exp.fechaRegistro) : 'N/A'}</p>
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
                                        <button
                                            className="button-prestamo"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onOpenPrestamoModal(exp);
                                            }}
                                        >
                                            Registrar Préstamo
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