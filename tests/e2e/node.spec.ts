import {
  aliceMainHead,
  expect,
  shortNodeRemote,
  sourceBrowsingRid,
  test,
} from "@tests/support/fixtures.js";
import { createProject } from "@tests/support/project";

test("node metadata", async ({ page, peerManager }) => {
  const peer = await peerManager.createPeer({
    name: "node-metadata-peer",
  });
  await peer.startHttpd();
  await peer.startNode({
    policy: "allow",
    scope: "all",
    alias: "palm",
    externalAddresses: ["seed.radicle.test:8123"],
  });

  await page.goto(peer.uiUrl());

  await expect(page.getByRole("link", { name: "Local Node" })).toBeVisible();
  await expect(
    page.getByText(`${shortNodeRemote}@seed.radicle.test:8123`),
  ).toBeVisible();
  await expect(page.getByText("0.1.0-")).toBeVisible();
  await peer.stopHttpd();
  await peer.stopNode();
});

test("node projects", async ({ page }) => {
  await page.goto("/nodes/radicle.local");
  const project = page
    .locator(".project", { hasText: "source-browsing" })
    .nth(0);

  // Project metadata.
  {
    await expect(project.getByText("source-browsing")).toBeVisible();
    await expect(
      project.getByText("Git repository for source browsing tests"),
    ).toBeVisible();
    await expect(project.getByText(aliceMainHead)).toBeVisible();
  }

  // Show project ID on hover.
  {
    await expect(project.getByText(sourceBrowsingRid)).not.toBeVisible();
    await project.hover();
    await expect(project.getByText(sourceBrowsingRid)).toBeVisible();
  }
});

test("seeding projects", async ({ page, authenticatedPeer }) => {
  const { rid } = await createProject(authenticatedPeer, {
    name: "seedProject",
  });

  await page.goto(authenticatedPeer.ridUrl(rid));
  await page.getByRole("button", { name: "Seeding" }).click();
  await expect(page.getByRole("button", { name: "Seed" })).toBeVisible();

  await page.getByRole("button", { name: "Seed" }).click();
  await expect(page.getByRole("button", { name: "Seeding" })).toBeVisible();
});
