// TODO: Implement invoices service
const invoicesService = {
  getAll: async ({ skip, limit, query }) => { return { data: [], total: 0 }; },
  create: async (data, user) => { throw new Error('Not implemented'); },
  getById: async (id) => { throw new Error('Not implemented'); },
  update: async (id, data, user) => { throw new Error('Not implemented'); },
  remove: async (id, user) => { throw new Error('Not implemented'); },
};

module.exports = invoicesService;
