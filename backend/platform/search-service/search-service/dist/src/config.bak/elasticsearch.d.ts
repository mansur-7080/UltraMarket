import { Client } from '@elastic/elasticsearch';
export declare const connectElasticsearch: {
    (): Promise<Client>;
    close: () => Promise<void>;
};
export declare const getElasticsearchClient: () => Client;
export declare const checkElasticsearchHealth: () => Promise<any>;
export declare const getIndexStats: (index: string) => Promise<any>;
export declare const closeElasticsearch: () => Promise<void>;
declare const _default: Client;
export default _default;
//# sourceMappingURL=elasticsearch.d.ts.map