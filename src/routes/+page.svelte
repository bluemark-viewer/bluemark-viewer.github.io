<script lang="ts">
    import { getUserBookmarks, type DedupedBookmark } from '$lib/unauthed-client';
    import 'bluesky-post-embed';

    import '$lib/styles.scss';
    import { authenticateIfNecessary, revokeSessions, savedHandle, user, waitForInitialSession } from '$lib/signed-in-user';
    import { onMount } from 'svelte';

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

    {#if $user}
        {#each bookmarks as bookmark}
        <p></p>

        <div class="pico">
            Saved on {bookmark.bookmarkedOn}
        </div>

        <bluesky-post src="at://{bookmark.repo}/app.bsky.feed.post/{bookmark.rkey}" allow-unauthenticated="true"></bluesky-post>
        {/each}
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
    }
</style>