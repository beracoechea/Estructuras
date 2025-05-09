// src/hooks/useExpedientesLogic.js
import { useState, useCallback } from 'react';
import { firestore } from '../config/firebase-config'; // Ajusta la ruta
import { collection, query, where, getDocs, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';

const N = Number;
const T = Timestamp;

export const useExpedientesLogic = (estructuraId) => {
    const [expedientes, setExpedientes] = useState([]);
    const [loadingExpedientes, setLoadingExpedientes] = useState(false); // Inicialmente false, se activa con fetch
    const [errorExpedientes, setErrorExpedientes] = useState(null);
    const [isAddExpedienteModalOpen, setIsAddExpedienteModalOpen] = useState(false);

    const fetchExpedientes = useCallback(async () => {
        if (!estructuraId) return;
        setLoadingExpedientes(true);
        setErrorExpedientes(null);
        setExpedientes([]);
        try {
            const expColRef = collection(firestore, "Expedientes");
            const q = query(expColRef, where("estructuraId", "==", estructuraId));
            const querySnapshot = await getDocs(q);
            const expData = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setExpedientes(expData);
        } catch (err) {
            console.error("Error al cargar expedientes:", err);
            setErrorExpedientes("No se pudieron cargar los expedientes asociados.");
        }
        setLoadingExpedientes(false);
    }, [estructuraId]);

    const handleOpenAddExpedienteModal = () => setIsAddExpedienteModalOpen(true);
    const handleCloseAddExpedienteModal = () => setIsAddExpedienteModalOpen(false);

    const handleSaveNuevoExpediente = async (data) => {
        if (!estructuraId) {
            throw new Error("ID de estructura no disponible.");
        }
        if (data.fecha && typeof data.fecha === 'string') {
            try {
                const parts = data.fecha.split('-');
                const dateObj = new Date(Date.UTC(N(parts[0]), N(parts[1]) - 1, N(parts[2])));
                if (isNaN(dateObj.getTime())) throw new Error('Fecha de documento inválida.');
                data.fecha = T.fromDate(dateObj);
            } catch (e) {
                throw new Error(e.message || "Formato de fecha de documento incorrecto.");
            }
        } else if (data.fecha === '') {
            data.fecha = null;
        } else if (data.fecha && !(data.fecha instanceof T) && data.fecha instanceof Date) {
            data.fecha = T.fromDate(data.fecha);
        }
        data.fechaRegistro = T.now();
        const expedienteData = { ...data, estructuraId };
        try {
            const expColRef = collection(firestore, "Expedientes");
            await addDoc(expColRef, expedienteData);
            await fetchExpedientes();
            handleCloseAddExpedienteModal();
        } catch (err) {
            console.error("Error al guardar expediente:", err);
            throw new Error("No se pudo guardar el nuevo expediente.");
        }
    };

    const handleUpdateExpedienteEnDetalle = async (expedienteId, data) => {
        if (!expedienteId) {
            throw new Error("ID de expediente no disponible.");
        }
    
        // Preparar los datos para actualizar
        const updateData = {
            nombre: data.nombre,
            numero: data.numero,
            estatus: data.estatus,
            linkDigital: data.linkDigital,
            ubicacionFisica: data.ubicacionFisica,
            observaciones: data.observaciones,
            original: data.original,
            copiasCertificadas: data.copiasCertificadas,
            fechaActualizacion: Timestamp.now()
        };
    
        // Función para convertir string de fecha a Timestamp
        const convertDateToTimestamp = (dateString) => {
            if (!dateString) return null;
            try {
                const parts = dateString.split('-');
                if (parts.length !== 3) throw new Error('Formato inválido');
                
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1; // Meses son 0-indexados
                const day = parseInt(parts[2]);
                
                const dateObj = new Date(Date.UTC(year, month, day));
                if (isNaN(dateObj.getTime())) throw new Error('Fecha inválida');
                
                return Timestamp.fromDate(dateObj);
            } catch (e) {
                console.error("Error convirtiendo fecha:", dateString, e);
                throw new Error(`Fecha inválida: ${dateString}. Use formato YYYY-MM-DD`);
            }
        };
    
        // Manejo de fechas
        try {
            updateData.fecha = convertDateToTimestamp(data.fecha);
            
            if (data.fechaVencimiento) {
                updateData.fechaVencimiento = convertDateToTimestamp(data.fechaVencimiento);
            } else {
                updateData.fechaVencimiento = null;
            }
        } catch (e) {
            throw new Error(e.message);
        }
    
        try {
            const expedienteRef = doc(firestore, "Expedientes", expedienteId);
            await updateDoc(expedienteRef, updateData);
            await fetchExpedientes(); // Recargar los datos
        } catch (err) {
            console.error("Error al actualizar expediente en Firestore:", err);
            throw new Error("No se pudo actualizar el expediente en la base de datos.");
        }
    };
    return {
        expedientes, loadingExpedientes, errorExpedientes, isAddExpedienteModalOpen,
        fetchExpedientes,
        handleOpenAddExpedienteModal,
        handleCloseAddExpedienteModal,
        handleSaveNuevoExpediente,
        handleUpdateExpedienteEnDetalle,
    };
};