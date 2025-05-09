import React from 'react';

const formatDateFromParent = (timestamp) => { // Reutilizamos la lógica que tenías
    if (!timestamp) return 'N/A'; let date; if (timestamp.toDate){ date = timestamp.toDate();} else if (typeof timestamp === 'string') { const parts = timestamp.split('-'); if(parts.length === 3){date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));} else { date = new Date(timestamp);}} else if (timestamp instanceof Date){date = timestamp;} else {return 'Fecha inválida';} if(isNaN(date.getTime())){ return 'Fecha inválida';} return date.toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'});
};


export const AntecedentesSocietariosView = ({
    antecedentes,
    expandedIndex,
    onToggleExpand,
    onOpenAddModal,
    onOpenEditModal,
    formatDate // O usar formatDateFromParent
}) => {
    // Si pasas formatDate como prop, úsalo directamente. Si no, usa la versión local.
    const displayDate = formatDate || formatDateFromParent;

    return (
        <div className="detalle-seccion antecedentes-societarios">
            <h2>Antecedentes Societarios</h2>
            {antecedentes.length === 0 && (<p>No hay antecedentes societarios registrados.</p>)}
            <div className="antecedentes-cards-container">
                {antecedentes.map((antecedente, index) => {
                    const isExpanded = expandedIndex === index;
                    const actos = Array.isArray(antecedente.actosCelebrados) ? antecedente.actosCelebrados : [];
                    return (
                        <div key={index} className={`antecedente-card ${isExpanded ? 'expanded' : ''}`}>
                            <div className="antecedente-summary" onClick={() => onToggleExpand(index)}>
                                <div className="summary-info">
                                    <span className="summary-field"><strong>Tipo:</strong> {antecedente.nombre || 'N/A'}</span>
                                    <span className="summary-field"><strong>Escritura:</strong> {antecedente.escritura || 'N/A'}</span>
                                    <span className="summary-field"><strong>Fecha:</strong> {displayDate(antecedente.fechaCelebracion)}</span>
                                </div>
                                <span className="expand-icon">{isExpanded ? '−' : '+'}</span>
                            </div>
                            <div className="antecedente-details">
                                <p><strong>Datos Notariales:</strong> {antecedente.datosNotariales || 'N/A'}</p>
                                <p><strong>Folio RPP:</strong> {antecedente.folioRPP || 'N/A'}</p>
                                <p><strong>Estatus/Ubicación Física:</strong> {antecedente.estatusUbicacionFisica || 'N/A'}</p>
                                <div className="text-area-display"><strong>Socios Finales:</strong><pre>{antecedente.sociosFinales || 'N/A'}</pre></div>
                                <div className="text-area-display"><strong>Rep. Legales Finales:</strong><pre>{antecedente.sociosRLfinales || 'N/A'}</pre></div>
                                <div className="actos-celebrados-section"><strong>Actos Celebrados:</strong>{actos.length > 0 ? (<ul className="actos-list">{actos.map((a, i) => <li key={i}>{a.otorgamiento||'?'} (Resp: {a.responsable||'?'})</li>)}</ul>) : (<p>N/A</p>)}</div>
                                <p><strong>Link de Acceso:</strong>{antecedente.linkAcceso ? (<a href={antecedente.linkAcceso} target="_blank" rel="noopener noreferrer" className="link-acceso"> Ver Documento </a>) : ' N/A'}</p>
                                <div className="antecedente-actions">
                                    <button className="button-edit-antecedente" onClick={(e) => { e.stopPropagation(); onOpenEditModal(antecedente, index); }}>
                                        Editar
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <button onClick={onOpenAddModal} className="button-add-antecedente">
                + Añadir Antecedente Societario
            </button>
        </div>
    );
};