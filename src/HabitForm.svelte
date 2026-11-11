<script lang="ts">
	let {
		name,
		isNew,
		onsave,
		ondelete,
		oncancel
	}: {
		name: string;
		isNew: boolean;
		onsave: (name: string) => void;
		ondelete: () => void;
		oncancel: () => void;
	} = $props();

	// The form mounts again for each habit, so it reads `name` once.
	// svelte-ignore state_referenced_locally
	let draft = $state(name);
	/** Delete takes a second tap, as it also deletes the history of the habit. */
	let confirming = $state(false);

	function submit(event: SubmitEvent) {
		event.preventDefault();
		if (draft.trim()) onsave(draft.trim());
	}
</script>

<form onsubmit={submit}>
	<h2>{isNew ? 'New habit' : 'Edit habit'}</h2>
	<input
		bind:value={draft}
		placeholder="Read 20 pages"
		aria-label="Name"
		enterkeyhint="done"
		maxlength="60"
		onkeydown={(event) => event.key === 'Escape' && oncancel()}
	/>
	<div class="actions">
		{#if !isNew}
			<button
				type="button"
				class="pill delete"
				class:confirming
				onclick={() => (confirming ? ondelete() : (confirming = true))}
			>
				{confirming ? 'Tap again to delete' : 'Delete'}
			</button>
		{/if}
		<button type="button" class="pill cancel" onclick={oncancel}>Cancel</button>
		<button class="pill primary" disabled={!draft.trim()}>{isNew ? 'Add' : 'Save'}</button>
	</div>
</form>

<style>
	form {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: center;
		gap: 0.6em;
		width: min(100%, 26em);
		margin: 0 auto;
	}

	h2 {
		margin: 0;
		font-size: 1em;
		font-weight: 600;
	}

	input {
		height: 2.2em;
		padding: 0 0.7em;
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) * 0.75);
		background: transparent;
		color: inherit;
		font: inherit;
	}

	input::placeholder {
		color: var(--muted-foreground);
	}

	input:focus {
		border-color: var(--ring);
		outline: none;
	}

	.actions {
		display: flex;
		gap: 0.5em;
	}

	/* Delete stays on the left, away form Save. */
	.cancel {
		margin-left: auto;
	}

	.delete {
		color: var(--destructive);
	}

	.delete.confirming {
		background: var(--destructive);
		color: white;
	}
</style>
