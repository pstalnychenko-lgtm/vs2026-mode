import * as https from 'https';

export interface NuGetPackageInfo {
  id: string;
  version: string;
  description: string;
  authors: string[];
  totalDownloads: number;
  iconUrl?: string;
  projectUrl?: string;
}

export class NuGetClient {
  public static async search(query: string, take: number = 20): Promise<NuGetPackageInfo[]> {
    const encoded = encodeURIComponent(query);
    const url = `https://azuresearch-usnc.nuget.org/query?q=${encoded}&prerelease=false&take=${take}`;

    return new Promise((resolve, reject) => {
      https.get(url, { headers: { 'User-Agent': 'VS2026Mode-Extension' } }, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              const json = JSON.parse(data);
              const items = json.data || [];
              const pkgs: NuGetPackageInfo[] = items.map((item: any) => ({
                id: item.id,
                version: item.version,
                description: item.description || '',
                authors: Array.isArray(item.authors) ? item.authors : [item.authors || 'Unknown'],
                totalDownloads: item.totalDownloads || 0,
                iconUrl: item.iconUrl,
                projectUrl: item.projectUrl
              }));
              resolve(pkgs);
            } else {
              resolve([]);
            }
          } catch (err) {
            reject(err);
          }
        });
      }).on('error', err => reject(err));
    });
  }
}
