// src/hooks/useAntecedentesLogic.js
import { useState } from 'react';
import { firestore } from '../config/firebase-config'; // Ajusta la ruta
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';

const N = Number;
const T = Timestamp;

export const useAntecedentesLogic = (estructura, fetchEstructuraDetalleCallback) => {
    const [expandedAntecedenteIndex, setExpandedAntecedenteIndex] = useState(null);
    const [isAddAntecedenteModalOpen, setIsAddAntecedenteModalOpen] = useState(false);
    const [isEditAntecedenteModalOpen, setIsEditAntecedenteModalOpen] = useState(false);
    const [antecedenteToEdit, setAntecedenteToEdit] = useState(null); // { data, index }

    const handleOpenAddAntecedenteModal = () => setIsAddAntecedenteModalOpen(true);
    const handleCloseAddAntecedenteModal = () => setIsAddAntecedenteModalOpen(false);

    const handleSaveAntecedente = async (data) => {
        if (!estructura || !estructura.id) {
            throw new Error("ID de estructura no disponible.");
        }
        if (data.fechaCelebracion && typeof data.fechaCelebracion === 'string') {
            try {
                const parts = data.fechaCelebracion.split('-');
                const dateObj = new Date(Date.UTC(N(parts[0]), N(parts[1]) - 1, N(parts[2])));
                if (isNaN(dateObj.getTime())) throw new Error('Fecha de celebración inválida.');
                data.fechaCelebracion = T.fromDate(dateObj);
            } catch (e) {
                throw new Error(e.message || "Formato de fecha de celebración incorrecto.");
            }
        } else if (data.fechaCelebracion && !(data.fechaCelebracion instanceof T) && data.fechaCelebracion instanceof Date) {
            data.fechaCelebracion = T.fromDate(data.fechaCelebracion);
        }
        data.fechaCreacion = T.now();
        const estructuraRef = doc(firestore, "Estructuras", estructura.id);
        try {
            await updateDoc(estructuraRef, { antecedentesSocietarios: arrayUnion(data) });
            await fetchEstructuraDetalleCallback();
            handleCloseAddAntecedenteModal();
        } catch (err) {
            console.error("Error al guardar antecedente:", err);
            throw new Error("No se pudo añadir el antecedente societario.");
        }
    };

    const handleOpenEditAntecedenteModal = (antecedenteData, index) => {
        setAntecedenteToEdit({ data: antecedenteData, index });
        setIsEditAntecedenteModalOpen(true);
    };
    const handleCloseEditAntecedenteModal = () => {
        setIsEditAntecedenteModalOpen(false);
        setAntecedenteToEdit(null);
    };

    const handleUpdateAntecedente = async (index, data) => {
        if (!estructura || !Array.isArray(estructura.antecedentesSocietarios) || index < 0 || index >= estructura.antecedentesSocietarios.length) {
            throw new Error("Datos de antecedente inválidos o índice fuera de rango.");
        }
        if (data.fechaCelebracion && typeof data.fechaCelebracion === 'string') {
            try {
                const parts = data.fechaCelebracion.split('-');
                const dateObj = new Date(Date.UTC(N(parts[0]), N(parts[1]) - 1, N(parts[2])));
                if (isNaN(dateObj.getTime())) throw new Error('Fecha de celebración inválida.');
                data.fechaCelebracion = T.fromDate(dateObj);
            } catch (e) {
                throw new Error(e.message || "Formato de fecha de celebración incorrecto al actualizar.");
            }
        } else if (data.fechaCelebracion === '') {
            data.fechaCelebracion = null;
        } else if (data.fechaCelebracion && !(data.fechaCelebracion instanceof T) && data.fechaCelebracion instanceof Date) {
            data.fechaCelebracion = T.fromDate(data.fechaCelebracion);
        }
        data.fechaActualizacion = T.now();
        const nuevosAntecedentes = estructura.antecedentesSocietarios.map((item, i) =>
            i === index ? { ...item, ...data } : item
        );
        const estructuraRef = doc(firestore, "Estructuras", estructura.id);
        try {
            await updateDoc(estructuraRef, { antecedentesSocietarios: nuevosAntecedentes });
            await fetchEstructuraDetalleCallback();
            handleCloseEditAntecedenteModal();
        } catch (err) {
            console.error("Error al actualizar antecedente:", err);
            throw new Error("No se pudo actualizar el antecedente societario.");
        }
    };

    const toggleExpandAntecedente = (index) => {
        setExpandedAntecedenteIndex(prevIndex => (prevIndex === index ? null : index));
    };

    const antecedentesArray = Array.isArray(estructura?.antecedentesSocietarios) ? estructura.antecedentesSocietarios : [];


    return {
        antecedentesArray,
        expandedAntecedenteIndex,
        isAddAntecedenteModalOpen,
        isEditAntecedenteModalOpen,
        antecedenteToEdit,
        handleOpenAddAntecedenteModal,
        handleCloseAddAntecedenteModal,
        handleSaveAntecedente,
        handleOpenEditAntecedenteModal,
        handleCloseEditAntecedenteModal,
        handleUpdateAntecedente,
        toggleExpandAntecedente,
    };
};