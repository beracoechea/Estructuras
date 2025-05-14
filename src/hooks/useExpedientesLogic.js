// src/hooks/useExpedientesLogic.js
import { useState, useCallback, useEffect } from 'react';
import { firestore } from '../config/firebase-config';
import {
    collection,
    doc,
    getDoc,
    setDoc, // Para crear el documento inicial de expedientes de la estructura
    updateDoc,
    Timestamp,
    // writeBatch ya no es necesario para addDefault si creamos/actualizamos un solo doc
} from 'firebase/firestore';

const PREDEFINED_EXPEDIENTE_NAMES = [
    "Acta constitutiva", "Asamblea 1", "Asamblea 2", "Identificación RL", "CSF RL",
    "Identificación socios", "CSF socios", "Registro SAT", "Informe fotográfico",
    "Contrato de arrendamiento", "Expediente arrendamiento", "Efirma sociedad", "CIEC",
    "Sellos para facturar", "Cuenta bancaria contrato", "Registro patronal", "Accesos IMSS",
    "ISN", "Accesos ISN", "Comprobante de domicilio", "Trabajadores registrados",
    "Contadores a cargo", "Declaraciones anuales",
    "Registros contables (Balanzas, polizas u otros)", "Registro de marca", "Licencia municipal", "E firma"
];

// Nombre de la nueva colección donde cada documento representa los expedientes de una estructura
const ESTRUCTURA_EXPEDIENTES_COLLECTION = "EstructuraExpedientes";

export const useExpedientesLogic = (estructuraId) => {
    const [expedientes, setExpedientes] = useState([]); // Este será el array 'listaExpedientes'
    const [loadingExpedientes, setLoadingExpedientes] = useState(false);
    const [errorExpedientes, setErrorExpedientes] = useState(null);
    const [isCreatingDefaults, setIsCreatingDefaults] = useState(false);

    const fetchExpedientes = useCallback(async () => {
        if (!estructuraId) {
            setExpedientes([]);
            return;
        }
        setLoadingExpedientes(true);
        setErrorExpedientes(null);
        try {
            const docRef = doc(firestore, ESTRUCTURA_EXPEDIENTES_COLLECTION, estructuraId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                // Asegurarse de que cada expediente en la lista tenga un 'id' si no lo tiene
                // y que coincida con 'nombre' para consistencia con cómo se editan.
                const lista = docSnap.data().listaExpedientes || [];
                const expedientesConId = lista.map(exp => ({ ...exp, id: exp.id || exp.nombre }));
                setExpedientes(expedientesConId);
            } else {
                setExpedientes([]); // No existe el documento, no hay expedientes (o no se han cargado los predeterminados)
            }
        } catch (err) {
            console.error("Error fetching expedientes for estructura:", err);
            setErrorExpedientes("No se pudieron cargar los expedientes de la estructura.");
            setExpedientes([]);
        } finally {
            setLoadingExpedientes(false);
        }
    }, [estructuraId]);

    const addDefaultExpedientesToEstructura = async (targetEstructuraId) => {
        if (!targetEstructuraId) {
            return { success: false, message: "ID de estructura no proporcionado." };
        }
        setIsCreatingDefaults(true);
        try {
            const docRef = doc(firestore, ESTRUCTURA_EXPEDIENTES_COLLECTION, targetEstructuraId);
            const docSnap = await getDoc(docRef);

            let currentListaExpedientes = [];
            if (docSnap.exists() && docSnap.data().listaExpedientes) {
                currentListaExpedientes = docSnap.data().listaExpedientes;
            }

            const existingNames = new Set(currentListaExpedientes.map(exp => exp.nombre));
            let expedientesAddedOrUpdated = false;
            let newOrUpdatedLista = [...currentListaExpedientes]; // Copiar para modificar

            PREDEFINED_EXPEDIENTE_NAMES.forEach((name, index) => {
                if (!existingNames.has(name)) {
                    const newExpedienteData = {
                        id: name, // Usar el nombre como ID interno del objeto
                        nombre: name,
                        numero: '',
                        fecha: null,
                        fechaVencimiento: null,
                        estatus: 'Pendiente',
                        linkDigital: '',
                        ubicacionFisica: '',
                        observaciones: '',
                        original: 0,
                        copiasCertificadas: 0,
                        fechaRegistro: Timestamp.now(),
                        fechaActualizacion: Timestamp.now(),
                        orden: index,
                    };
                    newOrUpdatedLista.push(newExpedienteData);
                    expedientesAddedOrUpdated = true;
                }
            });
            
            // Ordenar la lista final por el campo 'orden' para consistencia
            newOrUpdatedLista.sort((a, b) => (a.orden ?? Infinity) - (b.orden ?? Infinity));

            if (expedientesAddedOrUpdated || !docSnap.exists()) {
                if (!docSnap.exists()) {
                     // Si el documento no existe, lo creamos con setDoc
                    await setDoc(docRef, { estructuraId: targetEstructuraId, listaExpedientes: newOrUpdatedLista });
                } else {
                    // Si existe y hemos añadido expedientes, actualizamos con updateDoc
                    await updateDoc(docRef, { listaExpedientes: newOrUpdatedLista });
                }
                return { success: true, message: `Expedientes predeterminados fueron ${docSnap.exists() ? 'actualizados/añadidos' : 'creados'}.` };
            } else {
                return { success: true, message: "Todos los expedientes predeterminados ya existen y están actualizados." };
            }

        } catch (err) {
            console.error("Error al añadir/actualizar expedientes predeterminados:", err);
            return { success: false, message: `Error: ${err.message}` };
        } finally {
            setIsCreatingDefaults(false);
        }
    };

    // expedienteIdToUpdate ahora será el 'nombre' (o el 'id' interno) del expediente en el array.
    const handleUpdateExpedienteEnDetalle = async (expedienteIdentificador, dataToUpdate) => {
        if (!estructuraId) {
            setErrorExpedientes("ID de estructura no disponible para actualizar expediente.");
            return false;
        }
        if (!expedienteIdentificador) {
            setErrorExpedientes("Identificador de expediente no proporcionado.");
            return false;
        }

        // setLoadingExpedientes(true); // Podrías usar un loading específico para la edición
        try {
            const docRef = doc(firestore, ESTRUCTURA_EXPEDIENTES_COLLECTION, estructuraId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                throw new Error("Documento de expedientes de la estructura no encontrado.");
            }

            let currentLista = docSnap.data().listaExpedientes || [];
            let expedienteFound = false;
            const updatedLista = currentLista.map(exp => {
                if (exp.id === expedienteIdentificador || exp.nombre === expedienteIdentificador) { // Comparar por id o nombre
                    expedienteFound = true;
                    const updatedExp = { ...exp, ...dataToUpdate, fechaActualizacion: Timestamp.now() };

                    // Convertir fechas si vienen como strings YYYY-MM-DD
                    if (updatedExp.fecha && typeof updatedExp.fecha === 'string' && updatedExp.fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        const dp = updatedExp.fecha.split('-');
                        updatedExp.fecha = Timestamp.fromDate(new Date(Date.UTC(Number(dp[0]), Number(dp[1]) - 1, Number(dp[2]))));
                    } else if (updatedExp.fecha === '') updatedExp.fecha = null;
                    
                    if (updatedExp.fechaVencimiento && typeof updatedExp.fechaVencimiento === 'string' && updatedExp.fechaVencimiento.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        const dpv = updatedExp.fechaVencimiento.split('-');
                        updatedExp.fechaVencimiento = Timestamp.fromDate(new Date(Date.UTC(Number(dpv[0]), Number(dpv[1]) - 1, Number(dpv[2]))));
                    } else if (updatedExp.fechaVencimiento === '') updatedExp.fechaVencimiento = null;
                    
                    return updatedExp;
                }
                return exp;
            });

            if (!expedienteFound) {
                throw new Error(`Expediente con identificador '${expedienteIdentificador}' no encontrado en la lista.`);
            }

            await updateDoc(docRef, { listaExpedientes: updatedLista });
            await fetchExpedientes(); // Re-fetch para actualizar el estado local
            return true;
        } catch (err) {
            console.error("Error updating expediente en lista:", err);
            setErrorExpedientes("Error al actualizar el expediente: " + err.message);
            return false;
        } finally {
            // setLoadingExpedientes(false);
        }
    };

    return {
        expedientes,
        loadingExpedientes,
        errorExpedientes,
        isCreatingDefaults,
        fetchExpedientes,
        handleUpdateExpedienteEnDetalle,
        addDefaultExpedientesToEstructura
    };
};