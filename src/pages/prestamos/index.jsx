// src/pages/prestamos/PrestamosView.jsx
import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom'; // Ya no es necesario para la navegación desde aquí
import { firestore } from '../../config/firebase-config'; // Ajusta la ruta
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore'; // Añadido Timestamp
import { usePrestamosLogic } from '../../hooks/usePrestamosLogic'; // Ajusta la ruta a tu hook
import './Prestamos.css';

// Asumimos que tienes una función formatDate similar a esta o la importas
const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    let date;
    if (timestamp.toDate) { // Objeto Timestamp de Firebase
        date = timestamp.toDate();
    } else if (timestamp.seconds && typeof timestamp.seconds === 'number') { // Objeto con seconds/nanoseconds
        date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
        if (typeof timestamp === 'string' && timestamp.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const parts = timestamp.split('-');
            date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
        }
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        return 'Fecha inválida (tipo)';
    }

    if (isNaN(date.getTime())) return 'Fecha inválida (valor)';

    return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
    });
};


export const PrestamosView = ({ userInfo }) => {
    const [prestamos, setPrestamos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // const navigate = useNavigate(); // Comentado ya que no se usa para navegar directamente desde la tarjeta

    const { marcarPrestamoEntregado, isProcessingEntrega } = usePrestamosLogic();
    const [processingLoanId, setProcessingLoanId] = useState(null); // Para feedback en el botón específico

    const fetchPrestamos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const prestamosColRef = collection(firestore, "Prestamos");
            // Si marcarPrestamoEntregado ELIMINA el préstamo, no necesitas filtrar por estatus.
            // Si solo CAMBIA el estatus a "Devuelto", querrás filtrar aquí:
            // const q = query(prestamosColRef, where("estatusPrestamo", "==", "Prestado"), orderBy("fechaRegistroPrestamo", "desc"));
            const q = query(prestamosColRef, orderBy("fechaRegistroPrestamo", "desc"));
            const querySnapshot = await getDocs(q);
            const prestamosData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPrestamos(prestamosData);
        } catch (err) {
            console.error("Error obteniendo préstamos:", err);
            setError("No se pudieron cargar los registros de préstamos.");
            setPrestamos([]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchPrestamos();
    }, [fetchPrestamos]);

    const handleMarcarComoDevuelto = async (prestamoItem) => {
        if (!prestamoItem || !prestamoItem.id || !prestamoItem.expedienteId || !prestamoItem.estructuraId) {
            alert("Error: Información del préstamo incompleta.");
            return;
        }

        const confirmar = window.confirm(`¿Seguro que deseas marcar el préstamo del expediente "${prestamoItem.expedienteNombre || prestamoItem.expedienteId}" como devuelto? Esta acción finalizará el préstamo.`);
        if (!confirmar) {
            return;
        }

        setProcessingLoanId(prestamoItem.id);
        try {
            // La función marcarPrestamoEntregado espera: (prestamoId, expedienteIdentificadorEnArray, estructuraId)
            await marcarPrestamoEntregado(prestamoItem.id, prestamoItem.expedienteId, prestamoItem.estructuraId);
            alert('Préstamo finalizado y expediente actualizado.');
            fetchPrestamos(); // Recarga la lista, el préstamo debería desaparecer si se elimina
        } catch (err) {
            console.error("Error al marcar como devuelto:", err);
            alert(`Error al finalizar el préstamo: ${err.message}`);
        } finally {
            setProcessingLoanId(null);
        }
    };

    if (loading) return <div className="status-container"><p>Cargando préstamos...</p></div>;
    if (error) return <div className="status-container error"><p>{error} <button onClick={fetchPrestamos} disabled={loading}>Reintentar</button></p></div>;

    return (
        <div className="prestamos-view-container">
            <h1>Registros de Préstamos de Expedientes</h1>

            {prestamos.length === 0 && !loading ? (
                <div className="status-container no-data"><p>No hay préstamos activos registrados.</p></div>
            ) : (
                <div className="prestamos-list">
                    {prestamos.map(p => (
                        <div
                            key={p.id}
                            className="prestamo-item-card" // Ya no es 'clickable-card' para navegación global
                        >
                            <div className="prestamo-card-header">
                                {/* Asumimos que expedienteNombre se guarda en el doc de Préstamo */}
                                <h3>Expediente: {p.expedienteNombre || p.expedienteId || 'N/A'}</h3>
                                <span className={`prestamo-status prestamo-status-${(p.estatusPrestamo || 'Prestado').toLowerCase()}`}>
                                    {p.estatusPrestamo || "Prestado"}
                                </span>
                            </div>
                            <div className="prestamo-card-body">
                                {/* Sería ideal tener estructuraNombre aquí también */}
                                <p><strong>Estructura:</strong> {p.estructuraNombre || p.estructuraId || 'N/A'}</p>
                                <p><strong>Fecha Préstamo:</strong> {formatDate(p.fechaPrestamo)}</p>
                                <p><strong>Copias Prestadas:</strong> {p.cantidadCopiasPrestadas}</p>
                                <p><strong>Observaciones:</strong> {p.observaciones || 'N/A'}</p>
                            </div>
                            <div className="prestamo-card-footer">
                                {p.estatusPrestamo !== "Devuelto" && p.estatusPrestamo !== "Finalizado" && ( // Solo mostrar si está activo
                                    <button
                                        className="button-devolver" // Deberás añadir estilos para este botón
                                        onClick={() => handleMarcarComoDevuelto(p)}
                                        disabled={isProcessingEntrega && processingLoanId === p.id}
                                    >
                                        {isProcessingEntrega && processingLoanId === p.id ? "Procesando..." : "Marcar Devuelto"}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};