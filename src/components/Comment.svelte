<script lang="ts" strictEvents>
  import type { Comment, Embed } from "@httpd-client";
  import type { GroupedReactions } from "@app/lib/reactions";

  import { tick } from "svelte";

  import { closeFocused } from "./Popover.svelte";
  import * as utils from "@app/lib/utils";

  import ExtendedTextarea from "@app/components/ExtendedTextarea.svelte";
  import IconButton from "@app/components/IconButton.svelte";
  import IconSmall from "@app/components/IconSmall.svelte";
  import Markdown from "@app/components/Markdown.svelte";
  import NodeId from "@app/components/NodeId.svelte";
  import ReactionSelector from "@app/components/ReactionSelector.svelte";
  import Reactions from "@app/components/Reactions.svelte";

  export let id: string | undefined = undefined;
  export let authorId: string;
  export let authorAlias: string | undefined = undefined;
  export let body: string;
  export let enableAttachments: boolean = false;
  export let reactions: GroupedReactions | undefined = undefined;
  export let embeds: Map<string, Embed> | undefined = undefined;
  export let caption = "commented";
  export let rawPath: string;
  export let timestamp: number;
  export let isReply: boolean = false;
  export let isLastReply: boolean = false;
  export let lastEdit: Comment["edits"][0] | undefined = undefined;

  let state: "read" | "edit" | "submit" = "read";

  export let editComment:
    | ((body: string, embeds: Embed[]) => Promise<void>)
    | undefined = undefined;
  export let handleReaction:
    | ((nids: string[], reaction: string) => Promise<void>)
    | undefined = undefined;
</script>

<style>
  .card {
    display: flex;
    flex-direction: column;
    padding: 1rem 0;
    gap: 0.5rem;
  }
  .card:not(:last-child) {
    box-shadow: -1px 0 0 0 var(--color-fill-separator);
  }
  .card-header {
    display: flex;
    align-items: center;
    padding: 0 0.5rem;
    height: 1.5rem;
    gap: 0.5rem;
    font-size: var(--font-size-small);
  }
  .reply-dot {
    border-radius: var(--border-radius-round);
    width: 4px;
    height: 4px;
    position: absolute;
    top: 10px;
    left: -2.5px;
    background-color: var(--color-fill-separator);
  }
  .icon {
    color: var(--color-fill-gray);
  }
  .card-metadata {
    color: var(--color-fill-gray);
    font-size: var(--font-size-small);
  }
  .header-right {
    display: flex;
    margin-left: auto;
    gap: 0.5rem;
  }
  .card-body {
    word-wrap: break-word;
    font-size: var(--font-size-small);
    padding-left: 2rem;
    padding-right: 2rem;
  }
  .actions {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    padding-left: 2rem;
    margin-left: -0.25rem;
  }
  .edit-buttons {
    display: flex;
    gap: 0.25rem;
  }
  .reply .card-body,
  .reply .actions {
    padding-left: 1rem;
  }
  .connector-line {
    width: 1px;
    height: 28px;
    position: absolute;
    top: -16px;
    left: -1px;
    background-color: var(--color-fill-separator);
  }
</style>

<div class="card" {id} class:reply={isReply}>
  <div style:position="relative">
    {#if isReply}
      <div class="reply-dot" />
    {/if}
    {#if isLastReply}
      <div class="connector-line" />
    {/if}
    <div class="card-header">
      <div class="icon">
        <slot name="icon" />
      </div>
      <NodeId nodeId={authorId} alias={authorAlias} />
      <slot name="caption">{caption}</slot>
      <span class="card-metadata">
        {utils.formatTimestamp(timestamp)}
      </span>
      {#if lastEdit}
        <div class="card-metadata">•</div>
        <div class="card-metadata" title={utils.formatEditedCaption(lastEdit)}>
          edited
        </div>
      {/if}
      <div class="header-right">
        {#if id && editComment && state === "read"}
          <div class="edit-buttons">
            <IconButton title="edit comment" on:click={() => (state = "edit")}>
              <IconSmall name={"edit"} />
            </IconButton>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="card-body">
    {#if editComment && state !== "read"}
      {@const editComment_ = editComment}
      <ExtendedTextarea
        {rawPath}
        {body}
        {embeds}
        {enableAttachments}
        submitInProgress={state === "submit"}
        submitCaption="Save"
        placeholder="Leave your comment"
        on:submit={async ({ detail: { comment, embeds } }) => {
          state = "submit";
          try {
            await editComment_(comment, Array.from(embeds.values()));
          } finally {
            state = "read";
          }
        }}
        on:close={async () => {
          body = body;
          await tick();
          state = "read";
        }} />
    {:else if body.trim() === ""}
      <span class="txt-missing">No description</span>
    {:else}
      <Markdown {rawPath} content={body} />
    {/if}
  </div>
  {#if (id && handleReaction) || (id && reactions && reactions.size > 0)}
    <div class="actions">
      {#if id && handleReaction}
        {@const handleReaction_ = handleReaction}
        <ReactionSelector
          {reactions}
          on:select={async ({ detail: { nids, reaction } }) => {
            try {
              await handleReaction_(nids, reaction);
            } finally {
              closeFocused();
            }
          }} />
      {/if}
      {#if id && reactions && reactions.size > 0}
        <Reactions {handleReaction} {reactions} />
      {/if}
    </div>
  {/if}
</div>
