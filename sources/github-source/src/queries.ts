import fs from 'fs-extra';
import path from 'path';

// GraphQL query used to get organization members
export const ORG_MEMBERS_QUERY = loadQuery('list-members-query.gql');

/**
 * Load query file from resources
 * @param query query file name
 * @returns query string
 */
function loadQuery(query: string): string {
  return fs.readFileSync(
    path.join(__dirname, '..', 'resources', 'queries', query),
    'utf8'
  );
}
