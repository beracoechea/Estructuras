import React, { useCallback, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstructuras } from '../../hooks/useEstructure'; // Usando el path que has estado utilizando
import './EstructuraConsulta.css';

// --- Helper Function para Clases de Tipo ---
// Esta función asigna una clase CSS basada en el valor de 'Tipo' de la estructura.
const getTipoClass = (tipo) => {
    if (!tipo) return 'tipo-default'; // Clase por defecto para tipos no definidos o vacíos

    // Normalizamos el tipo para que sea más fácil de usar como parte de un nombre de clase
    // Ej: "Asociación patronal" -> "asociacion-patronal"
    const normalizedTipo = String(tipo).toLowerCase() // Asegurarse que tipo es string antes de normalizar
        .normalize("NFD") // Quitar acentos
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '-') // Reemplazar espacios con guiones
        .replace(/[^a-z0-9-]/g, ''); // Quitar caracteres no alfanuméricos excepto guiones

    switch (normalizedTipo) {
        case 'sociedad-civil': return 'tipo-sociedad-civil';
        case 'asociacion-patronal': return 'tipo-asociacion-patronal';
        case 'sindicato': return 'tipo-sindicato';
        case 'confederacion': return 'tipo-confederaciones'; // Asegúrate que este case coincida con el valor normalizado
        case 'sofom': return 'tipo-sofom';
        case 'otro': return 'tipo-otro';
        default: return 'tipo-default'; // Para cualquier otro caso no especificado
    }
};

// --- Datos para Leyenda y Filtros ---
// Esta lista debe reflejar los valores exactos de 'Tipo' que se guardan en Firestore
// y los que se usan en el modal de 'Añadir Estructura'.
const tiposDisponibles = [
    { label: "Sociedad Civil", value: "Sociedad civil" },
    { label: "Asociación Patronal", value: "Asociación patronal" },
    { label: "Sindicato", value: "Sindicato" },
    { label: "Confederacion", value: "Confederacion" }, // Usar plural si así se guarda
    { label: "SOFOM", value: "SOFOM" },
    { label: "Otro", value: "Otro" },
];

// Genera los items para la leyenda usando los tiposDisponibles
const legendItems = [
    ...tiposDisponibles.map(tipo => ({
        label: tipo.label,
        className: getTipoClass(tipo.value) // Usa la función para obtener la clase correcta
    })),
    { label: "Default / No especificado", className: getTipoClass("") } // Caso para tipo vacío o no mapeado
];

// Genera las opciones para los botones de filtro
const filterOptions = [
    { label: "Mostrar Todos", tipoValueToFilter: "" }, // String vacío para "Mostrar Todos"
    ...tiposDisponibles.map(tipo => ({
        label: tipo.label,
        tipoValueToFilter: tipo.value // El valor exacto del 'Tipo' para filtrar
    }))
];

// --- Componente Principal de Consulta ---
export const EstructuraConsulta = React.memo(({ userInfo }) => {
    // Aunque userInfo se recibe como prop, ya no se usa en este JSX si la leyenda reemplaza el saludo.
    // Podrías considerar quitarlo si no tiene otro uso.
    const { estructuras, loading, error } = useEstructuras();
    const navigate = useNavigate();
    const [selectedTipoFilter, setSelectedTipoFilter] = useState(""); // "" para "Mostrar Todos"

    const handleCardClick = useCallback((estructuraId) => {
        navigate(`/estructuras/detalle/${estructuraId}`);
    }, [navigate]);

    const handleFilterChange = useCallback((tipo) => {
        setSelectedTipoFilter(tipo);
    }, []);

    // Memoriza la lista filtrada para evitar recálculos innecesarios
    const filteredEstructuras = useMemo(() => {
        if (!selectedTipoFilter) { // Si el filtro es "" (Mostrar Todos)
            return estructuras;
        }
        return estructuras.filter(est => est.Tipo === selectedTipoFilter);
    }, [estructuras, selectedTipoFilter]);

    if (loading) {
        return <div className="consulta-status-container"><p>Cargando estructuras...</p></div>;
    }

    if (error) {
        return (
            <div className="consulta-status-container error">
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="button-retry">Reintentar</button>
            </div>
        );
    }

    return (
        <div className="estructura-consulta-container">
            <h1>Estructuras Disponibles (Modo Consulta)</h1>

            {/* --- Inicio de la Leyenda de Colores --- */}
            <div className="legend-container">
                <h4 className="legend-title">Referencia de Tipos:</h4>
                <ul className="legend-list">
                    {legendItems.map(item => (
                        // Usar una combinación de className y label para una key más robusta si hay duplicados de className (ej. tipo-default)
                        <li key={`${item.className}-${item.label}`} className="legend-item">
                            <span className={`legend-color-swatch ${item.className}`}></span>
                            <span className="legend-label">{item.label}</span>
                        </li>
                    ))}
                </ul>
            </div>
            {/* --- Fin de la Leyenda de Colores --- */}

            {/* --- Inicio de los Botones de Filtro --- */}
            <div className="filter-container">
                <span className="filter-label">Filtrar por Tipo:</span>
                {filterOptions.map(option => (
                    <button
                        key={option.label} // Asumiendo que los labels son únicos para los botones
                        onClick={() => handleFilterChange(option.tipoValueToFilter)}
                        className={`filter-button ${selectedTipoFilter === option.tipoValueToFilter ? 'active' : ''}`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
            {/* --- Fin de los Botones de Filtro --- */}

            {filteredEstructuras.length === 0 && !loading ? (
                <div className="consulta-status-container no-data">
                    <p>
                        {selectedTipoFilter
                            ? `No hay estructuras para el tipo "${tiposDisponibles.find(t => t.value === selectedTipoFilter)?.label || selectedTipoFilter}".`
                            : "No hay datos para mostrar en la colección 'Estructuras'."}
                    </p>
                </div>
            ) : (
                <EstructurasList
                    estructuras={filteredEstructuras}
                    onCardClick={handleCardClick}
                />
            )}
        </div>
    );
});

// --- Componente Lista de Estructuras ---
const EstructurasList = React.memo(({ estructuras, onCardClick }) => {
    if (!estructuras || estructuras.length === 0) {
    
        return null;
    }
    return (
        <div className="estructuras-scroll-container">
            {estructuras.map((estructura) => (
                <EstructuraCard
                    key={estructura.id}
                    estructura={estructura}
                    onClick={onCardClick}
                />
            ))}
        </div>
    );
});

const EstructuraCard = React.memo(({ estructura, onClick }) => {
    const tipoClass = getTipoClass(estructura.Tipo);

    return (
        <div
            className={`estructura-card ${tipoClass}`} // Clase dinámica para el color del borde
            onClick={() => onClick(estructura.id)}
            tabIndex={0}
            onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onClick(estructura.id);
            }}
        >
            <h3>{estructura.RazonSocial || 'Sin Razón Social'}</h3>
            <p className="card-field"><strong>Estatus:</strong> {estructura.Estatus || 'No especificado'}</p>
            <p className="card-field"><strong>Uso:</strong> {estructura.Uso || 'No especificado'}</p>
        </div>
    );
});