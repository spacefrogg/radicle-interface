<script lang="ts">
  import IconSmall from "@app/components/IconSmall.svelte";

  export let active: boolean;
  export let name: string;
</script>

<style>
  .file {
    border-radius: var(--border-radius-tiny);
    cursor: pointer;
    display: flex;
    line-height: 1.5em;
    margin: 0.25rem 0;
    padding: 0.25rem 0.875rem;
    width: 100%;
  }

  .file:hover {
    background-color: var(--color-fill-ghost);
  }

  .file.active {
    color: var(--color-foreground-match-background) !important;
    background-color: var(--color-fill-secondary);
  }

  .file.active:hover {
    color: var(--color-foreground-match-background) !important;
    background-color: var(--color-fill-secondary-hover);
  }

  .name {
    margin-left: 0.25rem;
    user-select: none;
    white-space: nowrap;
    text-overflow: ellipsis !important;
    overflow: hidden;
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-medium);
  }
  .icon-container {
    color: var(--color-fill-secondary);
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 0.125rem;
  }
  .active .icon-container {
    color: var(--color-foreground-match-background);
  }
</style>

<div class="file" class:active>
  <div class="icon-container">
    <IconSmall name="file" />
  </div>
  <span class="name">{name}</span>
</div>
