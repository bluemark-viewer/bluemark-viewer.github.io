
import '@atcute/client/lexicons';
import { KittyAgent } from 'kitty-agent';
import { base64ToBytes, decryptData, deriveKey } from './crypto';
import { parse as parseTid } from '@atcute/tid';

interface Bookmark {
    bookmarkedOn: Date;
    bookmarkRkey: string;

    repo: string;
    rkey: string;
}

export interface DedupedBookmark {
    bookmarkedOn: Date;
    bookmarkRkeys: string[];

    repo: string;
    rkey: string;
}

function groupBy<T, U extends string | symbol | number>(xs: T[], key: (element: T) => U): Record<U, T[]> {
    const obj: Partial<Record<U, T[]>> = {};
    for (const el of xs) {
        const k = key(el);
        (obj[k] ??= []).push(el);
    }
    return obj as Record<U, T[]>;
}

export async function getUserBookmarks(handleOrDid: string, passphrase: string) {
    const agent = await KittyAgent.getOrCreatePds(handleOrDid);
    const { records: bookmarks } = await agent.paginatedList({
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

    for (const { value: cryptBookmark, uri: { rkey } } of bookmarks) {
        const key = await getKey(cryptBookmark.salt);
        const decryptedString = await decryptData(cryptBookmark, key);
        const bookmark = {
            ...JSON.parse(decryptedString),
            bookmarkRkey: rkey,
            bookmarkedOn: new Date(parseTid(rkey).timestamp / 1_000),
        } as Bookmark;
        outBookmarks.push(bookmark);
    }
    // sort by recent first
    outBookmarks.sort((a, b) => {
        return b.bookmarkedOn.getTime() - a.bookmarkedOn.getTime();
    });

    // deduplicate
    const groups = groupBy(outBookmarks, e => `${e.repo}:${e.rkey}`);
    const dedupedBookmarks = Object.values(groups).map(group => ({
        repo: group[0].repo,
        rkey: group[0].rkey,
        bookmarkedOn: group[0].bookmarkedOn,
        bookmarkRkeys: group.map(bookmark => bookmark.bookmarkRkey),
    } satisfies DedupedBookmark))

    return dedupedBookmarks;
}