// src/services/firebaseChecksService.js
import { firestore } from '../config/firebase-config'; // Ajusta la ruta si es necesario
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Constante para la configuración de meses, usada internamente para asegurar estructura
const MESES_CONFIG_SERVICE = [
    { id: 'ENE', label: 'Enero' }, { id: 'FEB', label: 'Febrero' },
    { id: 'MAR', label: 'Marzo' }, { id: 'ABR', label: 'Abril' },
    { id: 'MAY', label: 'Mayo' }, { id: 'JUN', label: 'Junio' },
    { id: 'JUL', label: 'Julio' }, { id: 'AGO', label: 'Agosto' },
    { id: 'SEP', label: 'Septiembre' }, { id: 'OCT', label: 'Octubre' },
    { id: 'NOV', label: 'Noviembre' }, { id: 'DIC', label: 'Diciembre' }
];

// Nombre de la colección en Firestore donde se guardarán los datos de los checks
const CHECKS_COLLECTION_NAME = "seguimientoChecksEstructuras";

/**
 * Carga los datos de seguimiento de checks para una estructura y año específicos desde Firestore.
 * @param {string} estructuraId - El ID de la estructura.
 * @param {number} ano - El año para el cual se cargarán los datos.
 * @returns {Promise<Array|null>} Una promesa que resuelve al array de 'registrosMeses'
 * o null si el documento no existe o no tiene el campo.
 */
export const fetchChecksDataForYear = async (estructuraId, ano) => {
    if (!estructuraId || !ano) {
        console.error("Estructura ID y año son requeridos para fetchChecksDataForYear");
        return null; // Opcionalmente, podrías lanzar un error.
    }
    const docId = `${estructuraId}_${Number(ano)}`; // Asegurar que 'ano' sea tratado como número para el ID
    const docRef = doc(firestore, CHECKS_COLLECTION_NAME, docId);

    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            // Devuelve el array de registrosMeses. Si el campo no existe en el doc, devuelve undefined.
            // El componente que llama puede tratar undefined/null como "no datos".
            return docSnap.data().registrosMeses || null;
        } else {
            // No existe documento para este año, lo cual es un estado válido (aún no se ha iniciado el seguimiento).
            console.log(`No hay documento de checks para ${docId} en la colección ${CHECKS_COLLECTION_NAME}.`);
            return null;
        }
    } catch (error) {
        console.error("Error al cargar datos de checks desde Firestore:", error);
        throw error; // Propagar el error para que el llamador pueda manejarlo.
    }
};

/**
 * Actualiza o crea el documento de seguimiento de checks para un mes específico
 * de un año y estructura en Firestore.
 * @param {string} estructuraId - El ID de la estructura.
 * @param {number} ano - El año del seguimiento.
 * @param {string} mesId - El ID del mes a actualizar (ej. 'ENE', 'FEB').
 * @param {object} datosMesActualizados - Objeto con { marcado: boolean, observacion: string }.
 */
export const updateSingleMonthCheckData = async (estructuraId, ano, mesId, datosMesActualizados) => {
    if (!estructuraId || !ano || !mesId || datosMesActualizados === undefined) {
        const errorMsg = "Faltan parámetros para updateSingleMonthCheckData";
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    const docId = `${estructuraId}_${Number(ano)}`;
    const docRef = doc(firestore, CHECKS_COLLECTION_NAME, docId);

    try {
        const docSnap = await getDoc(docRef);
        let currentRegistrosMesesApi = [];

        // Si el documento existe y tiene el campo registrosMeses, lo usamos como base.
        if (docSnap.exists() && Array.isArray(docSnap.data().registrosMeses)) {
            currentRegistrosMesesApi = docSnap.data().registrosMeses;
        }

        // Construir el nuevo array de 'registrosMeses'.
        // Se asegura de que los 12 meses estén presentes, actualizando el mes afectado
        // y manteniendo los datos de otros meses o usando defaults.
        const nuevosRegistrosMeses = MESES_CONFIG_SERVICE.map(mesConfig => {
            const registroExistente = currentRegistrosMesesApi.find(r => r.mesId === mesConfig.id);

            if (mesConfig.id === mesId) { // Es el mes que estamos actualizando
                return {
                    mesId: mesId, // Asegurar que el mesId se guarde consistentemente
                    marcado: !!datosMesActualizados.marcado, // Coerción a booleano
                    observacion: datosMesActualizados.observacion || "" // Asegurar string
                };
            }
            // Para otros meses, mantener su valor existente o el default si es un nuevo año/documento
            return registroExistente || {
                mesId: mesConfig.id,
                marcado: false,
                observacion: ""
            };
        });

        // setDoc con merge:true creará el documento si no existe, o actualizará/añadirá
        // los campos especificados sin borrar otros campos de primer nivel no mencionados.
        await setDoc(docRef, {
            estructuraId: estructuraId,
            ano: Number(ano), // Guardar el año como número
            registrosMeses: nuevosRegistrosMeses,
            ultimaActualizacion: serverTimestamp() // Marcar el momento de la última modificación
        }, { merge: true });

        console.log(`Datos de checks para ${mesId} del ${ano} actualizados para estructura ${estructuraId}.`);
    } catch (error) {
        console.error("Error al actualizar datos de checks de un mes en Firestore:", error);
        throw error;
    }
};

/**
 * Crea el documento de seguimiento para un año con valores por defecto si aún no existe.
 * Esta función es útil si se tiene un botón "Iniciar seguimiento para este año".
 * @param {string} estructuraId - El ID de la estructura.
 * @param {number} ano - El año para el cual se inicializará el seguimiento.
 * @returns {Promise<Array|null>} Una promesa que resuelve al array de 'registrosMeses' por defecto
 * o los existentes si el documento ya estaba, o null en caso de error grave.
 */
export const initializeChecksForYear = async (estructuraId, ano) => {
    if (!estructuraId || !ano) {
        console.error("Estructura ID y año son requeridos para initializeChecksForYear");
        return null;
    }
    const docId = `${estructuraId}_${Number(ano)}`;
    const docRef = doc(firestore, CHECKS_COLLECTION_NAME, docId);

    try {
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            // El documento no existe, lo creamos con valores por defecto para todos los meses.
            const defaultRegistros = MESES_CONFIG_SERVICE.map(mesConfig => ({
                mesId: mesConfig.id,
                marcado: false,
                observacion: ""
            }));

            await setDoc(docRef, {
                estructuraId: estructuraId,
                ano: Number(ano),
                registrosMeses: defaultRegistros,
                fechaCreacion: serverTimestamp(), // Marcar cuándo se creó el seguimiento para este año
                ultimaActualizacion: serverTimestamp()
            });
            console.log(`Documento de checks inicializado para ${docId}.`);
            return defaultRegistros; // Devolver los datos recién creados
        } else {
            // El documento ya existe.
            console.log(`El documento de checks ya existe para ${docId}.`);
            return docSnap.data().registrosMeses || null; // Devolver los registros existentes o null si el campo falta
        }
    } catch (error) {
        console.error("Error al inicializar datos de checks en Firestore:", error);
        throw error;
    }
};