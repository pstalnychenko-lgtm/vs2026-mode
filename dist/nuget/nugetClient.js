"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NuGetClient = void 0;
const https = __importStar(require("https"));
class NuGetClient {
    static async search(query, take = 20) {
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
                            const pkgs = items.map((item) => ({
                                id: item.id,
                                version: item.version,
                                description: item.description || '',
                                authors: Array.isArray(item.authors) ? item.authors : [item.authors || 'Unknown'],
                                totalDownloads: item.totalDownloads || 0,
                                iconUrl: item.iconUrl,
                                projectUrl: item.projectUrl
                            }));
                            resolve(pkgs);
                        }
                        else {
                            resolve([]);
                        }
                    }
                    catch (err) {
                        reject(err);
                    }
                });
            }).on('error', err => reject(err));
        });
    }
}
exports.NuGetClient = NuGetClient;
//# sourceMappingURL=nugetClient.js.map