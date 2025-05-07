import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firestore } from '../../../config/firebase-config';
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { AddAntecedenteModal } from '../../../modals/AddAntecedenteModal';
import { EditAntecedenteModal } from '../../../modals/EditAntecedenteModal'; 
import './EstructuraDetalle.css';

export const EstructuraDetalle = () => {
    const { estructuraId } = useParams();
    const navigate = useNavigate();
    const [estructura, setEstructura] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddAntecedenteModalOpen, setIsAddAntecedenteModalOpen] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState(null);
    // --- 2. Añadir estados para el modal de edición ---
    const [isEditAntecedenteModalOpen, setIsEditAntecedenteModalOpen] = useState(false);
    const [antecedenteToEdit, setAntecedenteToEdit] = useState(null); // Guarda { index, data }

    // --- Fetch Logic (sin cambios) ---
    const fetchEstructuraDetalle = useCallback(async () => {/* ... as before ... */ setLoading(true);setError(null);try {const eRef=doc(firestore,"Estructuras",estructuraId);const dSnap=await getDoc(eRef);if(dSnap.exists()){setEstructura({id:dSnap.id,...dSnap.data()});}else{setError("No se encontró.");setEstructura(null);}} catch(err){console.error(err);setError("Error al cargar.");setEstructura(null);} setLoading(false);}, [estructuraId]);
    useEffect(() => { fetchEstructuraDetalle(); }, [fetchEstructuraDetalle]);

    // --- Add Modal Handlers (sin cambios) ---
    const handleOpenAddAntecedenteModal = () => setIsAddAntecedenteModalOpen(true);
    const handleCloseAddAntecedenteModal = () => setIsAddAntecedenteModalOpen(false);
    const handleSaveAntecedente = async (nuevoAntecedente) => {/* ... as before ... */ if(!estructura||!estructura.id){alert("Error");return;} if(nuevoAntecedente.fechaCelebracion&&typeof nuevoAntecedente.fechaCelebracion==='string'){try{const dateParts=nuevoAntecedente.fechaCelebracion.split('-');const dateObject=new Date(Date.UTC(dateParts[0],dateParts[1]-1,dateParts[2]));if(isNaN(dateObject.getTime()))throw new Error('Invalid date');nuevoAntecedente.fechaCelebracion=Timestamp.fromDate(dateObject);}catch(e){alert("Fecha invalida");return;}}else if(nuevoAntecedente.fechaCelebracion&&!(nuevoAntecedente.fechaCelebracion instanceof Timestamp)){try{nuevoAntecedente.fechaCelebracion=Timestamp.fromDate(nuevoAntecedente.fechaCelebracion);}catch(e){alert("Error fecha");return;}} const estRef=doc(firestore,"Estructuras",estructura.id);try{await updateDoc(estRef,{antecedentesSocietarios:arrayUnion(nuevoAntecedente)});await fetchEstructuraDetalle();handleCloseAddAntecedenteModal();}catch(err){console.error(err);alert("No se pudo añadir");throw err;}};

    // --- 3. Añadir manejadores para el modal de edición ---
    const handleOpenEditAntecedenteModal = (antecedenteData, index) => {
        setAntecedenteToEdit({ index, data: antecedenteData }); // Guardar índice y datos
        setIsEditAntecedenteModalOpen(true);
    };
    const handleCloseEditAntecedenteModal = () => {
        setIsEditAntecedenteModalOpen(false);
        setAntecedenteToEdit(null); // Limpiar al cerrar
    };

    // --- 4. Añadir función para actualizar el antecedente en Firestore ---
    const handleUpdateAntecedente = async (indexToUpdate, updatedData) => {
        if (!estructura || !Array.isArray(estructura.antecedentesSocietarios) || indexToUpdate < 0 || indexToUpdate >= estructura.antecedentesSocietarios.length) {
            console.error("Datos inválidos para actualizar antecedente.");
            alert("Error interno al intentar actualizar.");
            throw new Error("Datos inválidos para actualizar"); // Detener y mostrar error en modal
        }

        // Convertir fecha de string YYYY-MM-DD a Timestamp antes de guardar
        if (updatedData.fechaCelebracion && typeof updatedData.fechaCelebracion === 'string') {
            try {
                const dateParts = updatedData.fechaCelebracion.split('-');
                const dateObject = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
                if (isNaN(dateObject.getTime())) throw new Error('Fecha inválida');
                updatedData.fechaCelebracion = Timestamp.fromDate(dateObject);
            } catch (dateError) {
                console.error("Error convirtiendo fecha para actualizar:", dateError);
                alert("El formato de la fecha de celebración no es válido (YYYY-MM-DD).");
                throw dateError; // Detener y mostrar error en modal
            }
        } else if (!updatedData.fechaCelebracion) {
             updatedData.fechaCelebracion = null; // Asegurar que sea null si está vacía
        } // Si ya es Timestamp, no se hace nada

        // Añadir/Actualizar fecha de modificación
        updatedData.fechaActualizacion = Timestamp.now();

        // Crear una copia del array de antecedentes
        const nuevosAntecedentes = [...estructura.antecedentesSocietarios];
        // Reemplazar el elemento en el índice específico con los datos actualizados
        // Asegurarse de mantener campos que no estaban en el form si es necesario (ej. fechaCreacion)
        nuevosAntecedentes[indexToUpdate] = {
            ...estructura.antecedentesSocietarios[indexToUpdate], // Copia datos existentes (importante para fechaCreacion)
            ...updatedData // Sobrescribe con los datos actualizados del form
        };


        const estructuraRef = doc(firestore, "Estructuras", estructura.id);
        try {
            // Actualizar TODO el array en Firestore
            await updateDoc(estructuraRef, {
                antecedentesSocietarios: nuevosAntecedentes
            });
            await fetchEstructuraDetalle(); // Recargar los detalles actualizados
            handleCloseEditAntecedenteModal(); // Cerrar el modal de edición
        } catch (updateError) {
            console.error("Error al actualizar antecedente:", updateError);
            alert("No se pudo actualizar el antecedente. Inténtalo de nuevo.");
            throw updateError; // Propagar error al modal
        }
    };

    // --- Toggle Expand (sin cambios) ---
    const toggleExpand = (index) => setExpandedIndex(prevIndex => (prevIndex === index ? null : index));
    // --- Format Date Helper (sin cambios) ---
    const formatDate = (timestamp) => {/* ... as before ... */ if(!timestamp)return 'N/A';let date;if(timestamp.toDate){date=timestamp.toDate();}else if(typeof timestamp==='string'){const parts=timestamp.split('-');if(parts.length===3){date=new Date(Date.UTC(parts[0],parts[1]-1,parts[2]));}else{date=new Date(timestamp);}}else if(timestamp instanceof Date){date=timestamp;}else{return 'Fecha inválida';}if(isNaN(date.getTime())){return 'Fecha inválida';}return date.toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'});};

    // --- Renderizado ---
    if (loading) return <div className="detalle-status-container"><p>Cargando detalle...</p></div>;
    if (error) return <div className="detalle-status-container error"><p>{error}</p></div>;
    if (!estructura) return <div className="detalle-status-container"><p>No hay datos.</p></div>;

    return (
        <div className="estructura-detalle-container">
            <button onClick={() => navigate(-1)} className="button-back">&larr; Volver</button>
            <h1>{estructura.RazonSocial || "Detalle de Estructura"}</h1>

            {/* Info General Section */}
            <div className="detalle-seccion main-details">
                 <h2>Información General</h2>
                 {/* ... <p> tags for RazonSocial, Tipo, Estatus etc ... */}
                 <p><strong>Razón Social:</strong> {estructura.RazonSocial || 'N/A'}</p>
                 <p><strong>Tipo:</strong> {estructura.Tipo || 'N/A'}</p>
                 <p><strong>Estatus:</strong> {estructura.Estatus || 'N/A'}</p>
                 <p><strong>Uso:</strong> {estructura.Uso || 'N/A'}</p>
                 <p><strong>Observaciones:</strong> {estructura.Observaciones || 'N/A'}</p>
            </div>

            {/* Antecedentes Section */}
            <div className="detalle-seccion antecedentes-societarios">
                <h2>Antecedentes Societarios</h2>
                {(!estructura.antecedentesSocietarios || estructura.antecedentesSocietarios.length === 0) && (
                    <p>No hay antecedentes societarios registrados.</p>
                )}
                <div className="antecedentes-cards-container">
                    {estructura.antecedentesSocietarios && estructura.antecedentesSocietarios.map((antecedente, index) => {
                        const isExpanded = expandedIndex === index;
                        const actos = Array.isArray(antecedente.actosCelebrados) ? antecedente.actosCelebrados : [];
                        return (
                            <div key={index} className={`antecedente-card ${isExpanded ? 'expanded' : ''}`}>
                                {/* Card Summary */}
                                <div className="antecedente-summary" onClick={() => toggleExpand(index)}>
                                    <div className="summary-info">
                                        <span className="summary-field"><strong>Tipo:</strong> {antecedente.nombre || 'N/A'}</span>
                                        <span className="summary-field"><strong>Escritura:</strong> {antecedente.escritura || 'N/A'}</span>
                                        <span className="summary-field"><strong>Fecha:</strong> {formatDate(antecedente.fechaCelebracion)}</span>
                                    </div>
                                    <span className="expand-icon">{isExpanded ? '−' : '+'}</span>
                                </div>
                                {/* Card Details */}
                                <div className="antecedente-details">
                                    {/* ... párrafos con detalles ... */}
                                    <p><strong>Datos Notariales:</strong> {antecedente.datosNotariales || 'N/A'}</p>
                                    <p><strong>Folio RPP:</strong> {antecedente.folioRPP || 'N/A'}</p>
                                    <p><strong>Estatus/Ubicación Física:</strong> {antecedente.estatusUbicacionFisica || 'N/A'}</p>
                                    <div className="text-area-display"><strong>Socios Finales:</strong><pre>{antecedente.sociosFinales || 'N/A'}</pre></div>
                                    <div className="text-area-display"><strong>Rep. Legales Finales:</strong><pre>{antecedente.sociosRLfinales || 'N/A'}</pre></div>
                                    <div className="actos-celebrados-section">
                                         <strong>Actos Celebrados:</strong>
                                         {actos.length > 0 ? (<ul className="actos-list">{actos.map((a, i) => <li key={i}>{a.otorgamiento||'?'} (Resp: {a.responsable||'?'})</li>)}</ul>) : (<p>N/A</p>)}
                                    </div>
                                    <p><strong>Link de Acceso:</strong>{antecedente.linkAcceso ? (<a href={antecedente.linkAcceso} target="_blank" rel="noopener noreferrer" className="link-acceso"> Ver Documento </a>) : ' N/A'}</p>

                                    {/* --- 5. Botón de Editar --- */}
                                    <div className="antecedente-actions">
                                        <button
                                            className="button-edit-antecedente"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Evita que el clic en el botón colapse/expanda la tarjeta
                                                handleOpenEditAntecedenteModal(antecedente, index);
                                            }}
                                        >
                                            Editar
                                        </button>
                                        
                                    </div>
                                </div>
                            </div> 
                        );
                    })}
                </div> {/* Fin contenedor tarjetas */}

                {/* Botón Añadir */}
                <button onClick={handleOpenAddAntecedenteModal} className="button-add-antecedente">
                    + Añadir Antecedente Societario
                </button>
            </div> 

            {/* Modales */}
            <AddAntecedenteModal
                isOpen={isAddAntecedenteModalOpen}
                onClose={handleCloseAddAntecedenteModal}
                onSave={handleSaveAntecedente}
            />
            {/* --- 6. Renderizar el modal de edición --- */}
            <EditAntecedenteModal
                isOpen={isEditAntecedenteModalOpen}
                onClose={handleCloseEditAntecedenteModal}
                onUpdate={handleUpdateAntecedente}
                initialData={antecedenteToEdit} 
            />
        </div> 
    );
};