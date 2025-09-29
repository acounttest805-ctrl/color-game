// js/crypto.js

// ユーザーIDをlocalStorageから取得、なければ生成して保存する関数
export function getGuestUserId() {
    let guestId = localStorage.getItem('guestUserId');

    if (!guestId) {
        // 新しいIDを生成
        guestId = crypto.randomUUID();
        // Base64エンコードで簡易的に難読化
        const encodedId = btoa(guestId);
        localStorage.setItem('guestUserId', encodedId);
        return encodedId;
    }

    return guestId;
}