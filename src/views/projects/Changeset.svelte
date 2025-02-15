<script lang="ts">
  import type {
    BaseUrl,
    CommitBlob,
    Diff,
    DiffContent,
    DiffFile,
  } from "@httpd-client";

  import FileDiff from "@app/views/projects/Changeset/FileDiff.svelte";
  import FileLocationChange from "@app/views/projects/Changeset/FileLocationChange.svelte";
  import Observer, { intersection } from "@app/components/Observer.svelte";
  import IconButton from "@app/components/IconButton.svelte";

  export let diff: Diff;
  export let files: Record<string, CommitBlob>;
  export let baseUrl: BaseUrl;
  export let projectId: string;
  export let revision: string;

  let expanded = true;

  function pluralize(singular: string, count: number): string {
    return count === 1 ? singular : `${singular}s`;
  }

  const diffDescription = ({
    modified,
    added,
    deleted,
    moved,
    copied,
  }: Diff): string => {
    const s = [];

    if (modified.length) {
      s.push(
        `${modified.length} ${pluralize("file", modified.length)} changed`,
      );
    }
    if (added.length) {
      s.push(`${added.length} ${pluralize("file", added.length)} added`);
    }
    if (deleted.length) {
      s.push(`${deleted.length} ${pluralize("file", deleted.length)} deleted`);
    }
    if (copied.length) {
      s.push(`${copied.length} ${pluralize("file", copied.length)} copied`);
    }
    if (moved.length) {
      s.push(`${moved.length} ${pluralize("file", moved.length)} moved`);
    }
    return s.join(", ");
  };

  // Since libgit2 optimizes around not loading the content, when no content callbacks are configured,
  // and we don't want to loop over all diffs in radicle-surf to get a correct answer.
  // We assume that a `blobExecutable` file with no hunks is a binary file.
  function getFileType(diff: DiffContent, file: DiffFile): DiffContent["type"] {
    return file.mode === "blobExecutable" && diff.hunks.length === 0
      ? "binary"
      : diff.type;
  }
</script>

<style>
  .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 1rem;
  }
  .additions {
    color: var(--color-foreground-success);
  }
  .deletions {
    color: var(--color-foreground-red);
  }
  .diff-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .summary {
    font-size: var(--font-size-small);
  }
</style>

<div class="header">
  <div class="summary">
    <span>{diffDescription(diff)}</span>
    with
    <span class:additions={diff.stats.insertions > 0}>
      {diff.stats.insertions}
      {pluralize("insertion", diff.stats.insertions)}
    </span>
    and
    <span class:deletions={diff.stats.deletions > 0}>
      {diff.stats.deletions}
      {pluralize("deletion", diff.stats.deletions)}
    </span>
  </div>
  {#if diff.stats.filesChanged > 1}
    <div style:display="flex" style:gap="1rem">
      <IconButton on:click={() => (expanded = !expanded)}>
        {#if expanded === true}
          Collapse all
        {:else}
          Expand all
        {/if}
      </IconButton>
    </div>
  {/if}
</div>

<div class="diff-list">
  <Observer let:filesVisibility let:observer>
    {#each diff.added as file}
      <div use:intersection={observer} id={"observer:" + file.path}>
        <FileDiff
          {projectId}
          {baseUrl}
          {revision}
          {expanded}
          visible={filesVisibility.has(file.path)}
          content={files[file.new.oid]?.content}
          filePath={file.path}
          fileDiff={{ ...file.diff, type: getFileType(file.diff, file.new) }}
          headerBadgeCaption="added" />
      </div>
    {/each}
    {#each diff.deleted as file}
      <div use:intersection={observer} id={"observer:" + file.path}>
        <FileDiff
          {projectId}
          {baseUrl}
          {revision}
          {expanded}
          visible={filesVisibility.has(file.path)}
          oldContent={files[file.old.oid]?.content}
          filePath={file.path}
          fileDiff={{ ...file.diff, type: getFileType(file.diff, file.old) }}
          headerBadgeCaption="deleted" />
      </div>
    {/each}
    {#each diff.modified as file}
      <div use:intersection={observer} id={"observer:" + file.path}>
        <FileDiff
          {projectId}
          {baseUrl}
          {revision}
          {expanded}
          visible={filesVisibility.has(file.path)}
          oldContent={files[file.old.oid]?.content}
          content={files[file.new.oid]?.content}
          filePath={file.path}
          fileDiff={{ ...file.diff, type: getFileType(file.diff, file.new) }} />
      </div>
    {/each}
    {#each diff.moved as file}
      {#if "diff" in file}
        <div use:intersection={observer} id={"observer:" + file.newPath}>
          <FileDiff
            {projectId}
            {baseUrl}
            {revision}
            {expanded}
            content={files[file.new.oid]?.content}
            oldContent={files[file.old.oid]?.content}
            visible={filesVisibility.has(file.newPath)}
            filePath={file.newPath}
            oldFilePath={file.oldPath}
            fileDiff={{ ...file.diff, type: getFileType(file.diff, file.new) }}
            headerBadgeCaption="moved" />
        </div>
      {:else}
        <FileLocationChange
          {projectId}
          {baseUrl}
          {revision}
          newPath={file.newPath}
          oldPath={file.oldPath}
          mode="moved" />
      {/if}
    {/each}
    {#each diff.copied as file}
      {#if "diff" in file}
        <div use:intersection={observer} id={"observer:" + file.newPath}>
          <FileDiff
            {projectId}
            {baseUrl}
            {revision}
            {expanded}
            content={files[file.new.oid]?.content}
            oldContent={files[file.old.oid]?.content}
            visible={filesVisibility.has(file.newPath)}
            filePath={file.newPath}
            oldFilePath={file.oldPath}
            fileDiff={{ ...file.diff, type: getFileType(file.diff, file.new) }}
            headerBadgeCaption="copied" />
        </div>
      {:else}
        <FileLocationChange
          {projectId}
          {baseUrl}
          {revision}
          newPath={file.newPath}
          oldPath={file.oldPath}
          mode="copied" />
      {/if}
    {/each}
  </Observer>
</div>
