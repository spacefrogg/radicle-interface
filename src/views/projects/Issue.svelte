<script lang="ts">
  import type {
    BaseUrl,
    Issue,
    IssueState,
    Embed,
    Project,
  } from "@httpd-client";
  import type { Session } from "@app/lib/httpd";

  import capitalize from "lodash/capitalize";
  import isEqual from "lodash/isEqual";
  import uniqBy from "lodash/uniqBy";
  import partial from "lodash/partial";

  import * as modal from "@app/lib/modal";
  import * as role from "@app/lib/roles";
  import * as router from "@app/lib/router";
  import * as utils from "@app/lib/utils";
  import { HttpdClient } from "@httpd-client";
  import { closeFocused } from "@app/components/Popover.svelte";
  import { groupReactions } from "@app/lib/reactions";
  import { httpdStore } from "@app/lib/httpd";
  import { parseEmbedIntoMap } from "@app/lib/file";

  import AssigneeInput from "@app/views/projects/Cob/AssigneeInput.svelte";
  import Badge from "@app/components/Badge.svelte";
  import CobHeader from "@app/views/projects/Cob/CobHeader.svelte";
  import CobStateButton from "@app/views/projects/Cob/CobStateButton.svelte";
  import CommentToggleInput from "@app/components/CommentToggleInput.svelte";
  import Embeds from "@app/views/projects/Cob/Embeds.svelte";
  import ErrorModal from "@app/modals/ErrorModal.svelte";
  import ExtendedTextarea from "@app/components/ExtendedTextarea.svelte";
  import IconButton from "@app/components/IconButton.svelte";
  import IconSmall from "@app/components/IconSmall.svelte";
  import InlineMarkdown from "@app/components/InlineMarkdown.svelte";
  import LabelInput from "./Cob/LabelInput.svelte";
  import Layout from "./Layout.svelte";
  import Markdown from "@app/components/Markdown.svelte";
  import NodeId from "@app/components/NodeId.svelte";
  import ReactionSelector from "@app/components/ReactionSelector.svelte";
  import Reactions from "@app/components/Reactions.svelte";
  import TextInput from "@app/components/TextInput.svelte";
  import ThreadComponent from "@app/components/Thread.svelte";

  export let baseUrl: BaseUrl;
  export let issue: Issue;
  export let project: Project;
  export let rawPath: (commit?: string) => string;

  const api = new HttpdClient(baseUrl);

  const items: [string, IssueState][] = [
    ["Reopen issue", { status: "open" }],
    ["Close issue as solved", { status: "closed", reason: "solved" }],
    ["Close issue as other", { status: "closed", reason: "other" }],
  ];

  async function createReply(
    sessionId: string,
    replyTo: string,
    body: string,
    embeds: Embed[],
  ) {
    try {
      await api.project.updateIssue(
        project.id,
        issue.id,
        { type: "comment", body, embeds, replyTo },
        sessionId,
      );
    } catch (error) {
      if (error instanceof Error) {
        modal.show({
          component: ErrorModal,
          props: {
            title: "Comment reply creation failed",
            subtitle: [
              "There was an error while creating this reply.",
              "Check your radicle-httpd logs for details.",
            ],
            error: {
              message: error.message,
              stack: error.stack,
            },
          },
        });
      }
    } finally {
      await refreshIssue();
    }
  }

  async function createComment(
    sessionId: string,
    body: string,
    embeds: Embed[],
  ) {
    try {
      await api.project.updateIssue(
        project.id,
        issue.id,
        { type: "comment", body, embeds, replyTo: issue.id },
        sessionId,
      );
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        modal.show({
          component: ErrorModal,
          props: {
            title: "Comment creation failed",
            subtitle: [
              "There was an error while creating this comment.",
              "Check your radicle-httpd logs for details.",
            ],
            error: {
              message: error.message,
              stack: error.stack,
            },
          },
        });
      }
    } finally {
      await refreshIssue();
    }
  }

  async function editComment(
    sessionId: string,
    id: string,
    body: string,
    embeds: Embed[],
  ) {
    try {
      await api.project.updateIssue(
        project.id,
        issue.id,
        { type: "comment.edit", id, body, embeds },
        sessionId,
      );
    } catch (error) {
      if (error instanceof Error) {
        modal.show({
          component: ErrorModal,
          props: {
            title: "Issue comment editing failed",
            subtitle: [
              "There was an error while updating the issue.",
              "Check your radicle-httpd logs for details.",
            ],
            error: {
              message: error.message,
              stack: error.stack,
            },
          },
        });
      }
    } finally {
      await refreshIssue();
    }
  }

  async function handleReaction(
    session: Session,
    commentId: string,
    nids: string[],
    reaction: string,
  ) {
    try {
      await api.project.updateIssue(
        project.id,
        issue.id,
        {
          type: "comment.react",
          id: commentId,
          reaction,
          active: nids.includes(session.publicKey) ? false : true,
        },
        session.id,
      );
    } catch (error) {
      if (error instanceof Error) {
        modal.show({
          component: ErrorModal,
          props: {
            title: "Editing reactions failed",
            subtitle: [
              "There was an error while updating the issue.",
              "Check your radicle-httpd logs for details.",
            ],
            error: {
              message: error.message,
              stack: error.stack,
            },
          },
        });
      }
    } finally {
      await refreshIssue();
    }
  }

  async function editIssue(
    sessionId: string,
    title: string,
    id: string,
    body: string,
    embeds: Embed[],
  ) {
    try {
      await api.project.updateIssue(
        project.id,
        issue.id,
        { type: "edit", title },
        sessionId,
      );
      await api.project.updateIssue(
        project.id,
        issue.id,
        { type: "comment.edit", id, body, embeds },
        sessionId,
      );
    } catch (error) {
      if (error instanceof Error) {
        modal.show({
          component: ErrorModal,
          props: {
            title: "Issue editing failed",
            subtitle: [
              "There was an error while updating the issue.",
              "Check your radicle-httpd logs for details.",
            ],
            error: {
              message: error.message,
              stack: error.stack,
            },
          },
        });
      }
    } finally {
      await refreshIssue();
    }
  }

  async function saveLabels(sessionId: string, labels: string[]) {
    try {
      await api.project.updateIssue(
        project.id,
        issue.id,
        { type: "label", labels },
        sessionId,
      );
    } catch (error) {
      if (error instanceof Error) {
        modal.show({
          component: ErrorModal,
          props: {
            title: "Issue labels editing failed",
            subtitle: [
              "There was an error while updating the issue.",
              "Check your radicle-httpd logs for details.",
            ],
            error: {
              message: error.message,
              stack: error.stack,
            },
          },
        });
      }
    } finally {
      await refreshIssue();
    }
  }

  async function saveAssignees(sessionId: string, assignees: string[]) {
    try {
      await api.project.updateIssue(
        project.id,
        issue.id,
        { type: "assign", assignees },
        sessionId,
      );
    } catch (error) {
      if (error instanceof Error) {
        modal.show({
          component: ErrorModal,
          props: {
            title: "Issue assignees editing failed",
            subtitle: [
              "There was an error while updating the issue.",
              "Check your radicle-httpd logs for details.",
            ],
            error: {
              message: error.message,
              stack: error.stack,
            },
          },
        });
      }
    } finally {
      await refreshIssue();
    }
  }

  async function saveStatus(sessionId: string, state: IssueState) {
    try {
      await api.project.updateIssue(
        project.id,
        issue.id,
        { type: "lifecycle", state },
        sessionId,
      );
    } catch (error) {
      if (error instanceof Error) {
        modal.show({
          component: ErrorModal,
          props: {
            title: "Issue status editing failed",
            subtitle: [
              "There was an error while updating the issue.",
              "Check your radicle-httpd logs for details.",
            ],
            error: {
              message: error.message,
              stack: error.stack,
            },
          },
        });
      }
    } finally {
      void router.push({
        resource: "project.issue",
        project: project.id,
        node: baseUrl,
        issue: issue.id,
      });
    }
  }

  // Refreshes the given issue by fetching it from the server.
  // If the fetch fails, the given issue is returned.
  async function refreshIssue() {
    try {
      issue = await api.project.getIssueById(project.id, issue.id);
    } catch (error) {
      if (error instanceof Error) {
        modal.show({
          component: ErrorModal,
          props: {
            title: "Unable to fetch issue",
            subtitle: [
              "There was an error while refreshing this issue.",
              "Check your radicle-httpd logs for details.",
            ],
            error: {
              message: error.message,
              stack: error.stack,
            },
          },
        });
      }
    }
  }

  $: uniqueEmbeds = uniqBy(
    issue.discussion.flatMap(comment => comment.embeds),
    "content",
  );
  $: selectedItem = issue.state.status === "closed" ? items[0] : items[1];
  $: threads = issue.discussion
    .filter(
      comment =>
        (comment.id !== issue.discussion[0].id && !comment.replyTo) ||
        comment.replyTo === issue.discussion[0].id,
    )
    .map(thread => {
      return {
        root: thread,
        replies: issue.discussion
          .filter(comment => comment.replyTo === thread.id)
          .sort((a, b) => a.timestamp - b.timestamp),
      };
    }, []);
  $: session =
    $httpdStore.state === "authenticated" && utils.isLocal(baseUrl.hostname)
      ? $httpdStore.session
      : undefined;
  $: lastDescriptionEdit =
    issue.discussion[0].edits.length > 1
      ? issue.discussion[0].edits.pop()
      : undefined;

  type State = "read" | "edit" | "submit";

  let assigneeState: State = "read";
  let labelState: State = "read";
  let issueState: State = "read";
</script>

<style>
  .issue {
    display: flex;
    flex: 1;
    min-height: 100%;
  }
  .main {
    display: flex;
    flex: 1;
    flex-direction: column;
    background-color: var(--color-background-float);
  }
  .bottom {
    padding: 0 1rem 1rem 1rem;
    background-color: var(--color-background-default);
    height: 100%;
  }
  .connector {
    width: 1px;
    height: 1.5rem;
    margin-left: 1rem;
    background-color: var(--color-fill-separator);
  }
  .metadata {
    display: flex;
    flex-direction: column;
    font-size: var(--font-size-small);
    padding: 1rem;
    border-left: 1px solid var(--color-border-hint);
    gap: 1.5rem;
    width: 20rem;
  }

  .threads {
    display: flex;
    flex-direction: column;
  }

  .author {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 0.5rem;
  }
  .author-metadata {
    color: var(--color-fill-gray);
    font-size: var(--font-size-small);
  }
  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--font-size-large);
    height: 2.5rem;
  }
  .reactions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-left: -0.25rem;
  }

  @media (max-width: 720px) {
    .issue {
      display: block;
    }
  }
</style>

<Layout {baseUrl} {project} activeTab="issues">
  <div class="issue">
    <div class="main">
      <CobHeader>
        <svelte:fragment slot="title">
          {#if issueState !== "read"}
            <TextInput
              placeholder="Title"
              bind:value={issue.title}
              showKeyHint={false} />
          {:else if !issue.title}
            <span class="txt-missing">No title</span>
          {:else}
            <div class="title">
              <InlineMarkdown fontSize="large" content={issue.title} />
            </div>
          {/if}
          {#if session && role.isDelegateOrAuthor(session.publicKey, project.delegates, issue.author.id) && issueState === "read"}
            <IconButton
              title="edit issue"
              on:click={() => (issueState = "edit")}>
              <IconSmall name={"edit"} />
            </IconButton>
          {/if}
        </svelte:fragment>
        <svelte:fragment slot="state">
          {#if issue.state.status === "open"}
            <Badge size="tiny" variant="positive">
              <IconSmall name="issue" />
              {capitalize(issue.state.status)}
            </Badge>
          {:else}
            <Badge size="tiny" variant="negative">
              <IconSmall name="issue" />
              {capitalize(issue.state.status)} as
              {issue.state.reason}
            </Badge>
          {/if}
        </svelte:fragment>
        <div slot="description">
          {#if issueState !== "read"}
            <ExtendedTextarea
              rawPath={rawPath(project.head)}
              enableAttachments
              embeds={parseEmbedIntoMap(issue.discussion[0].embeds)}
              body={issue.discussion[0].body}
              submitCaption="Save"
              submitInProgress={issueState === "submit"}
              placeholder="Leave a description"
              on:close={() => {
                issueState = "read";
                void refreshIssue();
              }}
              on:submit={async ({ detail: { comment, embeds } }) => {
                if (session) {
                  try {
                    issueState = "submit";
                    await editIssue(
                      session.id,
                      issue.title,
                      issue.id,
                      comment,
                      Array.from(embeds.values()),
                    );
                  } finally {
                    issueState = "read";
                  }
                }
              }} />
          {:else}
            <Markdown
              content={issue.discussion[0].body}
              rawPath={rawPath(project.head)} />
          {/if}
          <div class="reactions">
            {#if session}
              <ReactionSelector
                reactions={groupReactions(issue.discussion[0].reactions)}
                on:select={async ({ detail: { nids, reaction } }) => {
                  try {
                    if (session) {
                      await handleReaction(session, issue.id, nids, reaction);
                    }
                  } finally {
                    closeFocused();
                  }
                }} />
            {/if}
            {#if issue.discussion[0].reactions.length > 0}
              <Reactions
                reactions={groupReactions(issue.discussion[0].reactions)}
                handleReaction={session &&
                  partial(handleReaction, session, issue.id)} />
            {/if}
          </div>
        </div>
        <div class="author" slot="author">
          <NodeId nodeId={issue.author.id} alias={issue.author.alias} />
          opened
          <span class="global-oid">{utils.formatObjectId(issue.id)}</span>
          {utils.formatTimestamp(issue.discussion[0].timestamp)}
          {#if lastDescriptionEdit}
            <div class="author-metadata">•</div>
            <div
              class="author-metadata"
              title={utils.formatEditedCaption(lastDescriptionEdit)}>
              edited
            </div>
          {/if}
        </div>
      </CobHeader>
      <div class="bottom">
        {#if threads.length > 0}
          <div class="connector" />
          <div class="threads">
            {#each threads as thread (thread.root.id)}
              <ThreadComponent
                enableAttachments
                {thread}
                rawPath={rawPath(project.head)}
                canEditComment={partial(
                  role.isDelegateOrAuthor,
                  session?.publicKey,
                  project.delegates,
                )}
                editComment={session && partial(editComment, session.id)}
                createReply={session && partial(createReply, session.id)}
                handleReaction={session && partial(handleReaction, session)} />
              <div class="connector" />
            {/each}
          </div>
        {/if}
        {#if session}
          {#if threads.length === 0}
            <div class="connector" />{/if}
          <CommentToggleInput
            rawPath={rawPath(project.head)}
            placeholder="Leave your comment"
            enableAttachments
            submit={partial(createComment, session.id)} />
          <div
            style="display:flex; flex-direction: column; align-items: flex-start;">
            {#if role.isDelegateOrAuthor(session.publicKey, project.delegates, issue.author.id)}
              <div class="connector" />
              <CobStateButton
                items={items.filter(
                  ([, state]) => !isEqual(state, issue.state),
                )}
                {selectedItem}
                state={issue.state}
                save={partial(saveStatus, session.id)} />
            {/if}
          </div>
        {/if}
      </div>
    </div>
    <div class="metadata global-hide-on-mobile">
      <AssigneeInput
        locallyAuthenticated={Boolean(
          role.isDelegate(session?.publicKey, project.delegates),
        )}
        assignees={issue.assignees}
        submitInProgress={assigneeState === "submit"}
        on:save={async ({ detail: newAssignees }) => {
          if (session) {
            assigneeState = "submit";
            try {
              await saveAssignees(session.id, newAssignees);
            } finally {
              assigneeState = "read";
            }
          }
          await refreshIssue();
        }} />
      <LabelInput
        locallyAuthenticated={Boolean(
          role.isDelegate(session?.publicKey, project.delegates),
        )}
        labels={issue.labels}
        submitInProgress={labelState === "submit"}
        on:save={async ({ detail: newLabels }) => {
          if (session) {
            labelState = "submit";
            try {
              await saveLabels(session.id, newLabels);
            } finally {
              labelState = "read";
            }
          }
          await refreshIssue();
        }} />
      <Embeds embeds={uniqueEmbeds} />
    </div>
  </div>
</Layout>
