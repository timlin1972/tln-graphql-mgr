const { PubSub } = require('apollo-server');

const MODULE_NAME = 'graphql-mgr';

//  Test items
const TEST_QUERY = `
  hello: String
`;

const TEST_TYPEDEFS = {
  queries: TEST_QUERY,
};

const TEST_RESOLVERS_QUERIES = {
  hello: () => 'Hello world!',
};

const TEST_RESOLVERS = {
  queries: TEST_RESOLVERS_QUERIES,
};

const DEF_LOGGER = null;
const DEF_TEST = false;
const DEF_I18N = null;

const DEF_CONFIGS = {
  logger: DEF_LOGGER,
  test: DEF_TEST,
  i18n: DEF_I18N,
}

class GraphqlMgr {
  constructor(configs=DEF_CONFIGS) {
    this.logger = configs.logger || DEF_LOGGER;
    this.test = configs.test || DEF_TEST;
    this.i18n = configs.i18n || DEF_I18N;

    this.typeDefsResult = [];
    this.resolversResult = [];

    this.pubsub = new PubSub(); //  we want to use one pubsub for all

    this.log('info', 'Initialized');
  }

  log = (level=DEF_LEVEL, msg) => {
    const msgI18n = this.i18n ? this.i18n.t(msg) : msg;
    this.logger ? 
      this.logger.log(MODULE_NAME, level, msgI18n) :
      console.log(`${level}: [${MODULE_NAME}] ${msgI18n}`);
  }

  addSchema({ typeDefs, resolvers }) {
    if (typeDefs) {
      this.typeDefsResult.push(typeDefs);
    }

    if (resolvers) {
      this.resolversResult.push(resolvers);
    }
  }

  prepareTypeDefs() {
    const types = [];
    const queries = [];
    const mutations = [];
    const subscriptions = [];

    this.typeDefsResult.forEach((s) => {
      if (s.types) {
        types.push(s.types);
      }

      if (s.queries) {
        queries.push(s.queries);
      }

      if (s.mutations) {
        mutations.push(s.mutations);
      }

      if (s.subscriptions) {
        subscriptions.push(s.subscriptions);
      }
    });

    let typeDefsFinal = '';
    if (types.length) {
      typeDefsFinal += `
        ${types.join('\n')}
      `;
    }

    if (queries.length) {
      typeDefsFinal += `
        type Query {
          ${queries.join('\n')}
        }
      `;
    }

    if (mutations.length) {
      typeDefsFinal += `
        type Mutation {
          ${mutations.join('\n')}
        }
      `;
    }

    if (subscriptions.length) {
      typeDefsFinal += `
        type Subscription {
          ${subscriptions.join('\n')}
        }
      `;
    }

    return typeDefsFinal;
  }

  prepareResolvers() {
    const resolversFinal = {};

    this.resolversResult.forEach((s) => {
      if (s.queries) {
        resolversFinal.Query = { ...resolversFinal.Query, ...s.queries };
      }

      if (s.mutations) {
        resolversFinal.Mutation = { ...resolversFinal.Mutation, ...s.mutations };
      }

      if (s.subscriptions) {
        resolversFinal.Subscription = { ...resolversFinal.Subscription, ...s.subscriptions };
      }
    });

    return resolversFinal;
  }

  getSchema() {
    if (this.test) {
      this.addSchema({
        typeDefs: TEST_TYPEDEFS,
        resolvers: TEST_RESOLVERS,
      });
      this.log('info', 'Added testing schema.');
    }

    return {
      typeDefs: this.prepareTypeDefs(),
      resolvers: this.prepareResolvers(),
    };
  }

  toString = () => `[${MODULE_NAME}]\n\
    \tlogger: ${this.logger ? 'yes' : 'no'}\n\
    \ttest: ${this.test}\n\
    `;
}

module.exports = GraphqlMgr;
