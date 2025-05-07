import React from 'react';
import { useNavigate } from 'react-router-dom';
// Asegúrate que la ruta al hook es correcta
import { useEstructuras } from '../../hooks/useEstructure'; 
import './Expediente.css';

export const ExpedientesContent = ({ }) => {
    const { estructuras, loading, error } = useEstructuras();
    const navigate = useNavigate();

    const handleEstructuraSeleccionada = (estructuraId) => {
        navigate(`/expedientes/detalle/${estructuraId}`);
    };

    if (loading) {
        return <div className="status-container"><p>Cargando estructuras...</p></div>;
    }
    if (error) {
        return <div className="status-container error"><p>{error}</p></div>;
    }

    return (
        <div className="expedientes-container">
            <h1>Seleccione una Estructura</h1>
            <p>Haga clic en una estructura para ver sus expedientes asociados.</p>

            {estructuras.length === 0 ? (
                <div className="status-container no-data">
                    <p>No hay estructuras registradas para mostrar.</p>
                </div>
            ) : (
                <div className="estructura-selector-container">
                    {estructuras.map((estructura) => (
                        <button
                            key={estructura.id}
                            className="estructura-selector-card"
                            onClick={() => handleEstructuraSeleccionada(estructura.id)}
                        >
                            <span className="razon-social">{estructura.RazonSocial || 'Sin Razón Social'}</span>
                            <span className="ver-expedientes-prompt">Ver Expedientes &rarr;</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};