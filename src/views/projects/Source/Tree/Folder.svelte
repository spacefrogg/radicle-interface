<script lang="ts" strictEvents>
  import type { BaseUrl, Tree } from "@httpd-client";

  import { createEventDispatcher } from "svelte";

  import Loading from "@app/components/Loading.svelte";
  import Link from "@app/components/Link.svelte";

  import File from "./File.svelte";
  import IconSmall from "@app/components/IconSmall.svelte";

  export let baseUrl: BaseUrl;
  export let currentPath: string;
  export let fetchTree: (path: string) => Promise<Tree | undefined>;
  export let name: string;
  export let peer: string | undefined;
  export let prefix: string;
  export let projectId: string;
  export let revision: string | undefined;

  $: expanded = currentPath.indexOf(prefix) === 0;
  $: tree = expanded
    ? fetchTree(prefix).then(tree => {
        return tree;
      })
    : Promise.resolve(undefined);

  const dispatch = createEventDispatcher<{ select: string }>();
  const onSelectFile = ({ detail: path }: { detail: string }) =>
    dispatch("select", path);

  const onClick = () => {
    expanded = !expanded;

    tree = fetchTree(prefix).then(tree => {
      if (expanded) return tree;
    });
  };
</script>

<style>
  .folder {
    display: flex;
    cursor: pointer;
    padding: 0.25rem 0.875rem;
    margin: 0.25rem 0;
    user-select: none;
    line-height: 1.5rem;
    white-space: nowrap;
  }
  .folder:hover {
    background-color: var(--color-fill-ghost);
    border-radius: var(--border-radius-tiny);
  }

  .folder-name {
    margin-left: 0.25rem;
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-medium);
  }

  .container {
    padding-left: 1rem;
    margin-left: 0.5rem;
  }

  .loading {
    display: inline-block;
    padding: 0.5rem 0;
  }
  .icon-container {
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--color-fill-secondary);
    margin-right: 0.125rem;
  }
</style>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div role="button" tabindex="0" class="folder" on:click={onClick}>
  <div class="icon-container">
    {#if expanded}
      <IconSmall name="folder-open" />
    {:else}
      <IconSmall name="folder" />
    {/if}
  </div>
  <span class="folder-name">{name}</span>
</div>

{#if expanded}
  <div class="container">
    {#await tree}
      <span class="loading"><Loading noDelay small margins /></span>
    {:then tree}
      {#if tree}
        {#each tree.entries as entry (entry.path)}
          {#if entry.kind === "tree"}
            <!-- svelte:self doesn't check types, make sure to pass in all
            required props! -->
            <svelte:self
              name={entry.name}
              on:select={onSelectFile}
              prefix={`${entry.path}/`}
              {baseUrl}
              {currentPath}
              {fetchTree}
              {peer}
              {projectId}
              {revision} />
          {:else}
            <Link
              route={{
                resource: "project.source",
                project: projectId,
                node: baseUrl,
                path: entry.path,
                peer,
                revision,
              }}
              on:afterNavigate={() => onSelectFile({ detail: entry.path })}>
              <File active={entry.path === currentPath} name={entry.name} />
            </Link>
          {/if}
        {/each}
      {/if}
    {/await}
  </div>
{/if}
