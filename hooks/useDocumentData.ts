import { useState, useEffect } from 'react';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/config/firebase';

export function useDocumentData<T = DocumentData>(
  path: string
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) {
      console.log(`[Firestore Listener] No path provided`);
      setData(null);
      setLoading(false);
      return;
    }

    const pathParts = path.split('/');
    if (pathParts.length !== 2) {
      console.error(`[Firestore Listener] Invalid path format: ${path}. Expected format: collection/documentId`);
      setData(null);
      setLoading(false);
      return;
    }

    const [collectionName, documentId] = pathParts;

    if (!documentId) {
      console.log(`[Firestore Listener] No document ID provided for ${collectionName}`);
      setData(null);
      setLoading(false);
      return;
    }

    console.log(`[Firestore Listener] Setting up listener for document: ${collectionName}/${documentId}`);
    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, collectionName, documentId);

      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const documentData = {
              id: snapshot.id,
              ...snapshot.data(),
            } as T;
            console.log(`[Firestore Listener] Document updated: ${collectionName}/${documentId}`, documentData);
            setData(documentData);
          } else {
            console.log(`[Firestore Listener] Document not found: ${collectionName}/${documentId}`);
            setData(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error(`[Firestore Listener] Error listening to document:`, err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => {
        console.log(`[Firestore Listener] Cleaning up listener for: ${collectionName}/${documentId}`);
        unsubscribe();
      };
    } catch (err) {
      console.error(`[Firestore Listener] Error setting up listener:`, err);
      setError(err as Error);
      setLoading(false);
    }
  }, [path]);

  return { data, loading, error };
}
