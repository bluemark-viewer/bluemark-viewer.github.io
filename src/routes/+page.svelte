<script lang="ts">
    import { getUserBookmarks, type Bookmark } from '$lib/unauthed-client';
    import 'bluesky-post-embed';

    import '$lib/styles.scss';

    let handleOrDid = $state('');
    let passphrase = $state('');
    let bookmarks: Bookmark[] = $state([]);

    async function loadUser() {
        bookmarks = await getUserBookmarks(handleOrDid, passphrase);
    }
</script>

<div class="main">
    <div class="pico">
        <label>
            Username:
            <input type="text" bind:value={handleOrDid}>
        </label>

        <label>
            Bookmarks passphrase (NOT your Bluesky password):
            <input type="password" bind:value={passphrase}>
        </label>
        
        <button onclick={() => loadUser()}>Load Bookmarks</button>
    </div>

    {#each bookmarks as bookmark}
    <p></p>

    <div class="pico">
        Saved on {bookmark.bookmarkedOn}
    </div>

    <bluesky-post src="at://{bookmark.repo}/app.bsky.feed.post/{bookmark.rkey}" allow-unauthenticated="true"></bluesky-post>
    {/each}
</div>

<style lang="scss">
    .main {
        width: 550px;
        max-width: 550px;
        
        margin: 32px auto;
    }
</style>