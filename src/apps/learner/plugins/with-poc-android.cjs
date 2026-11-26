const fs = require('node:fs');
const path = require('node:path');
const {
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
} = require('expo/config-plugins');

module.exports = function withPocAndroid(config) {
  const packages = ['com.ichi2.anki', 'com.ichi2.anki.a', 'com.ichi2.anki.b', 'com.ichi2.anki.c'];
  config = withAndroidManifest(config, (result) => {
    const manifest = result.modResults.manifest;
    // Retain the optional desktop AnkiConnect test over trusted local HTTP.
    manifest.application[0].$['android:usesCleartextTraffic'] = 'true';
    manifest['uses-permission'] ??= [];
    for (const packageName of packages) {
      const permission = `${packageName}.permission.READ_WRITE_DATABASE`;
      if (!manifest['uses-permission'].some((item) => item.$['android:name'] === permission)) {
        manifest['uses-permission'].push({ $: { 'android:name': permission } });
      }
    }
    manifest.queries ??= [];
    if (!manifest.queries[0]) manifest.queries.push({});
    manifest.queries[0].package ??= [];
    for (const packageName of packages) {
      if (!manifest.queries[0].package.some((item) => item.$['android:name'] === packageName)) {
        manifest.queries[0].package.push({ $: { 'android:name': packageName } });
      }
    }
    return result;
  });
  config = withMainApplication(config, (result) => {
    const registration = 'add(ca.lingolyrics.ankidroid.AnkiDroidPackage())';
    if (!result.modResults.contents.includes(registration)) {
      const anchor = 'PackageList(this).packages.apply {';
      if (!result.modResults.contents.includes(anchor))
        throw new Error('Cannot locate React Native package registration');
      result.modResults.contents = result.modResults.contents.replace(
        anchor,
        `${anchor}\n          ${registration}`,
      );
    }
    return result;
  });
  return withDangerousMod(config, [
    'android',
    async (result) => {
      const source = path.join(result.modRequest.projectRoot, 'native/ankidroid');
      const destination = path.join(
        result.modRequest.platformProjectRoot,
        'app/src/main/java/ca/lingolyrics/ankidroid',
      );
      fs.mkdirSync(destination, { recursive: true });
      for (const file of ['AnkiDroidModule.kt', 'AnkiDroidPackage.kt']) {
        fs.copyFileSync(path.join(source, file), path.join(destination, file));
      }
      return result;
    },
  ]);
};
