# vars-to-env

<p align="center">
  <a href="https://github.com/infovista-opensource/vars-to-env-action/actions"><img alt="vars-to-env-action status" src="https://github.com/infovista-opensource/vars-to-env-action/workflows/build-test/badge.svg"></a>
</p>

This action provides the following functionality for GitHub Actions users:

- Read Github secrets/variables and export **all** of them as environment variables
- Optionally including, excluding and manipulating variables as needed before importing
  - Include or exclude secrets (comma separated, supports regex)
  - Add/remove a prefix to all exported envvars
  - Override already existing variables (default is true)
  
## Usage

Add the following action to your workflow:
```yaml
- uses: infovista-opensource/vars-to-env-action@v1
  with:
    secrets: ${{ toJSON(secrets) }}
```
After running this action, subsequent actions will be able to access the secrets as env variables.
Note the `secrets` key. It is **mandatory** so the action can read and export the secrets.

**Basic:**

```yaml
steps:
- uses: actions/checkout@v3
- uses: infovista-opensource/vars-to-env-action@v1
  with:
    secrets: ${{ toJSON(secrets) }}
- run: echo "Value of MY_SECRET: $MY_SECRET"
```

**Include or exclude secrets:**

Exclude defined secret(s) from list of secrets (comma separated, supports regex).

```yaml
steps:
- uses: actions/checkout@v3
- uses: oNaiPs/secrets-to-env-action@v1
  with:
    secrets: ${{ toJSON(secrets) }}
    exclude: DUMMY_.+
  # DUMMY_* are not exported
```

**Only** include secret(s) from list of secrets (comma separated, supports regex).

```yaml
steps:
- uses: actions/checkout@v3
- uses: infovista-opensource/vars-to-env-action@v1
  with:
    secrets: ${{ toJSON(secrets) }}
    include: MY_SECRET, MY_OTHER_SECRETS_*
- run: echo "Value of MY_SECRET: $MY_SECRET"
```
To export secrets that start with a given string, you can use `include: PREFIX_.+` or `PREFIX_.*`.

NOTE: If specified secret does not exist, it is ignored.

**Add a prefix:**

Adds a prefix to all exported secrets.

```yaml
steps:
- uses: actions/checkout@v3
- uses: infovista-opensource/vars-to-env-action@v1
  with:
    secrets: ${{ toJSON(secrets) }}
    prefix: PREFIXED_
- run: echo "Value of PREFIXED_MY_SECRET: $PREFIXED_MY_SECRET"
```

**Remove a prefix:**

Remove a prefix to all exported secrets, if present.

```yaml
steps:
- uses: actions/checkout@v3
- uses: infovista-opensource/vars-to-env-action@v1
  with:
    secrets: ${{ toJSON(secrets) }}
    exclude: PREFIX2_.+
    removeprefix: PREFIX1_
- run: echo "Value of PREFIX1_MY_SECRET: $MY_SECRET"
```

**Override:**

Overrides already existing variables (default is **false**)

```yaml
env:
  MY_SECRET: DONT_OVERRIDE
steps:
- uses: actions/checkout@v3
- uses: infovista-opensource/vars-to-env-action@v1
  with:
    secrets: ${{ toJSON(secrets) }}
    override: false
- run: echo "Value of MY_SECRET: $MY_SECRET"
Value of MY_SECRET: DONT_OVERRIDE
```

**Convert:**

Converts all exported secrets case to `lower` or `upper`. Default is `upper`.
  
```yaml
steps:
- uses: actions/checkout@v3
- uses: infovista-opensource/vars-to-env-action@v1
  with:
    secrets: ${{ toJSON(secrets) }}
    convert: lower
- run: echo "Value of my_secret: $my_secret"
```

## How it works

This action uses the input in `secrets` to read all the secrets in the JSON format, and exporting all the variables one by one.  
It can of course used with any context, expecially `vars`.

## Why we forked the action

We at [Infovista](https://infovista.com) have multiple fleets of self-hosted github runners, in several datacenters.  
In order to keep them equivalent, we have to dynamically configure jobs to access the right on-prem resources via the _same_ environment variables, referenced in the action code. As these resources are named differently in each datacenter, we have to _"switch"_ the values of the environment variables, depending on the datacenter.

We customized the runner's _systemd_ unit in each datacenter to inject a `ONPREM_RUNNER_LOCATION` environment variable that we use for filtering out the secrets and for removing the prefix, in order to have the same variable set wherever the job runs.  
For example, `FRANCE_DOCKER_MIRROR` and `FRANCE_DOCKER_PASSWORD` become respectively `DOCKER_MIRROR` and `DOCKER_PASSWORD`, so the action scripts can use them without knowing the datacenter. Same for `USA_DOCKER_*`, etc.

This way:
- we can distribute build jobs on many datacenters
- the same job will run leveraging "local" resources
- no changes needed in the CI code

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).

## Contributions

Contributions are welcome! Past contributors:

- José Luis Pereira @oNaiPs
- Tamas Kadar @KTamas

## Local development

```shell
# setup
yarn install
# before pushing the code to GH
yarn run all 
```