import "reflect-metadata"
import { MikroORM } from "@mikro-orm/core"
import { COOKIE_NAME, __prod__ } from "./constants"
import microConfig from "./mikro-orm.config"
import express, { query } from "express"
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello"
import { PostResolver } from "./resolvers/post"
import { UserResolver } from "./resolvers/user"
import session from "express-session";
import connect from "connect-pg-simple"
import pg from "pg"
import { MyContext } from "./types"
import cors from "cors"


const main = async () => {
  const orm = await MikroORM.init(microConfig)
  await orm.getMigrator().up()
  const app = express()
  const pgStore = connect(session)

  const pgPool = new pg.Pool({
    database: "postgres",
    user: "postgres",
    max: 10,
    min: 1,
    password: "Madskills1.",
    // log: e => console.error("logS", e)

  })

  const PostgresConnection = new pgStore({
    pool: pgPool,

  })

  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true
    })
  )

  app.use(session({
    name: COOKIE_NAME,
    store: PostgresConnection,
    saveUninitialized: false,
    secret: "my secret",
    resave: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000 * 12, // 1 year
      httpOnly: true,
      secure: __prod__, // cookie only works in https if set to production
      sameSite: "lax" //csrf
    }
  }));

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false
    }),
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res })
  })

  apolloServer.applyMiddleware({ app, cors: false })
  app.listen(4000, () => console.log("server started on 4000"))
}

main().catch(err => console.error(err))
