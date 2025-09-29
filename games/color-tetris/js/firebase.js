// js/firebase.js
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, writeBatch, doc, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let db;

export function initFirebase(firestoreInstance) {
    db = firestoreInstance;
}

// ★★★ 修正された週ID生成関数 ★★★
function getWeekId(season) {
    const now = new Date(); // 現在時刻を取得

    // 日本のタイムゾーンオフセットを考慮 (JST = UTC+9)
    const timezoneOffset = 9 * 60 * 60 * 1000;
    const nowJST = new Date(now.getTime() + timezoneOffset);

    // 日本時間の日曜日を週の始まり(0)とする
    const dayOfWeekJST = nowJST.getUTCDay();
    
    // 週の開始日（日曜日）の0時0分0秒(JST)を計算
    const startOfWeekJST = new Date(nowJST);
    startOfWeekJST.setUTCDate(nowJST.getUTCDate() - dayOfWeekJST);
    startOfWeekJST.setUTCHours(0, 0, 0, 0);

    // 週IDを生成
    const weekIdDate = startOfWeekJST.toISOString().split('T')[0];
    
    const prefix = season === 0 ? "" : `s${season}-`;
    return `${prefix}week-${weekIdDate}`;
}


export async function submitScore(playerName, score, mode, season) {
    if (!db || score <= 0) return;
    
    const name = playerName.slice(0, 8) || "Anonymous";
    const modeName = mode === 'normal' ? 'ノーマル' : '色覚サポート';
    const weekId = getWeekId(season);
    
    const allTimeCollectionName = season === 0 ? "scores_alltime" : `scores_s${season}_alltime`;
    const weeklyCollectionName = season === 0 ? "scores_weekly" : `scores_s${season}_weekly`;

    const allTimeCollection = collection(db, allTimeCollectionName);
    const weeklyCollection = collection(db, weeklyCollectionName);

    const qAllTime = query(allTimeCollection, orderBy("score", "desc"), limit(5));
    const qWeekly = query(weeklyCollection, where("weekId", "==", weekId), orderBy("score", "desc"), limit(5));

    try {
        const [allTimeSnapshot, weeklySnapshot] = await Promise.all([getDocs(qAllTime), getDocs(qWeekly)]);
        
        const batch = writeBatch(db);
        let updated = false;

        const allTimeScores = allTimeSnapshot.docs;
        if (allTimeScores.length < 5 || score > allTimeScores[allTimeScores.length - 1].data().score) {
            const newDocRef = doc(allTimeCollection);
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

export async function getRankings(season) {
    if (!db) return { allTime: [], weekly: [] };
    
    const weekId = getWeekId(season);

    const allTimeCollectionName = season === 0 ? "scores_alltime" : `scores_s${season}_alltime`;
    const weeklyCollectionName = season === 0 ? "scores_weekly" : `scores_s${season}_weekly`;

    const qAllTime = query(collection(db, allTimeCollectionName), orderBy("score", "desc"), limit(5));
    const qWeekly = query(collection(db, weeklyCollectionName), where("weekId", "==", weekId), orderBy("score", "desc"), limit(5));

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