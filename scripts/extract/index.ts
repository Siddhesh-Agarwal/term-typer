// scripts/extract/index.ts
import * as fs from 'fs';
import * as path from 'path';
import { REPOS, getReposByLanguage, type RepoConfig } from './repos';
import { extractSnippetsFromFile, walkDirectory } from './extractor';
import { calculateDifficulty } from './scorer';

const EXTENSIONS: Record<string, string[]> = {
  python: ['py'],
  javascript: ['js', 'jsx', 'ts', 'tsx'],
  typescript: ['ts', 'tsx'],
  go: ['go'],
  rust: ['rs'],
  c: ['c', 'h'],
  cpp: ['cpp', 'cc', 'cxx', 'hpp'],
};

interface Snippet {
  id: string;
  lang: string;
  repo: string;
  file: string;
  difficulty: string;
  length: number;
  chars: string;
  attribution_url: string;
}

async function cloneOrFetchRepo(repo: RepoConfig): Promise<string> {
  const tempDir = path.join('/tmp', `termtyper-${repo.owner}-${repo.repo}`);
  
  if (fs.existsSync(tempDir)) {
    console.log(`Using cached repo: ${repo.owner}/${repo.repo}`);
    return tempDir;
  }
  
  console.log(`Cloning ${repo.owner}/${repo.repo}...`);
  
  const gitUrl = `https://github.com/${repo.owner}/${repo.repo}.git`;
  const { execSync } = await import('child_process');
  
  try {
    execSync(`git clone --depth 1 ${repo.branch ? `-b ${repo.branch}` : ''} ${gitUrl} ${tempDir}`, {
      stdio: 'inherit',
    });
  } catch (error) {
    console.error(`Failed to clone ${repo.owner}/${repo.repo}:`, error);
    throw error;
  }
  
  return tempDir;
}

function extractSnippets(repo: RepoConfig, localPath: string): Snippet[] {
  const snippets: Snippet[] = [];
  const exts = EXTENSIONS[repo.lang] || [];
  const files = walkDirectory(localPath, exts);
  
  let count = 0;
  for (const file of files) {
    const candidates = extractSnippetsFromFile(file);
    
    for (const candidate of candidates) {
      const difficulty = calculateDifficulty(candidate.content);
      const snippet: Snippet = {
        id: `${repo.lang}_${repo.repo.replace(/-/g, '_')}_${String(count).padStart(4, '0')}`,
        lang: repo.lang,
        repo: `${repo.owner}/${repo.repo}`,
        file: path.relative(localPath, candidate.file),
        difficulty,
        length: candidate.content.length,
        chars: candidate.content,
        attribution_url: `https://github.com/${repo.owner}/${repo.repo}/blob/main/${path.relative(localPath, candidate.file)}#L${candidate.startLine}`,
      };
      
      snippets.push(snippet);
      count++;
    }
  }
  
  console.log(`Extracted ${snippets.length} snippets from ${repo.owner}/${repo.repo}`);
  return snippets;
}

async function main() {
  const lang = process.argv[2] || 'all';
  
  const repos = lang === 'all' 
    ? REPOS 
    : getReposByLanguage(lang);
  
  console.log(`Extracting snippets for: ${repos.map(r => r.lang).join(', ')}`);
  
  const allSnippets: Snippet[] = [];
  
  for (const repo of repos) {
    try {
      const localPath = await cloneOrFetchRepo(repo);
      const snippets = extractSnippets(repo, localPath);
      allSnippets.push(...snippets);
    } catch (error) {
      console.error(`Error processing ${repo.owner}/${repo.repo}:`, error);
    }
  }
  
  const outputPath = path.join(process.cwd(), 'src', 'lib', 'data', 'snippets.json');
  fs.writeFileSync(outputPath, JSON.stringify(allSnippets, null, 2));
  
  console.log(`\nTotal snippets: ${allSnippets.length}`);
  console.log(`Output: ${outputPath}`);
}

main().catch(console.error);
