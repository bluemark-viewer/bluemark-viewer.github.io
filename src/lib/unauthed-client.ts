
import '@atcute/client/lexicons';
import { KittyAgent } from 'kitty-agent';
import { base64ToBytes, decryptData, deriveKey } from './crypto';
import { parse as parseTid } from '@atcute/tid';

export interface Bookmark {
    bookmarkedOn: Date;
    bookmarkRkey: string;

    repo: string;
    rkey: string;
}

export async function getUserBookmarks(handleOrDid: string, passphrase: string) {
    const agent = await KittyAgent.getOrCreatePds(handleOrDid);
    const { records: bookmarks } = await agent.list({
        collection: 'io.github.uwx.bluemark.encryptedBookmark',
        repo: handleOrDid,
    });

    const keys = new Map<string, CryptoKey>();
    async function getKey(salt: string) {
        let key = keys.get(salt);
        if (key) return key;

        key = await deriveKey(passphrase, base64ToBytes(salt));
        keys.set(salt, key);
        return key;
    }

    const outBookmarks: Bookmark[] = [];

    for (const { value: cryptBookmark, uri: { rkey }} of bookmarks) {
        const key = await getKey(cryptBookmark.salt);
        const decryptedString = await decryptData(cryptBookmark, key);
        const bookmark = {
            ...JSON.parse(decryptedString),
            bookmarkRkey: rkey,
            bookmarkedOn: new Date(parseTid(rkey).timestamp / 1_000),
        } as Bookmark;
        outBookmarks.push(bookmark);
    }

    return outBookmarks.sort((a, b) => {
        return b.bookmarkedOn.getTime() - a.bookmarkedOn.getTime();
    });
}