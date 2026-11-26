#!/bin/bash
cd /home/claude/medusajs-2.0-for-railway-boilerplate/backend
redis-cli -p 6390 flushall >/dev/null
export DATABASE_URL=postgres://x JWT_SECRET=x COOKIE_SECRET=x NODE_PATH=src
node -e "require('module').Module._initPaths(); require('ts-node').register({transpileOnly:true, compilerOptions:{module:'commonjs'}}); require('./.harness/onepay-harness.ts')"
