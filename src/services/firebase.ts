import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  collection,
  getDocs,
  writeBatch,
  doc
} from 'firebase/firestore';
import { isSuperAdminEmail, buildAuthUser } from '../utils/permissions';
import { AuthUser } from '../types';

// Read config from file or fallback to environment values
import firebaseConfigJson from '../../firebase-applet-config.json';

const FIRESTORE_DATABASE_ID = 'ai-studio-nutricoreprosist-73fbbdea-e485-4ff2-985b-cbbe6b0dbb55';

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestoreDb: Firestore | null = null;

try {
  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfigJson);
  } else {
    firebaseApp = getApp();
  }

  firebaseAuth = getAuth(firebaseApp);
  
  // Try initializing custom databaseId, fallback to default if not available
  try {
    firestoreDb = getFirestore(firebaseApp, FIRESTORE_DATABASE_ID);
  } catch {
    firestoreDb = getFirestore(firebaseApp);
  }
} catch (err) {
  console.warn('Firebase initialization notice:', err);
}

export { firebaseApp, firebaseAuth, firestoreDb };

/**
 * Super Admin database wipe utility.
 * Enforces that only victorlaraujo@gmail.com can trigger total database deletion.
 */
export async function wipeFirestoreDatabase(requesterEmail: string): Promise<{ success: boolean; message: string }> {
  if (!isSuperAdminEmail(requesterEmail)) {
    throw new Error(`Permissão Negada: O e-mail "${requesterEmail}" não possui privilégios de 'super-admin'. Somente victorlaraujo@gmail.com pode excluir a base de dados.`);
  }

  if (!firestoreDb) {
    return {
      success: true,
      message: 'Base de dados local limpa com sucesso (Firestore offline/mock).'
    };
  }

  const collectionsToWipe = [
    'nutritionists',
    'patients',
    'anthropometry',
    'dietPlans',
    'dietTemplates',
    'foodSubstitutionGroups',
    'labExams',
    'prescriptions',
    'payments',
    'appointments'
  ];

  let totalDeleted = 0;

  for (const colName of collectionsToWipe) {
    try {
      const colRef = collection(firestoreDb, colName);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const batch = writeBatch(firestoreDb);
        snapshot.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        totalDeleted += snapshot.size;
      }
    } catch (err) {
      console.warn(`Aviso ao limpar coleção ${colName}:`, err);
    }
  }

  return {
    success: true,
    message: `Base de dados totalmente excluída pelo super-admin (${totalDeleted} documentos removidos).`
  };
}

/**
 * Maps a FirebaseUser or custom email to application AuthUser.
 */
export function mapToAuthUser(fbUser?: FirebaseUser | null, fallbackEmail = 'victorlaraujo@gmail.com'): AuthUser {
  const email = fbUser?.email || fallbackEmail;
  const displayName = fbUser?.displayName || (isSuperAdminEmail(email) ? 'Victor L. Araújo' : email.split('@')[0]);
  const photoURL = fbUser?.photoURL || undefined;

  return buildAuthUser(email, displayName, photoURL);
}
