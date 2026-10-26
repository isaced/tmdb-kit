export const AUTHENTICATION_HELP = [
  'AUTHENTICATION',
  '',
  '  tmdb auth login        Set up a TMDB API Read Access Token',
  '  tmdb auth status       Show credential source and config path',
  '  tmdb auth logout       Remove saved API credentials',
  '  tmdb config show       Show config path and masked values',
  '  tmdb config path       Print the config file path',
  '',
  '  TMDB_ACCESS_TOKEN      Environment variable (takes precedence)',
  '  TMDB_API_KEY           Legacy v3 API key (takes precedence)',
].join('\n')
