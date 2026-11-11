<script lang="ts">
	import { dayName, type Day } from './dates';

	let {
		name,
		done,
		streak,
		days,
		todayKey,
		ontoggle,
		onedit
	}: {
		name: string;
		done: ReadonlySet<string>;
		streak: number;
		days: Day[];
		todayKey: string;
		ontoggle: (key: string) => void;
		onedit: () => void;
	} = $props();
</script>

<li class="line">
	<button class="name" onclick={onedit}>{name}</button>
	<div class="days">
		{#each days as day (day.key)}
			<button
				class="day"
				class:done={done.has(day.key)}
				class:today={day.key === todayKey}
				aria-pressed={done.has(day.key)}
				aria-label="{name}, {dayName.format(day.date)}"
				onclick={() => ontoggle(day.key)}
			></button>
		{/each}
	</div>
	<span class="streak" class:zero={!streak} title="Days in a row">
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<!-- Lucide "flame" icon, ISC license: https://lucide.dev/license -->
			<path
				d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
			/>
		</svg>
		{streak}
	</span>
</li>

<style>
	.name {
		min-width: 0;
		overflow: hidden;
		font-size: 0.9em;
		text-align: left;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.day {
		flex: none;
		width: var(--cell);
		height: var(--cell);
		border-radius: calc(var(--cell) / 4.5);
		background: color-mix(in oklch, var(--card-foreground) 10%, transparent);
		transition:
			scale 120ms,
			background-color 120ms;
	}

	.day.done {
		background: var(--primary);
	}

	.day.today:not(.done) {
		box-shadow: inset 0 0 0 2px var(--primary);
	}

	.day:active {
		scale: 0.85;
	}

	.streak {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.2em;
		font-size: 0.85em;
		font-variant-numeric: tabular-nums;
	}

	.streak svg {
		width: 1em;
		fill: none;
		stroke: var(--primary);
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.streak.zero {
		color: var(--muted-foreground);
	}

	.streak.zero svg {
		stroke: currentColor;
	}
</style>
