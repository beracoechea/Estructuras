// src/pages/estructuras/EstructuraDetalle.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firestore } from '../../../config/firebase-config'; 
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { AddAntecedenteModal } from '../../../modals/AddAntecedenteModal'; 
import './EstructuraDetalle.css'; 
export const EstructuraDetalle = () => {
    const { estructuraId } = useParams(); // Obtiene el ID de la URL
    const navigate = useNavigate();
    const [estructura, setEstructura] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddAntecedenteModalOpen, setIsAddAntecedenteModalOpen] = useState(false);

    const fetchEstructuraDetalle = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const estructuraRef = doc(firestore, "Estructuras", estructuraId);
            const docSnap = await getDoc(estructuraRef);

            if (docSnap.exists()) {
                setEstructura({ id: docSnap.id, ...docSnap.data() });
            } else {
                setError("No se encontró la estructura.");
                setEstructura(null);
            }
        } catch (err) {
            console.error("Error al obtener detalle de la estructura:", err);
            setError("Error al cargar los datos de la estructura.");
            setEstructura(null);
        }
        setLoading(false);
    }, [estructuraId]);

    useEffect(() => {
        fetchEstructuraDetalle();
    }, [fetchEstructuraDetalle]);

    const handleOpenAddAntecedenteModal = () => {
        setIsAddAntecedenteModalOpen(true);
    };

    const handleCloseAddAntecedenteModal = () => {
        setIsAddAntecedenteModalOpen(false);
    };

    const handleSaveAntecedente = async (nuevoAntecedente) => {
        if (!estructura || !estructura.id) {
            alert("Error: No se ha cargado la estructura principal.");
            return;
        }

        // Convertir fecha a Timestamp de Firestore si es necesario
        if (nuevoAntecedente.fechaCelebracion) {
            // Asumiendo que fechaCelebracion es un string 'YYYY-MM-DD' del input type="date"
            try {
                nuevoAntecedente.fechaCelebracion = Timestamp.fromDate(new Date(nuevoAntecedente.fechaCelebracion));
            } catch (dateError) {
                console.error("Error convirtiendo fecha: ", dateError);
                alert("El formato de la fecha de celebración no es válido.");
                return; // Detener si la fecha no es válida
            }
        }


        const estructuraRef = doc(firestore, "Estructuras", estructura.id);
        try {
            await updateDoc(estructuraRef, {
                antecedentesSocietarios: arrayUnion(nuevoAntecedente)
            });
            // Refrescar los datos para mostrar el nuevo antecedente
            await fetchEstructuraDetalle();
            handleCloseAddAntecedenteModal(); // Cierra el modal después de guardar
        } catch (updateError) {
            console.error("Error al añadir antecedente:", updateError);
            alert("No se pudo añadir el antecedente. Inténtalo de nuevo.");
            // Considera propagar el error al modal para mostrarlo allí
            throw updateError;
        }
    };


    if (loading) {
        return <div className="detalle-status-container"><p>Cargando detalle de la estructura...</p></div>;
    }

    if (error) {
        return <div className="detalle-status-container error"><p>{error}</p></div>;
    }

    if (!estructura) {
        return <div className="detalle-status-container"><p>No hay datos de estructura para mostrar.</p></div>;
    }

    // Función para formatear fechas de Timestamp (si las usas)
    const formatDate = (timestamp) => {
        if (timestamp && timestamp.toDate) {
            return timestamp.toDate().toLocaleDateString('es-MX'); // Formato local
        }
        if (typeof timestamp === 'string') { // Si ya es un string
             try {
                return new Date(timestamp).toLocaleDateString('es-MX');
            } catch (e) { return timestamp; } // Devuelve el string original si no se puede parsear
        }
        return 'N/A';
    };


    return (
        <div className="estructura-detalle-container">
            <button onClick={() => navigate(-1)} className="button-back">
                &larr; Volver a la lista
            </button>
            <h1>Detalle de la Estructura: {estructura.RazonSocial || "Sin Razón Social"}</h1>
            <div className="detalle-seccion main-details">
                <h2>Información General</h2>
                <p><strong>Razón Social:</strong> {estructura.RazonSocial || 'N/A'}</p>
                <p><strong>Tipo:</strong> {estructura.Tipo || 'N/A'}</p>
                <p><strong>Estatus:</strong> {estructura.Estatus || 'N/A'}</p>
                <p><strong>Uso:</strong> {estructura.Uso || 'N/A'}</p>
                <p><strong>Observaciones:</strong> {estructura.Observaciones || 'N/A'}</p>
            </div>

            <div className="detalle-seccion antecedentes-societarios">
                <h2>Antecedentes Societarios</h2>
                {(!estructura.antecedentesSocietarios || estructura.antecedentesSocietarios.length === 0) && (
                    <p>No hay antecedentes societarios registrados para esta estructura.</p>
                )}
                {estructura.antecedentesSocietarios && estructura.antecedentesSocietarios.length > 0 && (
                    <ul className="antecedentes-list">
                        {estructura.antecedentesSocietarios.map((antecedente, index) => (
                            <li key={index} className="antecedente-item">
                                <p><strong>Escritura:</strong> {antecedente.escritura || 'N/A'}</p>
                                <p><strong>Fecha de Celebración:</strong> {formatDate(antecedente.fechaCelebracion)}</p>
                                <p><strong>Datos Notariales:</strong> {antecedente.datosNotariales || 'N/A'}</p>
                                <p><strong>Folio RPP:</strong> {antecedente.folioRPP || 'N/A'}</p>
                                <p>
                                    <strong>Link de Acceso:</strong>
                                    {antecedente.linkAcceso ? (
                                        <a href={antecedente.linkAcceso} target="_blank" rel="noopener noreferrer">
                                            Ver Documento
                                        </a>
                                    ) : 'N/A'}
                                </p>
                                <p><strong>Estatus/Ubicación Física:</strong> {antecedente.estatusUbicacionFisica || 'N/A'}</p>
                                {/* Aquí podrías añadir botones para editar/eliminar cada antecedente en el futuro */}
                            </li>
                        ))}
                    </ul>
                )}
                <button onClick={handleOpenAddAntecedenteModal} className="button-add-antecedente">
                    + Añadir Antecedente Societario
                </button>
            </div>

            <AddAntecedenteModal
                isOpen={isAddAntecedenteModalOpen}
                onClose={handleCloseAddAntecedenteModal}
                onSave={handleSaveAntecedente}
            />
        </div>
    );
};