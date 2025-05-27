// src/pages/estructuras/detalle/ExpedientesMensualesView.jsx
import React, { useState } from 'react';
import './ExpedientesMensuales.css';

export const ExpedientesMensualesView = ({
    expedientesMensuales,
    onUpdateExpedienteMensual,
    loading,
    error,
    onAddDefaultExpedientesMensuales,
}) => {
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

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
    };

    if (loading && (!expedientesMensuales || expedientesMensuales.length === 0)) {
        return <div className="status-container"><p>Cargando expedientes mensuales...</p></div>;
    }
    if (error) return <div className="status-container error"><p>{error}</p></div>;

    return (
        <div className="detalle-seccion expedientes-mensuales-view">
            
            {/* =====> 2. AÑADE LA BARRA DE ACCIONES CON LOS BOTONES <===== */}
            <div className="expedientes-mensuales-actions-header">
                <button 
                    onClick={onAddDefaultExpedientesMensuales} 
                    disabled={loading}
                    className="button-primary"
                >
                    {loading ? 'Cargando...' : 'Cargar Exp. Mensuales Pred.'}
                </button>
            </div>


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
                            </div>
                            
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
        </div>
    );
};