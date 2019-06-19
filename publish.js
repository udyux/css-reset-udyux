const { execSync } = require('child_process')
const { version } = require('package.json')

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

    const versionMap = currentVersion
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
    if (!argMap.length) return [arg]
    const [lastArg] = argMap.splice(-1)

    const flag = Array.isArray(lastArg)
      ? arg.replace(regex.versionFlags, '--new-version').replace(regex.tagFlags, '--tag')
      : null

    if (flag) return [...argMap, lastArg, flag]

    const value = regex.versionKeywords.test(arg) ? convertVersionKeyword(version, arg) : arg
    return [...argMap, [lastArg, value]]
  }, [])
)

const branch = execSync(`git symbolic-ref HEAD | cut -d'/' -f3,4`)
  .toString()
  .trim()

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

if (branch !== 'master') {
  console.error('\nYou must be on branch `master`. Aborting publish...\n')
  process.exit(1)
}

const versionBranch = `version/${newVersion.replace(...regex.keepMajorMinor)}`

const arguments = Array.from(argumentMap)
  .reduce((args, v) => [...args, ...v])
  .join(' ')

execSync(`yarn publish ${arguments}`)

try {
  execSync(`git checkout -b ${versionBranch} > /dev/null 2>&1`)
} catch (e) {
  execSync(`git checkout ${versionBranch} > /dev/null 2>&1`)
}

execSync(`git merge master && git push -u origin ${versionBranch} && git checkout master`)
