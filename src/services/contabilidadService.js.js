// src/services/firebaseContabilidadService.js
import { firestore } from '../config/firebase-config';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

// Nombre de la colección en Firestore para los registros contables
const CONTABILIDAD_COLLECTION_NAME = "contabilidad";

/**
 * Obtiene todos los registros contables de una estructura específica
 * @param {string} estructuraId - ID de la estructura
 * @returns {Promise<Array>} Array de registros contables
 */
export const fetchContabilidadByEstructura = async (estructuraId) => {
    if (!estructuraId) {
        console.error("Se requiere el ID de la estructura");
        throw new Error("ID de estructura es requerido");
    }

    try {
        const q = query(
            collection(firestore, CONTABILIDAD_COLLECTION_NAME),
            where("estructuraId", "==", estructuraId)
        );
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error al obtener registros contables:", error);
        throw error;
    }
};

/**
 * Crea o actualiza un registro contable
 * @param {string} estructuraId - ID de la estructura
 * @param {object} contabilidadData - Datos del registro contable
 * @param {string} [docId] - ID del documento a actualizar (opcional para creación)
 * @returns {Promise<string>} ID del documento creado/actualizado
 */
export const saveContabilidadItem = async (estructuraId, contabilidadData, docId = null) => {
    if (!estructuraId || !contabilidadData) {
        console.error("Estructura ID y datos son requeridos");
        throw new Error("Datos incompletos");
    }

    try {
        const docRef = docId 
            ? doc(firestore, CONTABILIDAD_COLLECTION_NAME, docId)
            : doc(collection(firestore, CONTABILIDAD_COLLECTION_NAME));

        const dataToSave = {
            ...contabilidadData,
            estructuraId,
            ultimaActualizacion: serverTimestamp(),
            ...(!docId && { fechaCreacion: serverTimestamp() }) // Solo añadir en creación
        };

        await setDoc(docRef, dataToSave, { merge: true });
        return docRef.id;
    } catch (error) {
        console.error("Error al guardar registro contable:", error);
        throw error;
    }
};

/**
 * Obtiene un registro contable específico por su ID
 * @param {string} docId - ID del documento
 * @returns {Promise<object|null>} El registro contable o null si no existe
 */
export const getContabilidadItemById = async (docId) => {
    if (!docId) {
        console.error("Se requiere el ID del documento");
        return null;
    }

    try {
        const docRef = doc(firestore, CONTABILIDAD_COLLECTION_NAME, docId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Error al obtener registro contable:", error);
        throw error;
    }
};

/**
 * Elimina un registro contable (si es necesario)
 * @param {string} docId - ID del documento a eliminar
 * @returns {Promise<void>}
 */
export const deleteContabilidadItem = async (docId) => {
    if (!docId) {
        console.error("Se requiere el ID del documento");
        throw new Error("ID de documento es requerido");
    }

    try {
        const docRef = doc(firestore, CONTABILIDAD_COLLECTION_NAME, docId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error al eliminar registro contable:", error);
        throw error;
    }
};