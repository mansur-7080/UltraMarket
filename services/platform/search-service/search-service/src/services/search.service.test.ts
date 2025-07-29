import { SearchService } from './search.service';

describe('SearchService', () => {
  let service: SearchService;

  beforeAll(() => {
    service = new SearchService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have searchProducts method', () => {
    expect(typeof service.searchProducts).toBe('function');
  });

  // Mock test: real Elasticsearch connection is not tested here
  it('should throw error if searchProducts called without Elasticsearch', async () => {
    await expect(service.searchProducts({})).rejects.toThrow();
  });
}); 