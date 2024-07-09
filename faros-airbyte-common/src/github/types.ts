import {Octokit} from '@octokit/rest';
import {GetResponseDataTypeFromEndpointMethod} from '@octokit/types';

import {ListMembersQuery, PullRequestsQuery} from './generated';

const octokit: Octokit = new Octokit();

export type AppInstallation = GetResponseDataTypeFromEndpointMethod<
  typeof octokit.apps.listInstallations
>[0];

export type Organization = Pick<
  GetResponseDataTypeFromEndpointMethod<typeof octokit.orgs.get>,
  'login' | 'name' | 'type' | 'html_url' | 'created_at' | 'updated_at'
>;

export type Repository = {
  org: string;
} & Pick<
  GetResponseDataTypeFromEndpointMethod<typeof octokit.repos.listForOrg>[0],
  | 'name'
  | 'full_name'
  | 'private'
  | 'description'
  | 'language'
  | 'size'
  | 'default_branch'
  | 'html_url'
  | 'topics'
  | 'created_at'
  | 'updated_at'
>;

export type PullRequest = {
  org: string;
  repo: string;
} & PullRequestsQuery['repository']['pullRequests']['nodes'][0];

export type User = {
  org: string;
} & ListMembersQuery['organization']['membersWithRole']['nodes'][0];

export type Team = {
  org: string;
  parentSlug: string | null;
} & Pick<
  GetResponseDataTypeFromEndpointMethod<typeof octokit.teams.list>[0],
  'name' | 'slug' | 'description'
>;

export type TeamMembership = {
  org: string;
  team: string;
  user: string;
};

export type CopilotSeatsStreamRecord = CopilotSeat | CopilotSeatsEmpty;

export type CopilotSeat = {
  empty?: never;
  org: string;
  user: string;
} & Pick<
  GetResponseDataTypeFromEndpointMethod<
    typeof octokit.copilot.listCopilotSeats
  >['seats'][0],
  'created_at' | 'updated_at' | 'pending_cancellation_date' | 'last_activity_at'
>;

export type CopilotSeatsEmpty = {
  empty: true;
  org: string;
};

export enum GitHubTool {
  Copilot = 'GitHubCopilot',
}

export type CopilotUsageSummary = {
  org: string;
} & GetResponseDataTypeFromEndpointMethod<
  typeof octokit.copilot.usageMetricsForOrg
>[0];

export type LanguageEditorBreakdown = CopilotUsageSummary['breakdown'][0];
