// scripts/extract/repos.ts
export interface RepoConfig {
  lang: string;
  owner: string;
  repo: string;
  branch?: string;
}

export const REPOS: RepoConfig[] = [
  // Python
  { lang: 'python', owner: 'psf', repo: 'requests', branch: 'main' },
  { lang: 'python', owner: 'pallets', repo: 'flask', branch: 'main' },
  { lang: 'python', owner: 'psf', repo: 'urllib3', branch: 'main' },
  
  // JavaScript/TypeScript
  { lang: 'javascript', owner: 'facebook', repo: 'react', branch: 'main' },
  { lang: 'javascript', owner: 'nodejs', repo: 'node', branch: 'main' },
  { lang: 'typescript', owner: 'microsoft', repo: 'typescript', branch: 'main' },
  
  // Go
  { lang: 'go', owner: 'gin-gonic', repo: 'gin', branch: 'master' },
  { lang: 'go', owner: 'spf13', repo: 'cobra', branch: 'main' },
  
  // Rust
  { lang: 'rust', owner: 'tokio-rs', repo: 'tokio', branch: 'main' },
  { lang: 'rust', owner: 'BurntSushi', repo: 'ripgrep', branch: 'main' },
  
  // C
  { lang: 'c', owner: 'redis', repo: 'redis', branch: 'unstable' },
];

export function getReposByLanguage(lang: string): RepoConfig[] {
  return REPOS.filter(r => r.lang === lang);
}
