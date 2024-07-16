import {AirbyteLogger, readTestResourceAsJSON} from 'faros-airbyte-cdk';

import {GitHub, GitHubToken} from '../src/github';

export function setupGitHubInstance(octokitMock: any, logger: AirbyteLogger) {
  GitHub.instance = jest.fn().mockImplementation(() => {
    return new GitHubToken(
      readTestResourceAsJSON('config.json'),
      {
        ...octokitMock,
        paginate: {
          iterator: (fn: () => any) => iterate([{data: fn()}]),
        },
        orgs: {
          ...octokitMock.orgs,
          listForAuthenticatedUser:
            octokitMock.orgs?.listForAuthenticatedUser ??
            jest.fn().mockReturnValue([{login: 'github'}]),
        },
      },
      logger
    );
  });
}

export const graphqlMockedImplementation = (queryName: string, res: any) => {
  const graphqlMock: any = jest.fn().mockImplementation((query: string) => {
    if (!query.includes(`query ${queryName}`)) {
      throw new Error('Not mocked');
    }
    return res;
  });

  graphqlMock.paginate = {
    iterator: jest.fn().mockImplementation((query: string) => {
      if (!query.includes(`query ${queryName}`)) {
        throw new Error('Not mocked');
      }
      return iterate([res]);
    }),
  };

  return {
    graphql: graphqlMock,
  };
};

export async function* iterate<T>(
  arr: ReadonlyArray<T>
): AsyncIterableIterator<T> {
  for (const x of arr) {
    yield x;
  }
}
