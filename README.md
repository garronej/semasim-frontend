# semasim-frontend

```bash

cd build-script

# Automatically run npm install everywhere:
npm run install_pages

# Build all pages ( and watch for changes ):
# NOTE: Type 'exit' and not ctrl+C for stop watching.
npm run build_pages -- -w

```
shared/tsconfig.json

        "types": [
            "bootstrap",
            "jquery"
        ]//Because importing semasim-gateway cause @types/node to be imported
        //and we don't want to forget that we that we a running in a restricted js env.
