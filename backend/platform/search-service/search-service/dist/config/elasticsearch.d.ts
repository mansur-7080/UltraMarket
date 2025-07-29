import { Client } from '@elastic/elasticsearch';
declare let client: Client;
export declare const connectElasticsearch: {
    (): Promise<Client>;
    close: () => Promise<void>;
};
export declare const getElasticsearchClient: () => Client;
export declare const checkElasticsearchHealth: () => Promise<any>;
export declare const getIndexStats: (index: string) => Promise<any>;
export declare const closeElasticsearch: () => Promise<void>;
export default client;
//# sourceMappingURL=elasticsearch.d.ts.map