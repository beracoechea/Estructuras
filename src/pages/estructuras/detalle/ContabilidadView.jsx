import React, { useState } from 'react';
import { AnnualComment } from './AnnualComment';
import './ContabilidadView.css';

export const ContabilidadView = ({
    contabilidadData,
    onUpdateContabilidad,
    loading,
    error,
    onAddDefaultContabilidadItems,
   
}) => {
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    // ... (el resto de tu lógica de handleToggleCheck no necesita cambios)
    const handleToggleCheck = async (item, year, monthIndex = null) => {
        const itemId = item.id || item.nombre;
        let updatedData = {};

        if (item.frecuencia === 'mensual') {
            const currentChecksForYear = item.cumplimientoMensual?.[year] ? [...item.cumplimientoMensual[year]] : Array(12).fill(false);
            currentChecksForYear[monthIndex] = !currentChecksForYear[monthIndex];
            updatedData = {
                cumplimientoMensual: {
                    ...(item.cumplimientoMensual || {}),
                    [year]: currentChecksForYear,
                }
            };
        } else if (item.frecuencia === 'anual') {
            const currentAnnualStatus = item.cumplimientoAnual?.[year] || false;
            updatedData = {
                cumplimientoAnual: {
                    ...(item.cumplimientoAnual || {}),
                    [year]: !currentAnnualStatus,
                }
            };
        } else {
            console.warn("Frecuencia no manejada para el item:", item);
            return;
        }
        
        const result = await onUpdateContabilidad(itemId, updatedData);
        if (!result || !result.success) {
            alert(result?.message || "Error al actualizar el registro. El cambio visual podría ser revertido por el hook si la actualización optimista falla.");
        }
    };

    if (loading && (!contabilidadData || contabilidadData.length === 0)) {
        return <div className="status-container"><p>Cargando registros contables...</p></div>;
    }
    if (error) return <div className="status-container error"><p>{error}</p></div>;

    return (
        <div className="detalle-seccion contabilidad-cards-view">
            <div className="contabilidad-actions-header">
                <button 
                    onClick={onAddDefaultContabilidadItems}
                    disabled={loading}
                    className="button-primary"
                >
                    {loading ? 'Cargando...' : 'Cargar Contabilidad Pred.'}
                </button>

    
            </div>

            <div className="year-selector">
                <button onClick={() => setCurrentYear(y => y - 1)} className="button-secondary">&lt; Año Ant.</button>
                <strong>{currentYear}</strong>
                <button onClick={() => setCurrentYear(y => y + 1)} className="button-secondary">Año Sig. &gt;</button>
            </div>

            {(!contabilidadData || contabilidadData.length === 0) ? (
                <div className="status-container no-data">
                    <p>No hay registros contables definidos. Use el botón "Cargar Contabilidad Pred." para empezar.</p>
                </div>
            ) : (
                <div className="antecedentes-cards-container">
                    {contabilidadData.map(item => (
                        <div key={item.id || item.nombre} className="antecedente-card mensual-card">
                            <div className="mensual-card-header">
                                <h3>{item.nombre} <span className="frecuencia-tag">({item.frecuencia})</span></h3>
                            </div>
                            <p className="expediente-descripcion">{item.descripcion || 'Sin descripción detallada.'}</p>
                            
                            {item.frecuencia === 'mensual' && (
                                <>
                                    <div className="checks-mensuales-container">
                                        <h4>Cumplimiento {currentYear}:</h4>
                                        <div className="checks-grid">
                                            {meses.map((mes, index) => (
                                                <div key={`${item.id || item.nombre}-${currentYear}-${index}`} className="check-item">
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            checked={item.cumplimientoMensual?.[currentYear]?.[index] || false}
                                                            onChange={() => handleToggleCheck(item, currentYear, index)}
                                                        />
                                                        {mes}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <AnnualComment
                                        itemId={item.id || item.nombre}
                                        currentYear={currentYear}
                                        initialComments={item.comentariosAnuales}
                                        onUpdate={onUpdateContabilidad}
                                    />
                                </>
                            )}

                            {item.frecuencia === 'anual' && (
                                <>
                                    <div className="checks-anuales-container">
                                        <h4>Cumplimiento {currentYear}:</h4>
                                        <div className="check-item">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={item.cumplimientoAnual?.[currentYear] || false}
                                                    onChange={() => handleToggleCheck(item, currentYear)}
                                                />
                                                Cumplido
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <AnnualComment
                                        itemId={item.id || item.nombre}
                                        currentYear={currentYear}
                                        initialComments={item.comentariosAnuales}
                                        onUpdate={onUpdateContabilidad}
                                    />
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};