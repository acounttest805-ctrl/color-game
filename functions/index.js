// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

function getWeekId(season, timestamp) {
    const now = new Date(timestamp);
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

exports.submitScore = onRequest(
    { region: "asia-northeast1", cors: true },
    async (req, res) => {
        if (req.method !== 'POST') {
            return res.status(405).send({ error: 'Method Not Allowed' });
        }

        const { encodedId, playerName, score, mode, season } = req.body;

        if (typeof score !== 'number' || score < 0 || score > 999999 || typeof season !== 'number') {
            return res.status(400).send({ error: 'Bad Request: Invalid parameters' });
        }
        
        try {
            Buffer.from(encodedId, 'base64').toString('ascii');
        } catch (e) {
            return res.status(400).send({ error: 'Bad Request: Invalid ID format' });
        }

        const name = (playerName || "Anonymous").slice(0, 8);
        const modeName = mode === 'normal' ? 'ノーマル' : '色覚サポート';
        const timestamp = admin.firestore.FieldValue.serverTimestamp();
        const weekId = getWeekId(season, new Date());
        
        const allTimeCollectionName = season === 0 ? "scores_alltime" : `scores_s${season}_alltime`;
        const weeklyCollectionName = season === 0 ? "scores_weekly" : `scores_s${season}_weekly`;

        const allTimeCollection = db.collection(allTimeCollectionName);
        const weeklyCollection = db.collection(weeklyCollectionName);

        try {
            const batch = db.batch();

            // --- 全期間ランキングの更新 ---
            const oldAllTimeQuery = allTimeCollection.where("guestId", "==", encodedId);
            const oldAllTimeSnapshot = await oldAllTimeQuery.get();
            oldAllTimeSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            batch.set(allTimeCollection.doc(), { guestId: encodedId, name, score, mode: modeName, timestamp });
            
            // ★変更: 6件取得して、7位以下を削除
            const allTimeRankQuery = allTimeCollection.orderBy("score", "desc").limit(10);
            const allTimeRankSnapshot = await allTimeRankQuery.get();
            if (allTimeRankSnapshot.size > 6) { // 6件より多ければ
                for (let i = 6; i < allTimeRankSnapshot.size; i++) { // 7番目から削除
                    batch.delete(allTimeRankSnapshot.docs[i].ref);
                }
            }

            // --- 今週ランキングの更新 ---
            const oldWeeklyQuery = weeklyCollection.where("guestId", "==", encodedId).where("weekId", "==", weekId);
            const oldWeeklySnapshot = await oldWeeklyQuery.get();
            oldWeeklySnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            batch.set(weeklyCollection.doc(), { guestId: encodedId, name, score, mode: modeName, weekId, timestamp });

            // ★変更: 6件取得して、7位以下を削除
            const weeklyRankQuery = weeklyCollection.where("weekId", "==", weekId).orderBy("score", "desc").limit(10);
            const weeklyRankSnapshot = await weeklyRankQuery.get();
            if (weeklyRankSnapshot.size > 6) { // 6件より多ければ
                for (let i = 6; i < weeklyRankSnapshot.size; i++) { // 7番目から削除
                    batch.delete(weeklyRankSnapshot.docs[i].ref);
                }
            }

            await batch.commit();
            res.status(200).send({ message: "Score processed successfully" });

        } catch (error) {
            logger.error("Error processing score:", error);
            res.status(500).send({ error: "Internal Server Error" });
        }
    }
);