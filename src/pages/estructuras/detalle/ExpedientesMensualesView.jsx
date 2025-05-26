// src/pages/estructuras/detalle/ExpedientesMensualesView.jsx
import React, { useState } from 'react'; // useEffect and EditExpedienteModal removed
import './ExpedientesMensuales.css';

export const ExpedientesMensualesView = ({
    expedientesMensuales, // This prop se actualizará desde el hook con el cambio optimista
    onUpdateExpedienteMensual, // This is the function from the hook for optimistic updates (primarily for checks)
    loading,
    error,
}) => {
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    const toggleCheck = async (expedienteId, year, monthIndex) => {
        const expedienteActual = expedientesMensuales.find(e => e.id === expedienteId || e.nombre === expedienteId);
        if (!expedienteActual) {
            console.error("Expediente no encontrado para toggleCheck, estado local puede estar desactualizado.");
            return;
        }

        const currentChecksForYear = expedienteActual.checksMensuales?.[year] ? [...expedienteActual.checksMensuales[year]] : Array(12).fill(false);
        currentChecksForYear[monthIndex] = !currentChecksForYear[monthIndex];

        const updatedChecksData = {
            checksMensuales: {
                ...expedienteActual.checksMensuales,
                [year]: currentChecksForYear,
            }
        };
        
        const result = await onUpdateExpedienteMensual(expedienteId, updatedChecksData);

        if (!result || !result.success) {
            alert(result?.message || "Error al actualizar el check mensual. El cambio visual ha sido revertido.");
        }
        // UI is already optimistically updated by the hook.
    };

    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    if (loading) return <div className="status-container"><p>Cargando expedientes mensuales...</p></div>;
    if (error) return <div className="status-container error"><p>{error}</p></div>;

    return (
        <div className="detalle-seccion expedientes-mensuales-view">
            {/* Button to add new monthly expedientes might still be here, triggered by onOpenAddModal from parent */}
            {/* e.g., <button onClick={onOpenAddModal} className="button-primary">Añadir Exp. Mensual</button> */}
            {/* This part depends on where the "add" button is located in your UI structure. */}
            {/* For now, assuming onOpenAddModal is called from outside this component's direct render. */}


            <div className="year-selector">
                <button onClick={() => setCurrentYear(y => y - 1)} className="button-secondary">&lt; Año Ant.</button>
                <strong>{currentYear}</strong>
                <button onClick={() => setCurrentYear(y => y + 1)} className="button-secondary">Año Sig. &gt;</button>
            </div>

            {expedientesMensuales.length === 0 ? (
                <div className="status-container no-data">
                    <p>No hay expedientes mensuales definidos. Use el botón "Cargar Exp. Mensuales Pred." o añada uno nuevo.</p>
                </div>
            ) : (
                <div className="antecedentes-cards-container">
                    {expedientesMensuales.map(exp => (
                        <div key={exp.id || exp.nombre} className="antecedente-card mensual-card">
                            <div className="mensual-card-header">
                                <h3>{exp.nombre}</h3>
                                {/* Removed Edit Info Button */}
                            </div>
                            {/* Removed description, general reminder date, and status display */}
                            {/* {exp.descripcion && <p className="expediente-descripcion">{exp.descripcion}</p>} */}
                            {/* {exp.fechaVencimientoRecordatorioGeneral && ... } */}
                            {/* <p><strong>Estatus:</strong> {exp.estatus || 'N/A'}</p> */}

                            <div className="checks-mensuales-container">
                                <h4>Cumplimiento {currentYear}:</h4>
                                <div className="checks-grid">
                                    {meses.map((mes, index) => (
                                        <div key={`${exp.id || exp.nombre}-${currentYear}-${index}`} className="check-item">
                                            <label htmlFor={`${exp.id || exp.nombre}-${currentYear}-${mes}-${index}`}>
                                                <input
                                                    type="checkbox"
                                                    id={`${exp.id || exp.nombre}-${currentYear}-${mes}-${index}`}
                                                    checked={exp.checksMensuales?.[currentYear]?.[index] || false}
                                                    onChange={() => toggleCheck(exp.id || exp.nombre, currentYear, index)}
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

            {/* Removed EditExpedienteModal rendering */}
        </div>
    );
};