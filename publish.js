const { execSync } = require('child_process')
const { version } = require('./package.json')

const regex = {
  keepMajorMinor: [/^(\d+\.\d+).*$/, '$1'],
  tagFlags: /^(?:-t|--tag)$/,
  validVersion: /^(?:(?:\d+\.?){3}|(?:major|minor|patch))/,
  versionFlags: /^(?:-v|--version|--new-version)$/,
  versionKeywords: /^(?:(major)|(minor)|(patch))$/
}

const logVersionInfo = () =>
  console.error(`Use flag \`--new-version | --version | -v\` with either
  • a valid semver version eg. 1.2.3
  • a version keyword \`major | minor | patch\`
`)

const convertVersionKeyword = bumpKeyword =>
  bumpKeyword.replace(regex.versionKeywords, (...matches) => {
    const index = matches.slice(1, -2).findIndex(str => !!str)

    const versionMap = version
      .replace(/((?:\d+\.){2}\d+).*/, '$1')
      .trim()
      .split('.')
      .map(Number)

    return versionMap
      .map((num, i) => {
        if (i < index) return num
        return i === index ? num + 1 : 0
      })
      .join('.')
  })

const argumentMap = new Map(
  process.argv.slice(2).reduce((argMap, arg) => {
    const mappedFlag = arg.replace(regex.versionFlags, '--new-version').replace(regex.tagFlags, '--tag')
    const parsedValue = regex.versionKeywords.test(arg) ? convertVersionKeyword(arg) : arg
    const [lastArg] = argMap.splice(-1)

    if (!lastArg) return [mappedFlag]

    return Array.isArray(lastArg) ? [...argMap, lastArg, mappedFlag] : [...argMap, [lastArg, parsedValue]]
  }, [])
)

const currentBranch = execSync(`git symbolic-ref HEAD | cut -d'/' -f3,4`)
  .toString()
  .trim()

const arguments = Array.from(argumentMap)
  .reduce((args, v) => [...args, ...v])
  .join(' ')

if (!argumentMap.has('--new-version')) {
  console.error('\nMissing version. Aborting publish...')
  logVersionInfo()
  process.exit(1)
}

if (!regex.validVersion.test(argumentMap.get('--new-version'))) {
  console.error(`\nInvalid version format. Aborting publish...`)
  logVersionInfo()
  process.exit(1)
}

if (currentBranch !== 'master') {
  console.error('\nYou must be on branch `master`. Aborting publish...\n')
  process.exit(1)
}

const versionBranch = `version/${argumentMap.get('--new-version').replace(...regex.keepMajorMinor)}`

execSync(`yarn publish ${arguments}`)

try {
  execSync(`git checkout -b ${versionBranch} > /dev/null 2>&1`)
} catch (e) {
  execSync(`git checkout ${versionBranch} > /dev/null 2>&1`)
}

execSync(`git merge master && git push -u origin ${versionBranch} && git checkout master`)
