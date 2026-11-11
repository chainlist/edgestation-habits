<script lang="ts">
	import type { WidgetApi } from '@edgestation/sdk';
	import { dayKey, lastDays, streak, untilTomorrow } from './dates';
	import HabitForm from './HabitForm.svelte';
	import HabitRow from './HabitRow.svelte';

	interface Habit {
		id: string;
		name: string;
		/** The checked days, as `dayKey` writes them. */
		done: string[];
	}

	let props: { api: WidgetApi } = $props();
	// `api` does not change. A changed setting mounts the widget again.
	// svelte-ignore state_referenced_locally
	const { api } = props;

	/** `undefined` until the widget reads the saved habits. */
	let habits = $state.raw<Habit[]>();
	/** The habit in the form. A habit without an `id` is a new one. */
	let editing = $state.raw<{ id?: string; name: string }>();
	let today = $state.raw(new Date());
	/** Sizes in pixels. The month row is 1.6em high, so it gives the font size. */
	let boxHeight = $state(0);
	let width = $state(0);
	let monthsHeight = $state(0);

	// The rows fill the height between the padding and the month row (3.5em in all). A gap is a
	// fifth of a square, as `--gap` sets it. Squares stay between 2.2em, a size that a finger can
	// still tap, and 3.2em. Below that, the list scrolls.
	const size = $derived.by(() => {
		const em = monthsHeight / 1.6;
		const count = habits?.length || 1;
		const room = Math.max(0, boxHeight - em * 3.5);
		const cell = Math.min(Math.max(room / (count * 1.2 - 0.2), em * 2.2), em * 3.2);
		return { cell, list: Math.min(Math.ceil(cell * (count * 1.2 - 0.2)), room) };
	});
	const days = $derived(
		lastDays(
			today,
			size.cell ? Math.max(1, Math.floor((width + size.cell / 5) / (size.cell * 1.2))) : 0
		)
	);
	const todayKey = $derived(dayKey(today));
	const rows = $derived(
		(habits ?? []).map((habit) => {
			const done = new Set(habit.done);
			return { habit, done, streak: streak(done, today) };
		})
	);

	api.guard(async () => {
		habits = (await api.storage.instance.get<Habit[]>('habits')) ?? [];
	})();

	// The timer waits while the page is off screen. It fires when the page shows if midnight passed.
	const nextDay = () => {
		today = new Date();
		api.after(untilTomorrow(today), nextDay);
	};
	nextDay();

	const save = api.guard(async (next: Habit[]) => {
		habits = next;
		await api.storage.instance.set('habits', next);
	});

	function toggle(habit: Habit, key: string) {
		// The midnight timer can be late after the PC sleeps. Then a tap only moves the days, so
		// it cannot check the wrong day.
		if (dayKey(new Date()) !== todayKey) {
			today = new Date();
			return;
		}
		const done = habit.done.includes(key)
			? habit.done.filter((day) => day !== key)
			: [...habit.done, key];
		save(habits!.map((other) => (other.id === habit.id ? { ...other, done } : other)));
	}

	function submit(name: string) {
		const id = editing?.id;
		save(
			id
				? habits!.map((habit) => (habit.id === id ? { ...habit, name } : habit))
				: [...habits!, { id: crypto.randomUUID(), name, done: [] }]
		);
		editing = undefined;
	}

	function remove() {
		const id = editing?.id;
		save(habits!.filter((habit) => habit.id !== id));
		editing = undefined;
	}

	const add = () => (editing = { name: '' });
</script>

<!-- `el` is the size container, so its padding cannot use cqh or cqw. Put the layout in it. -->
<div class="habits" bind:clientHeight={boxHeight} style:--cell="{size.cell}px">
	{#if editing}
		<HabitForm
			name={editing.name}
			isNew={!editing.id}
			onsave={submit}
			ondelete={remove}
			oncancel={() => (editing = undefined)}
		/>
	{:else if habits?.length === 0}
		<div class="empty">
			<p>Track a habit day by day</p>
			<button class="pill primary" onclick={add}>Add a habit</button>
		</div>
	{:else if habits}
		<div class="line">
			<button class="add" aria-label="Add a habit" onclick={add}>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
			</button>
			<div class="days months" bind:clientWidth={width} bind:clientHeight={monthsHeight}>
				{#each days as day (day.key)}
					<span class="slot">{#if day.month}<span>{day.month}</span>{/if}</span>
				{/each}
			</div>
		</div>

		<!-- This holds the overlay scrollbars of the list. Its height is set, so the block can be
		     centered and the list can still scroll. -->
		<div class="list" style:height="{size.list}px">
			<ul {@attach (ul) => api.scrollbars(ul)}>
				{#each rows as row (row.habit.id)}
					<HabitRow
						name={row.habit.name}
						done={row.done}
						streak={row.streak}
						{days}
						{todayKey}
						ontoggle={(key) => toggle(row.habit, key)}
						onedit={() => (editing = row.habit)}
					/>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	/* The script sets `--cell`, the size of a square. The font follows the height of the cell,
	   and the width of a narrow one, with limits that keep the names readable. */
	.habits {
		--gap: calc(var(--cell) / 5);
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.4em;
		height: 100%;
		padding: 0.75em;
		font-size: clamp(12px, min(4.5cqh, 2.2cqw), 20px);
	}

	/* Shared with HabitForm and HabitRow. */
	:where(.habits) :global(button) {
		padding: 0;
		border: none;
		background: none;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	:where(.habits) :global(.pill) {
		flex: none;
		padding: 0.4em 1em;
		border-radius: 999px;
		background: color-mix(in oklch, var(--card-foreground) 10%, transparent);
		white-space: nowrap;
	}

	:where(.habits) :global(.pill.primary) {
		background: var(--primary);
		color: var(--primary-foreground);
	}

	:where(.habits) :global(.pill:disabled) {
		opacity: 0.35;
		cursor: default;
	}

	/* The same colums on each line keep the squares of all rows aligned. */
	:where(.habits) :global(.line) {
		display: grid;
		grid-template-columns: min(7em, 25%) 1fr 2.6em;
		gap: 0.6em;
		align-items: center;
	}

	:where(.habits) :global(.days) {
		display: flex;
		justify-content: flex-end;
		gap: var(--gap);
		height: var(--cell);
		overflow: hidden;
	}

	.months {
		height: 1.6em;
	}

	.slot {
		flex: none;
		display: flex;
		align-items: flex-end;
		width: var(--cell);
	}

	.slot span {
		color: var(--muted-foreground);
		font-size: 0.7em;
		line-height: 1;
		white-space: nowrap;
	}

	.add {
		display: grid;
		place-items: center;
		justify-self: start;
		width: 1.6em;
		height: 1.6em;
		border-radius: 50%;
		background: var(--primary);
		color: var(--primary-foreground);
	}

	.add svg {
		width: 55%;
		fill: none;
		stroke: currentColor;
		stroke-width: 3;
		stroke-linecap: round;
	}

	.list {
		flex: none;
	}

	/* The list scrolls inside `.list` and fills it (see `api.scrollbars`). */
	ul {
		display: flex;
		flex-direction: column;
		gap: var(--gap);
		margin: 0;
		padding: 0;
		overscroll-behavior: contain;
		list-style: none;
	}

	.empty {
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.8em;
	}

	.empty p {
		margin: 0;
		color: var(--muted-foreground);
	}
</style>
