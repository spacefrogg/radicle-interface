<script lang="ts">
  import type { ActiveTab } from "./Header.svelte";
  import type { BaseUrl, Project } from "@httpd-client";

  import { ResponseError } from "@httpd-client/lib/fetcher";

  import { api, httpdStore } from "@app/lib/httpd";
  import { isLocal } from "@app/lib/utils";
  import { onMount } from "svelte";

  import Button from "@app/components/Button.svelte";
  import ContextHelp from "@app/views/projects/Sidebar/ContextHelp.svelte";
  import IconSmall from "@app/components/IconSmall.svelte";
  import Link from "@app/components/Link.svelte";
  import Loading from "@app/components/Loading.svelte";
  import Popover from "@app/components/Popover.svelte";

  import Help from "@app/App/Help.svelte";
  import Settings from "@app/App/Settings.svelte";

  const SIDEBAR_STATE_KEY = "sidebarState";

  export let activeTab: ActiveTab | undefined = undefined;
  export let baseUrl: BaseUrl;
  export let project: Project;

  let expanded = true;

  export function storeSidebarState(expanded: boolean): void {
    window.localStorage.setItem(
      SIDEBAR_STATE_KEY,
      expanded ? "expanded" : "collapsed",
    );
  }

  // To avoid concurrent request.
  let queryingLocalProject: boolean = true;
  let localProject: "notFound" | "found" | undefined = undefined;
  $: hideContextHelp =
    isLocal(baseUrl.hostname) && $httpdStore.state === "authenticated";
  $: loadingContextHelp =
    $httpdStore.state !== "stopped" && localProject === undefined;

  httpdStore.subscribe(async () => {
    if ($httpdStore.state !== "stopped" && !queryingLocalProject) {
      await detectLocalProject();
    }
  });

  function loadSidebarState(): boolean {
    const storedSidebarState = window.localStorage.getItem(SIDEBAR_STATE_KEY);

    if (storedSidebarState === null) {
      return true;
    } else {
      return storedSidebarState === "expanded" ? true : false;
    }
  }

  function toggleSidebar() {
    expanded = !expanded;
    storeSidebarState(expanded);
  }

  async function detectLocalProject(): Promise<void> {
    queryingLocalProject = true;
    localProject = await api.project
      .getById(project.id)
      .then<"found">(() => "found")
      .catch((error: unknown) =>
        error instanceof ResponseError && error.status === 404
          ? "notFound"
          : undefined,
      );
    queryingLocalProject = false;
  }

  onMount(async () => {
    expanded = loadSidebarState();
    await detectLocalProject();
  });
</script>

<style>
  .sidebar {
    padding: 1rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .expanded {
    width: 22.5rem;
  }
  .project-navigation {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .counter {
    border-radius: var(--border-radius-tiny);
    background-color: var(--color-fill-ghost);
    color: var(--color-foreground-dim);
    padding: 0 0.25rem;
  }
  .selected {
    background-color: var(--color-fill-counter);
    color: var(--color-foreground-contrast);
  }
  .hover {
    background-color: var(--color-fill-ghost-hover);
    color: var(--color-foreground-contrast);
  }
  .title-counter {
    display: flex;
    gap: 0.5rem;
    justify-content: space-between;
    width: 100%;
  }
  .sidebar-footer {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }
  .help-box {
    padding: 1rem;
    background-color: var(--color-background-float);
    border: 1px solid var(--color-border-hint);
    font-size: var(--font-size-small);
    border-radius: var(--border-radius-small);
  }
</style>

<div class="sidebar" class:expanded>
  {#if expanded}
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <div class="project-navigation">
        <Link
          title="Source"
          route={{
            resource: "project.source",
            project: project.id,
            node: baseUrl,
            path: "/",
          }}>
          <Button
            stylePadding="0.5rem 0.75rem"
            size="large"
            styleWidth="100%"
            styleJustifyContent={"flex-start"}
            variant={activeTab === "source" ? "gray" : "background"}>
            <IconSmall name="chevron-left-right" />
            Source
          </Button>
        </Link>
        <Link
          title={`${project.issues.open} Issues`}
          route={{
            resource: "project.issues",
            project: project.id,
            node: baseUrl,
          }}>
          <Button
            stylePadding="0.5rem 0.75rem"
            let:hover
            size="large"
            styleJustifyContent={"flex-start"}
            styleWidth="100%"
            variant={activeTab === "issues" ? "gray" : "background"}>
            <IconSmall name="issue" />
            <div class="title-counter">
              Issues
              <span
                class="counter"
                class:selected={activeTab === "issues"}
                class:hover={hover && activeTab !== "issues"}>
                {project.issues.open}
              </span>
            </div>
          </Button>
        </Link>

        <Link
          title={`${project.patches.open} Patches`}
          route={{
            resource: "project.patches",
            project: project.id,
            node: baseUrl,
          }}>
          <Button
            stylePadding="0.5rem 0.75rem"
            let:hover
            size="large"
            styleWidth="100%"
            styleJustifyContent={"flex-start"}
            variant={activeTab === "patches" ? "gray" : "background"}>
            <IconSmall name="patch" />
            <div class="title-counter">
              Patches
              <span
                class="counter"
                class:hover={hover && activeTab !== "patches"}
                class:selected={activeTab === "patches"}>
                {project.patches.open}
              </span>
            </div>
          </Button>
        </Link>
      </div>
    </div>
    <div style="display: flex; flex-direction:column; gap: 1rem;">
      {#if !hideContextHelp}
        {#if loadingContextHelp}
          <div
            style="display: flex; justify-content: center; align-items: center; height: 2rem;">
            <Loading small />
          </div>
        {:else}
          <div class="help-box">
            <ContextHelp
              {localProject}
              {baseUrl}
              projectId={project.id}
              hideLocalButton={isLocal(baseUrl.hostname)}
              disableLocalButton={$httpdStore.state !== "authenticated" ||
                localProject !== "found"} />
          </div>
        {/if}
      {/if}

      <div class="sidebar-footer" style:flex-direction="row">
        <Button
          title={"Collapse"}
          on:click={toggleSidebar}
          variant="background">
          <IconSmall name="chevron-left" />
        </Button>
        <div style:width="1.5rem" />

        <Popover popoverPositionBottom="2.5rem" popoverPositionLeft="0">
          <Button
            variant="background"
            title="Settings"
            slot="toggle"
            let:toggle
            on:click={toggle}>
            <IconSmall name="settings" />
            Settings
          </Button>

          <Settings slot="popover" />
        </Popover>
        <Popover popoverPositionBottom="2.5rem" popoverPositionLeft="0">
          <Button
            variant="background"
            title="Help"
            slot="toggle"
            let:toggle
            on:click={toggle}>
            <IconSmall name="help" />
            Help
          </Button>

          <Help slot="popover" />
        </Popover>
      </div>
    </div>
  {:else}
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <div class="project-navigation">
        <Link
          title="Source"
          route={{
            resource: "project.source",
            project: project.id,
            node: baseUrl,
            path: "/",
          }}>
          <Button
            size="large"
            stylePadding="0 0.75rem"
            variant={activeTab === "source" ? "gray" : "background"}>
            <IconSmall name="chevron-left-right" />
          </Button>
        </Link>
        <Link
          title={`${project.issues.open} Issues`}
          route={{
            resource: "project.issues",
            project: project.id,
            node: baseUrl,
          }}>
          <Button
            size="large"
            stylePadding="0 0.75rem"
            variant={activeTab === "issues" ? "gray" : "background"}>
            <IconSmall name="issue" />
          </Button>
        </Link>

        <Link
          title={`${project.patches.open} Patches`}
          route={{
            resource: "project.patches",
            project: project.id,
            node: baseUrl,
          }}>
          <Button
            size="large"
            stylePadding="0 0.75rem"
            variant={activeTab === "patches" ? "gray" : "background"}>
            <IconSmall name="patch" />
          </Button>
        </Link>
      </div>
    </div>

    <div
      class="sidebar-footer"
      style:flex-direction="column-reverse"
      style:gap="0.5rem">
      <Button
        stylePadding="0 0.75rem"
        variant="background"
        title={"Expand"}
        on:click={toggleSidebar}>
        <IconSmall name="chevron-right" />
      </Button>

      <Popover popoverPositionBottom="0" popoverPositionLeft="3rem">
        <Button
          stylePadding="0 0.75rem"
          variant="background"
          title="Settings"
          slot="toggle"
          let:toggle
          on:click={toggle}>
          <IconSmall name="settings" />
        </Button>

        <Settings slot="popover" />
      </Popover>

      <Popover popoverPositionBottom="0" popoverPositionLeft="3rem">
        <Button
          stylePadding="0 0.75rem"
          variant="background"
          title="Help"
          slot="toggle"
          let:toggle
          on:click={toggle}>
          <IconSmall name="help" />
        </Button>

        <Help slot="popover" />
      </Popover>

      {#if !hideContextHelp}
        {#if loadingContextHelp}
          <div
            style="display: flex; justify-content: center; align-items: center; height: 2rem;">
            <Loading small condensed />
          </div>
        {:else}
          <Popover popoverPositionBottom="0" popoverPositionLeft="3rem">
            <Button
              stylePadding="0 0.75rem"
              variant="background"
              title="Help"
              slot="toggle"
              let:toggle
              on:click={toggle}>
              <IconSmall name="globe" />
            </Button>

            <ContextHelp
              {localProject}
              {baseUrl}
              popover
              projectId={project.id}
              hideLocalButton={isLocal(baseUrl.hostname)}
              disableLocalButton={$httpdStore.state !== "authenticated" ||
                localProject !== "found"}
              slot="popover" />
          </Popover>
        {/if}
      {/if}
    </div>
  {/if}
</div>
