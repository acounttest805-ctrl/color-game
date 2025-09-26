// js/firebase.js
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, writeBatch, doc, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let db;

export function initFirebase(firestoreInstance) {
    db = firestoreInstance;
}

function getWeekId() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const adjustment = dayOfWeek === 0 ? 1 : -(6 - dayOfWeek);
    const startOfWeek = new Date(now); // nowを直接変更しないようにコピー
    startOfWeek.setDate(now.getDate() + adjustment);
    startOfWeek.setHours(0, 0, 0, 0);
    return `week-${startOfWeek.toISOString().split('T')[0]}`;
}


export async function submitScore(playerName, score, mode) {
    if (!db || score <= 0) return;
    
    const name = playerName.slice(0, 8) || "Anonymous";
    const modeName = mode === 'normal' ? 'ノーマル' : '色覚サポート';
    const weekId = getWeekId();
    
    const allTimeCollection = collection(db, "scores_alltime");
    const weeklyCollection = collection(db, "scores_weekly");

    const qAllTime = query(allTimeCollection, orderBy("score", "desc"), limit(5));
    const qWeekly = query(weeklyCollection, where("weekId", "==", weekId), orderBy("score", "desc"), limit(5));

    try {
        const [allTimeSnapshot, weeklySnapshot] = await Promise.all([getDocs(qAllTime), getDocs(qWeekly)]);
        
        const batch = writeBatch(db);
        let updated = false;

        const allTimeScores = allTimeSnapshot.docs;
        if (allTimeScores.length < 5 || score > allTimeScores[allTimeScores.length - 1].data().score) {
            const newDocRef = doc(allTimeCollection); // 新しいドキュメント参照を作成
            batch.set(newDocRef, { name, score, mode: modeName, timestamp: new Date() });
            if (allTimeScores.length >= 5) {
                batch.delete(allTimeScores[allTimeScores.length - 1].ref);
            }
            updated = true;
        }
        
        const weeklyScores = weeklySnapshot.docs;
        if (weeklyScores.length < 5 || score > weeklyScores[weeklyScores.length - 1].data().score) {
            const newDocRef = doc(weeklyCollection);
            batch.set(newDocRef, { name, score, mode: modeName, weekId, timestamp: new Date() });
            if (weeklyScores.length >= 5) {
                batch.delete(weeklyScores[weeklyScores.length - 1].ref);
            }
            updated = true;
        }

        if (updated) {
            await batch.commit();
            console.log("Score submitted!");
        } else {
            console.log("Score was not high enough for ranking.");
        }
    } catch (e) {
        console.error("Error submitting score: ", e);
    }
}

export async function getRankings() {
    if (!db) return { allTime: [], weekly: [] };
    
    const weekId = getWeekId();

    const qAllTime = query(collection(db, "scores_alltime"), orderBy("score", "desc"), limit(5));
    const qWeekly = query(collection(db, "scores_weekly"), where("weekId", "==", weekId), orderBy("score", "desc"), limit(5));

    try {
        const [allTimeSnapshot, weeklySnapshot] = await Promise.all([getDocs(qAllTime), getDocs(qWeekly)]);
        
        const allTime = allTimeSnapshot.docs.map(doc => doc.data());
        const weekly = weeklySnapshot.docs.map(doc => doc.data());
        
        return { allTime, weekly };
    } catch (e) {
        console.error("Error getting rankings: ", e);
        return { allTime: [], weekly: [] };
    }
}