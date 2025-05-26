import { useState, useCallback } from 'react';
// --- FIREBASE INTEGRATION v9 (MODULAR) ---
// Asegúrate que la ruta a tu configuración de Firebase sea correcta
import { firestore } from '../config/firebase-config'; // Ajusta la ruta si es necesario
import { collection, doc, getDoc, setDoc, updateDoc, writeBatch, FieldValue } from 'firebase/firestore';


const DEFAULT_DOCUMENTOS = [
    { nombre: 'Altas ante el IMSS / alta al registro patronal', seTiene: false },
    { nombre: 'Modificaciones de salario - IMSS', seTiene: false },
    { nombre: 'Baja del registro patronal', seTiene: false },
    { nombre: 'Contrato individual del trabajo', seTiene: false },
    { nombre: 'INE del trabajador', seTiene: false },
    { nombre: 'Recibo de nómina timbrado', seTiene: false },
    { nombre: 'SUA', seTiene: false },
];

export const usePersonalLogic = (estructuraId) => {
    // El estado 'personalIndex' ahora solo guarda el índice {id, nombre}
    const [personalIndex, setPersonalIndex] = useState([]);
    // Nuevo estado para guardar los detalles del empleado SELECCIONADO
    const [selectedEmpleadoDetails, setSelectedEmpleadoDetails] = useState(null);

    const [loadingPersonal, setLoadingPersonal] = useState(false);
    const [errorPersonal, setErrorPersonal] = useState(null);

    // Carga solo la lista de nombres/IDs para el menú desplegable
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
            console.error(err);
        } finally {
            setLoadingPersonal(false);
        }
    }, [estructuraId]);

    // Carga los detalles completos de un solo empleado bajo demanda
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
            console.error(err);
        } finally {
            setLoadingPersonal(false);
        }
    };

    // Añade un empleado, escribiendo en el documento principal y en la subcolección
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

            batch.update(estructuraDocRef, {
                empleados_idx: FieldValue.arrayUnion({ id: newEmpleadoId, nombre: nombreLimpio })
            });

            await batch.commit();

            setPersonalIndex(prev => [...prev, { id: newEmpleadoId, nombre: nombreLimpio }]);
            return { success: true };

        } catch (err) {
            setErrorPersonal("Error al crear el empleado.");
            console.error(err);
            return { success: false, message: err.message };
        } finally {
            setLoadingPersonal(false);
        }
    };

    // Actualiza el estado de un documento para un empleado específico
    const updateDocumentoStatus = async (empleadoId, nombreDocumento, newStatus) => {
        setLoadingPersonal(true);
        try {
            const empleadoRef = selectedEmpleadoDetails;
            if (!empleadoRef || empleadoRef.id !== empleadoId) throw new Error("Datos del empleado no cargados.");
            
            const updatedDocumentos = empleadoRef.documentos.map(doc =>
                doc.nombre === nombreDocumento ? { ...doc, seTiene: newStatus } : doc
            );

            const empleadoDocRef = doc(firestore, 'Estructuras', estructuraId, 'Personal', empleadoId);
            await updateDoc(empleadoDocRef, { documentos: updatedDocumentos });
            
            setSelectedEmpleadoDetails(prev => ({ ...prev, documentos: updatedDocumentos }));
            return { success: true };
        } catch(err) {
             setErrorPersonal("Error al actualizar el documento.");
            console.error(err);
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