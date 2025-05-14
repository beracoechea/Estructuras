// src/hooks/useVencimientosData.js
import { useState, useEffect, useCallback } from 'react';
import { firestore } from '../config/firebase-config'; // Ajusta la ruta
import { collection, getDocs, Timestamp, doc, updateDoc,getDoc } from 'firebase/firestore'; // Añadir doc y updateDoc

// (formatDateForVencimientos como lo tenías)
export const formatDateForVencimientos = (timestamp) => {
    if (!timestamp) return 'N/A';
    let date;
    if (timestamp.toDate) { date = timestamp.toDate(); }
    else if (timestamp.seconds && typeof timestamp.seconds === 'number') { date = new Date(timestamp.seconds * 1000); }
    else if (typeof timestamp === 'string' && timestamp.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const parts = timestamp.split('-');
        date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
    } else if (timestamp instanceof Date) { date = timestamp; }
    else if (typeof timestamp === 'string' || typeof timestamp === 'number') { date = new Date(timestamp); }
    else { return 'Fecha inválida (tipo)'; }
    if (isNaN(date.getTime())) return 'Fecha inválida (valor)';
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
};

const ESTRUCTURA_EXPEDIENTES_COLLECTION = "EstructuraExpedientes"; // Misma colección que en useExpedientesLogic

export const useVencimientosData = () => {
    const [expedientesConVencimiento, setExpedientesConVencimiento] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        console.warn("ADVERTENCIA: La obtención de datos para Vencimientos con el modelo de array embebido puede ser ineficiente si hay muchas estructuras.");
        try {
            const estructuraExpedientesCollectionRef = collection(firestore, ESTRUCTURA_EXPEDIENTES_COLLECTION);
            const estructuraExpedientesSnap = await getDocs(estructuraExpedientesCollectionRef);

            const todosLosExpedientesConFechaVenc = [];

            // Para obtener nombres de Estructuras eficientemente (si no están en EstructuraExpedientes)
            const estructurasMap = new Map();
            const estructurasInfoSnap = await getDocs(collection(firestore, "Estructuras")); // Asume que tienes una colección "Estructuras"
            estructurasInfoSnap.forEach(docE => {
                estructurasMap.set(docE.id, docE.data().RazonSocial || `Estructura ${docE.id}`);
            });

            estructuraExpedientesSnap.forEach(docSnap => { // docSnap es el documento de una estructura que contiene la lista
                const dataEstructuraExpedientes = docSnap.data();
                const estructuraIdActual = docSnap.id; // El ID del documento es el estructuraId
                const lista = dataEstructuraExpedientes.listaExpedientes || [];

                lista.forEach(exp => {
                    if (exp.fechaVencimiento) { // Asume que fechaVencimiento es un Timestamp de Firestore o null
                        todosLosExpedientesConFechaVenc.push({
                            ...exp, // Contiene 'id' (nombre), 'nombre', 'fechaVencimiento', etc.
                            // Necesitamos el id del documento que contiene el array y el 'id' del expediente dentro del array
                            // Para la edición, necesitaríamos el estructuraId (ID del doc) y el 'id' del expediente (nombre)
                            idOriginalDocEstructura: estructuraIdActual, // ID del documento en EstructuraExpedientes
                            nombreEstructura: estructurasMap.get(estructuraIdActual) || "Estructura Desconocida",
                            // El 'id' del expediente ya está como exp.id (que es exp.nombre)
                        });
                    }
                });
            });

            // Ordenar por fecha de vencimiento (cliente)
            todosLosExpedientesConFechaVenc.sort((a, b) => {
                const dateA = a.fechaVencimiento?.toDate ? a.fechaVencimiento.toDate() : new Date(0);
                const dateB = b.fechaVencimiento?.toDate ? b.fechaVencimiento.toDate() : new Date(0);
                return dateA.getTime() - dateB.getTime();
            });

            setExpedientesConVencimiento(todosLosExpedientesConFechaVenc);

        } catch (err) {
            console.error("Error fetching vencimientos data (new model):", err);
            setError("No se pudieron cargar los datos de vencimientos. (Modelo Array)");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // expedienteIdentificador es el 'id' (o 'nombre') del expediente dentro del array.
    // estructuraIdDelExpediente es el ID del documento en ESTRUCTURA_EXPEDIENTES_COLLECTION.
    const updateExpedienteEnLista = async (expedienteIdentificador, dataToUpdate, estructuraIdDelExpediente) => {
        if (!estructuraIdDelExpediente || !expedienteIdentificador || !dataToUpdate) {
            throw new Error("IDs y datos para actualizar son requeridos.");
        }
        try {
            const docRef = doc(firestore, ESTRUCTURA_EXPEDIENTES_COLLECTION, estructuraIdDelExpediente);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                throw new Error(`Documento de expedientes para estructura ${estructuraIdDelExpediente} no encontrado.`);
            }

            let currentLista = docSnap.data().listaExpedientes || [];
            let expedienteFound = false;
            const updatedLista = currentLista.map(exp => {
                if (exp.id === expedienteIdentificador || exp.nombre === expedienteIdentificador) {
                    expedienteFound = true;
                    const updatedExp = { ...exp, ...dataToUpdate, fechaActualizacion: Timestamp.now() };
                    // Conversión de fechas
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
                throw new Error(`Expediente '${expedienteIdentificador}' no encontrado en estructura '${estructuraIdDelExpediente}'.`);
            }

            await updateDoc(docRef, { listaExpedientes: updatedLista });
            return true;
        } catch (err) {
            console.error("Error updating expediente desde useVencimientosData (new model):", err);
            throw err;
        }
    };

    return { expedientesConVencimiento, loading, error, refetchData: fetchData, updateExpedienteEnLista };
};