// src/pages/prestamos/PrestamosView.jsx (Fragmento modificado)
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Ya estaba importado
import { firestore } from '../../config/firebase-config';
import { collection, getDocs, query, orderBy /* ... otros imports si los usas como doc, getDoc */ } from 'firebase/firestore';
import './Prestamos.css';

// ... (formatDate sin cambios) ...
const formatDate = (timestamp) => { /* ... */ };

export const PrestamosView = ({ userInfo }) => {
    const [prestamos, setPrestamos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Ya estaba inicializado

    // ... (fetchPrestamos puede quedar igual o simplificarse si ya no necesitas el nombre del expediente aquí) ...
    const fetchPrestamos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const prestamosColRef = collection(firestore, "Prestamos");
            const q = query(prestamosColRef, orderBy("fechaRegistroPrestamo", "desc"));
            const querySnapshot = await getDocs(q);
            // Simplificado: Ya no necesitamos buscar el nombre aquí si vamos a la vista de detalle
            const prestamosData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPrestamos(prestamosData);
        } catch (err) {
            console.error("Error obteniendo préstamos:", err);
            setError("No se pudieron cargar los registros de préstamos.");
        }
        setLoading(false);
    }, []);


    useEffect(() => {
        fetchPrestamos();
    }, [fetchPrestamos]);

    // --- MODIFICADO: Función para manejar el clic ---
    const handlePrestamoClick = (expedienteId) => {
        if (!expedienteId) {
            console.error("El registro de préstamo no tiene un expedienteId asociado.");
            alert("Error: No se puede determinar el expediente para este préstamo.");
            return;
        }
        console.log(`Navegando a detalle del expediente: ${expedienteId}`);
        // Navega a la nueva ruta de detalle del expediente
        navigate(`/expedientes/${expedienteId}`);
    };

    // ... (renderizado de loading y error sin cambios) ...
    if (loading) return <div className="status-container"><p>Cargando préstamos...</p></div>;
    if (error) return <div className="status-container error"><p>{error}</p></div>;


    return (
        <div className="prestamos-view-container">
            <h1>Registros de Préstamos de Expedientes</h1>
            {/* ... (resto del renderizado sin cambios hasta el map) ... */}

            {prestamos.length === 0 ? (
                 <div className="status-container no-data"><p>No hay préstamos registrados.</p></div>
             ) : (
                <div className="prestamos-list">
                    {prestamos.map(p => (
                        // --- MODIFICADO: onClick ahora solo necesita expedienteId ---
                        <div
                            key={p.id}
                            className="prestamo-item-card clickable-card"
                            onClick={() => handlePrestamoClick(p.expedienteId)} // Llama con el ID del expediente
                            title={`Ver detalles del expediente ${p.expedienteId.slice(0,8)}...`} // Tooltip actualizado
                        >
                            <div className="prestamo-card-header">
                                {/* Muestra el ID del expediente directamente */}
                                <h3>Expediente ID: {p.expedienteId ? p.expedienteId.slice(0, 8) : 'N/A'}...</h3>
                                <span className={`prestamo-status prestamo-status-${(p.estatusPrestamo || 'prestado').toLowerCase()}`}>
                                    {p.estatusPrestamo || "Prestado"}
                                </span>
                            </div>
                            {/* ... (resto del cuerpo y pie de la tarjeta sin cambios) ... */}
                             <div className="prestamo-card-body">
                                 <p><strong>Estructura ID:</strong> {p.estructuraId ? p.estructuraId.slice(0,8) : 'N/A'}...</p>
                                 <p><strong>Fecha Préstamo:</strong> {formatDate(p.fechaPrestamo)}</p>
                                 <p><strong>Copias Prestadas:</strong> {p.cantidadCopiasPrestadas}</p>
                                 <p><strong>Observaciones:</strong> {p.observaciones || 'N/A'}</p>
                             </div>
                             <div className="prestamo-card-footer">
                                 <small>Registrado: {formatDate(p.fechaRegistroPrestamo)}</small>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};