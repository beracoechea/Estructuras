import { useState, useCallback } from 'react';
import { firestore } from '../config/firebase-config';

import { 
    collection, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    writeBatch, 
    arrayUnion // <--- ¡Importar arrayUnion aquí! Se quita FieldValue
} from 'firebase/firestore';


const DEFAULT_DOCUMENTOS = [
    { nombre: 'Altas ante el IMSS / alta al registro patronal', seTiene: false },
    { nombre: 'Modificaciones de salario - IMSS', seTiene: false },
    { nombre: 'Baja del registro patronal', seTiene: false },
    { nombre: 'Contrato individual del trabajo', seTiene: false },
    { nombre: 'INE del trabajador', seTiene: false },
    { nombre: 'Recibo de nómina timbrado', seTiene: false },
];

export const usePersonalLogic = (estructuraId) => {
    const [personalIndex, setPersonalIndex] = useState([]);
    const [selectedEmpleadoDetails, setSelectedEmpleadoDetails] = useState(null);
    const [loadingPersonal, setLoadingPersonal] = useState(false);
    const [errorPersonal, setErrorPersonal] = useState(null);

    const fetchPersonalIndex = useCallback(async () => {
        if (!estructuraId) return;
        setLoadingPersonal(true);
        setErrorPersonal(null);
        try {
            const estructuraDocRef = doc(firestore, 'Estructuras', estructuraId);
            const docSnap = await getDoc(estructuraDocRef);

            if (docSnap.exists() && docSnap.data().empleados_idx) {
                setPersonalIndex(docSnap.data().empleados_idx);
            } else {
                setPersonalIndex([]);
            }
        } catch (err) {
            setErrorPersonal('Error al cargar el índice de personal.');
            console.error("Error en fetchPersonalIndex:", err);
        } finally {
            setLoadingPersonal(false);
        }
    }, [estructuraId]);

    const fetchEmpleadoDetails = async (empleadoId) => {
        if (!estructuraId || !empleadoId) return;
        setLoadingPersonal(true);
        setSelectedEmpleadoDetails(null);
        try {
            const empleadoDocRef = doc(firestore, 'Estructuras', estructuraId, 'Personal', empleadoId);
            const docSnap = await getDoc(empleadoDocRef);
            if (docSnap.exists()) {
                setSelectedEmpleadoDetails({ id: docSnap.id, ...docSnap.data() });
            } else {
                throw new Error("El documento detallado de este empleado no fue encontrado.");
            }
        } catch (err) {
            setErrorPersonal(err.message);
            console.error("Error en fetchEmpleadoDetails:", err);
        } finally {
            setLoadingPersonal(false);
        }
    };

    const addEmpleado = async (nombreEmpleado) => {
        const nombreLimpio = nombreEmpleado.trim();
        if (!nombreLimpio) return { success: false, message: "El nombre no puede estar vacío." };

        const empleadoExists = personalIndex.some(emp => emp.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase());
        if (empleadoExists) {
            alert("Ya existe un empleado con este nombre.");
            return { success: false, message: "Empleado duplicado." };
        }
        
        setLoadingPersonal(true);
        try {
            const newEmpleadoId = `emp_${Date.now()}`;
            const estructuraDocRef = doc(firestore, 'Estructuras', estructuraId);
            const empleadoDocRef = doc(firestore, 'Estructuras', estructuraId, 'Personal', newEmpleadoId);
            const batch = writeBatch(firestore);

            batch.set(empleadoDocRef, {
                nombre: nombreLimpio,
                documentos: DEFAULT_DOCUMENTOS
            });

            // --- CORRECCIÓN #2: Usar arrayUnion directamente ---
            batch.update(estructuraDocRef, {
                empleados_idx: arrayUnion({ id: newEmpleadoId, nombre: nombreLimpio }) // <--- ¡Así se usa!
            });

            await batch.commit();
            setPersonalIndex(prev => [...prev, { id: newEmpleadoId, nombre: nombreLimpio }]);
            return { success: true };

        } catch (err) {
            setErrorPersonal("Error al crear el empleado."); // Este es tu mensaje genérico
            console.error("Error específico en addEmpleado:", err); // Este es el error de Firebase
            return { success: false, message: err.message };
        } finally {
            setLoadingPersonal(false);
        }
    };

    const updateDocumentoStatus = async (empleadoId, nombreDocumento, newStatus) => {
        setLoadingPersonal(true);
        try {
            const empleadoRef = selectedEmpleadoDetails;
            if (!empleadoRef || empleadoRef.id !== empleadoId) {
                 // Si no están cargados los detalles, intenta cargarlos o busca en el índice (menos ideal)
                console.warn("Detalles del empleado no estaban cargados para updateDocumentoStatus, o ID no coincide. EmpleadoID:", empleadoId);
                setErrorPersonal("No se pudieron actualizar los documentos, intente seleccionar de nuevo al empleado.");
                return { success: false, message: "Detalles del empleado no cargados." };
            }
            
            const updatedDocumentos = empleadoRef.documentos.map(doc =>
                doc.nombre === nombreDocumento ? { ...doc, seTiene: newStatus } : doc
            );

            const empleadoDocRef = doc(firestore, 'Estructuras', estructuraId, 'Personal', empleadoId);
            await updateDoc(empleadoDocRef, { documentos: updatedDocumentos });
            
            setSelectedEmpleadoDetails(prev => ({ ...prev, documentos: updatedDocumentos }));
            return { success: true };
        } catch(err) {
            setErrorPersonal("Error al actualizar el documento.");
            console.error("Error específico en updateDocumentoStatus:", err);
            return { success: false, message: err.message };
        } finally {
            setLoadingPersonal(false);
        }
    };

    return {
        personalIndex,
        selectedEmpleadoDetails,
        loadingPersonal,
        errorPersonal,
        fetchPersonalIndex,
        fetchEmpleadoDetails,
        addEmpleado,
        updateDocumentoStatus,
    };
};