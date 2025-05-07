import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firestore } from '../../../config/firebase-config';
import { collection, query, where, getDocs, doc, getDoc, addDoc, Timestamp } from 'firebase/firestore';
 import { AddDocumentoModal } from '../../../modals/AddDocument';
// ------------------------------------------
import '../Expediente.css'; // O la ruta correcta a tus estilos
import '../../../modals/Modal.css'; // O la ruta correcta a tus estilos de modal

// Helper para formatear fechas (igual que antes)
const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'; let date; if (timestamp.toDate){ date = timestamp.toDate();} else if (typeof timestamp === 'string') { const parts = timestamp.split('-'); if(parts.length === 3){date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));} else { date = new Date(timestamp);}} else if (timestamp instanceof Date){date = timestamp;} else {return 'Fecha inválida';} if(isNaN(date.getTime())){ return 'Fecha inválida';} return date.toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'});
};

export const ListaExpedientesPorEstructura = () => {
    const { estructuraId } = useParams();
    const navigate = useNavigate();
    const [estructuraNombre, setEstructuraNombre] = useState('');
    const [expedientes, setExpedientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // --- Fetch Estructura y Expedientes (sin cambios en la lógica) ---
    const fetchEstructuraYExpedientes = useCallback(async () => {
        setLoading(true); setError(null); setExpedientes([]);
        try {
            const estructuraRef = doc(firestore, "Estructuras", estructuraId);
            const estructuraSnap = await getDoc(estructuraRef);
            if (!estructuraSnap.exists()) { setError("La estructura especificada no existe."); setLoading(false); return; }
            setEstructuraNombre(estructuraSnap.data().RazonSocial || `Estructura ${estructuraId}`);
            const expedientesCollectionRef = collection(firestore, "Expedientes");
            const q = query(expedientesCollectionRef, where("estructuraId", "==", estructuraId));
            const querySnapshot = await getDocs(q);
            const expedientesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setExpedientes(expedientesData);
        } catch (err) { console.error("Error:", err); setError("No se pudieron cargar los datos."); }
        setLoading(false);
    }, [estructuraId]);

    useEffect(() => { fetchEstructuraYExpedientes(); }, [fetchEstructuraYExpedientes]);

    // --- Manejadores Modal (sin cambios) ---
    const handleOpenAddModal = () => setIsAddModalOpen(true);
    const handleCloseAddModal = () => setIsAddModalOpen(false);

    // --- Guardar Nuevo Expediente (sin cambios en la lógica) ---
    const handleSaveNuevoExpediente = async (nuevoExpedienteData) => {
        if (!estructuraId) { alert("Error: ID estructura padre no definido."); throw new Error("Falta estructuraId"); }
        if (nuevoExpedienteData.fecha && typeof nuevoExpedienteData.fecha === 'string') { try { const dp=nuevoExpedienteData.fecha.split('-'); const dO=new Date(Date.UTC(dp[0],dp[1]-1,dp[2])); if(isNaN(dO.getTime())) throw new Error(); nuevoExpedienteData.fecha = Timestamp.fromDate(dO); } catch(e){ alert("Fecha inválida."); throw e; } } else if (!nuevoExpedienteData.fecha) { nuevoExpedienteData.fecha = null; }
        if (!nuevoExpedienteData.fechaRegistro) nuevoExpedienteData.fechaRegistro = Timestamp.now();
        const dataToSave = { ...nuevoExpedienteData, estructuraId: estructuraId };
        const expedientesCollectionRef = collection(firestore, "Expedientes");
        try { await addDoc(expedientesCollectionRef, dataToSave); await fetchEstructuraYExpedientes(); handleCloseAddModal(); } catch (err) { console.error(err); alert("No se pudo guardar."); throw err; }
    };

    // --- Renderizado (sin cambios en la lógica) ---
    if (loading) return <div className="status-container"><p>Cargando expedientes...</p></div>;
    if (error) return <div className="status-container error"><p>{error}</p></div>;

    return (
        <div className="expedientes-container">
            <button onClick={() => navigate(-1)} className="button-back">&larr; Volver</button>
            <div className="expedientes-list-header">
                <h1>Documentos de: {estructuraNombre}</h1> {/* Título puede ser "Expedientes" o "Documentos" */}
                <button className="button-add-new" onClick={handleOpenAddModal}>
                    + Añadir Expediente {/* O "+ Añadir Documento" */}
                </button>
            </div>
            {expedientes.length === 0 ? (
                <div className="status-container no-data">
                    <p>No se han insertado expedientes para esta estructura todavía.</p>
                </div>
            ) : (
                <div className="documentos-list"> {/* O 'expedientes-list' */}
                    {expedientes.map((exp) => (
                        <div key={exp.id} className="documento-list-item"> {/* O 'expediente-list-item' */}
                            {/* ... spans con datos del expediente ... */}
                             <span className="doc-nombre"><strong>{exp.nombre || 'Exp Sin Nombre'}</strong></span>
                             <span className="doc-numero">#: {exp.numero || 'N/A'}</span>
                             <span className="doc-fecha">Fecha: {formatDate(exp.fecha)}</span>
                             <span className="doc-estatus">Estatus: {exp.estatus || 'N/A'}</span>
                             {exp.linkDigital && (<span className="doc-link-list"><a href={exp.linkDigital} target="_blank" rel="noopener noreferrer" onClick={(e)=> e.stopPropagation()}>Link</a></span>)}
                        </div>
                    ))}
                </div>
            )}
            <AddDocumentoModal
                isOpen={isAddModalOpen}
                onClose={handleCloseAddModal}
                onSave={handleSaveNuevoExpediente}
                estructuraId={estructuraId}
             />
        </div>
    );
};