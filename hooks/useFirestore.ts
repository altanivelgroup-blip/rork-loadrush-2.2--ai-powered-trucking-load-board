import { useState, useCallback } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  DocumentData,
  WhereFilterOp,
  OrderByDirection,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface FirestoreQuery {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

export interface FirestoreOrderBy {
  field: string;
  direction?: OrderByDirection;
}

export interface FirestoreOptions {
  queries?: FirestoreQuery[];
  orderByField?: FirestoreOrderBy;
  limitCount?: number;
}

export function useFirestore() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getDocument = useCallback(async <T = DocumentData>(
    collectionName: string,
    documentId: string
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      console.log(`[Firestore] Getting document: ${collectionName}/${documentId}`);
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as T;
        console.log(`[Firestore] Document retrieved successfully:`, data);
        return data;
      } else {
        console.log(`[Firestore] Document not found: ${collectionName}/${documentId}`);
        return null;
      }
    } catch (err) {
      const error = err as Error;
      console.error(`[Firestore] Error getting document:`, error);
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCollection = useCallback(async <T = DocumentData>(
    collectionName: string,
    options?: FirestoreOptions
  ): Promise<T[]> => {
    setLoading(true);
    setError(null);
    try {
      console.log(`[Firestore] Getting collection: ${collectionName}`, options);
      const collectionRef = collection(db, collectionName);
      const constraints: QueryConstraint[] = [];

      if (options?.queries) {
        options.queries.forEach((q) => {
          constraints.push(where(q.field, q.operator, q.value));
        });
      }

      if (options?.orderByField) {
        constraints.push(
          orderBy(options.orderByField.field, options.orderByField.direction || 'asc')
        );
      }

      if (options?.limitCount) {
        constraints.push(limit(options.limitCount));
      }

      const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;
      const querySnapshot = await getDocs(q);

      const documents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];

      console.log(`[Firestore] Collection retrieved successfully: ${documents.length} documents`);
      return documents;
    } catch (err) {
      const error = err as Error;
      console.error(`[Firestore] Error getting collection:`, error);
      setError(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addDocument = useCallback(async <T = DocumentData>(
    collectionName: string,
    data: Omit<T, 'id'>
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      console.log(`[Firestore] Adding document to ${collectionName}:`, data);
      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, data as DocumentData);
      console.log(`[Firestore] Document added successfully with ID: ${docRef.id}`);
      return docRef.id;
    } catch (err) {
      const error = err as Error;
      console.error(`[Firestore] Error adding document:`, error);
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const setDocument = useCallback(async <T = DocumentData>(
    collectionName: string,
    documentId: string,
    data: Omit<T, 'id'>,
    merge: boolean = false
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      console.log(`[Firestore] Setting document ${collectionName}/${documentId}:`, data);
      const docRef = doc(db, collectionName, documentId);
      await setDoc(docRef, data as DocumentData, { merge });
      console.log(`[Firestore] Document set successfully`);
      return true;
    } catch (err) {
      const error = err as Error;
      console.error(`[Firestore] Error setting document:`, error);
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDocument = useCallback(async (
    collectionName: string,
    documentId: string,
    data: Partial<DocumentData>
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      console.log(`[Firestore] Updating document ${collectionName}/${documentId}:`, data);
      const docRef = doc(db, collectionName, documentId);
      await updateDoc(docRef, data);
      console.log(`[Firestore] Document updated successfully`);
      return true;
    } catch (err) {
      const error = err as Error;
      console.error(`[Firestore] Error updating document:`, error);
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (
    collectionName: string,
    documentId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      console.log(`[Firestore] Deleting document ${collectionName}/${documentId}`);
      const docRef = doc(db, collectionName, documentId);
      await deleteDoc(docRef);
      console.log(`[Firestore] Document deleted successfully`);
      return true;
    } catch (err) {
      const error = err as Error;
      console.error(`[Firestore] Error deleting document:`, error);
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getDocument,
    getCollection,
    addDocument,
    setDocument,
    updateDocument,
    deleteDocument,
  };
}
