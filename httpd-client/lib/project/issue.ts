import type { Comment, Embed } from "./comment.js";
import type { ZodSchema } from "zod";
import { array, boolean, literal, object, string, union } from "zod";

import { commentSchema } from "./comment.js";

export type IssueState =
  | { status: "open" }
  | { status: "closed"; reason: "other" | "solved" };

const issueStateSchema = union([
  object({ status: literal("open") }),
  object({
    status: literal("closed"),
    reason: union([literal("other"), literal("solved")]),
  }),
]) satisfies ZodSchema<IssueState>;

export interface Issue {
  id: string;
  author: { id: string; alias?: string };
  title: string;
  state: IssueState;
  discussion: Comment[];
  labels: string[];
  assignees: string[];
}

export const issueSchema = object({
  id: string(),
  author: object({ id: string(), alias: string().optional() }),
  title: string(),
  state: issueStateSchema,
  discussion: array(commentSchema),
  labels: array(string()),
  assignees: array(string()),
}) satisfies ZodSchema<Issue>;

export interface IssueCreated {
  success: boolean;
  id: string;
}

export const issueCreatedSchema = object({
  success: boolean(),
  id: string(),
}) satisfies ZodSchema<IssueCreated>;

export const issuesSchema = array(issueSchema) satisfies ZodSchema<Issue[]>;

export type IssueUpdateAction =
  | { type: "edit"; title: string }
  | { type: "label"; labels: string[] }
  | {
      type: "assign";
      assignees: string[];
    }
  | { type: "lifecycle"; state: IssueState }
  | {
      type: "comment";
      body: string;
      embeds?: Embed[];
      replyTo?: string;
    }
  | {
      type: "comment.edit";
      id: string;
      body: string;
      embeds: Embed[];
    }
  | { type: "comment.redact"; id: string }
  | {
      type: "comment.react";
      id: string;
      reaction: string;
      active: boolean;
    };
