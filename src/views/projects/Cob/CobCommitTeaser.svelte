<script lang="ts">
  import type { BaseUrl, CommitHeader } from "@httpd-client";

  import { formatCommit, twemoji } from "@app/lib/utils";

  import CommitAuthorship from "../Commit/CommitAuthorship.svelte";
  import ExpandButton from "@app/components/ExpandButton.svelte";
  import IconButton from "@app/components/IconButton.svelte";
  import IconSmall from "@app/components/IconSmall.svelte";
  import InlineMarkdown from "@app/components/InlineMarkdown.svelte";
  import Link from "@app/components/Link.svelte";

  export let baseUrl: BaseUrl;
  export let commit: CommitHeader;
  export let projectId: string;

  let commitMessageVisible = false;
</script>

<style>
  .teaser {
    display: flex;
    font-size: var(--font-size-small);
  }
  .message {
    align-items: center;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .left {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .right {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-left: auto;
  }
  .summary:hover {
    text-decoration: underline;
  }
  .commit-message {
    margin: 0.5rem 0;
    font-size: var(--font-size-tiny);
  }
</style>

<div class="teaser" aria-label="commit-teaser">
  <div class="left">
    <div class="message">
      <Link
        route={{
          resource: "project.commit",
          project: projectId,
          node: baseUrl,
          commit: commit.id,
        }}>
        <div class="summary" use:twemoji>
          <InlineMarkdown fontSize="small" content={commit.summary} />
        </div>
      </Link>
      {#if commit.description}
        <ExpandButton
          variant="inline"
          on:toggle={() => {
            commitMessageVisible = !commitMessageVisible;
          }} />
      {/if}
    </div>
    {#if commitMessageVisible}
      <div class="commit-message" style:margin="0.5rem 0">
        <pre>{commit.description.trim()}</pre>
      </div>
    {/if}
  </div>
  <div class="right">
    <div style:display="flex" style:gap="1rem" style:height="1.5rem">
      <div style:margin-bottom="1rem">
        <CommitAuthorship header={commit}>
          <span class="global-commit">
            {formatCommit(commit.id)}
          </span>
        </CommitAuthorship>
      </div>
      <IconButton title="Browse the repository at this point in the history">
        <Link
          route={{
            resource: "project.source",
            project: projectId,
            node: baseUrl,
            revision: commit.id,
          }}>
          <IconSmall name="chevron-left-right" />
        </Link>
      </IconButton>
    </div>
  </div>
</div>
