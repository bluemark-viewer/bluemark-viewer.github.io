<script lang="ts">
    import { getUserBookmarks, type DedupedBookmark } from '$lib/unauthed-client';
    import 'bluesky-post-embed';

    import '$lib/styles.scss';
    import { authenticateIfNecessary, revokeSessions, savedHandle, user, waitForInitialSession } from '$lib/signed-in-user';
    import { onMount } from 'svelte';
    import Pagination from '$lib/components/Pagination.svelte';

    let loginHandle = $state($savedHandle ?? '');
    let passphrase = $state('');
    let bookmarks: DedupedBookmark[] = $state([]);
    let initialSessionPromise = $state<Promise<void>>();

    onMount(() => {
        initialSessionPromise = waitForInitialSession();
    });

    async function loadUser() {
        bookmarks = await getUserBookmarks($user!.did, passphrase);
    }
    
    async function signIn() {
        if (!$user) {
            await waitForInitialSession();
        }

        if (!$user) {
            await authenticateIfNecessary(loginHandle, false);
        }
    }

    function signOut() {
        revokeSessions();
    }

    async function deleteBookmark(bookmark: DedupedBookmark, event: Event) {
        event.preventDefault();
        
        if (!$user) {
            await waitForInitialSession();
        }

        if (!$user) {
            return;
        }

        await $user.client.deleteBookmarks(bookmark.bookmarkRkeys);
        await loadUser();
    }
</script>

{#if initialSessionPromise}
<div class="main">
    <div class="pico">
        {#await initialSessionPromise}
            Loading...
        {:then _}
            {#if $user}
                Signed in as {$user.handle}
                <button class="signout" onclick={signOut}>Sign Out</button>

                <hr>

                <label>
                    Bookmarks passphrase (NOT your Bluesky password):
                    <input type="password" bind:value={passphrase}>
                </label>
                
                <button onclick={loadUser}>Load Bookmarks</button>
            {:else}
                <label>
                    Username:
                    <input type="text" bind:value={loginHandle}>
                </label>
        
                <button onclick={signIn}>Sign In</button>
            {/if}
        {/await}
    </div>

    {#if $user && bookmarks.length}
        <Pagination rows={bookmarks} perPage={30} let:row totalShownPages={4}>
            {@const bookmark = row}
    
            Saved on {bookmark.bookmarkedOn.toLocaleString(undefined, {})}

            <a href="#deletePaste" role="button" class="delete-button" onclick={event => deleteBookmark(bookmark, event)}>
                🗑️
            </a>
    
            {#key [bookmark.repo, bookmark.rkey]}
            <bluesky-post src="at://{bookmark.repo}/app.bsky.feed.post/{bookmark.rkey}" allow-unauthenticated="true"></bluesky-post>
            {/key}

            <hr>
        </Pagination>
    {/if}
</div>
{/if}

<style lang="scss">
    .main {
        width: 550px;
        max-width: 550px;
        
        margin: 32px auto;
    }
    .signout {
        padding: 0.2rem 0.7rem !important;
        float: right;
    }
    .delete-button {
        float: right;
        text-decoration: none !important;
    }
</style>