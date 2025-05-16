// src/pages/estructuras/detalle/ExpedientesMensualesView.jsx
import React, { useState, useEffect } from 'react'; // Quitado useCallback si no se usa directamente aquí
import { EditExpedienteModal } from '../../../modals/EditExpedienteModal';
import './ExpedientesMensuales.css';

export const ExpedientesMensualesView = ({
    expedientesMensuales, // Este prop se actualizará desde el hook con el cambio optimista
    estructuraId,
    estructuraNombre,
    onUpdateExpedienteMensual, // Esta es la función del hook que ahora maneja la actualización optimista
    onOpenAddModal,
    formatDate,
    loading,
    error,
}) => {
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [expedienteParaEditarInfo, setExpedienteParaEditarInfo] = useState(null);
    const [isEditInfoModalOpen, setIsEditInfoModalOpen] = useState(false);

    const handleOpenEditInfoModal = (expediente) => {
        setExpedienteParaEditarInfo(expediente);
        setIsEditInfoModalOpen(true);
    };

    const handleCloseEditInfoModal = () => {
        setIsEditInfoModalOpen(false);
        setExpedienteParaEditarInfo(null);
    };

    const handleSaveGeneralInfoDesdeModal = async (expedienteIdOriginal, dataFromModal) => {
        const result = await onUpdateExpedienteMensual(expedienteIdOriginal, dataFromModal);
        if (result && result.success) {
            handleCloseEditInfoModal();
            alert(result.message || 'Información general del expediente mensual actualizada.');
            // No es necesario un refetch aquí, el hook ya actualizó el estado que se pasa como prop.
        } else {
            alert(result?.message || 'Error al actualizar la información general del expediente mensual.');
        }
        return result?.success || false;
    };

    const toggleCheck = async (expedienteId, year, monthIndex) => {
        // Encuentra el estado actual del expediente para calcular el nuevo estado de checks
        // Esto es para construir el payload, la actualización visual vendrá del hook.
        const expedienteActual = expedientesMensuales.find(e => e.id === expedienteId || e.nombre === expedienteId);
        if (!expedienteActual) {
            console.error("Expediente no encontrado para toggleCheck, estado local puede estar desactualizado.");
            return;
        }

        const currentChecksForYear = expedienteActual.checksMensuales?.[year] ? [...expedienteActual.checksMensuales[year]] : Array(12).fill(false);
        currentChecksForYear[monthIndex] = !currentChecksForYear[monthIndex]; // El nuevo valor

        const updatedChecksData = {
            checksMensuales: {
                ...expedienteActual.checksMensuales,
                [year]: currentChecksForYear,
            }
        };
        
        // Llamar a la función del hook. Esta se encargará de la actualización optimista del estado
        // y luego de la persistencia en Firestore.
        const result = await onUpdateExpedienteMensual(expedienteId, updatedChecksData);

        if (!result || !result.success) {
            // El hook ya revirtió el estado si falló la escritura en Firestore.
            // Solo mostramos la alerta que viene del hook.
            alert(result?.message || "Error al actualizar el check mensual. El cambio visual ha sido revertido.");
        }
        // La UI ya se actualizó optimistamente por el hook.
    };

    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    if (loading) return <div className="status-container"><p>Cargando expedientes mensuales...</p></div>;
    if (error) return <div className="status-container error"><p>{error}</p></div>;

    return (
        <div className="detalle-seccion expedientes-mensuales-view">
            

            <div className="year-selector">
                <button onClick={() => setCurrentYear(y => y - 1)} className="button-secondary">&lt; Año Ant.</button>
                <strong>{currentYear}</strong>
                <button onClick={() => setCurrentYear(y => y + 1)} className="button-secondary">Año Sig. &gt;</button>
            </div>

            {expedientesMensuales.length === 0 ? (
                <div className="status-container no-data">
                    <p>No hay expedientes mensuales definidos. Use el botón "Cargar Exp. Mensuales Pred." en la sección superior.</p>
                </div>
            ) : (
                <div className="antecedentes-cards-container">
                    {expedientesMensuales.map(exp => ( // exp ahora viene del estado optimista del hook
                        <div key={exp.id || exp.nombre} className="antecedente-card mensual-card">
                            <div className="mensual-card-header">
                                <h3>{exp.nombre}</h3>
                                <button onClick={() => handleOpenEditInfoModal(exp)} className="button-edit-sm">Editar Info</button>
                            </div>
                            {exp.descripcion && <p className="expediente-descripcion">{exp.descripcion}</p>}
                            {exp.fechaVencimientoRecordatorioGeneral &&
                                <p className="recordatorio-vencimiento">
                                    <strong>Recordatorio General Vence:</strong> {formatDate(exp.fechaVencimientoRecordatorioGeneral)}
                                </p>
                            }
                            <p><strong>Estatus:</strong> {exp.estatus || 'N/A'}</p>

                            <div className="checks-mensuales-container">
                                <h4>Cumplimiento {currentYear}:</h4>
                                <div className="checks-grid">
                                    {meses.map((mes, index) => (
                                        <div key={`${exp.id}-${currentYear}-${index}`} className="check-item">
                                            <label htmlFor={`${exp.id}-${currentYear}-${mes}-${index}`}>
                                                <input
                                                    type="checkbox"
                                                    id={`${exp.id}-${currentYear}-${mes}-${index}`}
                                                    // El 'checked' ahora refleja el estado (posiblemente optimista) del hook
                                                    checked={exp.checksMensuales?.[currentYear]?.[index] || false}
                                                    onChange={() => toggleCheck(exp.id, currentYear, index)}
                                                />
                                                {mes}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {expedienteParaEditarInfo && (
                <EditExpedienteModal
                    isOpen={isEditInfoModalOpen}
                    onClose={handleCloseEditInfoModal}
                    onUpdateExpediente={handleSaveGeneralInfoDesdeModal}
                    initialData={expedienteParaEditarInfo}
                />
            )}
        </div>
    );
};