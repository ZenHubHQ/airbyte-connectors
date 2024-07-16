import {AirbyteLogger} from 'faros-airbyte-cdk';
import {Repository} from 'faros-airbyte-common/github';
import {Memoize} from 'typescript-memoize';

import {GitHub} from './github';
import {GitHubConfig} from './types';

type FilterConfig = {
  organizations?: Set<string>;
  excludedOrganizations?: Set<string>;
  reposByOrg: Map<string, Set<string>>;
  excludedReposByOrg: Map<string, Set<string>>;
};

export class OrgRepoFilter {
  private readonly filterConfig: FilterConfig;
  private organizations?: Set<string>;
  private reposByOrg: Map<string, Set<Repository>> = new Map();

  constructor(
    private readonly config: GitHubConfig,
    private readonly logger: AirbyteLogger
  ) {
    const {organizations, repositories, excluded_repositories} = this.config;
    let {excluded_organizations} = this.config;

    if (organizations?.length && excluded_organizations?.length) {
      this.logger.warn(
        'Both organizations and excluded_organizations are specified, excluded_organizations will be ignored.'
      );
      excluded_organizations = undefined;
    }

    const reposByOrg = new Map<string, Set<string>>();
    if (repositories?.length) {
      collectReposByOrg(reposByOrg, repositories);
    }
    const excludedReposByOrg = new Map<string, Set<string>>();
    if (excluded_repositories?.length) {
      collectReposByOrg(excludedReposByOrg, excluded_repositories);
    }
    for (const org of reposByOrg.keys()) {
      if (excludedReposByOrg.has(org)) {
        this.logger.warn(
          `Both repositories and excluded_repositories are specified for organization ${org}, excluded_repositories for organization ${org} will be ignored.`
        );
        excludedReposByOrg.delete(org);
      }
    }

    this.filterConfig = {
      organizations: organizations ? new Set(organizations) : undefined,
      excludedOrganizations: excluded_organizations
        ? new Set(excluded_organizations)
        : undefined,
      reposByOrg,
      excludedReposByOrg,
    };
  }

  @Memoize()
  async getOrganizations(): Promise<ReadonlyArray<string>> {
    if (!this.organizations) {
      const organizations = new Set<string>();
      const github = await GitHub.instance(this.config, this.logger);
      const visibleOrgs = await github.getOrganizations();
      if (!this.filterConfig.organizations) {
        visibleOrgs.forEach((org) => {
          if (!this.filterConfig.excludedOrganizations?.has(org)) {
            organizations.add(org);
          }
        });
      } else {
        this.filterConfig.organizations.forEach((org) => {
          if (!visibleOrgs.some((o) => o === org)) {
            this.logger.warn(`Skipping not found organization ${org}`);
            return;
          }
          organizations.add(org);
        });
      }
      this.organizations = organizations;
    }
    return Array.from(this.organizations);
  }

  @Memoize()
  async getRepositories(org: string): Promise<ReadonlyArray<Repository>> {
    if (!this.reposByOrg.has(org)) {
      const repos = new Set<Repository>();
      const github = await GitHub.instance(this.config, this.logger);
      const visibleRepos = await github.getRepositories(org);
      if (!this.filterConfig.reposByOrg.has(org)) {
        visibleRepos.forEach((repo) => {
          if (!this.filterConfig.excludedReposByOrg.get(org)?.has(repo.name)) {
            repos.add(repo);
          }
        });
      } else {
        this.filterConfig.reposByOrg.get(org).forEach((repoName) => {
          const repo = visibleRepos.find((r) => r.name === repoName);
          if (!repo) {
            this.logger.warn(
              `Skipping not found repository ${org}/${repoName}`
            );
            return;
          }
          repos.add(repo);
        });
      }
      this.reposByOrg.set(org, repos);
    }
    return Array.from(this.reposByOrg.get(org));
  }
}

function collectReposByOrg(
  reposByOrg: Map<string, Set<string>>,
  repos: ReadonlyArray<string>
): void {
  for (const repo of repos) {
    const [org, name] = repo.split('/');
    if (!reposByOrg.has(org)) {
      reposByOrg.set(org, new Set());
    }
    reposByOrg.get(org).add(name);
  }
}
