import admin from "firebase-admin";
import {firestore} from "firebase-admin/lib/firestore";
import Firestore = firestore.Firestore;
import QueryDocumentSnapshot = firestore.QueryDocumentSnapshot;
import DocumentData = firestore.DocumentData;

let _db: Firestore;

function getDb() {
  if (!_db) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: "autodial-dfeb8",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Need to un-escape linebreaks from private key.
        // See: https://stackoverflow.com/a/50376092/6451879
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    _db = admin.firestore();
  }

  return _db;
}

export async function getUsers(): Promise<User[]> {
  const {docs} = await getDb().collection("users").get();
  return docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.data() as User);
}
