"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@mikro-orm/core");
const constants_1 = require("./constants");
const mikro_orm_config_1 = __importDefault(require("./mikro-orm.config"));
const express_1 = __importDefault(require("express"));
const apollo_server_express_1 = require("apollo-server-express");
const type_graphql_1 = require("type-graphql");
const hello_1 = require("./resolvers/hello");
const post_1 = require("./resolvers/post");
const user_1 = require("./resolvers/user");
const express_session_1 = __importDefault(require("express-session"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const pg_1 = __importDefault(require("pg"));
const cors_1 = __importDefault(require("cors"));
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const orm = yield core_1.MikroORM.init(mikro_orm_config_1.default);
    yield orm.getMigrator().up();
    const app = express_1.default();
    const pgStore = connect_pg_simple_1.default(express_session_1.default);
    const pgPool = new pg_1.default.Pool({
        database: "postgres",
        user: "postgres",
        max: 10,
        min: 1,
        password: "Madskills1.",
    });
    const PostgresConnection = new pgStore({
        pool: pgPool,
    });
    PostgresConnection.get(constants_1.COOKIE_NAME, () => {
    });
    app.use(cors_1.default({
        origin: "http://localhost:3000",
        credentials: true
    }));
    app.use(express_session_1.default({
        name: constants_1.COOKIE_NAME,
        store: PostgresConnection,
        saveUninitialized: false,
        secret: "my secret",
        resave: false,
        cookie: {
            maxAge: 30 * 24 * 60 * 60 * 1000 * 12,
            httpOnly: true,
            secure: constants_1.__prod__,
            sameSite: "lax"
        }
    }));
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema: yield type_graphql_1.buildSchema({
            resolvers: [hello_1.HelloResolver, post_1.PostResolver, user_1.UserResolver],
            validate: false
        }),
        context: ({ req, res }) => ({ em: orm.em, req, res })
    });
    apolloServer.applyMiddleware({ app, cors: false });
    app.listen(4000, () => console.log("server started on 4000"));
});
main().catch(err => console.error(err));
//# sourceMappingURL=index.js.map