<script lang="ts">
  import Command from "@app/components/Command.svelte";
  import ExternalLink from "@app/components/ExternalLink.svelte";
  import Icon from "@app/components/Icon.svelte";
  import Modal from "@app/components/Modal.svelte";

  export let title: string;
  export let subtitle: string[];
  // This is more explicit than the standard error type.
  export let error: { message: string; stack?: string };
</script>

<Modal {title}>
  <Icon name="alert" size="48" slot="icon" />

  <div slot="subtitle">
    {@html subtitle.join("<br />")}

    <br />
    <br />
    If you need help resolving this issue, copy the error message
    <br />
    below and send it to us on
    <ExternalLink href="https://radicle.zulipchat.com">
      radicle.zulipchat.com
    </ExternalLink>
  </div>

  <div slot="body">
    <div style:max-width="28rem">
      <Command command={JSON.stringify(error)} fullWidth showPrompt={false} />
    </div>
  </div>
</Modal>
