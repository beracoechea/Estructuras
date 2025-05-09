// src/hooks/useEstadosCuentaLogic.js
import { useState, useCallback } from 'react';
import { firestore } from '../config/firebase-config'; // Ajusta la ruta
import { collection, query, where, getDocs, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';

const T = Timestamp; // Asumiendo que 'N' (Number) no se usa aquí directamente.

export const useEstadosCuentaLogic = (estructuraId) => {
    const [estadosCuenta, setEstadosCuenta] = useState([]);
    const [loadingEstadosCuenta, setLoadingEstadosCuenta] = useState(false);
    const [errorEstadosCuenta, setErrorEstadosCuenta] = useState(null);

    // Para Añadir
    const [isAddEstadoCuentaModalOpen, setIsAddEstadoCuentaModalOpen] = useState(false);

    // --- NUEVO: Para Editar ---
    const [isEditEstadoCuentaModalOpen, setIsEditEstadoCuentaModalOpen] = useState(false);
    const [estadoCuentaToEdit, setEstadoCuentaToEdit] = useState(null); // Guardará el objeto completo

    const fetchEstadosDeCuenta = useCallback(async () => {
        // ... (sin cambios)
        if (!estructuraId) return;
        setLoadingEstadosCuenta(true);
        setErrorEstadosCuenta(null);
        setEstadosCuenta([]);
        try {
            const ecColRef = collection(firestore, "EstadosDeCuenta");
            const q = query(ecColRef, where("estructuraId", "==", estructuraId));
            const querySnapshot = await getDocs(q);
            const ecData = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setEstadosCuenta(ecData);
        } catch (err) {
            console.error("Error al cargar estados de cuenta:", err);
            setErrorEstadosCuenta("No se pudieron cargar los estados de cuenta.");
        }
        setLoadingEstadosCuenta(false);
    }, [estructuraId]);

    // Funciones para Añadir
    const handleOpenAddEstadoCuentaModal = () => setIsAddEstadoCuentaModalOpen(true);
    const handleCloseAddEstadoCuentaModal = () => {
        setIsAddEstadoCuentaModalOpen(false);
        // Podrías resetear algún estado temporal aquí si fuera necesario
    };

    const handleSaveNuevoEstadoCuenta = async (data) => {
        // ... (sin cambios)
        if (!estructuraId) {
            throw new Error("ID de estructura faltante para el estado de cuenta.");
        }
        data.fechaRegistro = T.now();
        const estadoCuentaData = { ...data, estructuraId };
        try {
            const ecColRef = collection(firestore, "EstadosDeCuenta");
            await addDoc(ecColRef, estadoCuentaData);
            await fetchEstadosDeCuenta();
            handleCloseAddEstadoCuentaModal();
        } catch (err) {
            console.error("Error al guardar el estado de cuenta:", err);
            throw new Error("No se pudo guardar el estado de cuenta. Intente más tarde.");
        }
    };

    // --- NUEVO: Funciones para Editar ---
    const handleOpenEditEstadoCuentaModal = (estadoCuentaData) => {
        setEstadoCuentaToEdit(estadoCuentaData); // estadoCuentaData debe incluir el 'id' del documento
        setIsEditEstadoCuentaModalOpen(true);
    };

    const handleCloseEditEstadoCuentaModal = () => {
        setIsEditEstadoCuentaModalOpen(false);
        setEstadoCuentaToEdit(null);
    };

    const handleUpdateEstadoCuenta = async (id, dataToUpdate) => {
        if (!id) {
            throw new Error("ID del estado de cuenta es requerido para actualizar.");
        }
        // Aquí puedes añadir transformaciones de fecha si es necesario, similar a como se hace en otros updates
        // Ejemplo: if (dataToUpdate.fechaDocumento && typeof dataToUpdate.fechaDocumento === 'string') { ... }

        dataToUpdate.fechaActualizacion = T.now(); // Estampa la fecha de actualización
        const estadoCuentaRef = doc(firestore, "EstadosDeCuenta", id);

        try {
            await updateDoc(estadoCuentaRef, dataToUpdate);
            await fetchEstadosDeCuenta(); // Refrescar la lista
            handleCloseEditEstadoCuentaModal();
        } catch (err) {
            console.error("Error al actualizar el estado de cuenta:", err);
            throw new Error("No se pudo actualizar el estado de cuenta.");
        }
    };

    return {
        estadosCuenta, loadingEstadosCuenta, errorEstadosCuenta,
        fetchEstadosDeCuenta,
        // Añadir
        isAddEstadoCuentaModalOpen,
        handleOpenAddEstadoCuentaModal,
        handleCloseAddEstadoCuentaModal,
        handleSaveNuevoEstadoCuenta,
        // Editar
        isEditEstadoCuentaModalOpen,
        estadoCuentaToEdit,
        handleOpenEditEstadoCuentaModal,
        handleCloseEditEstadoCuentaModal,
        handleUpdateEstadoCuenta,
    };
};