<script lang="ts">
  import type { BaseUrl, Issue, IssueState, Project } from "@httpd-client";

  import { HttpdClient } from "@httpd-client";
  import { ISSUES_PER_PAGE } from "./router";
  import { closeFocused } from "@app/components/Popover.svelte";
  import { httpdStore } from "@app/lib/httpd";
  import { isLocal } from "@app/lib/utils";
  import capitalize from "lodash/capitalize";

  import Button from "@app/components/Button.svelte";
  import DropdownList from "@app/components/DropdownList.svelte";
  import DropdownListItem from "@app/components/DropdownList/DropdownListItem.svelte";
  import ErrorMessage from "@app/components/ErrorMessage.svelte";
  import IconSmall from "@app/components/IconSmall.svelte";
  import IssueTeaser from "@app/views/projects/Issue/IssueTeaser.svelte";
  import Layout from "./Layout.svelte";
  import Link from "@app/components/Link.svelte";
  import List from "@app/components/List.svelte";
  import Loading from "@app/components/Loading.svelte";
  import Placeholder from "@app/components/Placeholder.svelte";
  import Popover from "@app/components/Popover.svelte";

  export let baseUrl: BaseUrl;
  export let issues: Issue[];
  export let project: Project;
  export let state: IssueState["status"];

  let loading = false;
  let page = 0;
  let error: any;
  let allIssues: Issue[];

  $: {
    allIssues = issues;
    page = 0;
  }

  const api = new HttpdClient(baseUrl);

  async function loadIssues(state: IssueState["status"]): Promise<void> {
    loading = true;
    page += 1;
    try {
      const response = await api.project.getAllIssues(project.id, {
        state,
        page,
        perPage: ISSUES_PER_PAGE,
      });
      allIssues = [...allIssues, ...response];
    } catch (e) {
      error = e;
    } finally {
      loading = false;
    }
  }

  const stateOptions: IssueState["status"][] = ["open", "closed"];
  const stateColor: Record<IssueState["status"], string> = {
    open: "var(--color-fill-success)",
    closed: "var(--color-foreground-red)",
  };

  $: showMoreButton =
    !loading && !error && allIssues.length < project.issues[state];
</script>

<style>
  .more {
    margin: 2rem 0;
    min-height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .dropdown-button-counter {
    border-radius: var(--border-radius-tiny);
    background-color: var(--color-fill-counter);
    color: var(--color-foreground-contrast);
    padding: 0 0.25rem;
  }
  .dropdown-list-counter {
    border-radius: var(--border-radius-tiny);
    background-color: var(--color-fill-ghost);
    color: var(--color-foreground-dim);
    padding: 0 0.25rem;
  }
  .selected {
    background-color: var(--color-fill-counter);
    color: var(--color-foreground-dim);
  }
</style>

<Layout {baseUrl} {project} activeTab="issues">
  <div slot="header" style:display="flex" style:padding="1rem">
    <Popover
      popoverPadding="0"
      popoverPositionTop="2.5rem"
      popoverBorderRadius="var(--border-radius-small)">
      <Button
        let:expanded
        slot="toggle"
        let:toggle
        on:click={toggle}
        ariaLabel="filter-dropdown"
        title="Filter issues by state">
        <div style:color={stateColor[state]}>
          <IconSmall name="issue" />
        </div>
        {capitalize(state)}
        <div class="dropdown-button-counter">
          {project.issues[state]}
        </div>
        <IconSmall name={expanded ? "chevron-up" : "chevron-down"} />
      </Button>

      <DropdownList slot="popover" items={stateOptions}>
        <Link
          on:afterNavigate={() => closeFocused()}
          slot="item"
          let:item
          route={{
            resource: "project.issues",
            project: project.id,
            node: baseUrl,
            state: item,
          }}>
          <DropdownListItem selected={item === state}>
            <div style:color={stateColor[item]}>
              <IconSmall name="issue" />
            </div>
            <div
              style="display: flex; gap: 1rem;justify-content: space-between; width: 100%;">
              {capitalize(item)}
              <div
                class="dropdown-list-counter"
                class:selected={item === state}>
                {project.issues[item]}
              </div>
            </div>
          </DropdownListItem>
        </Link>
      </DropdownList>
    </Popover>

    {#if $httpdStore.state === "authenticated" && isLocal(baseUrl.hostname)}
      <div style="margin-left: auto;">
        <Link
          route={{
            resource: "project.newIssue",
            project: project.id,
            node: baseUrl,
          }}>
          <Button variant="secondary">
            <IconSmall name="plus" />
            New Issue
          </Button>
        </Link>
      </div>
    {/if}
  </div>

  <List items={allIssues}>
    <IssueTeaser
      slot="item"
      let:item
      {baseUrl}
      projectId={project.id}
      issue={item} />
  </List>

  {#if error}
    <ErrorMessage message="Couldn't load issues" {error} />
  {/if}

  {#if project.issues[state] === 0}
    <div
      style="height: calc(100% - 4rem); display: flex; align-items: center; justify-content: center;">
      <Placeholder iconName="no-issues" caption={`No ${state} issues`} />
    </div>
  {/if}

  {#if loading || showMoreButton}
    <div class="more">
      {#if loading}
        <Loading noDelay small={page !== 0} center />
      {/if}

      {#if showMoreButton}
        <Button
          size="large"
          variant="outline"
          on:click={() => loadIssues(state)}>
          More
        </Button>
      {/if}
    </div>
  {/if}
</Layout>
