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

        let name = (playerName || "Anonymous").slice(0, 8);
        const lowerCaseName = name.toLowerCase();
        
        // NGワードリスト (ここにリストを記述)
        const NG_WORDS = [
    // 暴言・罵倒語
    "死ね", "shine", "殺す", "korosu", "消えろ", "kiero", "カス", "kasu", 
    "クズ", "kuzu", "ゴミ", "gomi", "馬鹿", "baka", "アホ", "aho", "マヌケ", "manuke",
    "うんこ", "unko", "クソ", "kuso", "雑魚", "zako", "ブス", "busu", "デブ", "debu",
    "ハゲ", "hage", "チビ", "chibi", "ガイジ", "gaiji", "乞食", "kojiki", "無能", "munou",
    "役立たず", "yakutatazu", "きもい", "kimoi", "うざい", "uzai", "いじめ", "ijime",

    // 差別・ヘイトスピーチ関連
    "黒人", "kokujin", "白人", "hakujin", "チョン", "chon", "土人", "dojin", 
    "ニガー", "nigger", "nigga", "ファック", "fuck", "ビッチ", "bitch", "シット", "shit",
    "アスホール", "asshole", "ゲイ", "gay", "レズ", "les", "rezu", "オカマ", "okama",
    "ニューハーフ", "newhalf", "部落", "buraku", "穢多", "eta", "非人", "hinin",
    "めくら", "mekura", "おし", "oshi", "つんぼ", "tsunbo", "ホモ", "homo",

    // 性的な表現
    "ちんこ", "chinko", "まんこ", "manko", "うんち", "unchi", "おっぱい", "oppai",
    "セックス", "sex", "エロ", "ero", "ポルノ", "porno", "裸", "hadaka", "ペニス", "penis",
    "バギナ", "vagina", "射精", "shasei", "フェラ", "fella", "オーガズム", "orgasm",
    "援助交際", "enjokousai", "売春", "baishun", "処女", "shojo", "童貞", "doutei",
    "レイプ", "rape", "変態", "hentai", "クリトリス", "kuritorisu", "アナル", "anal",
    "乳首", "chikubi", "睾丸", "kougan", "金玉", "kintama", "陰茎", "inkei", "膣", "chitsu",
    "ザーメン", "samen", "巨根", "kyokon", "パイパン", "paipan", "オナニー", "onani",
    "手コキ", "tekoki", "顔射", "gansha", "中出し", "nakadashi", "潮吹き", "shiofuki",
    "ハメ撮り", "hamedori", "乱交", "rankou", "輪姦", "rinkan", "近親相姦", "kinshinsoukan",
    "痴漢", "chikan", "盗撮", "tousatsu", "児童ポルノ", "jidouporno", "ソープランド", "soapland",
    "デリヘル", "deriheru", "娼婦", "shoufu", "肉便器", "nikubenki", "dick", "pussy",
    "slut", "whore", "horny", "masturbate", "媚薬", "biyaku", "精液", "seieki", "包茎", "houkei",
    "風俗", "fuuzoku", "アダルト", "adult", "無修正", "mushuusei", "裏ビデオ", "urabideo",
    "エッチ", "ecchi", "etti",

    // 犯罪・違法行為関連
    "犯罪", "hanzai", "殺人", "satsujin", "暴力", "bouryoku", "薬物", "yakubutsu",
    "麻薬", "mayaku", "大麻", "taima", "覚醒剤", "kakuseizai", "詐欺", "sagi", "テロ", "tero",

    // その他
    "荒らし", "arashi", "自殺", "jisatsu", "ちんぽ", "chinpo", "ぱいずり", "paizuri",
    "原爆", "genbaku", "ナチス", "nazi", "nachisu", "ヒトラー", "hitler", "死体", "shitai"
]; 
        for (const ngWord of NG_WORDS) {
            if (lowerCaseName.includes(ngWord)) {
                name = "******";
                break;
            }
        }

        const modeName = mode === 'normal' ? 'ノーマル' : '色覚サポート';
        const timestamp = admin.firestore.FieldValue.serverTimestamp();
        const weekId = getWeekId(season, new Date());
        
        const allTimeCollectionName = season === 0 ? "scores_alltime" : `scores_s${season}_alltime`;
        const weeklyCollectionName = season === 0 ? "scores_weekly" : `scores_s${season}_weekly`;

        const allTimeCollection = db.collection(allTimeCollectionName);
        const weeklyCollection = db.collection(weeklyCollectionName);

        try {
            const batch = db.batch();

            // ★★★ ここからロジックを修正 ★★★

            // --- 全期間ランキングの更新 ---
            const oldAllTimeQuery = allTimeCollection.where("guestId", "==", encodedId);
            const oldAllTimeSnapshot = await oldAllTimeQuery.get();
            let oldAllTimeScore = -1;
            let oldAllTimeDocRef = null;

            if (!oldAllTimeSnapshot.empty) {
                const oldDoc = oldAllTimeSnapshot.docs[0];
                oldAllTimeScore = oldDoc.data().score;
                oldAllTimeDocRef = oldDoc.ref;
            }

            // 今回のスコアが過去のスコアより高い場合のみ更新
            if (score > oldAllTimeScore) {
                if (oldAllTimeDocRef) {
                    batch.delete(oldAllTimeDocRef); // 古いスコアを削除
                }
                batch.set(allTimeCollection.doc(), { guestId: encodedId, name, score, mode: modeName, timestamp });
            }

            // --- 今週ランキングの更新 (同様の処理) ---
            const oldWeeklyQuery = weeklyCollection.where("guestId", "==", encodedId).where("weekId", "==", weekId);
            const oldWeeklySnapshot = await oldWeeklyQuery.get();
            let oldWeeklyScore = -1;
            let oldWeeklyDocRef = null;

            if (!oldWeeklySnapshot.empty) {
                const oldDoc = oldWeeklySnapshot.docs[0];
                oldWeeklyScore = oldDoc.data().score;
                oldWeeklyDocRef = oldDoc.ref;
            }

            if (score > oldWeeklyScore) {
                if (oldWeeklyDocRef) {
                    batch.delete(oldWeeklyDocRef);
                }
                batch.set(weeklyCollection.doc(), { guestId: encodedId, name, score, mode: modeName, weekId, timestamp });
            }

            // 7位以下のスコアをクリーンアップするロジックはバッチの最後に移動
            // (この部分は高負荷になる可能性があるため、別のトリガー関数に分けるのが理想だが、今回はこのまま)
            
            await batch.commit();

            // --- クリーンアップ処理 ---
            const cleanupBatch = db.batch();
            const allTimeRankQuery = allTimeCollection.orderBy("score", "desc").limit(10);
            const allTimeRankSnapshot = await allTimeRankQuery.get();
            if (allTimeRankSnapshot.size > 6) {
                for (let i = 6; i < allTimeRankSnapshot.size; i++) {
                    cleanupBatch.delete(allTimeRankSnapshot.docs[i].ref);
                }
            }
            
            const weeklyRankQuery = weeklyCollection.where("weekId", "==", weekId).orderBy("score", "desc").limit(10);
            const weeklyRankSnapshot = await weeklyRankQuery.get();
            if (weeklyRankSnapshot.size > 6) {
                for (let i = 6; i < weeklyRankSnapshot.size; i++) {
                    cleanupBatch.delete(weeklyRankSnapshot.docs[i].ref);
                }
            }

            await cleanupBatch.commit();

            res.status(200).send({ message: "Score processed successfully" });

        } catch (error) {
            logger.error("Error processing score:", error);
            res.status(500).send({ error: "Internal Server Error" });
        }
    }
);