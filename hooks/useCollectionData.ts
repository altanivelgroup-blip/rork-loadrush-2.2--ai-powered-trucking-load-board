import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  QueryConstraint,
  DocumentData,
  WhereFilterOp,
  OrderByDirection,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface CollectionQuery {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

export interface CollectionOrderBy {
  field: string;
  direction?: OrderByDirection;
}

export interface CollectionOptions {
  queries?: CollectionQuery[];
  orderByField?: CollectionOrderBy;
  limitCount?: number;
}

export function useCollectionData<T = DocumentData>(
  collectionName: string,
  options?: CollectionOptions
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log(`[Firestore Listener] Setting up listener for collection: ${collectionName}`, options);
    setLoading(true);
    setError(null);

    try {
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

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const documents = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];

          console.log(`[Firestore Listener] Collection updated: ${collectionName} (${documents.length} documents)`);
          setData(documents);
          setLoading(false);
        },
        (err) => {
          console.error(`[Firestore Listener] Error listening to collection:`, err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => {
        console.log(`[Firestore Listener] Cleaning up listener for: ${collectionName}`);
        unsubscribe();
      };
    } catch (err) {
      console.error(`[Firestore Listener] Error setting up listener:`, err);
      setError(err as Error);
      setLoading(false);
    }
  }, [collectionName, JSON.stringify(options)]);

  return { data, loading, error };
}
