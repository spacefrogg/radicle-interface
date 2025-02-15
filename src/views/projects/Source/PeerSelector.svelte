<script lang="ts">
  import type { Remote } from "@httpd-client";
  import { type Route } from "@app/lib/router";

  import { closeFocused } from "@app/components/Popover.svelte";
  import { formatNodeId } from "@app/lib/utils";

  import NodeId from "@app/components/NodeId.svelte";
  import Badge from "@app/components/Badge.svelte";
  import DropdownList from "@app/components/DropdownList.svelte";
  import DropdownListItem from "@app/components/DropdownList/DropdownListItem.svelte";
  import Popover from "@app/components/Popover.svelte";
  import IconSmall from "@app/components/IconSmall.svelte";
  import Link from "@app/components/Link.svelte";
  import Button from "@app/components/Button.svelte";
  import Avatar from "@app/components/Avatar.svelte";

  export let peers: Array<{ remote: Remote; selected: boolean; route: Route }>;

  $: selectedPeer = peers.find(p => p.selected)?.remote;

  function createTitle(p: Remote): string {
    const nodeId = formatNodeId(p.id);
    return p.delegate
      ? `${nodeId} is a delegate of this project`
      : `${nodeId} is a peer followed by this node`;
  }
</script>

<style>
  .counter {
    border-radius: var(--border-radius-tiny);
    background-color: var(--color-fill-counter);
    color: var(--color-foreground-contrast);
    padding: 0 0.25rem;
  }
</style>

<Popover
  popoverPadding="0"
  popoverPositionTop="2.5rem"
  popoverBorderRadius="var(--border-radius-small)">
  <Button
    slot="toggle"
    let:expanded
    let:toggle
    on:click={toggle}
    title="Change peer"
    disabled={!peers}>
    {#if !selectedPeer}
      <IconSmall name="delegate" />
    {/if}

    {#if selectedPeer}
      <NodeId
        nodeId={selectedPeer.id}
        alias={selectedPeer.alias}
        stylePopoverPositionLeft="-0.75rem" />
      {#if selectedPeer.delegate}
        <Badge size="tiny" variant="secondary">delegate</Badge>
      {/if}
    {:else}
      Remotes
      <div class="counter">
        {peers.length}
      </div>
    {/if}
    <IconSmall name={expanded ? "chevron-up" : "chevron-down"} />
  </Button>

  <DropdownList slot="popover" items={peers}>
    <svelte:fragment slot="item" let:item>
      <Link on:afterNavigate={() => closeFocused()} route={item.route}>
        <DropdownListItem
          selected={item.selected}
          title={createTitle(item.remote)}>
          <Avatar nodeId={item.remote.id} />
          <span style:font-family="var(--font-family-monospace)">
            {item.remote.alias || formatNodeId(item.remote.id)}
          </span>
          {#if item.remote.delegate}
            <div style:color="var(--color-fill-secondary)">
              <Badge size="tiny" variant="secondary">delegate</Badge>
            </div>
          {/if}
        </DropdownListItem>
      </Link>
    </svelte:fragment>
  </DropdownList>
</Popover>
