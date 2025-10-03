// js/firebase.js
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let db;

// ★★★ デプロイ後にURLを設定してください ★★★
const SUBMIT_SCORE_URL = "https://submitscore-mlvzsjcxca-an.a.run.app";
const CHECK_TITLES_URL = "https://asia-northeast1-color-game-5041b.cloudfunctions.net/checkTitles";

export function initFirebase(firestoreInstance) {
    db = firestoreInstance;
}

export async function submitScore(encodedId, playerName, score, mode, season, titleId) {
    const payload = { encodedId, playerName, score, mode, season, titleId };
    try {
        const response = await fetch(SUBMIT_SCORE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Score submission failed');
        const result = await response.json();
        console.log("Functions response:", result.message);
    } catch (error) {
        console.error("Error submitting score via Function:", error);
        alert("スコアの送信に失敗しました。");
    }
}

export async function checkEligibleTitles(encodedId, completedSeason) {
    try {
        const response = await fetch(CHECK_TITLES_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ encodedId, completedSeason }),
        });
        if (!response.ok) throw new Error('Failed to check titles');
        const data = await response.json();
        return data.titles || [];
    } catch (error) {
        console.error("Error checking titles:", error);
        return [];
    }
}

function getWeekId(season) {
    const now = new Date();
    const timezoneOffset = 9 * 60 * 60 * 1000;
    const nowJST = new Date(now.getTime() + timezoneOffset);
    const dayOfWeekJST = nowJST.getUTCDay();
    const startOfWeekJST = new Date(nowJST);
    startOfWeekJST.setUTCDate(nowJST.getUTCDate() - dayOfWeekJST);
    startOfWeekJST.setUTCHours(0, 0, 0, 0);
    const weekIdDate = startOfWeekJST.toISOString().split('T')[0];
    const prefix = season === 0 ? "" : `s${season}-`;
    return `${prefix}week-${weekIdDate}`;
}

export async function getRankings(season) {
    if (!db) return { allTime: [], weekly: [] };
    const weekId = getWeekId(season);
    const allTimeCollectionName = season === 0 ? "scores_alltime" : `scores_s${season}_alltime`;
    const weeklyCollectionName = season === 0 ? "scores_weekly" : `scores_s${season}_weekly`;
    const qAllTime = query(collection(db, allTimeCollectionName), orderBy("score", "desc"), limit(6));
    const qWeekly = query(collection(db, weeklyCollectionName), where("weekId", "==", weekId), orderBy("score", "desc"), limit(6));
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