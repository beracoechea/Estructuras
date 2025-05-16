// src/hooks/useExpedientesMensualesLogic.js
import { useState, useCallback, useEffect } from 'react';
import { firestore } from '../config/firebase-config';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';

const ESTRUCTURA_EXPEDIENTES_COLLECTION = "EstructuraExpedientes";
const PREDEFINED_MONTHLY_NAMES = ["OC IMSS", "OC SAT", "CSF EMPRESA", "CSF RL", "COMP DE DOM", "SUA"];

export const useExpedientesMensualesLogic = (estructuraId) => {
    const [expedientesMensuales, setExpedientesMensuales] = useState([]);
    const [loadingExpedientesMensuales, setLoadingExpedientesMensuales] = useState(false);
    const [errorExpedientesMensuales, setErrorExpedientesMensuales] = useState(null);
    const [isCreatingDefaultMensuales, setIsCreatingDefaultMensuales] = useState(false);

    const fetchExpedientesMensuales = useCallback(async () => {
        // ... (tu fetchExpedientesMensuales sin cambios, solo asegúrate que ordena bien)
        if (!estructuraId) {
            setExpedientesMensuales([]);
            return;
        }
        setLoadingExpedientesMensuales(true);
        setErrorExpedientesMensuales(null);
        try {
            const docRef = doc(firestore, ESTRUCTURA_EXPEDIENTES_COLLECTION, estructuraId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const allExpedientes = docSnap.data().listaExpedientes || [];
                const mensuales = allExpedientes
                    .filter(exp => exp.tipo === 'mensual')
                    .map(exp => ({ ...exp, id: exp.id || exp.nombre }));
                mensuales.sort((a,b) => (a.orden ?? Infinity) - (b.orden ?? Infinity));
                setExpedientesMensuales(mensuales);
            } else {
                setExpedientesMensuales([]);
            }
        } catch (err) {
            console.error("Error fetching expedientes mensuales:", err);
            setErrorExpedientesMensuales("No se pudieron cargar los expedientes mensuales.");
        } finally {
            setLoadingExpedientesMensuales(false);
        }
    }, [estructuraId]);

    const addDefaultExpedientesMensualesToEstructura = async (targetEstructuraId) => {
        // ... (tu función sin cambios significativos para esta pregunta) ...
        if (!targetEstructuraId) return { success: false, message: "ID de estructura no proporcionado." };
        setIsCreatingDefaultMensuales(true);
        try {
            const docRef = doc(firestore, ESTRUCTURA_EXPEDIENTES_COLLECTION, targetEstructuraId);
            const docSnap = await getDoc(docRef);
            let currentListaExpedientes = docSnap.exists() ? (docSnap.data().listaExpedientes || []) : [];
            const existingMonthlyNames = new Set(currentListaExpedientes.filter(exp => exp.tipo === 'mensual').map(exp => exp.nombre));
            let newExpedientesAdded = false;
            let maxOrdenMensual = -1;
            currentListaExpedientes.filter(exp => exp.tipo === 'mensual').forEach(exp => {
                if (exp.orden !== undefined && exp.orden > maxOrdenMensual) maxOrdenMensual = exp.orden;
            });

            PREDEFINED_MONTHLY_NAMES.forEach((name) => {
                if (!existingMonthlyNames.has(name)) {
                    maxOrdenMensual++;
                    const currentYear = new Date().getFullYear();
                    currentListaExpedientes.push({
                        id: name, nombre: name, tipo: 'mensual', estatus: 'Pendiente',
                        descripcion: `Expediente mensual: ${name}`, fechaRegistro: Timestamp.now(),
                        fechaActualizacion: Timestamp.now(),
                        checksMensuales: { [currentYear]: Array(12).fill(false) },
                        orden: maxOrdenMensual,
                    });
                    newExpedientesAdded = true;
                }
            });
             // Re-ordenar toda la lista si es necesario o solo la parte mensual
            currentListaExpedientes.sort((a,b) => (a.orden ?? Infinity) - (b.orden ?? Infinity));

            if (newExpedientesAdded || !docSnap.exists()) {
                await setDoc(docRef, { estructuraId: targetEstructuraId, listaExpedientes: currentListaExpedientes }, { merge: !docSnap.exists() });
                return { success: true, message: `Expedientes mensuales predeterminados procesados.` };
            } else {
                return { success: true, message: "Todos los expedientes mensuales predeterminados ya existen." };
            }
        } catch (err) {
            console.error("Error al añadir expedientes mensuales predeterminados:", err);
            return { success: false, message: `Error: ${err.message}` };
        } finally {
            setIsCreatingDefaultMensuales(false);
        }
    };
    
    const addNewCustomExpedienteMensual = async (targetEstructuraId, nuevoExpData) => {
        // ... (tu función sin cambios significativos para esta pregunta) ...
        if (!targetEstructuraId || !nuevoExpData || !nuevoExpData.nombre) {
            return { success: false, message: "Datos incompletos." };
        }
        try {
            const docRef = doc(firestore, ESTRUCTURA_EXPEDIENTES_COLLECTION, targetEstructuraId);
            const docSnap = await getDoc(docRef);
            let currentListaExpedientes = docSnap.exists() ? (docSnap.data().listaExpedientes || []) : [];
            if (currentListaExpedientes.some(exp => exp.nombre === nuevoExpData.nombre && exp.tipo === 'mensual')) {
                return { success: false, message: `El expediente mensual "${nuevoExpData.nombre}" ya existe.` };
            }
            let maxOrden = -1;
            currentListaExpedientes.forEach(exp => {
                if (exp.orden !== undefined && exp.orden > maxOrden) maxOrden = exp.orden;
            });
            const expedienteCompleto = { ...nuevoExpData, id: nuevoExpData.nombre, fechaRegistro: Timestamp.now(), fechaActualizacion: Timestamp.now(), orden: maxOrden + 1 };
            currentListaExpedientes.push(expedienteCompleto);
            await setDoc(docRef, { estructuraId: targetEstructuraId, listaExpedientes: currentListaExpedientes }, { merge: true });
            return { success: true, message: `Expediente mensual "${nuevoExpData.nombre}" añadido.` };
        } catch (err) {
            console.error("Error añadiendo nuevo expediente mensual personalizado:", err);
            return { success: false, message: `Error: ${err.message}` };
        }
    };

    // MODIFICADO para actualización optimista
    const handleUpdateExpedienteMensual = async (expedienteIdActualizar, dataToUpdate) => {
        if (!estructuraId || !expedienteIdActualizar) {
            return { success: false, message: "Faltan IDs para actualizar." };
        }

        const previousState = JSON.parse(JSON.stringify(expedientesMensuales)); // Copia profunda para revertir
        let originalExpediente = null;

        // 1. Actualización optimista del estado local
        setExpedientesMensuales(currentExpedientes => {
            const updatedList = currentExpedientes.map(exp => {
                if (exp.id === expedienteIdActualizar || exp.nombre === expedienteIdActualizar) {
                    originalExpediente = JSON.parse(JSON.stringify(exp)); // Guardar el original específico
                    return { ...exp, ...dataToUpdate, fechaActualizacion: Timestamp.now() };
                }
                return exp;
            });
            return updatedList;
        });

        try {
            const docRef = doc(firestore, ESTRUCTURA_EXPEDIENTES_COLLECTION, estructuraId);
            const docSnap = await getDoc(docRef); // Leer el documento completo de Firestore

            if (!docSnap.exists()) {
                throw new Error("Documento de la estructura no encontrado para actualizar expedientes.");
            }

            let listaGlobalActual = docSnap.data().listaExpedientes || [];
            let expedienteEncontradoEnFirestore = false;

            const listaGlobalActualizada = listaGlobalActual.map(exp => {
                if ((exp.id === expedienteIdActualizar || exp.nombre === expedienteIdActualizar) && exp.tipo === 'mensual') {
                    expedienteEncontradoEnFirestore = true;
                    // Prepara los datos para Firestore (asegura Timestamps para fechas si vienen como string)
                    let datosParaFirestore = { ...dataToUpdate };
                    
                    if (datosParaFirestore.fecha && typeof datosParaFirestore.fecha === 'string' && datosParaFirestore.fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        const dp = datosParaFirestore.fecha.split('-');
                        datosParaFirestore.fecha = Timestamp.fromDate(new Date(Date.UTC(Number(dp[0]), Number(dp[1]) - 1, Number(dp[2]))));
                    } else if (datosParaFirestore.fecha === '') {
                        datosParaFirestore.fecha = null;
                    }
                    
                    if (datosParaFirestore.fechaVencimiento && typeof datosParaFirestore.fechaVencimiento === 'string' && datosParaFirestore.fechaVencimiento.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        const dpv = datosParaFirestore.fechaVencimiento.split('-');
                        datosParaFirestore.fechaVencimiento = Timestamp.fromDate(new Date(Date.UTC(Number(dpv[0]), Number(dpv[1]) - 1, Number(dpv[2]))));
                    } else if (datosParaFirestore.fechaVencimiento === '') {
                         datosParaFirestore.fechaVencimiento = null;
                    }
                     if (datosParaFirestore.fechaVencimientoRecordatorioGeneral && typeof datosParaFirestore.fechaVencimientoRecordatorioGeneral === 'string' && datosParaFirestore.fechaVencimientoRecordatorioGeneral.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        const dpvrg = datosParaFirestore.fechaVencimientoRecordatorioGeneral.split('-');
                        datosParaFirestore.fechaVencimientoRecordatorioGeneral = Timestamp.fromDate(new Date(Date.UTC(Number(dpvrg[0]), Number(dpvrg[1]) - 1, Number(dpvrg[2]))));
                    } else if (datosParaFirestore.fechaVencimientoRecordatorioGeneral === '') {
                         datosParaFirestore.fechaVencimientoRecordatorioGeneral = null;
                    }
                    
                    return { ...exp, ...datosParaFirestore, fechaActualizacion: Timestamp.now() };
                }
                return exp;
            });

            if (!expedienteEncontradoEnFirestore) {
                throw new Error(`Expediente mensual "${expedienteIdActualizar}" no encontrado en Firestore.`);
            }

            await updateDoc(docRef, { listaExpedientes: listaGlobalActualizada });
            // Opcional: se podría llamar a fetchExpedientesMensuales() aquí para asegurar consistencia total,
            // pero la actualización optimista ya debería reflejar el cambio.
            // Si se llama, puede causar un leve parpadeo si el estado optimista difiere del de la BD por alguna razón.
            // Por ahora, confiamos en la actualización optimista.
            return { success: true, message: "Expediente mensual actualizado." };

        } catch (err) {
            console.error("Error actualizando expediente mensual en Firestore (optimista):", err);
            // 2. Revertir el estado local si la actualización de Firestore falla
            setExpedientesMensuales(previousState); // Revertir al estado anterior
            return { success: false, message: `Error al actualizar: ${err.message}. Se revirtieron los cambios visuales.` };
        }
    };
    
    useEffect(() => {
        if (estructuraId) {
            fetchExpedientesMensuales();
        } else {
            setExpedientesMensuales([]); 
        }
    }, [estructuraId, fetchExpedientesMensuales]);


    return {
        expedientesMensuales,
        loadingExpedientesMensuales,
        errorExpedientesMensuales,
        isCreatingDefaultMensuales,
        fetchExpedientesMensuales,
        addDefaultExpedientesMensualesToEstructura,
        handleUpdateExpedienteMensual,
        addNewCustomExpedienteMensual
    };
};