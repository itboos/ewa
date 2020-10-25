'use strict';

/* eslint no-console: "off" */

const path = require('path');
const execSync = require('child_process').execSync;
const ROOT = process.cwd();
const configFile = path.resolve(__dirname, 'config.js');

module.exports = function(webpack) {
  let cmd = [
    webpack,
    '--config',
    configFile,
    '--colors',
    '--display=errors-only',
    // 输出性能分析到指定文件
    '--profile --json > ~/Desktop/compilation-stats.json'
  ].join(' ');

  execSync(cmd, {
    env: process.env,
    stdio: ['pipe', process.stdout, process.stderr]
  });
};
